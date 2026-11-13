/**
 * Progress over time, computed only from what was recorded on this device (src/store/stats.ts):
 * active time (pauses are never counted), sessions, repetitions and the exercises practised. The
 * current period is compared with the previous period of the same number of days. Nothing here
 * measures how well a movement is done: no tracking device observes the user.
 *
 * Days are local calendar days ("yyyy-mm-dd" in the device's time zone), counted with UTC day
 * numbers so that daylight saving changes never add or lose a day.
 */
import type { DisciplineId, Exercise, ExerciseKind, LevelId } from './types';
import { LEVELS } from './types';

export interface ProgressRecord {
  id: string;
  start: string;
  discipline: DisciplineId;
  level: LevelId;
  exerciseId: string;
  exerciseName: string;
  activeSec: number;
  reps: number;
}

// ------------------------------------------------------------------ days

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** local calendar day of a date */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** day number of a "yyyy-mm-dd" key (days since 1970-01-01) */
export function dayNum(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function keyOf(n: number) {
  const d = new Date(n * DAY_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export const recordDay = (r: { start: string }) => dayKey(new Date(r.start));

// ------------------------------------------------------------------ periods

export type PeriodPreset = '7j' | '30j' | '90j' | '12m' | 'perso';

export const PERIOD_PRESETS: {
  id: Exclude<PeriodPreset, 'perso'>;
  label: string;
  days: number;
}[] = [
  { id: '7j', label: '7 jours', days: 7 },
  { id: '30j', label: '30 jours', days: 30 },
  { id: '90j', label: '90 jours', days: 90 },
  // 365 days rather than calendar months, so that both periods always have the same length
  { id: '12m', label: '12 mois', days: 365 },
];

/** inclusive range of local days */
export interface DayRange {
  from: string;
  to: string;
  days: number;
}

export interface PeriodPair {
  cur: DayRange;
  prev: DayRange;
  /** the current period contains today: it is not over yet */
  inProgress: boolean;
  /** the current period ends in the future: days after today cannot hold data yet */
  futureDays: number;
}

const range = (a: number, b: number): DayRange => ({
  from: keyOf(a),
  to: keyOf(b),
  days: b - a + 1,
});

/**
 * The current period and the previous one of the same length, just before it. Presets end today.
 * A custom period is taken as given (dates swapped if reversed).
 */
export function periodPair(preset: PeriodPreset, now: Date, custom?: { from: string; to: string }): PeriodPair {
  const today = dayNum(dayKey(now));
  let a: number;
  let b: number;
  if (preset === 'perso' && custom) {
    a = dayNum(custom.from);
    b = dayNum(custom.to);
    if (a > b) [a, b] = [b, a];
  } else {
    const days = PERIOD_PRESETS.find((p) => p.id === preset)?.days ?? 30;
    b = today;
    a = today - days + 1;
  }
  const n = b - a + 1;
  return {
    cur: range(a, b),
    prev: range(a - n, a - 1),
    inProgress: a <= today && today <= b,
    futureDays: Math.max(0, b - Math.max(today, a - 1)),
  };
}

export const inRange = (day: string, r: DayRange) => day >= r.from && day <= r.to;

// ------------------------------------------------------------------ filters

export interface ProgressFilters {
  discipline: DisciplineId | 'toutes';
  level?: LevelId | null;
  kind?: ExerciseKind | null;
}

/** the kind of exercise a record belongs to, null when it cannot be known */
export type KindOf = (r: ProgressRecord) => ExerciseKind | null;

export function matches(r: ProgressRecord, f: ProgressFilters, kindOf: KindOf) {
  if (f.discipline !== 'toutes' && r.discipline !== f.discipline) return false;
  if (f.level && r.level !== f.level) return false;
  if (f.kind && kindOf(r) !== f.kind) return false;
  return true;
}

// ------------------------------------------------------------------ totals

export interface Totals {
  activeSec: number;
  sessions: number;
  reps: number;
  /** distinct exercises practised */
  exercises: number;
  /** days with at least one recorded active second or repetition */
  activeDays: number;
  /**
   * longest run of days without training inside the period, counted from the first day ever
   * trained (days before the first use of the app are not a break) and up to today
   */
  longestBreak: number;
}

/** records of a period (already filtered); firstDay: first day trained, all periods together */
export function totals(xs: ProgressRecord[], r: DayRange, today: string, firstDay?: string | null): Totals {
  const days = new Set(xs.map(recordDay));
  const last = Math.min(dayNum(r.to), dayNum(today));
  let longestBreak = 0;
  let run = 0;
  const from = firstDay === null ? Infinity : Math.max(dayNum(r.from), firstDay ? dayNum(firstDay) : -Infinity);
  for (let d = from; d <= last; d++) {
    if (days.has(keyOf(d))) run = 0;
    else longestBreak = Math.max(longestBreak, ++run);
  }
  return {
    activeSec: xs.reduce((a, s) => a + s.activeSec, 0),
    // one session = one start (a session with several exercises has several records)
    sessions: new Set(xs.map((s) => s.id.split('#')[0])).size,
    reps: xs.reduce((a, s) => a + s.reps, 0),
    exercises: new Set(xs.map((s) => s.exerciseId)).size,
    activeDays: days.size,
    longestBreak,
  };
}

export function split(all: ProgressRecord[], p: PeriodPair, f: ProgressFilters, kindOf: KindOf) {
  const cur: ProgressRecord[] = [];
  const prev: ProgressRecord[] = [];
  for (const r of all) {
    if (!matches(r, f, kindOf)) continue;
    const d = recordDay(r);
    if (inRange(d, p.cur)) cur.push(r);
    else if (inRange(d, p.prev)) prev.push(r);
  }
  return { cur, prev };
}

// ------------------------------------------------------------------ comparison

/** up: more than before; flat: the same (within the tolerance); down: less; new: nothing before; none: nothing in either */
export type Trend = 'up' | 'flat' | 'down' | 'new' | 'none';
/** how the trend reads for the user (for a break, shorter is better) */
export type Tone = 'progression' | 'stagnation' | 'regression' | 'neutral';

export interface Delta {
  cur: number;
  prev: number;
  diff: number;
  /** only when the previous period holds a value: never a growth rate from zero */
  pct: number | null;
  trend: Trend;
  tone: Tone;
  /** the two values exist but measure different things (a break next to a period without training) */
  incomparable?: boolean;
}

/** changes smaller than this share of the previous value read as stable */
export const STABLE_TOLERANCE = 0.05;

export function delta(cur: number, prev: number, opts: { lowerIsBetter?: boolean } = {}): Delta {
  const diff = cur - prev;
  let trend: Trend;
  let pct: number | null = null;
  if (cur === 0 && prev === 0) trend = 'none';
  else if (prev === 0) trend = 'new';
  else {
    pct = diff / prev;
    trend = Math.abs(pct) < STABLE_TOLERANCE ? 'flat' : diff > 0 ? 'up' : 'down';
  }
  const good = opts.lowerIsBetter ? 'down' : 'up';
  const tone: Tone =
    trend === 'none' ? 'neutral' : trend === 'flat' ? 'stagnation' : trend === 'new' ? (opts.lowerIsBetter ? 'neutral' : 'progression') : trend === good ? 'progression' : 'regression';
  return { cur, prev, diff, pct, trend, tone };
}

export interface Comparison {
  activeSec: Delta;
  sessions: Delta;
  reps: Delta;
  exercises: Delta;
  activeDays: Delta;
  longestBreak: Delta;
}

const notComparable = (cur: number, prev: number): Delta => ({ cur, prev, diff: cur - prev, pct: null, trend: 'none', tone: 'neutral', incomparable: true });

/** first day trained among the records (null when there is none) */
export function firstDayOf(xs: ProgressRecord[]) {
  let first: string | null = null;
  for (const r of xs) {
    const d = recordDay(r);
    if (!first || d < first) first = d;
  }
  return first;
}

export function compare(a: Totals, b: Totals): Comparison {
  return {
    activeSec: delta(a.activeSec, b.activeSec),
    sessions: delta(a.sessions, b.sessions),
    reps: delta(a.reps, b.reps),
    exercises: delta(a.exercises, b.exercises),
    activeDays: delta(a.activeDays, b.activeDays),
    // a break is compared only when both periods hold training: otherwise it says nothing
    longestBreak: a.activeDays && b.activeDays ? delta(a.longestBreak, b.longestBreak, { lowerIsBetter: true }) : notComparable(a.longestBreak, b.longestBreak),
  };
}

/** "+18 %", "stable", "Nouvelle activité", "−2 j"… (unit formats the absolute difference) */
export function deltaLabel(d: Delta, unit: (n: number) => string) {
  const sign = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '');
  switch (d.trend) {
    case 'none':
      return d.incomparable ? 'non comparable' : 'Aucune donnée';
    case 'new':
      return 'Nouvelle activité';
    case 'flat':
      return d.diff === 0 ? 'stable' : `stable (${sign(d.diff)}${unit(Math.abs(d.diff))})`;
    default: {
      const pct = Math.round(Math.abs(d.pct!) * 100);
      return `${sign(d.diff)}${pct} % (${sign(d.diff)}${unit(Math.abs(d.diff))})`;
    }
  }
}

// ------------------------------------------------------------------ buckets

/** days per bar: a day up to two weeks, a week up to 4 months, else about a twelfth of the period */
export function bucketDays(days: number) {
  if (days <= 14) return 1;
  if (days <= 120) return 7;
  return Math.max(7, Math.round(days / 12));
}

export interface Bucket {
  /** index from the start of the period: bar i of the current period faces bar i of the previous one */
  index: number;
  cur: DayRange;
  prev: DayRange;
  curSec: number;
  prevSec: number;
  /** the bucket is shorter than the others (the last one, when the period does not divide evenly) */
  short: boolean;
  /** the bucket contains today */
  inProgress: boolean;
}

export function buckets(cur: ProgressRecord[], prev: ProgressRecord[], p: PeriodPair, today: string): Bucket[] {
  const size = bucketDays(p.cur.days);
  const n = Math.ceil(p.cur.days / size);
  const a = dayNum(p.cur.from);
  const pa = dayNum(p.prev.from);
  const t = dayNum(today);
  const out: Bucket[] = [];
  for (let i = 0; i < n; i++) {
    const s = i * size;
    const e = Math.min(p.cur.days, s + size) - 1;
    out.push({
      index: i,
      cur: range(a + s, a + e),
      prev: range(pa + s, pa + e),
      curSec: 0,
      prevSec: 0,
      short: e - s + 1 < size,
      inProgress: a + s <= t && t <= a + e,
    });
  }
  const at = (r: ProgressRecord, base: number) => Math.floor((dayNum(recordDay(r)) - base) / size);
  for (const r of cur) out[at(r, a)].curSec += r.activeSec;
  for (const r of prev) out[at(r, pa)].prevSec += r.activeSec;
  return out;
}

// ------------------------------------------------------------------ breakdowns

export interface Row {
  id: string;
  label: string;
  cur: number;
  prev: number;
}

function group(cur: ProgressRecord[], prev: ProgressRecord[], key: (r: ProgressRecord) => string) {
  const m = new Map<string, { cur: number; prev: number }>();
  const add = (r: ProgressRecord, k: 'cur' | 'prev') => {
    const id = key(r);
    const v = m.get(id) ?? { cur: 0, prev: 0 };
    v[k] += r.activeSec;
    m.set(id, v);
  };
  cur.forEach((r) => add(r, 'cur'));
  prev.forEach((r) => add(r, 'prev'));
  return m;
}

export function byLevel(cur: ProgressRecord[], prev: ProgressRecord[]): Row[] {
  const m = group(cur, prev, (r) => r.level);
  return LEVELS.map((l) => ({
    id: l.id,
    label: l.name,
    ...(m.get(l.id) ?? { cur: 0, prev: 0 }),
  }));
}

export const KIND_LABEL: Record<ExerciseKind | 'autre', string> = {
  technique: 'Techniques',
  combinaison: 'Combinaisons',
  defense: 'Défense',
  deplacement: 'Déplacements',
  cardio: 'Cardio',
  round: 'Rounds',
  autre: 'Non classé',
};

export function byKind(cur: ProgressRecord[], prev: ProgressRecord[], kindOf: KindOf): Row[] {
  const m = group(cur, prev, (r) => kindOf(r) ?? 'autre');
  return (Object.keys(KIND_LABEL) as (ExerciseKind | 'autre')[])
    .filter((k) => m.has(k))
    .map((k) => ({ id: k, label: KIND_LABEL[k], ...m.get(k)! }))
    .sort((x, y) => y.cur - x.cur || y.prev - x.prev);
}

export interface ExerciseRow {
  id: string;
  name: string;
  sec: number;
  reps: number;
  sessions: number;
  prevSec: number;
}

export function byExercise(cur: ProgressRecord[], prev: ProgressRecord[]): ExerciseRow[] {
  const m = new Map<string, ExerciseRow>();
  const get = (r: ProgressRecord) => {
    let v = m.get(r.exerciseId);
    if (!v)
      m.set(
        r.exerciseId,
        (v = {
          id: r.exerciseId,
          name: r.exerciseName,
          sec: 0,
          reps: 0,
          sessions: 0,
          prevSec: 0,
        }),
      );
    return v;
  };
  const starts = new Map<string, Set<string>>();
  for (const r of cur) {
    const v = get(r);
    v.sec += r.activeSec;
    v.reps += r.reps;
    const s = starts.get(r.exerciseId) ?? new Set();
    s.add(r.id.split('#')[0]);
    starts.set(r.exerciseId, s);
  }
  for (const r of prev) if (m.has(r.exerciseId)) m.get(r.exerciseId)!.prevSec += r.activeSec;
  for (const [id, s] of starts) m.get(id)!.sessions = s.size;
  return [...m.values()].filter((v) => v.sec > 0 || v.reps > 0).sort((a, b) => b.sec - a.sec || b.reps - a.reps);
}

/** sessions of the current period, newest first: one entry per start, with its exercises */
export interface SessionGroup {
  start: string;
  discipline: DisciplineId;
  records: ProgressRecord[];
  activeSec: number;
  reps: number;
}

export function sessionGroups(xs: ProgressRecord[]): SessionGroup[] {
  const m = new Map<string, SessionGroup>();
  for (const r of xs) {
    const k = r.id.split('#')[0];
    const g = m.get(k) ?? {
      start: r.start,
      discipline: r.discipline,
      records: [],
      activeSec: 0,
      reps: 0,
    };
    g.records.push(r);
    g.activeSec += r.activeSec;
    g.reps += r.reps;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.start.localeCompare(a.start));
}

// ------------------------------------------------------------------ course coverage

/** the techniques of an exercise record, null when the exercise no longer exists (deleted custom combination) */
export type SequenceOf = (r: ProgressRecord) => string[] | null;

export interface Coverage {
  /** techniques of the course practised at least once up to the end of the period */
  studied: number;
  total: number;
  /** studied / total, 0 when the course is empty */
  ratio: number;
  /** techniques practised for the first time during the current period, during the previous one */
  newCur: number;
  newPrev: number;
  /** records whose exercise could not be resolved: their techniques are not counted */
  unresolved: number;
}

/**
 * Coverage of the course: how many of its techniques appear in an exercise the user practised. It
 * counts what was trained, not how well: time spent does not raise it.
 */
export function coverage(all: ProgressRecord[], course: Set<string>, f: ProgressFilters, sequenceOf: SequenceOf, p: PeriodPair): Coverage {
  const first = new Map<string, string>();
  let unresolved = 0;
  for (const r of all) {
    if (f.discipline !== 'toutes' && r.discipline !== f.discipline) continue;
    if (f.level && r.level !== f.level) continue;
    const day = recordDay(r);
    if (day > p.cur.to) continue;
    const seq = sequenceOf(r);
    if (!seq) {
      unresolved++;
      continue;
    }
    for (const t of seq) {
      if (!course.has(t)) continue;
      const was = first.get(t);
      if (!was || day < was) first.set(t, day);
    }
  }
  let newCur = 0;
  let newPrev = 0;
  for (const d of first.values()) {
    if (inRange(d, p.cur)) newCur++;
    else if (inRange(d, p.prev)) newPrev++;
  }
  const total = course.size;
  return {
    studied: first.size,
    total,
    ratio: total ? first.size / total : 0,
    newCur,
    newPrev,
    unresolved,
  };
}

/** the course of a discipline (or of all), optionally of one level: the techniques of its solo exercises */
export function courseOf(exercises: Exercise[], techniqueOk: (id: string) => boolean, f: ProgressFilters) {
  const out = new Set<string>();
  for (const e of exercises) {
    if (f.discipline !== 'toutes' && e.discipline !== f.discipline) continue;
    if (f.level && e.level !== f.level) continue;
    for (const t of e.sequence) if (techniqueOk(t)) out.add(t);
  }
  return out;
}
