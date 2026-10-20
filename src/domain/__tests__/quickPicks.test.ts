import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../exercises';
import { TECHNIQUE_BY_ID, TECHNIQUES, techniquesFor } from '../techniques';
import { DISCIPLINES } from '../types';
import { exerciseForTechnique, techniqueOfTheDay } from '../quickPicks';

describe('technique du jour (pilule de l’accueil)', () => {
  const boxe = techniquesFor('boxe');
  it('la même toute la journée, quel que soit l’ordre de la liste, et une technique de la liste', () => {
    const d = new Date(2026, 9, 20, 8, 0);
    const t = techniqueOfTheDay(boxe, d)!;
    expect(boxe).toContain(t);
    expect(techniqueOfTheDay([...boxe].reverse(), new Date(2026, 9, 20, 23, 30))!.id).toBe(t.id);
  });
  it('change d’un jour à l’autre (sur un mois, plusieurs techniques différentes)', () => {
    const ids = new Set(Array.from({ length: 30 }, (_, i) => techniqueOfTheDay(boxe, new Date(2026, 9, 1 + i))!.id));
    expect(ids.size).toBeGreaterThan(5);
  });
  it('jamais une technique réservée au travail avec un partenaire ; rien pour une liste vide', () => {
    const partner = TECHNIQUES.filter((t) => t.mode === 'partenaire');
    for (let i = 0; i < 60; i++) expect(techniqueOfTheDay(TECHNIQUES, new Date(2026, 0, 1 + i))!.mode).not.toBe('partenaire');
    if (partner.length) expect(techniqueOfTheDay(partner)).toBeUndefined();
    expect(techniqueOfTheDay([])).toBeUndefined();
  });
});

describe('« S’entraîner » depuis une fiche technique', () => {
  it('le jab de boxe : l’exercice « technique » du jab seul, au niveau débutant', () => {
    const e = exerciseForTechnique(EXERCISES.filter((x) => x.discipline === 'boxe'), 'jab', 'debutant')!;
    expect(e.id).toBe('boxe-debutant-02');
    expect(e.sequence).toEqual(['jab']);
  });
  it('choisit toujours un exercice qui contient la technique, le plus direct possible', () => {
    for (const d of DISCIPLINES) {
      const list = EXERCISES.filter((x) => x.discipline === d.id);
      for (const t of techniquesFor(d.id)) {
        const e = exerciseForTechnique(list, t.id, 'intermediaire');
        const containing = list.filter((x) => x.sequence.includes(t.id));
        if (!containing.length) {
          expect(e, `${d.id} ${t.id}`).toBeUndefined();
          continue;
        }
        expect(e!.sequence, `${d.id} ${t.id}`).toContain(t.id);
        const fewest = Math.min(...containing.map((x) => new Set(x.sequence).size));
        expect(new Set(e!.sequence).size).toBe(fewest);
      }
    }
  });
  it('à nombre de mouvements égal, le niveau le plus proche de celui de l’utilisateur', () => {
    const list = EXERCISES.filter((x) => x.discipline === 'boxe');
    const e = exerciseForTechnique(list, 'jab', 'expert')!;
    const cands = list.filter((x) => x.sequence.includes('jab') && new Set(x.sequence).size === new Set(e.sequence).size);
    const LV = ['debutant', 'intermediaire', 'avance', 'expert'];
    const best = Math.min(...cands.map((x) => Math.abs(LV.indexOf(x.level) - 3)));
    expect(Math.abs(LV.indexOf(e.level) - 3)).toBe(best);
    expect(TECHNIQUE_BY_ID.has('jab')).toBe(true);
  });
  it('aucun exercice ne contient la technique : pas de raccourci', () => {
    expect(exerciseForTechnique(EXERCISES, 'technique-inexistante', 'debutant')).toBeUndefined();
  });
});
