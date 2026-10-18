import type { DisciplineId } from './types';

/**
 * Official artwork of each discipline: the ONE place that says which image stands for a discipline.
 * Every screen goes through `DisciplineArtwork` (src/ui/components), never through a path of its own,
 * so replacing an illustration or adding a discipline is a change here (and its files), nothing else.
 * Managed by the publisher only: users cannot replace these images.
 */
export interface ArtSource {
  /** width in px of this file */
  w: number;
  src: string;
}

export interface DisciplineArt {
  /** files of the same picture at several widths (WebP), smallest first */
  sources: ArtSource[];
  /** natural proportions of the picture: containers adapt to them, the picture is never stretched */
  width: number;
  height: number;
  /** point to keep in view when a container crops the picture (percent of width / height) */
  focus: { x: number; y: number };
  /** close framing on the fighter for small round badges: centre (percent) and zoom */
  bust: { x: number; y: number; zoom: number };
  /** what the picture shows, for screen readers */
  alt: string;
  /** provenance and rights, also listed in docs/ASSETS.md */
  credit: { author: string; licence: string; origin: string };
  /** bumped when the publisher replaces the picture (cache busting) */
  rev: number;
}

const OWN = { author: 'Combat Shadow Studio', licence: 'Création originale, propriété de l’éditeur', origin: 'Rendu des coachs 3D de l’application' };

const art = (id: string, alt: string, focus: DisciplineArt['focus'], bust: DisciplineArt['bust']): DisciplineArt => ({
  sources: [240, 600].map((w) => ({ w, src: `./art/disciplines/${id}-${w}.webp` })),
  width: 600,
  height: 760,
  focus,
  bust,
  alt,
  credit: OWN,
  rev: 1,
});

/** disciplines whose official artwork is still to be produced: their name is shown alone, no stand-in */
export const ART_PENDING: DisciplineId[] = ['bjj', 'judo'];

export const DISCIPLINE_ART: Partial<Record<DisciplineId, DisciplineArt>> = {
  boxe: art('boxe', 'Boxeur en garde', { x: 50, y: 20 }, { x: 52, y: 22, zoom: 2.2 }),
  kickboxing: art('kickboxing', 'Combattante de kick-boxing en coup de pied', { x: 50, y: 22 }, { x: 46, y: 22, zoom: 2 }),
  mma: art('mma', 'Combattant de MMA en entrée de lutte', { x: 50, y: 24 }, { x: 50, y: 24, zoom: 2 }),
  muaythai: art('muaythai', 'Combattante de muay-thaï en coup de genou', { x: 50, y: 22 }, { x: 56, y: 20, zoom: 2.2 }),
};

/** the official artwork, or undefined for a discipline that has none yet (the UI then shows its name only) */
export function disciplineArt(id: string): DisciplineArt | undefined {
  return (DISCIPLINE_ART as Record<string, DisciplineArt>)[id];
}
