import { describe, expect, it } from 'vitest';
import { BETWEEN_ITEMS, PROGRAMS, PROGRAM_BY_ID, SESSION_COUNTDOWN, programProgress, programQuery, programSessionSeconds, programSessions } from '../programs';
import { CATALOGUE_GAPS } from '../programCatalog';
import { NO_PROGRAM_FILTER, filterPrograms, programEquipment, programLevel } from '../programMeta';
import { programSource } from '../programSources';
import { EXERCISE_BY_ID } from '../exercises';
import { programPlan } from '../../ui/training/plan';

// 0.41 (Youssef, 2026-10-22, « Enrichissement des programmes »)
describe('catalogue des programmes v0.41', () => {
  it('identifiants uniques et stables, au plus huit programmes par discipline', () => {
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(PROGRAMS.length);
    for (const p of PROGRAMS) expect(p.id).toMatch(/^[a-z0-9-]+$/);
    const per = new Map<string, number>();
    for (const p of PROGRAMS) per.set(p.discipline, (per.get(p.discipline) ?? 0) + 1);
    for (const d of ['boxe', 'kickboxing', 'mma', 'muaythai', 'judo', 'bjj'] as const) {
      expect(per.get(d)!).toBeLessThanOrEqual(8);
      // fewer than eight only with a written reason
      if (per.get(d)! < 8) expect(CATALOGUE_GAPS[d]).toBeTruthy();
    }
  });
  it('chaque bloc de chaque séance renvoie à un exercice qui existe', () => {
    for (const p of PROGRAMS) for (const s of programSessions(p)) for (const b of s.blocks) expect(EXERCISE_BY_ID.has(b.exercise), `${p.id} → ${b.exercise}`).toBe(true);
  });
  it('les durées sont calculées à partir des blocs (rounds, repos, transitions)', () => {
    const blocks = [
      { label: 'a', phase: 'technique' as const, exercise: 'x', rounds: 2, work: 60, rest: 30 },
      { label: 'b', phase: 'recuperation' as const, exercise: 'y', rounds: 1, work: 120, rest: 0 },
    ];
    // one countdown, 2×60 of work + 1×30 of rest, the transition (the rest, at least BETWEEN_ITEMS, at most 30 s), then 120
    expect(programSessionSeconds(blocks)).toBe(SESSION_COUNTDOWN + 120 + 30 + Math.max(BETWEEN_ITEMS, 30) + 120);
    for (const p of PROGRAMS) {
      // the minutes of each session, rounded, then their mean, rounded: never a typed number
      const mins = programSessions(p).map((s) => Math.round(programSessionSeconds(s.blocks) / 60));
      expect(p.durationMin, p.id).toBe(Math.round(mins.reduce((a, b) => a + b, 0) / mins.length));
    }
  });
  it('les nouveaux programmes sont complets et disent leur origine', () => {
    for (const p of PROGRAMS.slice(10)) {
      expect(p.level, p.id).toBeTruthy();
      expect(p.description, p.id).toBeTruthy();
      expect(p.weeks! * p.perWeek!).toBeGreaterThan(0);
      expect(p.sessions!.length).toBe(p.weeks);
      expect(p.prerequisites!.length).toBeGreaterThan(0);
      expect(p.safety!.length).toBeGreaterThan(0);
      expect(p.origin).toBe('original');
      expect(p.sessions![0].blocks[0].phase).toBe('echauffement');
      expect(p.sessions![0].blocks.at(-1)!.phase).toBe('recuperation');
      for (const r of p.sources ?? []) expect(programSource(r.id), `${p.id} → ${r.id}`).toBeTruthy();
      // each week has its own blocks: not the same session copied four times
      const keys = p.sessions!.map((s) => JSON.stringify(s.blocks));
      expect(new Set(keys).size, p.id).toBeGreaterThan(1);
    }
  });
  it('le filtre matériel et les niveaux couvrent tout le catalogue', () => {
    const a = filterPrograms(PROGRAMS, { ...NO_PROGRAM_FILTER, equipment: 'aucun' });
    const t = filterPrograms(PROGRAMS, { ...NO_PROGRAM_FILTER, equipment: 'tapis' });
    expect(a.length + t.length).toBe(PROGRAMS.length);
    expect(t.every((p) => programEquipment(p) === 'tapis')).toBe(true);
    expect(new Set(PROGRAMS.map(programLevel)).size).toBeGreaterThanOrEqual(3);
  });
  it('progression : séances faites, restantes, semaine et séance suivante', () => {
    const p = PROGRAMS.find((x) => x.sessions && x.perWeek === 3 && x.weeks === 4)!;
    expect(programProgress(p, 0)).toMatchObject({ done: 0, total: 12, remaining: 12, week: 1, next: 0, finished: false });
    expect(programProgress(p, 4)).toMatchObject({ done: 4, remaining: 8, week: 2, next: 1 });
    expect(programProgress(p, 12)).toMatchObject({ done: 12, remaining: 0, finished: true, next: 3 });
    expect(programProgress(p, 40).done).toBe(12);
    expect(programQuery(p, 1)).toBe(`prog=${p.id}&s=2`);
    const old = PROGRAM_BY_ID.get('coordination-15')!;
    expect(programProgress(old, 3)).toMatchObject({ done: 3, total: null, remaining: null });
    expect(programQuery(old, 0)).toBe('prog=coordination-15');
  });
  it('la séance lancée est celle de la semaine demandée', () => {
    const p = PROGRAMS.find((x) => x.sessions && x.sessions.length === 4)!;
    const w1 = programPlan(p.id, 0)!;
    const w4 = programPlan(p.id, 3)!;
    expect(w1.title).toMatch(/semaine 1/);
    expect(w4.title).toMatch(/semaine 4/);
    expect(w4.items.length).toBe(p.sessions![3].blocks.length);
  });
});
