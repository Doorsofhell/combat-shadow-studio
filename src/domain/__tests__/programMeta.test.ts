import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '../programs';
import { NO_PROGRAM_FILTER, activeFilterCount, durationBucket, filterPrograms, programLevel, programObjective } from '../programMeta';

// 0.33 (Entraîner §10): les dix programmes sont conservés, les filtres sont combinables et réinitialisables
describe('programmes et filtres', () => {
  it('les dix programmes existants sont tous là, sans filtre', () => {
    expect(PROGRAMS).toHaveLength(10);
    expect(filterPrograms(PROGRAMS, NO_PROGRAM_FILTER)).toHaveLength(10);
  });
  it('chaque programme a un niveau tiré de ses exercices et un objectif classé', () => {
    for (const p of PROGRAMS) {
      expect(['debutant', 'intermediaire', 'avance', 'expert']).toContain(programLevel(p));
      expect(['bases', 'technique', 'cardio', 'coordination', 'mobilite']).toContain(programObjective(p));
    }
    expect(programLevel(PROGRAMS.find((p) => p.id === 'boxe-initiation-4-semaines')!)).toBe('debutant');
  });
  it('les filtres se combinent (ET) et chaque résultat respecte tous les critères', () => {
    const f = { ...NO_PROGRAM_FILTER, discipline: 'muaythai', duration: 'moyen' as const };
    const r = filterPrograms(PROGRAMS, f);
    expect(r.map((p) => p.id)).toEqual(['muay-fondamentaux']);
    expect(activeFilterCount(f)).toBe(2);
    const g = { ...NO_PROGRAM_FILTER, objective: 'mobilite' as const };
    expect(filterPrograms(PROGRAMS, g).every((p) => programObjective(p) === 'mobilite')).toBe(true);
    expect(filterPrograms(PROGRAMS, { ...g, discipline: 'boxe' })).toHaveLength(0);
  });
  it('durée : trois tranches qui couvrent tous les programmes', () => {
    const n = (['court', 'moyen', 'long'] as const).map((d) => PROGRAMS.filter((p) => durationBucket(p) === d).length);
    expect(n.reduce((a, b) => a + b, 0)).toBe(10);
  });
});
