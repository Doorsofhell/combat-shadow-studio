import { describe, expect, test } from 'vitest';
import { ALL_COACHES, SKILLS } from '../catalog';

/** 1.13 (Youssef 2026-11-04, option B): the selection screen's bars. Style profile out of 10 for every coach; a weight
 * only where it was measured on the 3D model (no made-up number) */
describe('barres de l’écran de choix', () => {
  // 1.37: four coaches (Axel and Kaila removed)
  test('les quatre coachs ont les sept barres, chacune de 1 à 10', () => {
    expect(ALL_COACHES).toHaveLength(4);
    for (const c of ALL_COACHES)
      for (const k of SKILLS) {
        const v = c.skills[k.id];
        expect(Number.isInteger(v), `${c.id} ${k.id}`).toBe(true);
        expect(v, `${c.id} ${k.id}`).toBeGreaterThanOrEqual(1);
        expect(v, `${c.id} ${k.id}`).toBeLessThanOrEqual(10);
      }
  });
  test('poids mesurés : Kadir 91, Naël 87, Amara 61, Inaya 65', () => {
    const w = Object.fromEntries(ALL_COACHES.map((c) => [c.id, c.weightKg]));
    expect(w).toEqual({ 'mma-kadir': 91, nael: 87, 'mma-amara': 61, inaya: 65 });
  });
  test('deux coachs ne se ressemblent pas : profils tous différents', () => {
    const keys = ALL_COACHES.map((c) => SKILLS.map((k) => c.skills[k.id]).join(','));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
