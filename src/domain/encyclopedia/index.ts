import type { DisciplineId } from '../types';
import { FAMILIES } from './families';
import { CULTURE_TERMS } from './terms/culture';
import { EQUIPMENT_TERMS } from './terms/equipements';
import { VENUE_TERMS } from './terms/lieux';
import { POSITION_TERMS } from './terms/positions';
import { TRAINING_TERMS } from './terms/preparation';
import { RULE_TERMS } from './terms/regles';
import { SAFETY_TERMS } from './terms/securite';
import { TECHNIQUE_TERMS } from './terms/techniques';
import type { FamilyId, Term } from './types';

export { FAMILIES, FAMILY_BY_ID, subfamilyLabel } from './families';
export { IMAGES, imageOf } from './images';
export { encyclopediaSource } from './sources';
export type * from './types';

/** every term, in family order then as written in its file */
export const TERMS: readonly Term[] = [
  ...TECHNIQUE_TERMS,
  ...POSITION_TERMS,
  ...EQUIPMENT_TERMS,
  ...VENUE_TERMS,
  ...RULE_TERMS,
  ...TRAINING_TERMS,
  ...SAFETY_TERMS,
  ...CULTURE_TERMS,
];

export const TERM_BY_ID: ReadonlyMap<string, Term> = new Map(TERMS.map((t) => [t.id, t]));

/** the term that explains a technique (or a partner sheet) of the app, for « Comprendre ce terme » (§15) */
const BY_TECHNIQUE = new Map<string, Term>();
for (const t of TERMS) if (t.family !== 'preparation') for (const x of [...(t.techniques ?? []), ...(t.partner ?? []).map((p) => `partenaire:${p}`)]) if (!BY_TECHNIQUE.has(x)) BY_TECHNIQUE.set(x, t);
export const termForTechnique = (id: string): Term | undefined => BY_TECHNIQUE.get(id);
export const termForPartner = (id: string): Term | undefined => BY_TECHNIQUE.get(`partenaire:${id}`);

/** lower case, without accents, apostrophes and dashes as spaces (« Ō », « œ », « ’ »): « Ko-uchi-gari » = « kouchi gari » */
export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[’'`´\-_/.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** the same text with no spaces at all, so « kouchi » finds « ko-uchi » and « highkick » finds « high kick » */
const squash = (s: string) => normalize(s).replace(/ /g, '');

export interface TermFilter {
  family?: FamilyId;
  sub?: string;
  discipline?: DisciplineId;
  query?: string;
}

interface Indexed {
  term: Term;
  /** name, international name, aliases */
  names: string[];
  /** everything searchable, normalized */
  text: string;
}

/** what people type for each discipline, so « boxe thaï » or « jjb » find the right terms */
const DISCIPLINE_WORDS: Record<DisciplineId, string> = {
  boxe: 'boxe anglaise boxing',
  kickboxing: 'kick-boxing kickboxing',
  mma: 'mma arts martiaux mixtes',
  muaythai: 'muay-thai boxe thai',
  bjj: 'jiu-jitsu bresilien jjb bjj',
  judo: 'judo',
};

const familyLabel = new Map(FAMILIES.map((f) => [f.id, f.label]));
const subLabel = new Map(FAMILIES.flatMap((f) => f.subfamilies.map((s) => [`${f.id}/${s.id}`, s.label] as const)));

const INDEX: Indexed[] = TERMS.map((term) => {
  const names = [term.name, term.intl ?? '', ...(term.aliases ?? [])].filter(Boolean).map(normalize);
  const text = [
    ...names,
    normalize(term.subtitle),
    normalize(term.definition),
    normalize(familyLabel.get(term.family) ?? ''),
    normalize(subLabel.get(`${term.family}/${term.sub}`) ?? ''),
    ...term.disciplines,
    ...term.disciplines.map((d) => normalize(DISCIPLINE_WORDS[d])),
  ].join(' | ');
  return { term, names, text };
});


/**
 * Score of a term for a query: exact name first, then a name that starts with it, then a name that contains it,
 * then any other field. 0 = no match.
 */
const score = (it: Indexed, q: string, qs: string): number => {
  if (it.names.some((n) => n === q || n.replace(/ /g, '') === qs)) return 100;
  if (it.names.some((n) => n.startsWith(q) || n.replace(/ /g, '').startsWith(qs))) return 60;
  if (it.names.some((n) => n.includes(q) || n.replace(/ /g, '').includes(qs))) return 40;
  const words = q.split(' ');
  if (words.every((w) => it.text.includes(w))) return 10;
  return 0;
};

/** terms matching every filter; with a query, the best matches first, else the order of the base */
export function findTerms(f: TermFilter = {}): Term[] {
  const q = f.query ? normalize(f.query) : '';
  const qs = q ? squash(q) : '';
  const out: { term: Term; s: number; i: number }[] = [];
  INDEX.forEach((it, i) => {
    const t = it.term;
    if (f.family && t.family !== f.family) return;
    if (f.sub && t.sub !== f.sub) return;
    if (f.discipline && !t.disciplines.includes(f.discipline)) return;
    const s = q ? score(it, q, qs) : 1;
    if (s > 0) out.push({ term: t, s, i });
  });
  out.sort((a, b) => b.s - a.s || a.i - b.i);
  return out.map((o) => o.term);
}

/** first letter of a name for the A–Z index: « Échauffement » goes under E */
export const initialOf = (name: string): string => normalize(name).charAt(0).toUpperCase();

export interface AzEntry {
  /** the word listed: a term's name, or an alias leading to it */
  label: string;
  term: Term;
  /** true when the label is an alias (shown as « label → name ») */
  alias: boolean;
}

/**
 * The A–Z index (§8): every name, plus international names and aliases that start with a letter, each leading to its
 * term; sorted without accents. Letters with no entry are not listed.
 */
export function azIndex(): Map<string, AzEntry[]> {
  const entries: AzEntry[] = [];
  const seen = new Set<string>();
  const push = (label: string, term: Term, alias: boolean) => {
    const k = `${normalize(label)}→${term.id}`;
    if (seen.has(k) || !/^[a-z]/.test(normalize(label))) return;
    seen.add(k);
    entries.push({ label, term, alias });
  };
  for (const t of TERMS) push(t.name, t, false);
  for (const t of TERMS) {
    if (t.intl) push(t.intl, t, true);
    for (const a of t.aliases ?? []) if (normalize(a) !== normalize(t.name)) push(a, t, true);
  }
  entries.sort((a, b) => normalize(a.label).localeCompare(normalize(b.label), 'fr'));
  const out = new Map<string, AzEntry[]>();
  for (const e of entries) {
    const l = initialOf(e.label);
    out.set(l, [...(out.get(l) ?? []), e]);
  }
  return out;
}

/** content state shown on the home page (§14 « afficher clairement l'état d'avancement »), counted, never declared */
export function coverage() {
  const byFamily = FAMILIES.map((f) => ({ family: f, count: TERMS.filter((t) => t.family === f.id).length }));
  const byDiscipline = (['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'] as DisciplineId[]).map((d) => ({ d, count: TERMS.filter((t) => t.disciplines.includes(d)).length }));
  return {
    total: TERMS.length,
    sourced: TERMS.filter((t) => t.status === 'sourcee' || t.status === 'validee').length,
    reviewed: TERMS.filter((t) => t.status === 'validee').length,
    byFamily,
    byDiscipline,
  };
}
