import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { currentScope, idbStorage } from './storage';
import { RESUME_MAX, ProgramRun, ResumeSnapshot, validSnapshot } from '../domain/resume';

/**
 * IndexedDB writes are asynchronous: an app closed right after « Pause » could keep an older snapshot. Every change
 * is therefore also written synchronously to localStorage (same user scope). That copy is always the most recent, so
 * it is read first when the app opens again; IndexedDB is the fallback when it is missing or unreadable.
 */
type Saved = { snapshots?: unknown; programs?: unknown };
const mirrorKey = () => `css-resume-mirror:${currentScope()}`;
function writeMirror(st: { snapshots: ResumeSnapshot[]; programs: Record<string, ProgramRun> }) {
  try {
    localStorage.setItem(mirrorKey(), JSON.stringify({ snapshots: st.snapshots, programs: st.programs }));
  } catch {
    // private mode or full storage: IndexedDB alone keeps the state
  }
}
function readMirror(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(mirrorKey()) ?? 'null');
    return v && typeof v === 'object' && Array.isArray(v.snapshots) ? v : null;
  } catch {
    return null;
  }
}

/** one snapshot per session, the most recently saved, newest first */
export function newestPerQuery(lists: unknown[][]): ResumeSnapshot[] {
  const by = new Map<string, ResumeSnapshot>();
  for (const x of lists.flat()) {
    const s = validSnapshot(x);
    if (!s) continue;
    const had = by.get(s.query);
    if (!had || Date.parse(s.savedAt) >= Date.parse(had.savedAt)) by.set(s.query, s);
  }
  return [...by.values()].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)).slice(0, RESUME_MAX);
}

interface ResumeState {
  /** interrupted sessions, newest first, one per session query */
  snapshots: ResumeSnapshot[];
  /** finished programme sessions, by programme id */
  programs: Record<string, ProgramRun>;
  save: (s: ResumeSnapshot) => void;
  /** the session ended (finished, or the user chose to start again): it is not offered any more */
  drop: (query: string) => void;
  programDone: (id: string, at: string) => void;
}

/**
 * 0.33: interrupted sessions and finished programmes of this user (scoped like the history). Recorded statistics
 * stay in src/store/stats.ts: dropping a snapshot never removes any history.
 */
export const useResume = create<ResumeState>()(
  persist(
    (setState) => ({
      snapshots: [],
      programs: {},
      save: (s) =>
        setState((st) => {
          const snapshots = [s, ...st.snapshots.filter((x) => x.query !== s.query)].slice(0, RESUME_MAX);
          writeMirror({ snapshots, programs: st.programs });
          return { snapshots };
        }),
      drop: (query) =>
        setState((st) => {
          if (!st.snapshots.some((x) => x.query === query)) return st;
          const snapshots = st.snapshots.filter((x) => x.query !== query);
          writeMirror({ snapshots, programs: st.programs });
          return { snapshots };
        }),
      programDone: (id, at) =>
        setState((st) => {
          const programs = { ...st.programs, [id]: { lastDone: at, count: (st.programs[id]?.count ?? 0) + 1 } };
          writeMirror({ snapshots: st.snapshots, programs });
          return { programs };
        }),
    }),
    {
      name: 'css-resume',
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ snapshots, programs }) => ({ snapshots, programs }),
      // a corrupted or older save is read without crashing: only the usable snapshots are kept
      merge: (saved, current) => {
        const s = (readMirror() ?? saved ?? {}) as Saved;
        const snapshots = newestPerQuery([Array.isArray(s.snapshots) ? s.snapshots : []]);
        const programs: Record<string, ProgramRun> = {};
        if (s.programs && typeof s.programs === 'object') {
          for (const [id, r] of Object.entries(s.programs as Record<string, ProgramRun>)) {
            if (r && typeof r.lastDone === 'string' && !Number.isNaN(Date.parse(r.lastDone)) && typeof r.count === 'number') programs[id] = r;
          }
        }
        return { ...current, snapshots, programs };
      },
    },
  ),
);
