import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { sequenceView } from '../camera';
import { TECHNIQUE_BY_ID } from '../techniques';
import { validateSequence } from '../transitions';
import type { CatalogCombo, CatalogFile } from '../catalog/types';
import { isValidated } from '../catalog/types';
import { isPlayable3D, sequenceKey, statusProblems, validateCatalogFile, validateCombo } from '../catalog/validate';
import { buildCatalog, mergeCatalogFiles } from '../catalog/loader';
import { catalogCounts, comboCredit, searchCombos } from '../catalog/search';

/**
 * Catalogue validé (Youssef, 2026-11-06 : « que des combinaisons d'entraînement vérifiées et validées par les fédérations ») :
 * les fiches de programme fédéral (public/catalog/programmes-v1.json, scripts/build-programmes.mjs).
 */
const read = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf8')) as CatalogFile;
const base = read('public/catalog/catalog-v1.json');
const prog = read('public/catalog/programmes-v1.json');

/**
 * Relit la citation d’une fiche FFBoxe dont les bras sont écrits (« Direct Arr Face + Crochet Av Face… ») et en
 * déduit les gestes attendus : la séquence saisie doit être exactement celle du document.
 */
function ffboxeQuoteToIds(quote: string): string[] | null {
  // une consigne entre parenthèses (« Attaque + Parade Bloquée (Direct… + Crochet…) ») n’est pas dans l’ordre d’exécution
  if (/\([^)]*(Direct|Crochet|Uppercut)/.test(quote)) return null;
  quote = quote.replace(/\([^)]*\)/g, '');
  const re = /(Parade(?: Avant-Bras| avant-bras| Bloquée)?|Parades? sur place|2 Parades|D\.Pg|Direct|Crochet|Uppercut)\s*(Avant|Av|Avt|Arr|Arrière|arrière|avant)?\s*(Face|Buste|buste)?/g;
  const out: string[] = [];
  for (const m of quote.matchAll(re)) {
    const [, kind, side, target] = m;
    if (/^2 Parades/.test(kind)) {
      out.push('parade', 'parade');
      continue;
    }
    if (/^Parade (Avant-Bras|avant-bras|Bloquée)$/.test(kind)) {
      out.push('blocage-haut');
      continue;
    }
    if (kind.startsWith('Parade')) return null;
    if (!side) return null;
    const front = /^(Avant|Av|Avt|avant)$/.test(side);
    const body = !!target && /buste/i.test(target);
    if (kind === 'Direct' || kind === 'D.Pg') out.push(front ? (body ? 'jab-corps' : 'jab') : body ? 'direct-corps' : 'direct');
    else if (kind === 'Crochet') out.push(`crochet-${front ? 'avant' : 'arriere'}${body ? '-corps' : ''}`);
    else if (kind === 'Uppercut') {
      if (body) return null;
      out.push(`uppercut-${front ? 'avant' : 'arriere'}`);
    }
  }
  return out.length ? out : null;
}

describe('fiches de programme fédéral', () => {
  test('fichier valide : organismes, fiches, références complètes', () => {
    const r = validateCatalogFile(prog);
    expect(r.errors).toEqual([]);
    expect(prog.combos.length).toBeGreaterThanOrEqual(30);
    expect(prog.orgs?.map((o) => o.id).sort()).toEqual(['ffboxe', 'ffkmda']);
  });

  test('chaque fiche porte sa source exacte (document, page, exercice, citation, date de lecture)', () => {
    for (const c of prog.combos) {
      expect(c.status, c.id).toBe('programme');
      expect(c.program, c.id).toBeDefined();
      const p = c.program!;
      expect(p.org, c.id).toBe(c.champion);
      expect(p.url, c.id).toBe(c.source.url);
      expect(c.source.reference, c.id).toContain(`p. ${p.page}`);
      expect(p.quote.length, c.id).toBeGreaterThan(10);
      expect(p.consulted, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(statusProblems(c), c.id).toEqual([]);
    }
  });

  test('une fiche de programme sans citation ou sans page est refusée', () => {
    const c = prog.combos[0];
    const orgs = new Map((prog.orgs ?? []).map((o) => [o.id, o]));
    expect(validateCombo({ ...c, program: { ...c.program!, quote: '' } }, undefined, orgs).join()).toContain('citation');
    expect(validateCombo({ ...c, program: { ...c.program!, page: 0 } }, undefined, orgs).join()).toContain('page');
    expect(validateCombo({ ...c, program: undefined }, undefined, orgs).join()).toContain('référence');
    expect(validateCombo({ ...c, source: { ...c.source, kind: 'profil-style' } }, undefined, orgs).join()).toContain('document');
    // une fiche inspirée ne peut pas se donner une référence de programme
    expect(statusProblems({ status: 'inspiree', source: { kind: 'profil-style', note: 'x' }, program: c.program }).join()).toContain('programme');
  });

  test('FFBoxe : quand le document écrit les bras, la séquence est exactement celle du document', () => {
    let checked = 0;
    for (const c of prog.combos.filter((x) => x.champion === 'ffboxe')) {
      const ids = ffboxeQuoteToIds(c.program!.quote);
      if (!ids) continue;
      checked++;
      expect(c.sequence, `${c.id} : « ${c.program!.quote} »`).toEqual(ids);
    }
    // les fiches dont le document laisse le choix des bras le disent dans « solo »
    for (const c of prog.combos.filter((x) => x.champion === 'ffboxe' && !ffboxeQuoteToIds(x.program!.quote))) expect(c.program!.solo, c.id).toMatch(/choix|ne précise pas|jouée? (ici )?par|« doublé »/);
    expect(checked).toBeGreaterThanOrEqual(15);
  });

  test('chaque fiche est jouable en 3D, sans avertissement, dans les deux gardes', () => {
    for (const c of prog.combos) {
      expect(isPlayable3D(c), c.id).toBe(true);
      expect(c.guard, c.id).toBe('les-deux');
      expect(validateSequence(c.sequence, c.discipline).filter((i) => i.level !== 'info'), c.id).toEqual([]);
      for (const v of c.variants) if (v.sequence) expect(validateSequence(v.sequence, c.discipline).filter((i) => i.level !== 'info'), `${c.id} variante`).toEqual([]);
      expect(sequenceView(c.sequence).why.length, c.id).toBeGreaterThan(10);
      for (const id of c.sequence) expect(TECHNIQUE_BY_ID.get(id)?.disciplines, `${c.id} ${id}`).toContain(c.discipline);
    }
  });

  test('aucun doublon : identifiants, séquences et objectifs uniques, y compris face aux fiches inspirées', () => {
    const all = [...base.combos, ...prog.combos];
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(new Set(prog.combos.map(sequenceKey)).size).toBe(prog.combos.length);
    expect(new Set(all.map((c) => c.objective)).size).toBe(all.length);
  });

  test('niveaux suivant les grades : gants blanc et jaune, prajeet jaune = débutant ; orange et vert = intermédiaire ; rouge = avancé', () => {
    const LEVEL: Record<string, CatalogCombo['level']> = { 'Gant blanc': 'debutant', 'Gant jaune': 'debutant', 'Gant orange': 'intermediaire', 'Gant rouge': 'avance', 'Prajeet jaune': 'debutant', 'Prajeet orange': 'intermediaire', 'Prajeet vert': 'intermediaire' };
    for (const c of prog.combos) expect(c.level, c.id).toBe(LEVEL[c.program!.grade]);
  });
});

describe('bibliothèque avec les fiches de programme', () => {
  const merged = mergeCatalogFiles(base, prog);
  const cat = buildCatalog(merged);

  test('non-régression : les 1 496 fiches inspirées restent, inchangées', () => {
    expect(merged.combos.length).toBe(base.combos.length + prog.combos.length);
    for (const c of base.combos) expect(cat.comboById.get(c.id), c.id).toBe(c);
    expect(catalogCounts(cat.combos).inspiree).toBe(base.combos.length);
    expect(validateCatalogFile(base).errors).toEqual([]);
  });

  test('une séquence à la fois inspirée et écrite dans un programme garde ses deux fiches (crédits différents, statuts distincts)', () => {
    const insp = new Map(base.combos.map((c) => [sequenceKey(c), c]));
    const shared = prog.combos.filter((c) => insp.has(sequenceKey(c)));
    expect(shared.map((c) => c.id).sort()).toEqual(['boxe-ffboxe-gb-01', 'boxe-ffboxe-gb-05', 'boxe-ffboxe-gr-04']);
    for (const c of shared) {
      expect(cat.comboById.get(c.id)).toBe(c);
      expect(cat.comboById.get(insp.get(sequenceKey(c))!.id)?.status).toBe('inspiree');
    }
  });

  test('les fiches validées passent en tête de liste, le filtre « Validées » les isole', () => {
    const n = prog.combos.length;
    expect(cat.combos.slice(0, n).every((c) => isValidated(c.status))).toBe(true);
    expect(cat.combos.slice(n).every((c) => c.status === 'inspiree')).toBe(true);
    expect(searchCombos(cat, { validated: true }).length).toBe(n);
    expect(searchCombos(cat, { validated: true, discipline: 'boxe' }).every((c) => c.discipline === 'boxe')).toBe(true);
    expect(searchCombos(cat, { status: 'programme' }).length).toBe(n);
    const boxe = searchCombos(cat, { discipline: 'boxe' });
    expect(boxe[0].status).toBe('programme');
  });

  test('crédit lisible et recherche par organisme ou grade', () => {
    const c = cat.combos.find((x) => x.program?.grade === 'Gant jaune')!;
    expect(comboCredit(c, cat)).toBe('FFBoxe · Gant jaune');
    expect(searchCombos(cat, { text: 'ffboxe gant jaune' }).every((x) => x.program?.grade === 'Gant jaune')).toBe(true);
    expect(searchCombos(cat, { text: 'ffkmda' }).length).toBe(prog.combos.filter((x) => x.champion === 'ffkmda').length);
    const insp = cat.combos.find((x) => x.status === 'inspiree')!;
    expect(comboCredit(insp, cat)).toBe(cat.championById.get(insp.champion)!.name);
  });

  test('sans le fichier des programmes, la bibliothèque reste identique', () => {
    expect(mergeCatalogFiles(base, undefined)).toBe(base);
    expect(buildCatalog(base).combos.length).toBe(base.combos.length);
  });
});
