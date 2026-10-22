import { DISCIPLINES, type DisciplineId } from '../../domain/types';
import { DISCIPLINE_ICON_ALT } from '../icons/disciplines';

/**
 * 0.33: the one registry of the discipline emblems. Every discipline has the same object in three variants:
 * - `detaille` (A): a 3D render (tools/generator/emblems/render.py → export.py), WebP with alpha, for 64 to 128 px
 *   (discipline cards, headers). Files: public/emblems/<id>-{64,128,256}.webp;
 * - `semi` (B): the semi-flat vector icon of src/ui/icons/disciplines.tsx (gradients, light from the top left),
 *   from 32 to 128 px (programmes, lists, home);
 * - `contour` (C): the monochrome outline of ./outline.tsx (currentColor), for 24 and 32 px (chips, filters).
 * Adding a discipline: add its builder to render.py and export.py, its drawing to both vector files, then its entry
 * here; the registry test fails until the three variants exist.
 */
export type EmblemVariant = 'detaille' | 'semi' | 'contour';
export const EMBLEM_SIZES = [128, 64, 32, 24] as const;
export const DETAILED_FILES = [64, 128, 256] as const;

export interface EmblemEntry {
  id: DisciplineId;
  name: string;
  /** what the object is, read by screen readers when the name is not written next to it */
  alt: string;
  /** the file of the detailed render at a given pixel width (public path, without the base URL) */
  detailed: (px: (typeof DETAILED_FILES)[number]) => string;
}

export const emblemFile = (id: DisciplineId, px: number) => `emblems/${id}-${px}.webp`;

export const EMBLEMS: Record<DisciplineId, EmblemEntry> = Object.fromEntries(
  DISCIPLINES.map((d) => [d.id, { id: d.id, name: d.name, alt: DISCIPLINE_ICON_ALT[d.id], detailed: (px: number) => emblemFile(d.id, px) }]),
) as Record<DisciplineId, EmblemEntry>;

/** the variant chosen when the caller does not say: details are only legible from 64 px */
export const defaultVariant = (size: number): EmblemVariant => (size >= 64 ? 'detaille' : size >= 32 ? 'semi' : 'contour');
