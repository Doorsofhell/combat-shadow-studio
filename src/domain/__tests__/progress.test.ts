import { describe, expect, it } from 'vitest';
import {
  ProgressRecord,
  bucketDays,
  buckets,
  byExercise,
  byKind,
  byLevel,
  compare,
  coverage,
  courseOf,
  dayKey,
  dayNum,
  delta,
  firstDayOf,
  deltaLabel,
  periodPair,
  sessionGroups,
  split,
  totals,
} from '../progress';
import { EXERCISES, EXERCISE_BY_ID } from '../exercises';
import type { DisciplineId, LevelId } from '../types';

// local noon on 2026-03-31, the day before daylight saving changes in many zones does not matter: days are local
const NOW = new Date(2026, 2, 31, 18, 0, 0);
const TODAY = dayKey(NOW);

let n = 0;
/** a record `daysAgo` days before NOW, at 10:00 local time */
function rec(daysAgo: number, sec: number, o: Partial<ProgressRecord> & { session?: string } = {}): ProgressRecord {
  const d = new Date(2026, 2, 31 - daysAgo, 10, 0, 0);
  const start = o.start ?? d.toISOString();
  const exerciseId = o.exerciseId ?? 'boxe-debutant-01';
  return {
    id: `${o.session ?? start}#${exerciseId}#${n++}`,
    start,
    discipline: (o.discipline ?? 'boxe') as DisciplineId,
    level: (o.level ?? 'debutant') as LevelId,
    exerciseId,
    exerciseName: o.exerciseName ?? exerciseId,
    activeSec: sec,
    reps: o.reps ?? 0,
  };
}

const kindOf = (r: ProgressRecord) => EXERCISE_BY_ID.get(r.exerciseId)?.kind ?? null;
const ALL = { discipline: 'toutes' as const };

function run(records: ProgressRecord[], preset: Parameters<typeof periodPair>[0] = '7j', f: Parameters<typeof split>[2] = ALL, custom?: { from: string; to: string }) {
  const p = periodPair(preset, NOW, custom);
  const { cur, prev } = split(records, p, f, kindOf);
  const c = compare(totals(cur, p.cur, TODAY), totals(prev, p.prev, TODAY));
  return { p, cur, prev, c };
}

describe('periods', () => {
  it('presets end today and the previous period has the same length, just before', () => {
    for (const [id, days] of [
      ['7j', 7],
      ['30j', 30],
      ['90j', 90],
      ['12m', 365],
    ] as const) {
      const p = periodPair(id, NOW);
      expect(p.cur.to).toBe(TODAY);
      expect(p.cur.days).toBe(days);
      expect(p.prev.days).toBe(days);
      expect(dayNum(p.prev.to)).toBe(dayNum(p.cur.from) - 1);
      expect(p.inProgress).toBe(true);
    }
  });

  it('counts calendar days across a daylight saving change (29 March 2026 in Europe)', () => {
    const p = periodPair('7j', NOW);
    expect(p.cur).toEqual({ from: '2026-03-25', to: '2026-03-31', days: 7 });
    expect(p.prev).toEqual({ from: '2026-03-18', to: '2026-03-24', days: 7 });
  });

  it('custom period: given dates inclusive, previous period of the same length, reversed dates accepted', () => {
    const p = periodPair('perso', NOW, {
      from: '2026-02-10',
      to: '2026-02-01',
    });
    expect(p.cur).toEqual({ from: '2026-02-01', to: '2026-02-10', days: 10 });
    expect(p.prev).toEqual({ from: '2026-01-22', to: '2026-01-31', days: 10 });
    expect(p.inProgress).toBe(false);
    const q = periodPair('perso', NOW, {
      from: '2026-03-20',
      to: '2026-04-05',
    });
    expect(q.inProgress).toBe(true);
    expect(q.futureDays).toBe(5);
  });

  it('places a record on its local day, not its UTC day', () => {
    const late = new Date(2026, 2, 24, 23, 30).toISOString();
    const { cur, prev } = run([rec(0, 60, { start: late })]);
    expect(cur).toHaveLength(0);
    expect(prev).toHaveLength(1);
  });
});

describe('comparison with the previous period', () => {
  it('1. rise in activity', () => {
    const { c } = run([rec(9, 600), rec(1, 600), rec(2, 600)]);
    expect(c.activeSec).toMatchObject({
      cur: 1200,
      prev: 600,
      diff: 600,
      pct: 1,
      trend: 'up',
      tone: 'progression',
    });
    expect(c.activeDays).toMatchObject({ cur: 2, prev: 1, trend: 'up' });
    expect(deltaLabel(c.activeSec, (s) => `${s / 60} min`)).toBe('+100 % (+10 min)');
  });

  it('2. drop in activity: shown as less volume, with the real difference', () => {
    const { c } = run([rec(8, 1200), rec(10, 600), rec(1, 900)]);
    expect(c.activeSec).toMatchObject({
      cur: 900,
      prev: 1800,
      pct: -0.5,
      trend: 'down',
      tone: 'regression',
    });
    expect(deltaLabel(c.activeSec, (s) => `${s / 60} min`)).toBe('−50 % (−15 min)');
  });

  it('3. identical periods are stable, never ±0 %', () => {
    const { c } = run([rec(8, 600, { reps: 10 }), rec(1, 600, { reps: 10 })]);
    for (const d of Object.values(c)) expect(d.trend).toBe('flat');
    expect(deltaLabel(c.activeDays, String)).toBe('stable');
    expect(delta(1000, 1020).trend).toBe('flat');
    expect(deltaLabel(delta(1000, 1020), String)).toBe('stable (−20)');
  });

  it('4. previous period empty: "Nouvelle activité", no percentage from zero', () => {
    const { c } = run([rec(1, 600, { reps: 5 })]);
    expect(c.activeSec).toMatchObject({
      prev: 0,
      pct: null,
      trend: 'new',
      tone: 'progression',
    });
    expect(deltaLabel(c.reps, String)).toBe('Nouvelle activité');
    for (const d of Object.values(c)) expect(Number.isFinite(d.pct ?? 0)).toBe(true);
  });

  it('5. current period empty: a real −100 %, and no data at all reads as no data', () => {
    const { c } = run([rec(9, 600)]);
    expect(c.activeSec).toMatchObject({
      cur: 0,
      prev: 600,
      pct: -1,
      trend: 'down',
    });
    const empty = run([]).c;
    for (const d of Object.values(empty)) expect(d).toMatchObject({ trend: 'none', pct: null, tone: 'neutral' });
    expect(deltaLabel(empty.activeSec, String)).toBe('Aucune donnée');
  });

  it('6. custom period is compared with the same number of days before it', () => {
    const r = [rec(40, 300), rec(35, 300), rec(31, 300)]; // 19, 24, 28 Feb
    const { c } = run(r, 'perso', ALL, {
      from: '2026-02-24',
      to: '2026-02-28',
    });
    expect(c.activeSec).toMatchObject({ cur: 600, prev: 300 });
  });

  it('7. one discipline never mixes the others in', () => {
    const r = [rec(1, 600), rec(1, 900, { discipline: 'judo', exerciseId: 'judo-debutant-01' }), rec(8, 300, { discipline: 'judo', exerciseId: 'judo-debutant-01' })];
    expect(run(r, '7j', { discipline: 'boxe' }).c.activeSec).toMatchObject({
      cur: 600,
      prev: 0,
    });
    expect(run(r, '7j', { discipline: 'judo' }).c.activeSec).toMatchObject({
      cur: 900,
      prev: 300,
    });
    expect(run(r).c.activeSec).toMatchObject({ cur: 1500, prev: 300 });
  });

  it('level and category filters apply together with the discipline', () => {
    const r = [rec(1, 600), rec(1, 300, { level: 'expert', exerciseId: 'boxe-expert-01' })];
    expect(run(r, '7j', { discipline: 'boxe', level: 'expert' }).c.activeSec.cur).toBe(300);
    const kind = EXERCISE_BY_ID.get('boxe-debutant-01')!.kind;
    expect(run(r, '7j', { discipline: 'boxe', kind }).cur.every((x) => kindOf(x) === kind)).toBe(true);
  });

  it('a session with several exercises counts once; a break shorter than before reads as progress', () => {
    const s = new Date(2026, 2, 30, 9).toISOString();
    const r = [rec(1, 100, { session: s, start: s }), rec(1, 100, { session: s, start: s, exerciseId: 'boxe-debutant-02' })];
    const t = totals(r, periodPair('7j', NOW).cur, TODAY);
    expect(t.sessions).toBe(1);
    expect(t.exercises).toBe(2);
    expect(t.activeDays).toBe(1);
    // 25..29 without training, then 30, then 31 (today) without: longest break 5 days
    expect(t.longestBreak).toBe(5);
    expect(delta(2, 5, { lowerIsBetter: true }).tone).toBe('progression');
    // days before the first use of the app are not a break
    expect(totals(r, periodPair('30j', NOW).cur, TODAY, firstDayOf(r)).longestBreak).toBe(1);
    expect(totals([], periodPair('30j', NOW).cur, TODAY, null).longestBreak).toBe(0);
    // a break is not compared with a period without training
    const c = compare(totals(r, periodPair('7j', NOW).cur, TODAY), totals([], periodPair('7j', NOW).prev, TODAY));
    expect(c.longestBreak).toMatchObject({ trend: 'none', pct: null });
    expect(deltaLabel(c.longestBreak, String)).toBe('non comparable');
    expect(delta(5, 2, { lowerIsBetter: true }).tone).toBe('regression');
  });
});

describe('charts', () => {
  it('bucket size follows the length; previous buckets face current ones', () => {
    expect([7, 14, 30, 90, 365].map(bucketDays)).toEqual([1, 1, 7, 7, 30]);
    const r = [rec(0, 60), rec(29, 120), rec(30, 180)];
    const { p, cur, prev } = run(r, '30j');
    const b = buckets(cur, prev, p, TODAY);
    expect(b).toHaveLength(5);
    expect(b[4]).toMatchObject({ short: true, inProgress: true, curSec: 60 });
    expect(b[0].curSec).toBe(120);
    expect(b[4].prevSec).toBe(180);
    expect(b.reduce((a, x) => a + x.curSec, 0)).toBe(180);
  });

  it('breakdowns add up to the totals (no double counting)', () => {
    const r = [rec(1, 100, { reps: 3 }), rec(2, 200, { level: 'expert', exerciseId: 'boxe-expert-01', reps: 4 }), rec(8, 50)];
    const { cur, prev } = run(r);
    expect(byLevel(cur, prev).reduce((a, x) => a + x.cur, 0)).toBe(300);
    expect(byLevel(cur, prev).reduce((a, x) => a + x.prev, 0)).toBe(50);
    expect(byKind(cur, prev, kindOf).reduce((a, x) => a + x.cur, 0)).toBe(300);
    const ex = byExercise(cur, prev);
    expect(ex[0]).toMatchObject({
      id: 'boxe-expert-01',
      sec: 200,
      reps: 4,
      sessions: 1,
    });
    expect(ex[1]).toMatchObject({
      id: 'boxe-debutant-01',
      sec: 100,
      prevSec: 50,
    });
    expect(sessionGroups(cur)).toHaveLength(2);
  });
});

describe('course coverage', () => {
  const seq = (r: ProgressRecord) => EXERCISE_BY_ID.get(r.exerciseId)?.sequence ?? null;
  const f = { discipline: 'boxe' as const };
  const course = courseOf(EXERCISES, () => true, f);

  it('counts techniques practised, not time; first study dates split the periods', () => {
    const e1 = EXERCISE_BY_ID.get('boxe-debutant-01')!.sequence;
    const p = periodPair('7j', NOW);
    const once = coverage([rec(1, 10)], course, f, seq, p);
    const long = coverage([rec(1, 5000)], course, f, seq, p);
    expect(once.studied).toBe(new Set(e1).size);
    expect(long.studied).toBe(once.studied);
    expect(once.total).toBe(course.size);
    expect(once.ratio).toBeCloseTo(once.studied / course.size);
    expect(once.newCur).toBe(once.studied);
    const again = coverage([rec(9, 10), rec(1, 10)], course, f, seq, p);
    expect(again).toMatchObject({
      newCur: 0,
      newPrev: once.studied,
      studied: once.studied,
    });
  });

  it('ignores later records, other disciplines and deleted exercises (reported, not guessed)', () => {
    const p = periodPair('perso', NOW, {
      from: '2026-03-01',
      to: '2026-03-10',
    });
    const c = coverage([rec(1, 10), rec(25, 10, { discipline: 'judo', exerciseId: 'judo-debutant-01' }), rec(25, 10, { exerciseId: 'perso-x' })], course, f, seq, p);
    expect(c).toMatchObject({ studied: 0, unresolved: 1 });
  });

  it('an empty course gives 0 %, never a division by zero', () => {
    const c = coverage([], new Set(), f, seq, periodPair('7j', NOW));
    expect(c.ratio).toBe(0);
  });
});
