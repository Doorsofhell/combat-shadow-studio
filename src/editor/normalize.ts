import type { CoachId } from '../domain/types';
import { BeardStyle, BottomType, FeetGearType, FighterLook, HairStyle, HandsType, HeadType, Paint, Pattern, ShinsType, ShoesType, Tattoo, TattooZone, TopType, defaultLook } from './look';

/**
 * Value lists of every union type of the look. Built from a Record so that the compiler fails
 * when look.ts gains a value that is missing here.
 */
const keys = <T extends string>(r: Record<T, true>) => Object.keys(r) as T[];

export const PATTERNS = keys<Pattern>({
  uni: true,
  bande: true,
  'deux-tons': true,
  carreaux: true,
  camouflage: true,
  flammes: true,
});
export const TATTOO_ZONES = keys<TattooZone>({
  'bras-gauche': true,
  'bras-droit': true,
  'avant-bras-gauche': true,
  'avant-bras-droit': true,
  'epaule-gauche': true,
  'epaule-droite': true,
  poitrine: true,
  ventre: true,
  dos: true,
  'cuisse-gauche': true,
  'cuisse-droite': true,
  'mollet-gauche': true,
  'mollet-droit': true,
});
export const BOTTOMS = keys<BottomType>({
  'short-boxe': true,
  'short-mma': true,
  'short-thai': true,
  'short-compression': true,
  legging: true,
  aucun: true,
});
export const TOPS = keys<TopType>({
  aucun: true,
  'rashguard-court': true,
  'rashguard-long': true,
  tshirt: true,
  debardeur: true,
  brassiere: true,
  compression: true,
});
export const SHOES = keys<ShoesType>({
  'pieds-nus': true,
  'chaussures-boxe': true,
  'chaussons-mma': true,
});
export const HANDS = keys<HandsType>({
  aucun: true,
  bandes: true,
  'sous-gants': true,
  'gants-boxe': true,
  'gants-mma': true,
});
export const SHINS = keys<ShinsType>({
  aucun: true,
  'tibias-thai': true,
  'tibias-mma': true,
});
export const FEET_GEAR = keys<FeetGearType>({
  aucun: true,
  chevillères: true,
  'protege-pieds': true,
});
export const HEADS = keys<HeadType>({
  aucun: true,
  'casque-ouvert': true,
  'casque-joues': true,
  'casque-barre': true,
});
export const HAIR_STYLES = keys<HairStyle>({
  rase: true,
  court: true,
  degrade: true,
  crete: true,
  chignon: true,
  queue: true,
  tresses: true,
  afro: true,
});
export const BEARD_STYLES = keys<BeardStyle>({
  aucune: true,
  ombre: true,
  courte: true,
  pleine: true,
  bouc: true,
  moustache: true,
});

export type Range = readonly [min: number, max: number];

/** slider ranges, from the comments of look.ts (unbounded offsets use -1..1, like mass) */
export const BODY_RANGES: Record<keyof FighterLook['body'], Range> = {
  height: [0.9, 1.1],
  mass: [-1, 1],
  muscle: [0, 1.5],
  shoulders: [-1, 1],
  chest: [-1, 1],
  arms: [-1, 1],
  legs: [-1, 1],
  waist: [-1, 1],
  defAbs: [0, 1],
  defArms: [0, 1],
  defShoulders: [0, 1],
  defLegs: [0, 1],
  legLength: [0.94, 1.06],
  neck: [-1, 1],
};
export const FACE_RANGES: Record<keyof FighterLook['face'], Range> = {
  jaw: [-1, 1],
  cheeks: [-1, 1],
  brow: [-1, 1],
  nose: [-1, 1],
};
export const HAIR_LENGTH_RANGE: Range = [0, 1];
export const BODY_HAIR_RANGE: Range = [0, 1];
export const TATTOO_RANGES = {
  u: [-1, 1],
  v: [-1, 1],
  size: [0.04, 0.3],
  rotation: [-180, 180],
  intensity: [0, 1],
} as const satisfies Record<string, Range>;
export const MAX_TATTOOS = 8;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const HEX = /^#[0-9a-f]{6}$/i;

const num = (v: unknown, r: Range, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(r[1], Math.max(r[0], v)) : fb);
const color = (v: unknown, fb: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fb);
const pick = <T extends string>(v: unknown, list: readonly T[], fb: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fb);
const bool = (v: unknown, fb: boolean) => (typeof v === 'boolean' ? v : fb);

function paint(v: unknown, fb: Paint): Paint {
  const p = isObj(v) ? v : {};
  return {
    color: color(p.color, fb.color),
    color2: color(p.color2, fb.color2),
    pattern: pick(p.pattern, PATTERNS, fb.pattern),
  };
}

function tattoo(v: unknown, i: number, designs?: readonly string[]): Tattoo | null {
  if (!isObj(v)) return null;
  const design = typeof v.design === 'string' && v.design ? v.design : null;
  if (!design || (designs && !designs.includes(design))) return null;
  const zone = pick<TattooZone | ''>(v.zone, TATTOO_ZONES, '');
  if (!zone) return null;
  const R = TATTOO_RANGES;
  return {
    id: typeof v.id === 'string' && v.id ? v.id : `t-${i}-${design}`,
    design,
    zone,
    u: num(v.u, R.u, 0),
    v: num(v.v, R.v, 0),
    size: num(v.size, R.size, 0.12),
    rotation: num(v.rotation, R.rotation, 0),
    color: color(v.color, '#1a1a1a'),
    intensity: num(v.intensity, R.intensity, 0.9),
  };
}

/**
 * Repairs a look read from an old or partial save: every missing field takes the default of the
 * fighter's sex, numbers are clamped to their range, unknown enum values and malformed colours
 * fall back to the default, tattoos are validated (at most 8; pass `designs` to also drop
 * tattoos whose design no longer exists). Never throws; never shares objects with the input.
 */
export function normalizeLook(raw: unknown, fallbackSex: CoachId = 'homme', designs?: readonly string[]): FighterLook {
  const r = isObj(raw) ? raw : {};
  const sex: CoachId = r.sex === 'femme' || r.sex === 'homme' ? r.sex : fallbackSex;
  const d = defaultLook(sex);

  const rb = isObj(r.body) ? r.body : {};
  const body = { ...d.body };
  for (const k of Object.keys(BODY_RANGES) as (keyof FighterLook['body'])[]) body[k] = num(rb[k], BODY_RANGES[k], d.body[k]);

  const rf = isObj(r.face) ? r.face : {};
  const face = { ...d.face };
  for (const k of Object.keys(FACE_RANGES) as (keyof FighterLook['face'])[]) face[k] = num(rf[k], FACE_RANGES[k], d.face[k]);

  const rh = isObj(r.hair) ? r.hair : {};
  const rbd = isObj(r.beard) ? r.beard : {};
  const ro = isObj(r.outfit) ? r.outfit : {};
  const rg = isObj(r.gear) ? r.gear : {};
  const tattoos = (Array.isArray(r.tattoos) ? r.tattoos : [])
    .map((t, i) => tattoo(t, i, designs))
    .filter((t): t is Tattoo => !!t)
    .slice(0, MAX_TATTOOS);
  // duplicate ids would confuse the editor list
  const seen = new Set<string>();
  for (const t of tattoos) {
    while (seen.has(t.id)) t.id = `${t.id}-b`;
    seen.add(t.id);
  }

  return {
    sex,
    body,
    face,
    skin: color(r.skin, d.skin),
    eyes: color(r.eyes, d.eyes),
    hair: {
      style: pick(rh.style, HAIR_STYLES, d.hair.style),
      color: color(rh.color, d.hair.color),
      length: num(rh.length, HAIR_LENGTH_RANGE, d.hair.length),
    },
    beard: {
      style: pick(rbd.style, BEARD_STYLES, d.beard.style),
      color: color(rbd.color, d.beard.color),
    },
    bodyHair: num(r.bodyHair, BODY_HAIR_RANGE, d.bodyHair),
    tattoos,
    outfit: {
      bottom: pick(ro.bottom, BOTTOMS, d.outfit.bottom),
      bottomPaint: paint(ro.bottomPaint, d.outfit.bottomPaint),
      top: pick(ro.top, TOPS, d.outfit.top),
      topPaint: paint(ro.topPaint, d.outfit.topPaint),
      shoes: pick(ro.shoes, SHOES, d.outfit.shoes),
      shoesPaint: paint(ro.shoesPaint, d.outfit.shoesPaint),
    },
    gear: {
      hands: pick(rg.hands, HANDS, d.gear.hands),
      handsPaint: paint(rg.handsPaint, d.gear.handsPaint),
      shins: pick(rg.shins, SHINS, d.gear.shins),
      shinsPaint: paint(rg.shinsPaint, d.gear.shinsPaint),
      feet: pick(rg.feet, FEET_GEAR, d.gear.feet),
      feetPaint: paint(rg.feetPaint, d.gear.feetPaint),
      head: pick(rg.head, HEADS, d.gear.head),
      headPaint: paint(rg.headPaint, d.gear.headPaint),
      mouthguard: bool(rg.mouthguard, d.gear.mouthguard),
      mouthPaint: paint(rg.mouthPaint, d.gear.mouthPaint),
      bodyProtector: bool(rg.bodyProtector, d.gear.bodyProtector),
      bodyPaint: paint(rg.bodyPaint, d.gear.bodyPaint),
    },
  };
}
