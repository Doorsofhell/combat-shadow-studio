import type { CoachId } from '../domain/types';
import { FighterLook, Paint, Tattoo, defaultLook } from './look';
import { BEARD_STYLES, BODY_RANGES, BOTTOMS, FACE_RANGES, HAIR_STYLES, PATTERNS, SHOES, TATTOO_ZONES, TOPS } from './normalize';

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

type R = readonly [number, number];
/**
 * Body archetypes: the random look first picks a credible build, then varies it within that build,
 * so mass, muscle and definition stay consistent (a heavy fighter is not shredded and thin-armed).
 */
export interface Archetype {
  id: string;
  label: string;
  height: R;
  mass: R;
  muscle: R;
  definition: R;
  /** shoulders, chest, arms, legs, waist, neck around the archetype's own centre */
  parts: Partial<Record<'shoulders' | 'chest' | 'arms' | 'legs' | 'waist' | 'neck', R>>;
}

export const ARCHETYPES: Record<CoachId, Archetype[]> = {
  homme: [
    { id: 'leger', label: 'Léger et sec', height: [0.95, 1.02], mass: [-0.6, -0.25], muscle: [0.75, 1.05], definition: [0.6, 0.9], parts: { waist: [-0.5, -0.1], legs: [-0.3, 0.2] } },
    { id: 'athletique', label: 'Athlétique', height: [0.97, 1.05], mass: [-0.25, 0.2], muscle: [0.95, 1.3], definition: [0.5, 0.85], parts: { shoulders: [0, 0.5], chest: [0, 0.5], waist: [-0.4, 0.1] } },
    { id: 'puissant', label: 'Puissant', height: [0.98, 1.06], mass: [0.2, 0.6], muscle: [1, 1.3], definition: [0.2, 0.5], parts: { shoulders: [0.2, 0.5], neck: [0.1, 0.5], waist: [0, 0.4], legs: [0, 0.5] } },
  ],
  femme: [
    { id: 'leger', label: 'Légère et sèche', height: [0.94, 1.01], mass: [-0.6, -0.25], muscle: [0.45, 0.8], definition: [0.5, 0.85], parts: { waist: [-0.5, -0.1] } },
    { id: 'athletique', label: 'Athlétique', height: [0.96, 1.04], mass: [-0.25, 0.2], muscle: [0.6, 1], definition: [0.4, 0.8], parts: { shoulders: [-0.1, 0.4], legs: [0, 0.4] } },
    { id: 'puissant', label: 'Puissante', height: [0.97, 1.05], mass: [0.2, 0.6], muscle: [0.7, 1], definition: [0.2, 0.5], parts: { shoulders: [0, 0.4], legs: [0.1, 0.5], waist: [0, 0.4] } },
  ],
};

/** largest skin offset a body region may get (metres): beyond this the silhouette is no longer human */
export const MAX_SHAPE_OFFSET = 0.03;

/**
 * Checks that a look can be shown without anatomical or rendering errors: every slider within its
 * range, legs at the reference length (the random look never changes the skeleton), skin offsets
 * within MAX_SHAPE_OFFSET, consistent build, outfit that suits the sex. Returns the problems found.
 */
export function validateLook(l: FighterLook, shape?: (l: FighterLook) => number[][]): string[] {
  const bad: string[] = [];
  for (const [k, [a, b]] of Object.entries(BODY_RANGES)) {
    const v = l.body[k as keyof FighterLook['body']];
    if (!(v >= a && v <= b)) bad.push(`corps.${k} hors limites (${v})`);
  }
  for (const [k, [a, b]] of Object.entries(FACE_RANGES)) {
    const v = l.face[k as keyof FighterLook['face']];
    if (!(v >= a && v <= b)) bad.push(`visage.${k} hors limites (${v})`);
  }
  if (shape) for (const vec of shape(l)) for (const v of vec) if (Math.abs(v) > MAX_SHAPE_OFFSET) bad.push(`déformation excessive (${v.toFixed(3)} m)`);
  if (l.body.mass > 0.3 && l.body.defAbs > 0.75) bad.push('masse élevée et abdominaux très dessinés');
  if (l.sex === 'femme' && l.outfit.top === 'aucun') bad.push('tenue : haut manquant');
  return bad;
}

/**
 * A plausible random fighter: a body archetype, then body and face within its ranges, natural skin
 * / hair / eye colours, an outfit that suits the sex (no bare chest for a woman), a few tattoos at
 * most. Only appearance changes: the skeleton, the reference posture and the animations are never
 * touched (leg length stays at its reference value). Gear stays off: it is a training choice, see
 * "Tenue conseillée". `rng` makes it testable. A look that fails validateLook() is replaced by the
 * default look of that sex, which is always valid.
 */
export function randomLook(sex: CoachId, rng: Rng = Math.random, tattooDesigns: readonly string[] = [], shape?: (l: FighterLook) => number[][]): FighterLook {
  for (let attempt = 0; attempt < 5; attempt++) {
    const l = randomLookOnce(sex, rng, tattooDesigns);
    if (!validateLook(l, shape).length) return l;
  }
  return defaultLook(sex);
}

function randomLookOnce(sex: CoachId, rng: Rng, tattooDesigns: readonly string[]): FighterLook {
  const l = defaultLook(sex);
  const male = sex === 'homme';
  const b = l.body;
  const a = pickOf(rng, ARCHETYPES[sex]);
  b.height = between(rng, ...a.height);
  b.mass = between(rng, ...a.mass);
  b.muscle = between(rng, ...a.muscle);
  for (const k of ['shoulders', 'chest', 'arms', 'legs', 'waist', 'neck'] as const) b[k] = between(rng, ...(a.parts[k] ?? [-0.3, 0.3]));
  for (const k of ['defAbs', 'defArms', 'defShoulders', 'defLegs'] as const) b[k] = between(rng, ...a.definition);
  b.legLength = 1;
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
