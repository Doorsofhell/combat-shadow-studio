import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { TECHNIQUE_BY_ID } from '../techniques';
import { validateSequence } from '../transitions';
import { sequenceView } from '../camera';
import type { DisciplineId } from '../types';
import type { CatalogCombo, CatalogFile } from '../catalog/types';
import { isPlayable3D, sequenceKey, statusProblems, validateCatalogFile, validateCombo } from '../catalog/validate';
import { EMPTY_IMPORT, buildCatalog } from '../catalog/loader';
import { importCatalog } from '../catalog/import';
import { catalogCounts, dailyPick, searchCombos } from '../catalog/search';
import { catalogPlan } from '../catalog/plan';
import { useCatalogUser } from '../../store/catalog';

const file = JSON.parse(readFileSync(resolve(process.cwd(), 'public/catalog/catalog-v1.json'), 'utf8')) as CatalogFile;
const combos = file.combos;
const TARGET: Record<DisciplineId, number> = { boxe: 300, kickboxing: 250, mma: 300, muaythai: 250 };
const of = (d: DisciplineId) => combos.filter((c) => c.discipline === d);
const withTag = (d: DisciplineId, t: string) => of(d).filter((c) => c.tags.includes(t));
const has = (c: CatalogCombo, cats: string[]) => c.sequence.some((id) => cats.includes(TECHNIQUE_BY_ID.get(id)!.category));

describe('catalogue des combinaisons de champions', () => {
  test('format et validation complète du fichier', () => {
    const r = validateCatalogFile(file);
    expect(r.errors.slice(0, 10)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(file.schema).toBe(1);
  });

  test('nombre de fiches par discipline (objectif 1100)', () => {
    for (const d of Object.keys(TARGET) as DisciplineId[]) expect(of(d).length, d).toBeGreaterThanOrEqual(TARGET[d]);
    expect(combos.length).toBeGreaterThanOrEqual(1100);
  });

  test('identifiants uniques et aucune séquence créditée deux fois', () => {
    expect(new Set(combos.map((c) => c.id)).size).toBe(combos.length);
    expect(new Set(combos.map(sequenceKey)).size).toBe(combos.length);
    expect(new Set(combos.map((c) => c.objective)).size).toBe(combos.length);
    expect(new Set(file.champions.map((c) => c.id)).size).toBe(file.champions.length);
  });

  test('chaque fiche est valide, jouable en 3D et sans avertissement de distance', () => {
    const champs = new Map(file.champions.map((c) => [c.id, c]));
    for (const c of combos) {
      expect(validateCombo(c, champs), c.id).toEqual([]);
      expect(isPlayable3D(c), c.id).toBe(true);
      const issues = validateSequence(c.sequence, c.discipline).filter((i) => i.level !== 'info');
      expect(issues, c.id).toEqual([]);
      expect(sequenceView(c.sequence).why.length, c.id).toBeGreaterThan(10);
    }
    expect(catalogCounts(combos).playable).toBe(combos.length);
  });

  test('statuts honnêtes : aucune fiche vérifiée ou adaptée sans source précise', () => {
    const n = catalogCounts(combos);
    expect(n.verifiee).toBe(0);
    expect(n.adaptee).toBe(0);
    expect(n.inspiree).toBe(combos.length);
    for (const c of combos) {
      expect(statusProblems(c), c.id).toEqual([]);
      expect(c.source.kind).toBe('profil-style');
      expect(c.source.note).toMatch(/non relevée en combat/);
    }
    const s = combos[0].source;
    expect(statusProblems({ status: 'verifiee', source: s }).length).toBeGreaterThan(0);
    expect(statusProblems({ status: 'verifiee', source: { kind: 'combat', note: 'x', reference: 'Combat X' } }).length).toBeGreaterThan(0);
    expect(statusProblems({ status: 'verifiee', source: { kind: 'combat', note: 'x', reference: 'Combat X', timestamp: 'R2 1:47' } })).toEqual([]);
    expect(statusProblems({ status: 'adaptee', source: s }).length).toBeGreaterThan(0);
  });

  test('toutes les longueurs de 2 à 10 mouvements, dans chaque discipline', () => {
    for (const d of Object.keys(TARGET) as DisciplineId[]) {
      const lens = new Set(of(d).map((c) => c.sequence.length));
      for (let n = 2; n <= 10; n++) expect(lens.has(n), `${d} ${n}`).toBe(true);
    }
  });

  test('variété pédagogique par discipline', () => {
    for (const d of Object.keys(TARGET) as DisciplineId[]) {
      expect(withTag(d, 'defense-contre').length, `${d} défense/contre`).toBeGreaterThanOrEqual(20);
      expect(of(d).filter((c) => has(c, ['deplacement'])).length, `${d} déplacements`).toBeGreaterThanOrEqual(20);
      expect(withTag(d, 'corps').length, `${d} corps`).toBeGreaterThanOrEqual(20);
      expect(withTag(d, 'cardio').length, `${d} cardio`).toBeGreaterThanOrEqual(10);
      for (const l of ['debutant', 'intermediaire', 'avance', 'expert']) expect(of(d).some((c) => c.level === l), `${d} ${l}`).toBe(true);
    }
    expect(of('muaythai').filter((c) => has(c, ['genou', 'clinch'])).length).toBeGreaterThanOrEqual(20);
    expect(of('muaythai').filter((c) => has(c, ['coude'])).length).toBeGreaterThanOrEqual(20);
    expect(of('mma').filter((c) => c.sequence.some((id) => ['changement-niveau', 'entree-lutte', 'feinte-lutte'].includes(id))).length).toBeGreaterThanOrEqual(20);
    expect(of('mma').filter((c) => c.sequence.some((id) => ['sprawl', 'defense-lutte'].includes(id))).length).toBeGreaterThanOrEqual(20);
    expect(of('mma').filter((c) => c.sequence.includes('descente-sol')).length).toBeGreaterThanOrEqual(5);
    for (const c of of('boxe')) expect(has(c, ['pied', 'genou', 'coude', 'lutte', 'sol', 'clinch']), c.id).toBe(false);
    expect(new Set(combos.map((c) => c.guard))).toEqual(new Set(['orthodoxe', 'gaucher', 'les-deux']));
  });

  test('niveau cohérent avec la longueur, transitions au sol terminées par un relevé', () => {
    for (const c of combos) {
      if (c.level === 'debutant') expect(c.sequence.length, c.id).toBeLessThanOrEqual(4);
      if (c.level === 'expert') expect(c.sequence.length, c.id).toBeGreaterThanOrEqual(5);
      const down = c.sequence.lastIndexOf('descente-sol');
      if (down >= 0) expect(c.sequence.indexOf('releve-technique', down), c.id).toBeGreaterThan(down);
      for (let i = 2; i < c.sequence.length; i++) expect(c.sequence[i] === c.sequence[i - 1] && c.sequence[i] === c.sequence[i - 2], c.id).toBe(false);
    }
  });

  test('tous les champions demandés, avec des fiches dans chacune de leurs disciplines', () => {
    const count = (d: DisciplineId) => file.champions.filter((c) => c.disciplines.includes(d)).length;
    expect([count('boxe'), count('kickboxing'), count('mma'), count('muaythai')]).toEqual([20, 20, 24, 20]);
    for (const ch of file.champions) {
      expect(ch.style.length).toBeGreaterThan(20);
      for (const d of ch.disciplines) expect(combos.some((c) => c.champion === ch.id && c.discipline === d), `${ch.id} ${d}`).toBe(true);
    }
    const names = file.champions.map((c) => c.name);
    for (const n of ['Mike Tyson', 'Alex Pereira', 'Superbon', 'Buakaw Banchamek', 'Sitthichai Sitsongpeenong', 'Khabib Nurmagomedov', 'Saenchai']) expect(names).toContain(n);
  });
});

describe('import, recherche et séances', () => {
  const base = file;
  const verified = (over: Partial<CatalogCombo> = {}): CatalogCombo => ({
    ...combos[0],
    id: 'import-test-0001',
    status: 'verifiee',
    source: { kind: 'combat', note: 'Relevé image par image', reference: 'Combat test', timestamp: 'R1 0:42' },
    sequence: ['jab', 'direct', 'crochet-avant', 'direct', 'pas-arriere', 'jab'],
    ...over,
  });

  test('import valide, mise à jour, rejets et priorité du statut le plus fort', () => {
    const r = importCatalog(base, EMPTY_IMPORT, { schema: 1, version: 'x', updatedAt: '2026-10-18', champions: [], combos: [verified()] });
    expect(r.error).toBeUndefined();
    expect(r.added).toEqual(['import-test-0001']);
    const again = importCatalog(base, r.next, { schema: 1, combos: [verified({ name: 'Nouveau nom' })] });
    expect(again.updated).toEqual(['import-test-0001']);
    expect(again.next.combos).toHaveLength(1);

    const bad = importCatalog(base, EMPTY_IMPORT, {
      schema: 1,
      combos: [
        verified({ id: 'x-1', sequence: ['jab', 'technique-inventee'] }),
        verified({ id: 'x-2', sequence: ['jab', 'high-kick-arriere'], discipline: 'boxe' }),
        verified({ id: 'x-3', source: { kind: 'combat', note: 'sans référence' } }),
        verified({ id: combos[1].id }),
        { ...combos[2], id: 'x-4' },
      ],
    });
    expect(bad.added).toEqual([]);
    expect(bad.rejected.map((x) => x.id)).toEqual(['x-1', 'x-2', 'x-3', combos[1].id, 'x-4']);
    expect(bad.rejected[4].reasons[0]).toMatch(/séquence déjà présente/);

    const stronger = importCatalog(base, EMPTY_IMPORT, { schema: 1, combos: [verified({ id: 'x-5', discipline: combos[2].discipline, champion: combos[2].champion, sequence: combos[2].sequence })] });
    expect(stronger.superseded).toEqual([combos[2].id]);
    const cat = buildCatalog(base, stronger.next);
    expect(cat.comboById.has(combos[2].id)).toBe(false);
    expect(cat.comboById.get('x-5')?.status).toBe('verifiee');
    expect(cat.combos.length).toBe(combos.length);

    expect(importCatalog(base, EMPTY_IMPORT, { schema: 2, combos: [] }).error).toBeTruthy();
    expect(importCatalog(base, EMPTY_IMPORT, 'pas du json').error).toBeTruthy();
  });

  test('nouveau champion importé avec ses fiches', () => {
    const r = importCatalog(base, EMPTY_IMPORT, {
      schema: 1,
      champions: [{ id: 'nouveau', name: 'Nouveau Champion', disciplines: ['boxe'], style: 'Description générale du style.', traits: ['jab'], source: 'Profil général' }],
      combos: [{ ...verified({ id: 'boxe-nouveau-0001', champion: 'nouveau', status: 'inspiree', source: { kind: 'profil-style', note: 'Inspirée ; non relevée en combat.' } }) }],
    });
    expect(r.championsAdded).toEqual(['nouveau']);
    expect(r.added).toEqual(['boxe-nouveau-0001']);
    expect(buildCatalog(base, r.next).championById.get('nouveau')?.name).toBe('Nouveau Champion');
  });

  test('recherche, filtres et fiche du jour déterministe', () => {
    const cat = buildCatalog(base);
    const tyson = searchCombos(cat, { text: 'tyson' });
    expect(tyson.length).toBeGreaterThan(5);
    expect(tyson.every((c) => c.champion === 'tyson')).toBe(true);
    const alvarez = searchCombos(cat, { text: 'alvarez' });
    expect(alvarez.length).toBeGreaterThan(0);
    const coudes = searchCombos(cat, { technique: 'coude-horizontal-arriere', discipline: 'muaythai', length: '4-5' });
    expect(coudes.every((c) => c.sequence.includes('coude-horizontal-arriere') && c.sequence.length >= 4 && c.sequence.length <= 5)).toBe(true);
    expect(searchCombos(cat, { guard: 'gaucher' }).every((c) => c.guard !== 'orthodoxe')).toBe(true);
    const day = new Date(2026, 9, 17);
    expect(dailyPick(combos, day)?.id).toBe(dailyPick([...combos].reverse(), day)?.id);
    expect(dailyPick(combos, day)?.id).not.toBe(dailyPick(combos, new Date(2026, 9, 18))?.id);
  });

  test('séance à partir d’une fiche', () => {
    const c = combos.find((x) => x.level === 'expert')!;
    const o = { roundSec: 120, restSec: 30, rounds: 4 };
    const t = catalogPlan(c, 'technique', o);
    expect(t.items).toHaveLength(1);
    expect(t.items[0].sequence).toEqual(c.sequence);
    expect(t.items[0].speed).toBeLessThanOrEqual(0.45);
    const r = catalogPlan(c, 'rounds', o);
    expect(r.items[0]).toMatchObject({ work: 120, rounds: 4, roundRest: 30 });
    const s = catalogPlan(c, 'libre', { ...o, siblings: combos.slice(0, 5).concat(c) });
    expect(s.items).toHaveLength(6);
    expect(s.items[s.start].key).toBe(`cat-${c.id}`);
  });
});

describe('données utilisateur de la bibliothèque', () => {
  test('favoris, historique, collections et import via le store', () => {
    const s = () => useCatalogUser.getState();
    s().toggleFavorite('a');
    s().toggleFavorite('b');
    s().toggleFavorite('a');
    expect(s().favorites).toEqual(['b']);
    s().pushHistory('x', 'ouvert');
    s().pushHistory('y', 'ouvert');
    s().pushHistory('x', 'ouvert');
    expect(s().history.map((h) => h.id)).toEqual(['x', 'y']);
    const id = s().createCollection('  Contres  ', ['x', 'x']);
    s().addToCollection(id, 'y');
    s().removeFromCollection(id, 'x');
    s().renameCollection(id, 'Contres au corps');
    expect(s().collections).toMatchObject([{ id, name: 'Contres au corps', ids: ['y'] }]);
    s().deleteCollection(id);
    expect(s().collections).toEqual([]);
    const bad = s().importFile(file, { schema: 9 });
    expect(bad.error).toBeTruthy();
    expect(s().imported.combos).toEqual([]);
    const r = s().importFile(file, { schema: 1, combos: [{ ...combos[0], id: 'store-0001', status: 'verifiee', source: { kind: 'combat', note: 'n', reference: 'r', timestamp: 't' }, sequence: ['jab', 'jab', 'direct', 'pas-arriere', 'crochet-avant'] }] });
    expect(r.added).toEqual(['store-0001']);
    expect(buildCatalog(file, s().imported).comboById.has('store-0001')).toBe(true);
    s().removeImported('store-0001');
    expect(s().imported.combos).toEqual([]);
  });
});
