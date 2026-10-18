import type { CoachId, DisciplineId } from '../domain/types';

/**
 * Everything the fighter creator can change. Applied at runtime on top of the generated base body
 * (src/three/customize.ts): shape through per-region displacement, skin/eyes/hair colours and
 * tattoos in the skin shader, clothes and gear as layers that share the body's skinning.
 */
export type Pattern = 'uni' | 'bande' | 'deux-tons' | 'carreaux' | 'camouflage' | 'flammes';

export interface Paint {
  color: string;
  color2: string;
  pattern: Pattern;
}

export type TattooZone =
  | 'bras-gauche'
  | 'bras-droit'
  | 'avant-bras-gauche'
  | 'avant-bras-droit'
  | 'epaule-gauche'
  | 'epaule-droite'
  | 'poitrine'
  | 'ventre'
  | 'dos'
  | 'cuisse-gauche'
  | 'cuisse-droite'
  | 'mollet-gauche'
  | 'mollet-droit';

export interface Tattoo {
  id: string;
  design: string;
  zone: TattooZone;
  /** offset inside the zone, -1..1 */
  u: number;
  v: number;
  /** size, metres */
  size: number;
  /** degrees */
  rotation: number;
  color: string;
  /** 0..1 */
  intensity: number;
}

export type BottomType = 'short-boxe' | 'short-mma' | 'short-thai' | 'short-compression' | 'legging' | 'aucun';
export type TopType = 'aucun' | 'rashguard-court' | 'rashguard-long' | 'tshirt' | 'debardeur' | 'brassiere' | 'compression';
export type ShoesType = 'pieds-nus' | 'chaussures-boxe' | 'chaussons-mma';
export type HandsType = 'aucun' | 'bandes' | 'sous-gants' | 'gants-boxe' | 'gants-mma';
export type ShinsType = 'aucun' | 'tibias-thai' | 'tibias-mma';
export type FeetGearType = 'aucun' | 'chevillères' | 'protege-pieds';
export type HeadType = 'aucun' | 'casque-ouvert' | 'casque-joues' | 'casque-barre';
export type HairStyle = 'rase' | 'court' | 'degrade' | 'crete' | 'chignon' | 'queue' | 'tresses' | 'afro';
export type BeardStyle = 'aucune' | 'ombre' | 'courte' | 'pleine' | 'bouc' | 'moustache';

export interface FighterLook {
  sex: CoachId;
  body: {
    /** 0.9..1.1, uniform scale of the whole fighter */
    height: number;
    /** -1 lean .. 1 heavy */
    mass: number;
    /** 0 normal .. 1.5 bodybuilder */
    muscle: number;
    shoulders: number;
    chest: number;
    arms: number;
    legs: number;
    waist: number;
    /** muscle definition (visual), 0..1 */
    defAbs: number;
    defArms: number;
    defShoulders: number;
    defLegs: number;
    /** leg length factor 0.94..1.06 */
    legLength: number;
    neck: number;
  };
  face: { jaw: number; cheeks: number; brow: number; nose: number };
  skin: string;
  eyes: string;
  hair: { style: HairStyle; color: string; length: number };
  beard: { style: BeardStyle; color: string };
  bodyHair: number;
  tattoos: Tattoo[];
  outfit: { bottom: BottomType; bottomPaint: Paint; top: TopType; topPaint: Paint; shoes: ShoesType; shoesPaint: Paint };
  gear: {
    hands: HandsType;
    handsPaint: Paint;
    shins: ShinsType;
    shinsPaint: Paint;
    feet: FeetGearType;
    feetPaint: Paint;
    head: HeadType;
    headPaint: Paint;
    mouthguard: boolean;
    mouthPaint: Paint;
    bodyProtector: boolean;
    bodyPaint: Paint;
  };
}

const paint = (color: string, color2 = '#111214', pattern: Pattern = 'uni'): Paint => ({ color, color2, pattern });

export function defaultLook(sex: CoachId): FighterLook {
  const male = sex === 'homme';
  return {
    sex,
    body: {
      height: 1,
      mass: 0,
      muscle: male ? 1 : 0.7,
      shoulders: 0,
      chest: 0,
      arms: 0,
      legs: 0,
      waist: 0,
      defAbs: male ? 0.7 : 0.5,
      defArms: 0.5,
      defShoulders: 0.5,
      defLegs: 0.4,
      legLength: 1,
      neck: 0,
    },
    face: { jaw: 0, cheeks: 0, brow: 0, nose: 0 },
    skin: male ? '#b97a56' : '#d8a07c',
    eyes: '#4a2f1e',
    hair: { style: male ? 'court' : 'chignon', color: '#1c1512', length: 0.5 },
    beard: { style: male ? 'ombre' : 'aucune', color: '#1c1512' },
    bodyHair: male ? 0.2 : 0,
    tattoos: [],
    outfit: {
      bottom: male ? 'short-boxe' : 'short-compression',
      bottomPaint: male ? paint('#e8e6df', '#c8102e', 'bande') : paint('#16171b', '#e5484d', 'bande'),
      top: male ? 'aucun' : 'brassiere',
      topPaint: paint('#16171b', '#e5484d'),
      shoes: 'pieds-nus',
      shoesPaint: paint('#16171b'),
    },
    gear: {
      hands: 'aucun',
      handsPaint: paint('#c8102e', '#ffffff'),
      shins: 'aucun',
      shinsPaint: paint('#f2f2f2', '#c8102e'),
      feet: 'aucun',
      feetPaint: paint('#f2f2f2'),
      head: 'aucun',
      headPaint: paint('#c8102e'),
      mouthguard: false,
      mouthPaint: paint('#2563eb'),
      bodyProtector: false,
      bodyPaint: paint('#16171b'),
    },
  };
}

/** loadouts recommended by the rules of each discipline (training gear, solo shadow) */
export interface Loadout {
  bottom: BottomType;
  shoes: ShoesType;
  hands: HandsType;
  shins: ShinsType;
  feet: FeetGearType;
}

export function recommendedGear(d: DisciplineId): Loadout {
  switch (d) {
    case 'boxe':
      return { bottom: 'short-boxe', shoes: 'chaussures-boxe', hands: 'gants-boxe', shins: 'aucun', feet: 'aucun' };
    case 'kickboxing':
      return { bottom: 'short-thai', shoes: 'pieds-nus', hands: 'gants-boxe', shins: 'tibias-thai', feet: 'aucun' };
    case 'mma':
      return { bottom: 'short-mma', shoes: 'pieds-nus', hands: 'gants-mma', shins: 'aucun', feet: 'aucun' };
    case 'muaythai':
      return { bottom: 'short-thai', shoes: 'pieds-nus', hands: 'bandes', shins: 'aucun', feet: 'chevillères' };
    // grappling: no gloves, no shin guards (the judogi and the gi are not modelled yet)
    case 'bjj':
    case 'judo':
      return { bottom: 'short-mma', shoes: 'pieds-nus', hands: 'aucun', shins: 'aucun', feet: 'aucun' };
  }
}
