import { techniquesFor } from '../../domain/techniques';
import { filterTechniques, type KbStyleChoice } from '../../domain/kickboxingStyles';
import type { DisciplineId, Technique } from '../../domain/types';
import type { Mastery } from '../../store/goals';

/**
 * Order of the technique sheets (0.25, Youssef 2026-10-20 12:30: « aller à la technique d'après ou
 * d'avant sans devoir sortir de l'écran »): the catalogue list the user came from, i.e. the
 * discipline, the kick-boxing style and the category filter of the « Techniques » tab.
 */
export type TechniqueFilter = Technique['category'] | 'tout' | 'a-revoir';

/** the filter carried by the URL (?cat=), 'tout' when absent or unknown */
export function parseTechniqueFilter(v: string | null | undefined, categories: readonly string[]): TechniqueFilter {
  if (v === 'a-revoir') return v;
  return v && categories.includes(v) ? (v as Technique['category']) : 'tout';
}

/** the techniques of the catalogue, filtered as the « Techniques » tab shows them */
export function techniqueCatalogue(d: DisciplineId, kbStyle: KbStyleChoice, cat: TechniqueFilter, mastery: Record<string, Mastery>): Technique[] {
  const list = filterTechniques(techniquesFor(d), d, kbStyle);
  if (cat === 'tout') return list;
  if (cat === 'a-revoir') return list.filter((t) => mastery[t.id] === 'a-revoir');
  return list.filter((t) => t.category === cat);
}

export interface Neighbours {
  /** 0-based position of the technique in the list */
  index: number;
  total: number;
  prev?: string;
  next?: string;
}

/** previous and next technique of `id` in `ids` (no wrap at the ends); null when `id` is not in it */
export function neighbours(ids: readonly string[], id: string): Neighbours | null {
  const index = ids.indexOf(id);
  if (index < 0) return null;
  return { index, total: ids.length, prev: index > 0 ? ids[index - 1] : undefined, next: index < ids.length - 1 ? ids[index + 1] : undefined };
}

/** query string of a sheet in that list: ?d=…, plus &cat=… for a filtered list */
export function sheetQuery(d: DisciplineId, cat: TechniqueFilter): string {
  return cat === 'tout' ? `?d=${d}` : `?d=${d}&cat=${encodeURIComponent(cat)}`;
}
