import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { DNA_AXES, comboDna, dnaSummary, focusTechniques } from '../catalog/dna';
import { TECHNIQUES } from '../techniques';
import type { CatalogFile } from '../catalog/types';

/** v0.28 (Youssef, 2026-10-20 21:52): the combat DNA replaces the count boxes; it must be computed, never invented */
describe('ADN de combat', () => {
  test('chaque catégorie de technique sauf la garde appartient à exactement un axe', () => {
    const cats = new Set(TECHNIQUES.map((t) => t.category));
    cats.delete('garde');
    for (const c of cats) expect(DNA_AXES.filter((a) => a.categories.includes(c)).length, c).toBe(1);
  });

  test('parts calculées sur les mouvements, postures ignorées', () => {
    const dna = comboDna([{ sequence: ['jab', 'direct', 'low-kick-arriere', 'garde'] }, { sequence: ['esquive-droite', 'crochet-avant'] }]);
    expect(dna.total).toBe(5);
    const by = Object.fromEntries(dna.axes.map((a) => [a.id, a]));
    expect(by.poings.count).toBe(3);
    expect(by.pieds.count).toBe(1);
    expect(by.defense.count).toBe(1);
    expect(by.poings.percent).toBe(60);
    expect(dna.dominant?.id).toBe('poings');
    expect(dna.axes.reduce((s, a) => s + a.share, 0)).toBeCloseTo(1);
    expect(dnaSummary(dna)).toBe('Poings 60 %, Coups de pied 20 %, Défense et feintes 20 %');
  });

  test('judo et jiu-jitsu tombent dans « Lutte, sol et projections »', () => {
    const dna = comboDna([{ sequence: ['shizen-tai', 'tsugi-ashi-avant', 'kuzushi', 'uchikomi-seoi'] }, { sequence: ['descente-sol', 'pont', 'releve-technique'] }]);
    const by = Object.fromEntries(dna.axes.map((a) => [a.id, a.count]));
    expect(by['lutte-sol']).toBe(5);
    expect(by.deplacements).toBe(1);
    expect(dna.total).toBe(6);
  });

  test('vide : aucun axe, aucun pourcentage inventé', () => {
    const dna = comboDna([]);
    expect(dna.total).toBe(0);
    expect(dna.dominant).toBeNull();
    expect(dna.axes.every((a) => a.percent === 0)).toBe(true);
    expect(dnaSummary(dna)).toBe('Aucun mouvement à analyser.');
  });

  test('« Ce que tu vas travailler » : techniques les plus présentes, familles variées, comptées par fiche', () => {
    const f = focusTechniques([{ sequence: ['jab', 'jab', 'direct'] }, { sequence: ['jab', 'direct', 'low-kick-arriere'] }, { sequence: ['jab', 'esquive-droite', 'crochet-avant'] }]);
    expect(f.map((x) => x.id)).toEqual(['jab', 'esquive-droite', 'low-kick-arriere']);
    expect(f[0].combos).toBe(3);
    expect(focusTechniques([{ sequence: ['garde', 'jab'] }]).map((x) => x.id)).toEqual(['jab']);
  });

  test('chaque champion du catalogue a un ADN et trois axes de travail', () => {
    const file = JSON.parse(readFileSync(resolve(process.cwd(), 'public/catalog/catalog-v1.json'), 'utf8')) as CatalogFile;
    for (const ch of file.champions) {
      const list = file.combos.filter((c) => c.champion === ch.id);
      expect(comboDna(list).total, ch.id).toBeGreaterThan(0);
      expect(focusTechniques(list).length, ch.id).toBe(3);
    }
  });
});
