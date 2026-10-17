import type { CoachId } from '../domain/types';
import { FighterLook, Paint, Tattoo, defaultLook } from './look';
import { BEARD_STYLES, BOTTOMS, HAIR_STYLES, PATTERNS, SHOES, TATTOO_ZONES, TOPS } from './normalize';

export type Rng = () => number;

/** realistic palettes: random hex colours would give green skin */
export const SKIN_TONES = ['#f3d2b8', '#e8b998', '#d8a07c', '#c68a64', '#b97a56', '#a0663f', '#8a5634', '#6f432a', '#563321', '#3f2619'];
export const HAIR_COLORS = ['#0f0c0b', '#1c1512', '#3b2a20', '#5a3d2a', '#8b5a36', '#b07b4a', '#d6b07a', '#e8d3a8', '#9a9a9a', '#e6e6e6', '#7a1f1f', '#2f4f9a'];
export const EYE_COLORS = ['#4a2f1e', '#2b1a10', '#6b4a2a', '#5c7a3a', '#3f6f8f', '#7a8a9a', '#3a3a3a'];
export const CLOTH_COLORS = ['#16171b', '#f2f2f2', '#c8102e', '#e5484d', '#2563eb', '#0f3d8a', '#1f7a3a', '#f0b45a', '#c8a96b', '#6b2fa0', '#ff7a1a', '#111214', '#7a7f8a'];

const pickOf = <T>(rng: Rng, list: readonly T[]) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
/** value in [a, b], rounded to 2 decimals so the sliders show what is stored */
const between = (rng: Rng, a: number, b: number) => Math.round((a + (b - a) * rng()) * 100) / 100;

function randomPaint(rng: Rng, plainBias = 0.5): Paint {
  const color = pickOf(rng, CLOTH_COLORS);
  let color2 = pickOf(rng, CLOTH_COLORS);
  if (color2 === color) color2 = color === '#f2f2f2' ? '#16171b' : '#f2f2f2';
  return {
    color,
    color2,
    pattern: rng() < plainBias ? 'uni' : pickOf(rng, PATTERNS),
  };
}

/**
 * A plausible random fighter: body and face within moderate ranges, natural skin / hair / eye
 * colours, an outfit that suits the sex (no bare chest for a woman), a few tattoos at most.
 * Gear stays off: it is a training choice, see "Tenue conseillée". `rng` makes it testable.
 */
export function randomLook(sex: CoachId, rng: Rng = Math.random, tattooDesigns: readonly string[] = []): FighterLook {
  const l = defaultLook(sex);
  const male = sex === 'homme';
  const b = l.body;
  b.height = between(rng, 0.94, 1.06);
  b.mass = between(rng, -0.6, 0.6);
  b.muscle = between(rng, male ? 0.6 : 0.4, male ? 1.3 : 1);
  for (const k of ['shoulders', 'chest', 'arms', 'legs', 'waist', 'neck'] as const) b[k] = between(rng, -0.5, 0.5);
  for (const k of ['defAbs', 'defArms', 'defShoulders', 'defLegs'] as const) b[k] = between(rng, 0.2, 0.9);
  b.legLength = between(rng, 0.97, 1.03);
  for (const k of ['jaw', 'cheeks', 'brow', 'nose'] as const) l.face[k] = between(rng, -0.7, 0.7);
  l.skin = pickOf(rng, SKIN_TONES);
  l.eyes = pickOf(rng, EYE_COLORS);
  l.hair = {
    style: pickOf(rng, HAIR_STYLES),
    color: pickOf(rng, HAIR_COLORS),
    length: between(rng, 0, 1),
  };
  l.beard = {
    style: male ? pickOf(rng, BEARD_STYLES) : 'aucune',
    color: l.hair.color,
  };
  l.bodyHair = male ? between(rng, 0, 0.6) : 0;
  l.outfit.bottom = pickOf(
    rng,
    BOTTOMS.filter((x) => x !== 'aucun'),
  );
  l.outfit.top = male
    ? pickOf(
        rng,
        TOPS.filter((x) => x !== 'brassiere'),
      )
    : pickOf(
        rng,
        TOPS.filter((x) => x !== 'aucun'),
      );
  l.outfit.shoes = pickOf(rng, SHOES);
  l.outfit.bottomPaint = randomPaint(rng, 0.4);
  l.outfit.topPaint = randomPaint(rng, 0.6);
  l.outfit.shoesPaint = randomPaint(rng, 0.8);
  const n = tattooDesigns.length ? Math.floor(rng() * 4) : 0;
  const tattoos: Tattoo[] = [];
  for (let i = 0; i < n; i++)
    tattoos.push({
      id: `t-${i}-${Math.floor(rng() * 1e9).toString(36)}`,
      design: pickOf(rng, tattooDesigns),
      zone: pickOf(rng, TATTOO_ZONES),
      u: between(rng, -0.4, 0.4),
      v: between(rng, -0.4, 0.4),
      size: between(rng, 0.08, 0.18),
      rotation: 0,
      color: rng() < 0.8 ? '#1a1a1a' : '#7a1010',
      intensity: between(rng, 0.7, 1),
    });
  l.tattoos = tattoos;
  return l;
}
