import { TECHNIQUE_BY_ID } from '../techniques';
import type { DisciplineId, LevelId } from '../types';
import type { Catalog, CatalogCombo, CatalogGoal, CatalogGuard, CatalogStatus } from './types';
import { isPlayable3D } from './validate';

export type LengthBand = '2-3' | '4-5' | '6-7' | '8-10';
export const LENGTH_BANDS: { id: LengthBand; label: string; min: number; max: number }[] = [
  { id: '2-3', label: '2-3 mouvements', min: 2, max: 3 },
  { id: '4-5', label: '4-5 mouvements', min: 4, max: 5 },
  { id: '6-7', label: '6-7 mouvements', min: 6, max: 7 },
  { id: '8-10', label: '8-10 mouvements', min: 8, max: 10 },
];

export interface CatalogQuery {
  text?: string;
  discipline?: DisciplineId;
  champion?: string;
  technique?: string;
  level?: LevelId;
  /** une fiche « les-deux » correspond aux deux gardes */
  guard?: Exclude<CatalogGuard, 'les-deux'>;
  length?: LengthBand;
  tag?: string;
  goal?: CatalogGoal;
  status?: CatalogStatus;
}

/** minuscules sans accents, pour une recherche tolérante */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function haystack(c: CatalogCombo, cat: Catalog) {
  const ch = cat.championById.get(c.champion);
  return fold([c.name, c.objective, ch?.name ?? '', c.tags.join(' '), ...c.sequence.map((id) => TECHNIQUE_BY_ID.get(id)?.name ?? id)].join(' '));
}

const hayCache = new WeakMap<CatalogCombo, string>();

/** recherche plein texte (champion, nom, objectif, techniques) + filtres */
export function searchCombos(cat: Catalog, q: CatalogQuery, list: CatalogCombo[] = cat.combos): CatalogCombo[] {
  const words = q.text ? fold(q.text).split(/\s+/).filter(Boolean) : [];
  const band = q.length ? LENGTH_BANDS.find((b) => b.id === q.length) : undefined;
  return list.filter((c) => {
    if (q.discipline && c.discipline !== q.discipline) return false;
    if (q.champion && c.champion !== q.champion) return false;
    if (q.technique && !c.sequence.includes(q.technique)) return false;
    if (q.level && c.level !== q.level) return false;
    if (q.guard && c.guard !== q.guard && c.guard !== 'les-deux') return false;
    if (band && (c.sequence.length < band.min || c.sequence.length > band.max)) return false;
    if (q.tag && !c.tags.includes(q.tag)) return false;
    if (q.goal && c.goal !== q.goal) return false;
    if (q.status && c.status !== q.status) return false;
    if (words.length) {
      let h = hayCache.get(c);
      if (!h) hayCache.set(c, (h = haystack(c, cat)));
      if (!words.every((w) => h!.includes(w))) return false;
    }
    return true;
  });
}

export interface CatalogCounts {
  total: number;
  verifiee: number;
  adaptee: number;
  inspiree: number;
  playable: number;
}

export function catalogCounts(list: CatalogCombo[]): CatalogCounts {
  const n: CatalogCounts = { total: list.length, verifiee: 0, adaptee: 0, inspiree: 0, playable: 0 };
  for (const c of list) {
    n[c.status]++;
    if (isPlayable3D(c)) n.playable++;
  }
  return n;
}

/** toutes les étiquettes présentes, triées par fréquence */
export function allTags(list: CatalogCombo[]): string[] {
  const m = new Map<string, number>();
  for (const c of list) for (const t of c.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** fiche du jour : la même pour tout le monde à une date donnée (indépendante de l’ordre de la liste) */
export function dailyPick(list: CatalogCombo[], date: Date = new Date()): CatalogCombo | undefined {
  if (!list.length) return undefined;
  const sorted = [...list].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return sorted[hash(`css-fiche-du-jour:${dayKey(date)}`) % sorted.length];
}

export function randomPick(list: CatalogCombo[], rnd: () => number = Math.random): CatalogCombo | undefined {
  return list.length ? list[Math.floor(rnd() * list.length) % list.length] : undefined;
}

/** ajoutées récemment : date d’ajout décroissante */
export function recentCombos(list: CatalogCombo[], n = 30): CatalogCombo[] {
  return [...list].sort((a, b) => (a.addedAt === b.addedAt ? (a.id < b.id ? -1 : 1) : a.addedAt < b.addedAt ? 1 : -1)).slice(0, n);
}
