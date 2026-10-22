import { memo } from 'react';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import type { TechniqueCategory } from '../../domain/types';
import { AppIcon, type GlyphId } from '../icons';
import data from './techniquePictos.json';
import type { PictoData } from './build';
import './pictos.css';

const PICTOS = data as unknown as Record<string, PictoData | null>;

// joint indexes in PICTO_JOINTS
const HEAD = 0, NECK = 1, HIPS = 2;
const ARM_L = [3, 4, 5], ARM_R = [6, 7, 8];
const LEG_L = [9, 10, 11, 12], LEG_R = [13, 14, 15, 16];

/** generic picture of a family, for an id the library does not know (never a made-up posture) */
const FAMILY_GLYPH: Partial<Record<TechniqueCategory, GlyphId>> = {
  garde: 'shield',
  deplacement: 'forward',
  poing: 'target',
  pied: 'target',
  genou: 'target',
  coude: 'target',
  defense: 'shield',
  feinte: 'random',
  clinch: 'link',
  lutte: 'link',
  sol: 'grid',
  chute: 'stepBack',
  projection: 'rotateRight',
};

/** the pictogram of a technique, or null when the library has none */
export const pictoFor = (id: string) => PICTOS[id] ?? null;

/**
 * v0.38: the one pictogram of a technique, used everywhere a technique is shown small (creator, combination tiles,
 * sheets, history). Neutral figure from the technique's animation; the limb that works is red. An unknown id gets
 * its family's glyph, with the technique name as the accessible label.
 */
export const TechniquePicto = memo(function TechniquePicto({ id, size = 32, title }: { id: string; size?: number; title?: string }) {
  const t = TECHNIQUE_BY_ID.get(id);
  const label = title ?? t?.name ?? id;
  const d = PICTOS[id];
  if (!d) {
    return (
      <span className="tpicto tpicto-family" style={{ width: size, height: size }} role="img" aria-label={label} data-picto="famille">
        <AppIcon id={(t && FAMILY_GLYPH[t.category]) || 'details'} size={Math.round(size * 0.6)} />
      </span>
    );
  }
  const P = d.p;
  const line = (ix: number[]) => ix.map((i) => `${P[i][0]},${P[i][1]}`).join(' ');
  const far = (ix: number[]) => d.z[ix[ix.length - 1]] > d.z[NECK];
  const work = (side: 'L' | 'R', kind: 'hand' | 'foot') => d.e === `${kind}${side}`;
  const limbs = [
    { ix: [NECK, ...ARM_L], w: work('L', 'hand') },
    { ix: [NECK, ...ARM_R], w: work('R', 'hand') },
    { ix: [HIPS, ...LEG_L], w: work('L', 'foot') },
    { ix: [HIPS, ...LEG_R], w: work('R', 'foot') },
  ].sort((a, b) => Number(far(b.ix)) - Number(far(a.ix)));
  return (
    <svg className="tpicto" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={label} data-picto={id}>
      <line className="tp-ground" x1="4" y1="45.5" x2="44" y2="45.5" />
      {limbs.filter((l) => far(l.ix)).map((l, i) => (
        <polyline key={`f${i}`} className={`tp-limb far${l.w ? ' work' : ''}`} points={line(l.ix)} />
      ))}
      <polyline className="tp-limb" points={line([HIPS, NECK])} />
      {limbs.filter((l) => !far(l.ix)).map((l, i) => (
        <polyline key={`n${i}`} className={`tp-limb${l.w ? ' work' : ''}`} points={line(l.ix)} />
      ))}
      <circle className="tp-head" cx={P[HEAD][0]} cy={P[HEAD][1] - 1} r="3.6" />
    </svg>
  );
});
