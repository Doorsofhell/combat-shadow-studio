import { TECHNIQUE_BY_ID } from '../techniques';
import { isPlayable, validateSequence } from '../transitions';
import type { DisciplineId, LevelId } from '../types';
import { CATALOG_SCHEMA } from './types';
import type { CatalogChampion, CatalogCombo, CatalogFile } from './types';

const DISCIPLINES: DisciplineId[] = ['boxe', 'kickboxing', 'mma', 'muaythai'];
const LEVELS: LevelId[] = ['debutant', 'intermediaire', 'avance', 'expert'];
const STATUSES = ['verifiee', 'adaptee', 'inspiree'];
const GUARDS = ['orthodoxe', 'gaucher', 'les-deux'];
const DISTANCES = ['longue', 'moyenne', 'courte', 'corps-a-corps', 'sol'];
const GOALS = ['technique', 'cardio', 'puissance', 'defense', 'deplacement'];
const SOURCE_KINDS = ['profil-style', 'combat', 'document'];
export const MIN_LENGTH = 2;
export const MAX_LENGTH = 10;

const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
const isStrList = (x: unknown, min: number, max: number) => Array.isArray(x) && x.length >= min && x.length <= max && x.every(isStr);

/** clé de dédoublonnage : une même séquence ne peut être créditée qu’une fois par discipline */
export const sequenceKey = (c: Pick<CatalogCombo, 'discipline' | 'sequence'>) => `${c.discipline}|${c.sequence.join(',')}`;

/**
 * Problèmes d’une séquence pour une discipline : technique inconnue, technique interdite dans la
 * discipline, ou enchaînement impossible pour le coach (états debout / sol).
 */
export function sequenceProblems(seq: unknown, d: DisciplineId): string[] {
  if (!Array.isArray(seq) || !seq.every((x) => typeof x === 'string')) return ['séquence absente ou mal formée'];
  const out: string[] = [];
  if (seq.length < MIN_LENGTH || seq.length > MAX_LENGTH) out.push(`longueur ${seq.length} hors de ${MIN_LENGTH} à ${MAX_LENGTH}`);
  for (const id of seq) {
    const t = TECHNIQUE_BY_ID.get(id);
    if (!t) out.push(`technique inconnue : ${id}`);
    else if (!t.disciplines.includes(d)) out.push(`${t.name} n’est pas autorisé dans cette discipline`);
  }
  if (!out.length) {
    const issues = validateSequence(seq, d);
    for (const i of issues) if (i.level === 'erreur') out.push(i.message);
    if (issues.some((i) => i.message.startsWith('L’enchaînement finit au sol'))) out.push('la séquence finit au sol sans relevé technique');
  }
  return out;
}

/**
 * Jouable en 3D : chaque technique existe, est autorisée dans la discipline (le moteur a une
 * animation pour chaque technique dans chacune de ses disciplines, dans les deux gardes — vérifié
 * par src/engine/__tests__/engine.test.ts) et l’enchaînement est réalisable par le coach.
 */
export function isPlayable3D(c: Pick<CatalogCombo, 'discipline' | 'sequence'>): boolean {
  return c.sequence.every((id) => TECHNIQUE_BY_ID.get(id)?.disciplines.includes(c.discipline)) && isPlayable(validateSequence(c.sequence, c.discipline));
}

/** honnêteté du statut : une fiche vérifiée ou adaptée doit citer sa source précisément */
export function statusProblems(c: Pick<CatalogCombo, 'status' | 'source'>): string[] {
  const s = c.source;
  const out: string[] = [];
  if (!s || !isStr(s.note) || !SOURCE_KINDS.includes(s.kind)) return ['source absente ou mal formée'];
  if (c.status === 'verifiee') {
    if (s.kind !== 'combat') out.push('une fiche vérifiée doit venir d’un combat (source.kind = "combat")');
    if (!isStr(s.reference)) out.push('une fiche vérifiée doit citer le combat (source.reference)');
    if (!isStr(s.timestamp)) out.push('une fiche vérifiée doit indiquer le moment exact (source.timestamp)');
  } else if (c.status === 'adaptee') {
    if (s.kind === 'profil-style') out.push('une fiche adaptée doit venir d’un combat ou d’un document');
    if (!isStr(s.reference)) out.push('une fiche adaptée doit citer sa source (source.reference)');
  } else if (c.status === 'inspiree' && s.kind !== 'profil-style') {
    out.push('une fiche inspirée a une source de type "profil-style"');
  }
  return out;
}

export function validateChampion(ch: unknown): string[] {
  const c = ch as Partial<CatalogChampion>;
  const out: string[] = [];
  if (!c || typeof c !== 'object') return ['champion mal formé'];
  if (!isStr(c.id) || !/^[a-z0-9-]+$/.test(c.id)) out.push('identifiant de champion invalide (minuscules, chiffres, tirets)');
  if (!isStr(c.name)) out.push('nom manquant');
  if (!Array.isArray(c.disciplines) || !c.disciplines.length || !c.disciplines.every((d) => DISCIPLINES.includes(d))) out.push('disciplines invalides');
  if (c.stance !== undefined && !['orthodoxe', 'gaucher', 'alterne'].includes(c.stance)) out.push('garde habituelle invalide');
  if (!isStr(c.style)) out.push('description du style manquante');
  if (!isStrList(c.traits, 1, 8)) out.push('traits de style manquants');
  if (!isStr(c.source)) out.push('source du profil manquante');
  return out;
}

/**
 * Toutes les vérifications d’une fiche. `champions` permet de vérifier que le champion existe et
 * pratique la discipline de la fiche.
 */
export function validateCombo(x: unknown, champions?: Map<string, CatalogChampion>): string[] {
  const c = x as Partial<CatalogCombo>;
  if (!c || typeof c !== 'object') return ['fiche mal formée'];
  const out: string[] = [];
  if (!isStr(c.id) || !/^[a-z0-9-]+$/.test(c.id)) out.push('identifiant invalide (minuscules, chiffres, tirets)');
  if (!isStr(c.name)) out.push('nom manquant');
  if (!c.discipline || !DISCIPLINES.includes(c.discipline)) {
    out.push('discipline invalide');
    return out;
  }
  if (!isStr(c.champion)) out.push('champion manquant');
  else if (champions) {
    const ch = champions.get(c.champion);
    if (!ch) out.push(`champion inconnu : ${c.champion}`);
    else if (!ch.disciplines.includes(c.discipline)) out.push(`${ch.name} n’a pas de profil en ${c.discipline}`);
  }
  if (!c.status || !STATUSES.includes(c.status)) out.push('statut invalide');
  else out.push(...statusProblems(c as CatalogCombo));
  if (!c.guard || !GUARDS.includes(c.guard)) out.push('garde invalide');
  if (!c.level || !LEVELS.includes(c.level)) out.push('niveau invalide');
  if (!c.distance || !DISTANCES.includes(c.distance)) out.push('distance invalide');
  out.push(...sequenceProblems(c.sequence, c.discipline));
  if (!isStr(c.objective)) out.push('objectif pédagogique manquant');
  if (!isStrList(c.keyPoints, 2, 4)) out.push('2 à 4 points clés attendus');
  if (!isStrList(c.errors, 2, 3)) out.push('2 ou 3 erreurs fréquentes attendues');
  if (typeof c.estimatedSec !== 'number' || !(c.estimatedSec > 0) || c.estimatedSec > 120) out.push('durée estimée invalide');
  if (!Array.isArray(c.variants) || c.variants.length < 1 || c.variants.length > 3) out.push('1 à 3 variantes attendues');
  else
    c.variants.forEach((v, i) => {
      if (!v || !isStr(v.label)) out.push(`variante ${i + 1} : libellé manquant`);
      else if (v.sequence !== undefined) for (const p of sequenceProblems(v.sequence, c.discipline!)) out.push(`variante ${i + 1} : ${p}`);
    });
  if (!c.goal || !GOALS.includes(c.goal)) out.push('objectif (goal) invalide');
  if (!Array.isArray(c.tags) || !c.tags.every(isStr)) out.push('étiquettes invalides');
  if (!isStr(c.addedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(c.addedAt)) out.push('date d’ajout invalide (AAAA-MM-JJ)');
  return out;
}

export interface CatalogReport {
  ok: boolean;
  /** problèmes bloquants, préfixés par l’identifiant concerné */
  errors: string[];
}

/** valide un fichier complet : schéma, champions, fiches, identifiants et séquences uniques */
export function validateCatalogFile(data: unknown): CatalogReport {
  const f = data as Partial<CatalogFile>;
  const errors: string[] = [];
  if (!f || typeof f !== 'object') return { ok: false, errors: ['fichier JSON mal formé'] };
  if (f.schema !== CATALOG_SCHEMA) errors.push(`schéma ${String(f.schema)} non pris en charge (attendu : ${CATALOG_SCHEMA})`);
  if (!isStr(f.version)) errors.push('version manquante');
  if (!Array.isArray(f.champions) || !Array.isArray(f.combos)) return { ok: false, errors: [...errors, 'listes champions et combos attendues'] };
  const champions = new Map<string, CatalogChampion>();
  for (const ch of f.champions) {
    const p = validateChampion(ch);
    if (p.length) errors.push(...p.map((m) => `champion ${(ch as CatalogChampion)?.id ?? '?'} : ${m}`));
    else if (champions.has(ch.id)) errors.push(`champion ${ch.id} : identifiant en double`);
    else champions.set(ch.id, ch);
  }
  const ids = new Set<string>();
  const seqs = new Map<string, string>();
  for (const c of f.combos) {
    const p = validateCombo(c, champions);
    if (p.length) {
      errors.push(...p.map((m) => `${(c as CatalogCombo)?.id ?? '?'} : ${m}`));
      continue;
    }
    if (ids.has(c.id)) errors.push(`${c.id} : identifiant en double`);
    ids.add(c.id);
    const k = sequenceKey(c);
    if (seqs.has(k)) errors.push(`${c.id} : même séquence que ${seqs.get(k)}`);
    else seqs.set(k, c.id);
  }
  return { ok: errors.length === 0, errors };
}
