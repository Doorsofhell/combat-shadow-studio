import type { DisciplineId, TrainingMode } from './types';

/**
 * v0.48 « Chrono de combat » (Youssef, 2026-10-23 et 2026-10-27, maquette B « Plein écran » choisie): a timer on its
 * own, reached from the bottom bar, with ready formats per discipline. The formats are usual competition or
 * training lengths, given as starting points: the user changes any of them with + and −.
 */
export interface ChronoFormat {
  id: string;
  label: string;
  /** the discipline the session is filed under in the history (none: the user's main discipline) */
  discipline?: DisciplineId;
  /** round or effort length, rest between two rounds, number of rounds (seconds) */
  work: number;
  rest: number;
  rounds: number;
  /** effort and recovery (Cardio) rather than combat rounds */
  intervals?: boolean;
}

export const CHRONO_FORMATS: readonly ChronoFormat[] = [
  { id: 'boxe', label: 'Boxe anglaise', discipline: 'boxe', work: 180, rest: 60, rounds: 3 },
  { id: 'kickboxing', label: 'Kick-boxing', discipline: 'kickboxing', work: 120, rest: 60, rounds: 3 },
  { id: 'mma', label: 'MMA', discipline: 'mma', work: 300, rest: 60, rounds: 3 },
  { id: 'muaythai', label: 'Muay-thaï', discipline: 'muaythai', work: 180, rest: 120, rounds: 5 },
  { id: 'bjj', label: 'Jiu-jitsu brésilien', discipline: 'bjj', work: 360, rest: 0, rounds: 1 },
  { id: 'judo', label: 'Judo', discipline: 'judo', work: 240, rest: 0, rounds: 1 },
  { id: 'intervalles', label: 'Intervalles', work: 20, rest: 10, rounds: 8, intervals: true },
];
export const CHRONO_FORMAT_BY_ID = new Map(CHRONO_FORMATS.map((f) => [f.id, f]));

/** the timer the user set up (remembered in the settings) */
export interface ChronoSetup {
  /** a format id, or 'perso' once a value was changed by hand */
  format: string;
  work: number;
  rest: number;
  rounds: number;
}
export const DEFAULT_CHRONO: ChronoSetup = { format: 'boxe', work: 180, rest: 60, rounds: 3 };

export const CHRONO_LIMITS = { work: [10, 600], rest: [0, 300], rounds: [1, 20] } as const;

/** one step of + or −: 10 s under a minute, 30 s above, so 3 min and 5 min are reached in a few taps */
export function stepSeconds(v: number, dir: 1 | -1, [lo, hi]: readonly [number, number]): number {
  const step = dir > 0 ? (v >= 60 ? 30 : 10) : v > 60 ? 30 : 10;
  return Math.max(lo, Math.min(hi, v + dir * step));
}
export function stepRounds(v: number, dir: 1 | -1): number {
  const [lo, hi] = CHRONO_LIMITS.rounds;
  return Math.max(lo, Math.min(hi, v + dir));
}

/** a stored setup read back safely (older or damaged values fall back to the default) */
export function cleanSetup(s: Partial<ChronoSetup> | undefined): ChronoSetup {
  const n = (v: unknown, [lo, hi]: readonly [number, number], d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : d);
  return {
    format: typeof s?.format === 'string' && (s.format === 'perso' || CHRONO_FORMAT_BY_ID.has(s.format)) ? s.format : DEFAULT_CHRONO.format,
    work: n(s?.work, CHRONO_LIMITS.work, DEFAULT_CHRONO.work),
    rest: n(s?.rest, CHRONO_LIMITS.rest, DEFAULT_CHRONO.rest),
    rounds: n(s?.rounds, CHRONO_LIMITS.rounds, DEFAULT_CHRONO.rounds),
  };
}

/** the setup changed by hand: no longer the format it came from */
export function editSetup(s: ChronoSetup, patch: Partial<Omit<ChronoSetup, 'format'>>): ChronoSetup {
  const next = { ...s, ...patch };
  const f = CHRONO_FORMAT_BY_ID.get(s.format);
  const same = f && f.work === next.work && f.rest === next.rest && f.rounds === next.rounds;
  return { ...next, format: same ? s.format : 'perso' };
}

/** the whole session, preparation included (no rest after the last round) */
export const chronoTotal = (s: ChronoSetup, prep: number) => prep + s.rounds * s.work + (s.rounds - 1) * s.rest;

/** how the session is filed in the history: Cardio for intervals, Rounds otherwise */
export const chronoMode = (s: ChronoSetup): TrainingMode => (CHRONO_FORMAT_BY_ID.get(s.format)?.intervals ? 'cardio' : 'rounds');

/** 3:00, 0:20 */
export const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
/** 03:00, the running clock (a second shows until it has fully passed) */
export const clock = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec - 1e-6));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
