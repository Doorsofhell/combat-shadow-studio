import { useEffect, useMemo, useState } from 'react';
import { EXERCISES, EXERCISE_BY_ID } from '../../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../../domain/techniques';
import type { DisciplineId, ExerciseKind } from '../../../domain/types';
import { filterExercises, type KbStyleChoice } from '../../../domain/kickboxingStyles';
import { compare, courseOf, coverage, dayKey, dayNum, firstDayOf, keyOf, matches, periodPair, split, totals, type ProgressFilters, type ProgressRecord } from '../../../domain/progress';
import { PROGRAM_BY_ID } from '../../../domain/programs';
import { pickCard } from '../../../domain/resume';
import { useCatalog } from '../../../store/catalog';
import { useCustom } from '../../../store/custom';
import { useProgressView } from '../../../store/progressView';
import { useResume } from '../../../store/resume';
import { useStats } from '../../../store/stats';
import { useHydrated } from '../../../store/useHydrated';
import { useKbStyle } from '../../components';

/**
 * v0.39 (Youssef, 2026-10-22, « Refonte premium de l'espace Progrès »): the figures shared by the overview and its
 * detail screens. They all come from the sessions recorded on this device (src/store/stats.ts) through
 * src/domain/progress.ts, with the discipline, level, kind and period kept in useProgressView: changing the period on
 * one screen changes it everywhere.
 */
export const kindOfRecord = (r: ProgressRecord): ExerciseKind | null => {
  const e = EXERCISE_BY_ID.get(r.exerciseId);
  if (e) return e.kind;
  // custom and catalogue combinations are sequences of techniques
  if (r.exerciseId.startsWith('perso-') || r.exerciseId.startsWith('cat-')) return 'combinaison';
  return null;
};

/** today's local day, changing at midnight while the screen stays open */
export function useToday() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (dayKey(n) === dayKey(new Date()) ? n : new Date())), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

const techniqueOk = (id: string) => !!TECHNIQUE_BY_ID.get(id) && TECHNIQUE_BY_ID.get(id)!.mode !== 'partenaire';

export function courseFor(f: ProgressFilters, kb: KbStyleChoice) {
  return courseOf(filterExercises(EXERCISES, kb), techniqueOk, f);
}

export function useProgressData(over: { discipline?: DisciplineId | 'toutes' } = {}) {
  const sessions = useStats((s) => s.sessions);
  const custom = useCustom((s) => s.combos);
  const v = useProgressView();
  const [kb] = useKbStyle();
  const needCatalog = useMemo(() => sessions.some((s) => s.exerciseId.startsWith('cat-')), [sessions]);
  const { catalog } = useCatalog(needCatalog);
  const now = useToday();
  const today = dayKey(now);
  const f: ProgressFilters = { discipline: over.discipline ?? v.discipline, level: v.level, kind: v.kind };
  const p = periodPair(v.preset === 'perso' && !v.custom ? '30j' : v.preset, now, v.custom ?? undefined);
  const { cur, prev } = split(sessions, p, f, kindOfRecord);
  // breaks are counted from the first day trained with these filters, never before the first use
  const first = firstDayOf(sessions.filter((r) => matches(r, f, kindOfRecord)));
  const tc = totals(cur, p.cur, today, first);
  const tp = totals(prev, p.prev, today, first);
  const cmp = compare(tc, tp);
  const sequenceOf = (r: ProgressRecord) => {
    const e = EXERCISE_BY_ID.get(r.exerciseId);
    if (e) return e.sequence;
    if (r.exerciseId.startsWith('perso-')) return custom.find((c) => `perso-${c.id}` === r.exerciseId)?.sequence ?? null;
    if (r.exerciseId.startsWith('cat-')) return catalog?.comboById.get(r.exerciseId.slice(4))?.sequence ?? null;
    return null;
  };
  const course = courseFor(f, kb);
  const cov = coverage(sessions, course, f, sequenceOf, p);
  return { sessions, custom, v, kb, now, today, f, p, cur, prev, tc, tp, cmp, sequenceOf, course, cov };
}

/**
 * Consecutive days with at least one recorded session, ending today (or yesterday: the day is not over yet). 0 when
 * the last session is older. Days come from the records, never estimated.
 */
export function streak(records: readonly { start: string }[], today: string): number {
  const days = new Set(records.map((r) => dayKey(new Date(r.start))));
  let d = dayNum(today);
  if (!days.has(today)) d -= 1;
  let n = 0;
  while (days.has(keyOf(d))) {
    n++;
    d--;
  }
  return n;
}

/** the session that can really be resumed now (same rules as Entraîner), or null */
export function useResumable(): { to: string; label: string } | null {
  const ready = useHydrated(useResume);
  const snapshots = useResume((s) => s.snapshots);
  const programs = useResume((s) => s.programs);
  const sessions = useStats((s) => s.sessions);
  const combos = useCustom((s) => s.combos);
  return useMemo(() => {
    if (!ready) return null;
    const card = pickCard({
      snapshots,
      programs,
      hasHistory: sessions.length > 0,
      available: (s) => {
        const q = new URLSearchParams(s.query);
        if (q.get('prog')) return PROGRAM_BY_ID.has(q.get('prog')!);
        if (q.get('perso')) return combos.some((c) => c.id === q.get('perso'));
        if (q.get('ex')) return EXERCISE_BY_ID.has(q.get('ex')!);
        return !!q.get('cat');
      },
      programExists: (id) => PROGRAM_BY_ID.has(id),
      now: new Date(),
    });
    if (card.kind === 'reprendre') return { to: `/entrainement?${card.snapshot.query}&reprise=1`, label: 'Reprendre l’entraînement' };
    if (card.kind === 'programme') return { to: `/entrainement?prog=${card.programId}`, label: 'Continuer mon programme' };
    return null;
  }, [ready, snapshots, programs, sessions.length, combos]);
}
