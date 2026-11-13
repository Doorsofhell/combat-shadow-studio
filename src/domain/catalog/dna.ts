import { TECHNIQUE_BY_ID } from '../techniques';
import type { Technique } from '../types';
import type { CatalogCombo } from './types';

/**
 * v0.28 (Youssef, 2026-10-20 21:52 : « retire les rectangles sur le nombre de techniques, sois
 * créatif ») : l'« ADN de combat » d'un champion remplace les cases de compteurs. Il est calculé, jamais
 * saisi : c'est la part de chaque famille de mouvements dans toutes les séquences de ses fiches. Les
 * postures (garde) ne comptent pas.
 */
export type DnaAxisId = 'poings' | 'pieds' | 'genoux-coudes' | 'lutte-sol' | 'defense' | 'deplacements';

export interface DnaAxisDef {
  id: DnaAxisId;
  /** libellé court, sur le radar */
  label: string;
  /** libellé complet, pour le résumé accessible */
  long: string;
  categories: Technique['category'][];
}

export const DNA_AXES: DnaAxisDef[] = [
  { id: 'poings', label: 'Poings', long: 'Poings', categories: ['poing'] },
  { id: 'pieds', label: 'Pieds', long: 'Coups de pied', categories: ['pied'] },
  { id: 'genoux-coudes', label: 'Genoux, coudes', long: 'Genoux, coudes et clinch', categories: ['genou', 'coude', 'clinch'] },
  { id: 'lutte-sol', label: 'Lutte, sol', long: 'Lutte, sol et projections', categories: ['lutte', 'sol', 'projection', 'chute'] },
  { id: 'defense', label: 'Défense', long: 'Défense et feintes', categories: ['defense', 'feinte'] },
  { id: 'deplacements', label: 'Déplacements', long: 'Déplacements', categories: ['deplacement'] },
];

export interface DnaAxis extends DnaAxisDef {
  count: number;
  /** part de 0 à 1 de tous les mouvements comptés */
  share: number;
  /** pourcentage arrondi, affiché */
  percent: number;
}

export interface Dna {
  axes: DnaAxis[];
  /** nombre de mouvements comptés */
  total: number;
  /** axe le plus présent (null sans mouvement) */
  dominant: DnaAxis | null;
}

const AXIS_OF = new Map<string, DnaAxisId>(DNA_AXES.flatMap((a) => a.categories.map((c) => [c, a.id] as const)));

export function comboDna(combos: Pick<CatalogCombo, 'sequence'>[]): Dna {
  const counts = new Map<DnaAxisId, number>();
  let total = 0;
  for (const c of combos)
    for (const id of c.sequence) {
      const cat = TECHNIQUE_BY_ID.get(id)?.category;
      const axis = cat && AXIS_OF.get(cat);
      if (!axis) continue;
      counts.set(axis, (counts.get(axis) ?? 0) + 1);
      total++;
    }
  const axes = DNA_AXES.map((a) => {
    const count = counts.get(a.id) ?? 0;
    const share = total ? count / total : 0;
    return { ...a, count, share, percent: Math.round(share * 100) };
  });
  const dominant = total ? axes.reduce((m, a) => (a.count > m.count ? a : m)) : null;
  return { axes, total, dominant };
}

/** résumé lisible (lecteur d'écran, aria-label) : les axes présents, du plus fort au plus faible */
export function dnaSummary(dna: Dna): string {
  if (!dna.total) return 'Aucun mouvement à analyser.';
  return [...dna.axes]
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((a) => `${a.long} ${a.percent} %`)
    .join(', ');
}

export interface Focus {
  id: string;
  name: string;
  category: Technique['category'];
  /** nombre de fiches qui contiennent la technique */
  combos: number;
}

/**
 * « Ce que tu vas travailler » : les techniques les plus présentes dans les fiches, en préférant des
 * familles différentes (pour ne pas annoncer trois coups de poing). Postures exclues.
 */
export function focusTechniques(combos: Pick<CatalogCombo, 'sequence'>[], n = 3): Focus[] {
  const per = new Map<string, number>();
  for (const c of combos)
    for (const id of new Set(c.sequence)) {
      const t = TECHNIQUE_BY_ID.get(id);
      if (!t || t.category === 'garde') continue;
      per.set(id, (per.get(id) ?? 0) + 1);
    }
  const ranked = [...per.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => {
      const t = TECHNIQUE_BY_ID.get(id)!;
      return { id, name: t.name, category: t.category, combos: count };
    });
  const out: Focus[] = [];
  const cats = new Set<string>();
  for (const f of ranked) if (out.length < n && !cats.has(f.category)) (out.push(f), cats.add(f.category));
  for (const f of ranked) if (out.length < n && !out.includes(f)) out.push(f);
  return out.sort((a, b) => b.combos - a.combos);
}
