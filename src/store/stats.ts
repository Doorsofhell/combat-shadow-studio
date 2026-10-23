import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import type { DisciplineId, LevelId, TrainingMode } from '../domain/types';

export interface SessionRecord {
  id: string;
  /** ISO date of the start */
  start: string;
  discipline: DisciplineId;
  level: LevelId;
  exerciseId: string;
  exerciseName: string;
  mode: TrainingMode;
  activeSec: number;
  reps: number;
  /**
   * v0.47 (« Chronomètre intégré au coach 3D » §14): the summary of the whole session, written once on the record
   * of the last exercise played (never summed with activeSec, so nothing is counted twice). Missing on older records.
   */
  status?: 'terminee' | 'interrompue';
  workSec?: number;
  restSec?: number;
  totalSec?: number;
  plannedRounds?: number | null;
  doneRounds?: number;
  intensity?: import('../ui/training/plan').CardioIntensity;
  /** length of a timed period (round, effort), null when free */
  work?: number | null;
}

interface StatsState {
  sessions: SessionRecord[];
  /** cumulative active seconds per exercise id (independent counters) */
  perExercise: Record<string, number>;
  /** add active time and reps to an open session, creating it on first call */
  record: (s: Omit<SessionRecord, 'activeSec' | 'reps'>, addSec: number, addReps: number) => void;
  /** v0.47: adds the session summary to an existing record (time and reps untouched) */
  annotate: (id: string, patch: Partial<Pick<SessionRecord, 'status' | 'workSec' | 'restSec' | 'totalSec' | 'plannedRounds' | 'doneRounds' | 'intensity' | 'work'>>) => void;
  importData: (data: unknown) => { ok: boolean; message: string };
  clear: () => void;
}

export const useStats = create<StatsState>()(
  persist(
    (setState, getState) => ({
      sessions: [],
      perExercise: {},
      record: (s, addSec, addReps) => {
        if (addSec <= 0 && addReps <= 0) return;
        const { sessions, perExercise } = getState();
        const i = sessions.findIndex((x) => x.id === s.id);
        const next = [...sessions];
        if (i < 0) next.push({ ...s, activeSec: addSec, reps: addReps });
        else next[i] = { ...next[i], activeSec: next[i].activeSec + addSec, reps: next[i].reps + addReps };
        setState({
          sessions: next,
          perExercise: { ...perExercise, [s.exerciseId]: (perExercise[s.exerciseId] ?? 0) + addSec },
        });
      },
      annotate: (id, patch) => {
        const { sessions } = getState();
        const i = sessions.findIndex((x) => x.id === id);
        if (i < 0) return;
        const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
        const next = [...sessions];
        next[i] = { ...next[i], ...clean };
        setState({ sessions: next });
      },
      importData: (data) => {
        const d = data as { app?: string; sessions?: SessionRecord[]; perExercise?: Record<string, number> };
        if (!d || d.app !== 'combat-shadow-studio' || !Array.isArray(d.sessions)) {
          return { ok: false, message: 'Fichier non reconnu : ce n’est pas une sauvegarde Combat Shadow Studio.' };
        }
        const valid = d.sessions.filter((x) => x && typeof x.id === 'string' && typeof x.activeSec === 'number' && typeof x.start === 'string');
        const known = new Set(getState().sessions.map((x) => x.id));
        const added = valid.filter((x) => !known.has(x.id));
        const perExercise = { ...getState().perExercise };
        for (const x of added) perExercise[x.exerciseId] = (perExercise[x.exerciseId] ?? 0) + x.activeSec;
        setState({ sessions: [...getState().sessions, ...added], perExercise });
        return { ok: true, message: `${added.length} séance(s) importée(s).` };
      },
      clear: () => setState({ sessions: [], perExercise: {} }),
    }),
    { name: 'css-stats', storage: createJSONStorage(() => idbStorage) },
  ),
);

// ------------------------------------------------------------------ aggregates
export const sum = (xs: SessionRecord[]) => xs.reduce((a, s) => a + s.activeSec, 0);

export function byKey<K extends string>(xs: SessionRecord[], key: (s: SessionRecord) => K) {
  const out = {} as Record<K, number>;
  for (const s of xs) out[key(s)] = (out[key(s)] ?? 0) + s.activeSec;
  return out;
}

/** Monday-based ISO week start, local time, as yyyy-mm-dd */
export function weekKey(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return localDay(d);
}

export const monthKey = (iso: string) => iso.slice(0, 7);

export function localDay(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** sessions counted per day (several records the same day for different exercises count once per day) */
export function sessionCount(xs: SessionRecord[]) {
  return new Set(xs.map((s) => s.id.split('#')[0])).size;
}

export function formatDuration(sec: number) {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h} h ${String(m).padStart(2, '0')}`;
  if (m) return `${m} min ${String(r).padStart(2, '0')}`;
  return `${r} s`;
}

export function exportData(state: { sessions: SessionRecord[]; perExercise: Record<string, number> }, extra: object) {
  return JSON.stringify({ app: 'combat-shadow-studio', version: 1, exportedAt: new Date().toISOString(), ...extra, ...state }, null, 2);
}
