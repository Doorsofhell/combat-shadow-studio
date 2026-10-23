import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '../programs';
import { NO_PROGRAM_FILTER, activeFilterCount, durationBucket, filterPrograms, programLevel, programObjective } from '../programMeta';

const FIRST_TEN = ['boxe-initiation-4-semaines', 'kick-poings-pieds', 'mma-striking-mobilite', 'muay-fondamentaux', 'cardio-combat-20', 'coordination-15', 'technique-avancee-30', 'muay-armes-completes', 'judo-bases-solo', 'bjj-mobilite-solo'];

// 0.33 (Entraîner §10): les dix programmes sont conservés, les filtres sont combinables et réinitialisables
// 0.41 (« Enrichissement des programmes »): le catalogue passe à 49, les dix premiers gardent leur identifiant
describe('programmes et filtres', () => {
  it('les dix programmes existants sont tous là, sans filtre', () => {
    const ids = PROGRAMS.map((p) => p.id);
    for (const id of FIRST_TEN) expect(ids).toContain(id);
    expect(ids.slice(0, 10)).toEqual(FIRST_TEN);
    expect(filterPrograms(PROGRAMS, NO_PROGRAM_FILTER)).toHaveLength(PROGRAMS.length);
  });
  it('chaque programme a un niveau tiré de ses exercices et un objectif classé', () => {
    for (const p of PROGRAMS) {
      expect(['debutant', 'intermediaire', 'avance', 'expert']).toContain(programLevel(p));
      expect(['bases', 'technique', 'cardio', 'coordination', 'mobilite', 'defense', 'deplacements', 'enchainements']).toContain(programObjective(p));
    }
    expect(programLevel(PROGRAMS.find((p) => p.id === 'boxe-initiation-4-semaines')!)).toBe('debutant');
  });
  it('les filtres se combinent (ET) et chaque résultat respecte tous les critères', () => {
    const f = { ...NO_PROGRAM_FILTER, discipline: 'muaythai', duration: 'moyen' as const };
    const r = filterPrograms(PROGRAMS, f);
    expect(r.map((p) => p.id)).toContain('muay-fondamentaux');
    expect(r.every((p) => p.discipline === 'muaythai' && durationBucket(p) === 'moyen')).toBe(true);
    expect(activeFilterCount(f)).toBe(2);
    const g = { ...NO_PROGRAM_FILTER, objective: 'mobilite' as const };
    expect(filterPrograms(PROGRAMS, g).every((p) => programObjective(p) === 'mobilite')).toBe(true);
    expect(filterPrograms(PROGRAMS, { ...g, discipline: 'boxe' }).every((p) => p.discipline === 'boxe' && programObjective(p) === 'mobilite')).toBe(true);
  });
  it('durée : trois tranches qui couvrent tous les programmes', () => {
    const n = (['court', 'moyen', 'long'] as const).map((d) => PROGRAMS.filter((p) => durationBucket(p) === d).length);
    expect(n.reduce((a, b) => a + b, 0)).toBe(PROGRAMS.length);
  });
});
