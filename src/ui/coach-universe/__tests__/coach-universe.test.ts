import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_COACHES } from '../../../domain/coaches/catalog';
import { resolveAll } from '../../../domain/coaches/atmosphere';
import { atmosphereOf, universeVars } from '../CoachUniverse';

/**
 * 2.10.5 (Youssef, 2026-11-26 : « il faudrait réutiliser le même composant ») : l'Accueil et l'écran du choix montrent l'univers du
 * coach avec le MÊME composant (CoachUniverseStage), jamais avec une copie ni en montant CoachStage eux-mêmes.
 */
const src = (p: string) => readFileSync(resolve(__dirname, '../../screens', p), 'utf8');

describe('univers du coach partagé (2.10.5)', () => {
  for (const screen of ['Home.tsx', 'CoachSelect.tsx'])
    it(`${screen} utilise CoachUniverseStage et ne monte pas CoachStage lui-même`, () => {
      const s = src(screen);
      expect(s).toMatch(/from '\.\.\/coach-universe\/CoachUniverse'/);
      expect(s).toMatch(/<CoachUniverseStage\b/);
      expect(s).not.toMatch(/<CoachStage\b/);
      expect(s).not.toMatch(/import\('\.\.\/\.\.\/three\/CoachStage'\)/);
      expect(s).not.toMatch(/resolveAll\(/);
    });

  it('chaque coach garde exactement l’ambiance de la 2.10.4 (celle de resolveAll)', () => {
    const ref = resolveAll(ALL_COACHES);
    for (const c of ALL_COACHES) expect(atmosphereOf(c)).toEqual(ref.get(c.id));
  });

  it('les couleurs de l’univers passent en variables CSS', () => {
    for (const c of ALL_COACHES) {
      const a = atmosphereOf(c);
      expect(universeVars(a)).toEqual({ '--atmo-primary': a.palette.primary, '--atmo-accent': a.palette.accent, '--atmo-deep': a.palette.sky[1] });
    }
  });
});
