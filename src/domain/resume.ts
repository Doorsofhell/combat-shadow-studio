import type { DisciplineId, LevelId, TrainingMode } from './types';

/**
 * 0.33 (Youssef, 2026-10-22 « Refonte premium de l'écran Entraîner », §5-6): an interrupted session is saved as a
 * small plain snapshot (no Three.js object, no texture: only numbers and ids) so the « Reprendre » card of the
 * Entraîner screen can bring it back exactly, even after the app was closed. Pure functions here; the store is
 * src/store/resume.ts and the engine side is src/ui/training/useSession.ts.
 */
export const RESUME_VERSION = 1;
/** a snapshot older than this is not offered any more (it stays in the history, only the card ignores it) */
export const RESUME_MAX_AGE_DAYS = 30;
/** at most this many interrupted sessions are kept, newest first */
export const RESUME_MAX = 5;
/** a programme done within this many days is « active » (state B of the card) */
export const PROGRAM_ACTIVE_DAYS = 14;

export type ResumePhase = 'pret' | 'decompte' | 'travail' | 'repos';

export interface ResumeSnapshot {
  v: typeof RESUME_VERSION;
  /** the query of /entrainement that built the plan (ex=…&mode=…, prog=…, perso=…, cat=…), without `reprise` */
  query: string;
  title: string;
  mode: TrainingMode;
  /** set for a programme session */
  programId?: string;
  discipline: DisciplineId;
  level: LevelId;
  /** current block of the plan, checked again against the plan when resuming */
  itemIndex: number;
  itemKey: string;
  itemName: string;
  itemCount: number;
  /** a technique of the current block, for the thumbnail */
  thumb: string;
  round: number;
  rounds: number;
  reps: number;
  phase: ResumePhase;
  /** active seconds already spent in the current phase, and its length (0 = free) */
  phaseElapsed: number;
  phaseLen: number;
  /** active training seconds of the whole session */
  sessionSec: number;
  /** v0.47: rest seconds of the session (pauses excluded); missing in saves of earlier versions */
  restSec?: number;
  /** planned work seconds (programme: whole session; timed exercise: the block), null when free */
  plannedSec: number | null;
  /** work seconds done, measured the same way as plannedSec */
  doneSec: number;
  speed: number;
  /** coach on screen when the session was saved */
  coach: 'homme' | 'femme';
  camera?: string;
  /** ISO start of the session: the statistics keep adding to the same session, never a second one */
  startIso: string;
  savedAt: string;
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0;
const PHASES: ResumePhase[] = ['pret', 'decompte', 'travail', 'repos'];
const MODES: TrainingMode[] = ['libre', 'technique', 'cardio', 'rounds', 'programme', 'personnalise'];

/** a saved value read back from storage: kept only if every field is usable (corrupted or older saves → null) */
export function validSnapshot(x: unknown): ResumeSnapshot | null {
  if (!x || typeof x !== 'object') return null;
  const s = x as Record<string, unknown>;
  if (s.v !== RESUME_VERSION) return null;
  if (!isStr(s.query) || !isStr(s.title) || !isStr(s.itemKey) || !isStr(s.itemName) || !isStr(s.discipline) || !isStr(s.level) || !isStr(s.thumb)) return null;
  if (!MODES.includes(s.mode as TrainingMode) || !PHASES.includes(s.phase as ResumePhase)) return null;
  for (const k of ['itemIndex', 'itemCount', 'round', 'rounds', 'reps', 'phaseElapsed', 'phaseLen', 'sessionSec', 'doneSec', 'speed'] as const) {
    if (!isNum(s[k]) || (s[k] as number) < 0) return null;
  }
  if ((s.itemIndex as number) >= (s.itemCount as number) || (s.round as number) < 1 || (s.speed as number) <= 0) return null;
  if (s.plannedSec !== null && !(isNum(s.plannedSec) && s.plannedSec > 0)) return null;
  if (!isStr(s.startIso) || !isStr(s.savedAt) || Number.isNaN(Date.parse(s.savedAt)) || Number.isNaN(Date.parse(s.startIso))) return null;
  if (s.coach !== 'homme' && s.coach !== 'femme') return null;
  return s as unknown as ResumeSnapshot;
}

/** minimal shape of a plan block, so this file does not depend on the UI */
export interface PlanBlockLike {
  key: string;
  work: number | null;
  rounds: number;
}

/**
 * Real progress of a session, in work seconds: a programme counts its whole plan; a timed exercise counts its
 * current block (the other exercises of the level are only reachable with « Suivant »); free practice has no
 * planned length, so no progress is shown (never an invented percentage).
 */
export function workProgress(
  plan: { mode: TrainingMode; items: PlanBlockLike[] },
  at: { itemIndex: number; round: number; phase: ResumePhase; phaseElapsed: number },
): { plannedSec: number | null; doneSec: number } {
  const it = plan.items[at.itemIndex];
  if (!it) return { plannedSec: null, doneSec: 0 };
  const inWork = at.phase === 'travail' ? at.phaseElapsed : 0;
  const block = (x: PlanBlockLike) => (x.work ?? 0) * x.rounds;
  if (plan.mode === 'programme') {
    if (plan.items.some((x) => !x.work)) return { plannedSec: null, doneSec: 0 };
    const before = plan.items.slice(0, at.itemIndex).reduce((a, x) => a + block(x), 0);
    const planned = plan.items.reduce((a, x) => a + block(x), 0);
    const done = before + (at.round - 1) * (it.work ?? 0) + Math.min(inWork, it.work ?? 0);
    return { plannedSec: planned, doneSec: Math.min(planned, done) };
  }
  if (!it.work) return { plannedSec: null, doneSec: 0 };
  const planned = block(it);
  return { plannedSec: planned, doneSec: Math.min(planned, (at.round - 1) * it.work + Math.min(inWork, it.work)) };
}

/** 0..1, or null when the session has no planned length */
export const progressRatio = (s: Pick<ResumeSnapshot, 'plannedSec' | 'doneSec'>) => (s.plannedSec ? Math.max(0, Math.min(1, s.doneSec / s.plannedSec)) : null);

/** the snapshot still matches the plan rebuilt from today's data (the exercise was not removed or moved) */
export function matchesPlan(s: ResumeSnapshot, plan: { items: PlanBlockLike[] }) {
  return plan.items.length === s.itemCount && plan.items[s.itemIndex]?.key === s.itemKey;
}

const ageDays = (iso: string, now: Date) => (now.getTime() - Date.parse(iso)) / 86_400_000;

export interface ProgramRun {
  /** ISO time the programme session was last finished */
  lastDone: string;
  /** finished sessions of this programme */
  count: number;
}

export type ResumeCardState =
  | { kind: 'reprendre'; snapshot: ResumeSnapshot }
  | { kind: 'programme'; programId: string; run: ProgramRun }
  | { kind: 'nouvelle' }
  | { kind: 'premiere' };

/**
 * Which card the Séances space shows (§5.3): an interrupted session that can really be resumed (newest valid one),
 * else a programme done recently, else a new session if the user already trained, else the first session.
 */
export function pickCard(input: {
  snapshots: unknown[];
  programs: Record<string, ProgramRun>;
  hasHistory: boolean;
  /** the source of the session still exists (exercise, programme, personal combination) */
  available: (s: ResumeSnapshot) => boolean;
  programExists: (id: string) => boolean;
  now: Date;
}): ResumeCardState {
  const valid = input.snapshots
    .map(validSnapshot)
    .filter((s): s is ResumeSnapshot => !!s && ageDays(s.savedAt, input.now) <= RESUME_MAX_AGE_DAYS && input.available(s))
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
  if (valid[0]) return { kind: 'reprendre', snapshot: valid[0] };
  const runs = Object.entries(input.programs)
    .filter(([id, r]) => input.programExists(id) && r && isStr(r.lastDone) && ageDays(r.lastDone, input.now) <= PROGRAM_ACTIVE_DAYS)
    .sort((a, b) => Date.parse(b[1].lastDone) - Date.parse(a[1].lastDone));
  if (runs[0]) return { kind: 'programme', programId: runs[0][0], run: runs[0][1] };
  return input.hasHistory ? { kind: 'nouvelle' } : { kind: 'premiere' };
}

/** the query of a session without the resume marker, so it identifies the session */
export function sessionQuery(q: URLSearchParams) {
  const c = new URLSearchParams(q);
  c.delete('reprise');
  c.sort();
  return c.toString();
}
