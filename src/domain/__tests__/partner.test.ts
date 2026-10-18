import { describe, expect, test } from 'vitest';
import { JUDO_PHASES, PARTNER_TECHNIQUES } from '../partner';
import { TECHNIQUE_BY_ID } from '../techniques';
import { EXERCISES } from '../exercises';

describe('techniques avec partenaire réel (BJJ et judo)', () => {
  test('toutes en mode partenaire, avec des consignes de sécurité au club', () => {
    expect(PARTNER_TECHNIQUES.length).toBeGreaterThanOrEqual(8);
    for (const p of PARTNER_TECHNIQUES) {
      expect(p.mode, p.id).toBe('partenaire');
      expect(p.safety.some((s) => /enseignant/.test(s)), p.id).toBe(true);
      expect(TECHNIQUE_BY_ID.has(p.id), `${p.id} ne doit pas être une technique solo`).toBe(false);
    }
  });

  test('projections de judo : déplacement, kuzushi, tsukuri, kake', () => {
    for (const p of PARTNER_TECHNIQUES.filter((x) => x.discipline === 'judo' && x.category === 'projection'))
      expect(p.phases.map((x) => x.label), p.id).toEqual(JUDO_PHASES);
  });

  test('séquences de BJJ : position, transition, contrôle, sortie', () => {
    for (const p of PARTNER_TECHNIQUES.filter((x) => x.discipline === 'bjj'))
      expect(p.phases.map((x) => x.label), p.id).toEqual(['Position', 'Transition', 'Contrôle', 'Sortie']);
  });

  test('les soumissions et les chutes ne sont qu’expliquées, avec un avertissement', () => {
    for (const p of PARTNER_TECHNIQUES.filter((x) => x.category === 'soumission')) expect(p.safety.join(' ')).toMatch(/tape/);
    for (const p of PARTNER_TECHNIQUES.filter((x) => x.category === 'chute')) expect(p.safety.join(' ')).toMatch(/maison/);
  });

  test('la préparation solo est une vraie technique animée, en mode solo', () => {
    for (const p of PARTNER_TECHNIQUES.filter((x) => x.prep)) {
      const t = TECHNIQUE_BY_ID.get(p.prep!);
      expect(t, p.id).toBeDefined();
      expect(t!.mode ?? 'solo').toBe('solo');
    }
  });

  test('les exercices BJJ et judo ne contiennent que des techniques solo', () => {
    for (const e of EXERCISES.filter((x) => x.discipline === 'bjj' || x.discipline === 'judo'))
      for (const id of e.sequence) expect(TECHNIQUE_BY_ID.get(id)?.mode ?? 'solo', `${e.id} / ${id}`).toBe('solo');
  });
});
