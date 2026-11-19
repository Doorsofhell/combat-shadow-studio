import type { DisciplineId } from '../types';

/**
 * CoachAtmosphereResolver — V4 de l'écran « Ton coach » (Youssef, 2026-11-18 : « une ambiance visuelle unique, construite
 * automatiquement à partir de sa description, de sa discipline, de son surnom, de ses spécialités », puis « pas forcément des
 * salles en ambiance, mais quelque chose tiré des traits du coach »).
 *
 * L'ambiance d'un coach n'est pas une salle : c'est un univers tiré de ses traits. Le module lit seulement les données qui
 * existent dans le catalogue et en déduit, par des règles fixes, une configuration de présentation (couleurs, lumière,
 * emblème, fumée, sol). Il ne devine rien d'absent : un champ vide ne produit pas de trait, et la source de chaque choix est
 * notée dans `sources` (ce que le rapport et les tests relisent).
 *
 * Ordre de priorité des données (demande du 18/11) :
 *   1. discipline principale (champ explicite, sinon mots du style ou de la description, sinon préfixe de l'identifiant) ;
 *   2. description (bio) ;
 *   3. surnom et identité (l'animal du surnom donne l'emblème et la palette de base) ;
 *   4. spécialités (points forts) ;
 *   5. style de combat (ligne de style et garde) ;
 *   6. profil physique : utilisé seulement pour le cadrage (CoachStage), jamais pour l'ambiance.
 *
 * Déterministe : même entrée, même ambiance (aucun hasard, aucun service externe). Les deux coachs qui tomberaient sur la
 * même palette sont départagés par une rotation de teinte tirée d'un hachage de leur identifiant (`resolveAll`).
 * Surcharge manuelle possible par coach (`ATMOSPHERE_OVERRIDES`), vide par défaut.
 */

/** ce que le module lit d'un coach : les champs du catalogue (ChampionCoach), `discipline` facultatif pour les futurs coachs */
export interface AtmosphereInput {
  id: string;
  name: string;
  nickname?: string;
  style?: string;
  bio?: string;
  guard?: string;
  strengths?: string[];
  discipline?: DisciplineId;
}

export type AnimalId = 'tigre' | 'lion' | 'panthere' | 'loup' | 'aigle' | 'faucon' | 'aucun';
/** dessin de l'emblème en fond (src/three/atmosphere/emblem.ts) */
export type MotifId = 'rayures' | 'criniere' | 'griffes' | 'lune' | 'ailes' | 'ailes-vitesse' | 'monogramme';
export type Temperament = 'explosif' | 'puissant' | 'precis' | 'calme' | 'mobile' | 'equilibre';
export type FloorMotif = 'ring' | 'octogone' | 'tatami' | 'aucun';
export type AtmosphereSourceField = 'discipline' | 'description' | 'surnom' | 'specialites' | 'style' | 'defaut' | 'surcharge';

export interface CoachAtmosphere {
  coachId: string;
  /** discipline lue dans les données, null si aucune n'y figure */
  discipline: DisciplineId | null;
  /** nom de l'univers, lisible (rapport, accessibilité) */
  environment: string;
  identity: { animal: AnimalId; label: string };
  temperament: Temperament;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    /** haut et bas du fond */
    sky: [string, string];
  };
  lighting: {
    temperature: 'warm' | 'neutral' | 'cold';
    intensity: 'soft' | 'cinematic' | 'intense';
    rimLight: true;
    /** lumière principale : presque blanche, juste teintée (aucune tache colorée sur la peau) */
    key: { color: string; intensity: number; side: 1 | -1 };
    fill: { color: string; intensity: number };
    rim: { color: string; intensity: number };
  };
  atmosphere: {
    smoke: 'none' | 'subtle' | 'dense';
    floorReflection: 'low' | 'medium';
    motif: MotifId;
    /** yeux de l'animal dans l'ombre (null : pas d'yeux) */
    eyes: { color: string; pupil: 'fente' | 'ronde' } | null;
    /** traits de vitesse (spécialités ou style rapides) */
    streaks: boolean;
    floor: FloorMotif;
    /** vitesse des mouvements du décor (fumée, respiration de la lumière), 1 = normal */
    pace: number;
  };
  sources: { field: AtmosphereSourceField; value: string; rule: string }[];
}

type Palette = CoachAtmosphere['palette'];

/** l'animal du surnom : emblème, palette et yeux de base */
const ANIMALS: { id: AnimalId; re: RegExp; label: string; motif: MotifId; palette: Palette; eyes: CoachAtmosphere['atmosphere']['eyes']; temperature: CoachAtmosphere['lighting']['temperature'] }[] = [
  { id: 'tigre', re: /tigr/i, label: 'Antre de la tigresse', motif: 'rayures', palette: { primary: '#E8A72C', secondary: '#3A211B', accent: '#FFD45A', sky: ['#3a2410', '#080605'] }, eyes: { color: '#FFB52E', pupil: 'ronde' }, temperature: 'warm' },
  { id: 'lion', re: /lion/i, label: 'Arène de la lionne', motif: 'criniere', palette: { primary: '#C2265E', secondary: '#2A0C33', accent: '#F2B544', sky: ['#33102e', '#08040a'] }, eyes: { color: '#F2B544', pupil: 'ronde' }, temperature: 'warm' },
  { id: 'panthere', re: /panth|jaguar|l[ée]opard/i, label: 'Jungle de nuit de la panthère', motif: 'griffes', palette: { primary: '#19B58A', secondary: '#06201A', accent: '#7CFFD4', sky: ['#0b2a24', '#030807'] }, eyes: { color: '#5CFFB8', pupil: 'fente' }, temperature: 'cold' },
  { id: 'loup', re: /loup|wolf/i, label: 'Clair de lune du loup', motif: 'lune', palette: { primary: '#9AA8B8', secondary: '#10151D', accent: '#E6EEF7', sky: ['#1c2633', '#05070a'] }, eyes: { color: '#CFE3FF', pupil: 'ronde' }, temperature: 'cold' },
  { id: 'aigle', re: /aigle|eagle/i, label: 'Ailes de l’aigle', motif: 'ailes', palette: { primary: '#B0161E', secondary: '#16181D', accent: '#C9D1D9', sky: ['#2c0d10', '#060607'] }, eyes: null, temperature: 'neutral' },
  { id: 'faucon', re: /faucon|falcon|[ée]pervier/i, label: 'Piqué du faucon', motif: 'ailes-vitesse', palette: { primary: '#2F7BFF', secondary: '#08142B', accent: '#9FD0FF', sky: ['#0a1d3f', '#03060c'] }, eyes: null, temperature: 'cold' },
];

/** palettes de repli par discipline (coach sans animal dans son surnom) */
const DISCIPLINE_PALETTES: Record<DisciplineId, Palette> = {
  boxe: { primary: '#2F6BFF', secondary: '#0B1530', accent: '#A9C8FF', sky: ['#0d1c38', '#04060b'] },
  kickboxing: { primary: '#E1452F', secondary: '#24100C', accent: '#FFB199', sky: ['#2e110b', '#070404'] },
  mma: { primary: '#B3122E', secondary: '#16181D', accent: '#D3D8DE', sky: ['#2b0b12', '#060607'] },
  muaythai: { primary: '#E8A72C', secondary: '#3A211B', accent: '#FFD45A', sky: ['#382210', '#080605'] },
  bjj: { primary: '#3C6FD8', secondary: '#0D1426', accent: '#C9D9FF', sky: ['#111c33', '#04060b'] },
  judo: { primary: '#C98A3A', secondary: '#2A1D12', accent: '#F6E7CF', sky: ['#33251a', '#0a0705'] },
};
const NEUTRAL: Palette = { primary: '#D4AF37', secondary: '#15171B', accent: '#F4E2A6', sky: ['#221d12', '#060606'] };

/** mots de la discipline, dans le style ou la description */
const DISCIPLINE_WORDS: [DisciplineId, RegExp][] = [
  ['muaythai', /muay|kru\b|nak muay/i],
  ['kickboxing', /kick[- ]?box/i],
  ['bjj', /jiu[- ]?jitsu|\bjjb\b|\bbjj\b/i],
  ['judo', /judo/i],
  ['mma', /\bmma\b|octogone|cage/i],
  ['boxe', /boxe anglaise|\bboxeu|\bboxe\b/i],
];
const DISCIPLINE_LABEL: Record<DisciplineId, string> = { boxe: 'boxe anglaise', kickboxing: 'kick-boxing', mma: 'MMA', muaythai: 'muay-thaï', bjj: 'jiu-jitsu brésilien', judo: 'judo' };
const FLOOR: Record<DisciplineId, FloorMotif> = { boxe: 'ring', kickboxing: 'ring', muaythai: 'ring', mma: 'octogone', bjj: 'tatami', judo: 'tatami' };

/** tempérament : mots du style, de la description et des spécialités (le premier trouvé dans l'ordre de priorité) */
const TEMPERAMENTS: [Temperament, RegExp][] = [
  ['explosif', /explosi|explose|éclat|fulgurant/i],
  ['puissant', /puissan|pression|fort\b|lourd|frappe fort/i],
  ['mobile', /rapide|mouvement|mobile|jeu de jambes|vitesse|léger|appuis/i],
  ['precis', /précis|chirurg|technique|lucide|lecture/i],
  ['calme', /calme|patien|vétéran|sang-froid|serein/i],
];
const SPEED = /rapide|vitesse|mouvement|jeu de jambes|contre/i;

const INTENSITY: Record<Temperament, CoachAtmosphere['lighting']['intensity']> = { explosif: 'intense', puissant: 'intense', mobile: 'cinematic', precis: 'cinematic', calme: 'soft', equilibre: 'cinematic' };
const SMOKE: Record<Temperament, CoachAtmosphere['atmosphere']['smoke']> = { explosif: 'dense', puissant: 'subtle', mobile: 'subtle', precis: 'subtle', calme: 'subtle', equilibre: 'subtle' };
const PACE: Record<Temperament, number> = { explosif: 1.5, puissant: 1.1, mobile: 1.6, precis: 0.9, calme: 0.6, equilibre: 1 };

/** surcharge manuelle par coach (facultative) : ce qui y figure remplace le calcul */
export interface AtmosphereOverride {
  palette?: Partial<Palette>;
  lighting?: Partial<Pick<CoachAtmosphere['lighting'], 'temperature' | 'intensity'>>;
  atmosphere?: Partial<CoachAtmosphere['atmosphere']>;
  environment?: string;
}
export const ATMOSPHERE_OVERRIDES: Record<string, AtmosphereOverride> = {};

// ---------------------------------------------------------------------------------------------------- couleurs

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
/** mélange de deux couleurs (t = part de b) */
export const mixColor = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
function rgbToHsl(h: string): [number, number, number] {
  const [r, g, b] = hex(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
/** tourne la teinte d'une couleur (degrés) */
export const shiftHue = (c: string, deg: number) => {
  const [h, s, l] = rgbToHsl(c);
  return hslToHex((((h + deg) % 360) + 360) % 360, s, l);
};
/** hachage stable d'une chaîne (FNV-1a 32 bits) */
export function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------------------------------- règles

function findDiscipline(c: AtmosphereInput, src: CoachAtmosphere['sources']): DisciplineId | null {
  if (c.discipline) {
    src.push({ field: 'discipline', value: c.discipline, rule: 'discipline indiquée dans la fiche du coach' });
    return c.discipline;
  }
  for (const [field, text] of [
    ['style', c.style],
    ['description', c.bio],
  ] as const) {
    if (!text) continue;
    for (const [d, re] of DISCIPLINE_WORDS)
      if (re.test(text)) {
        src.push({ field: field === 'style' ? 'discipline' : 'description', value: text, rule: `mot de la discipline « ${DISCIPLINE_LABEL[d]} » dans ${field === 'style' ? 'le style' : 'la description'}` });
        return d;
      }
  }
  const pre = /^(boxe|kickboxing|mma|muaythai|bjj|judo)-/.exec(c.id)?.[1] as DisciplineId | undefined;
  if (pre) {
    src.push({ field: 'discipline', value: c.id, rule: `identifiant du coach préfixé « ${pre} »` });
    return pre;
  }
  return null;
}

function findTemperament(c: AtmosphereInput, src: CoachAtmosphere['sources']): Temperament {
  // ordre de priorité : description, style, spécialités, garde
  const fields: [AtmosphereSourceField, string | undefined][] = [
    ['description', c.bio],
    ['style', c.style],
    ['specialites', c.strengths?.join(', ')],
    ['style', c.guard],
  ];
  // dans un même champ, le tempérament le plus marqué l'emporte (ordre de TEMPERAMENTS : explosif, puissant, mobile, précis, calme)
  for (const [field, text] of fields) {
    if (!text) continue;
    for (const [t, re] of TEMPERAMENTS) {
      const m = re.exec(text);
      if (m) {
        src.push({ field, value: text, rule: `tempérament « ${t} » (mot « ${m[0]} »)` });
        return t;
      }
    }
  }
  src.push({ field: 'defaut', value: '', rule: 'aucun mot de tempérament : équilibré' });
  return 'equilibre';
}

/** l'ambiance d'un coach, sans départage avec les autres (voir resolveAll) */
export function resolveCoachAtmosphere(c: AtmosphereInput): CoachAtmosphere {
  const sources: CoachAtmosphere['sources'] = [];
  const discipline = findDiscipline(c, sources);
  const animal = ANIMALS.find((a) => c.nickname && a.re.test(c.nickname)) ?? null;
  if (animal) sources.push({ field: 'surnom', value: c.nickname!, rule: `animal du surnom : ${animal.id} → emblème « ${animal.motif} »` });
  else sources.push({ field: 'defaut', value: c.nickname ?? '', rule: 'pas d’animal dans le surnom : monogramme et couleurs de la discipline' });
  const temperament = findTemperament(c, sources);
  const speed = [c.style, ...(c.strengths ?? [])].some((t) => t && SPEED.test(t));
  if (speed) sources.push({ field: 'specialites', value: [c.style, ...(c.strengths ?? [])].filter(Boolean).join(', '), rule: 'jeu rapide : traits de vitesse' });

  let palette: Palette = animal ? { ...animal.palette, sky: [...animal.palette.sky] as [string, string] } : discipline ? { ...DISCIPLINE_PALETTES[discipline] } : { ...NEUTRAL };
  // la discipline teinte légèrement le fond quand l'animal donne la palette (appoint, 15 %)
  if (animal && discipline) palette = { ...palette, sky: [mixColor(palette.sky[0], DISCIPLINE_PALETTES[discipline].sky[0], 0.15), palette.sky[1]] };
  const temperature = animal?.temperature ?? (discipline === 'muaythai' || discipline === 'judo' ? 'warm' : discipline === 'boxe' || discipline === 'bjj' ? 'cold' : 'neutral');
  const intensity = INTENSITY[temperament];
  const k = intensity === 'intense' ? 1.15 : intensity === 'soft' ? 0.85 : 1;
  const keyTint = temperature === 'warm' ? '#FFE6C8' : temperature === 'cold' ? '#E6EEFF' : '#FFF4EA';
  const floor = discipline ? FLOOR[discipline] : 'aucun';
  if (discipline) sources.push({ field: 'discipline', value: discipline, rule: `sol : ${floor === 'aucun' ? 'uni' : floor}` });

  const a: CoachAtmosphere = {
    coachId: c.id,
    discipline,
    environment: animal?.label ?? (discipline ? `Univers ${DISCIPLINE_LABEL[discipline]}` : 'Univers neutre'),
    identity: { animal: animal?.id ?? 'aucun', label: c.nickname ?? c.name },
    temperament,
    palette,
    lighting: {
      temperature,
      intensity,
      rimLight: true,
      // la lumière principale reste presque blanche : la couleur de l'univers passe par les contre-jours
      key: { color: keyTint, intensity: 2.6 * k, side: stableHash(c.id) % 2 ? 1 : -1 },
      fill: { color: mixColor('#DDE6FF', palette.secondary, 0.25), intensity: 0.55 },
      rim: { color: mixColor(palette.primary, '#FFFFFF', 0.25), intensity: 2.2 * k },
    },
    atmosphere: {
      smoke: SMOKE[temperament],
      floorReflection: temperament === 'calme' || temperament === 'precis' ? 'medium' : 'low',
      motif: animal?.motif ?? 'monogramme',
      eyes: animal?.eyes ?? null,
      streaks: speed,
      floor,
      pace: PACE[temperament],
    },
    sources,
  };
  return applyOverride(a, ATMOSPHERE_OVERRIDES[c.id]);
}

function applyOverride(a: CoachAtmosphere, o: AtmosphereOverride | undefined): CoachAtmosphere {
  if (!o) return a;
  a.sources.push({ field: 'surcharge', value: a.coachId, rule: 'surcharge manuelle' });
  return {
    ...a,
    environment: o.environment ?? a.environment,
    palette: { ...a.palette, ...o.palette },
    lighting: { ...a.lighting, ...o.lighting },
    atmosphere: { ...a.atmosphere, ...o.atmosphere },
  };
}

/** signature visuelle : deux coachs ne doivent pas la partager */
export const atmosphereSignature = (a: CoachAtmosphere) => `${a.atmosphere.motif}|${a.palette.primary}`;

/**
 * Les ambiances de tous les coachs, chacune unique : quand deux coachs tombent sur la même signature (même animal, ou même
 * discipline sans animal), le second voit ses couleurs tourner d'une teinte tirée de son identifiant (stable).
 */
export function resolveAll(coaches: AtmosphereInput[]): Map<string, CoachAtmosphere> {
  const out = new Map<string, CoachAtmosphere>();
  const seen = new Set<string>();
  for (const c of coaches) {
    let a = resolveCoachAtmosphere(c);
    let n = 0;
    while (seen.has(atmosphereSignature(a)) && n < 8) {
      n++;
      const deg = 25 + (stableHash(`${c.id}:${n}`) % 70);
      const p = a.palette;
      a = { ...a, palette: { primary: shiftHue(p.primary, deg), secondary: shiftHue(p.secondary, deg), accent: shiftHue(p.accent, deg), sky: [shiftHue(p.sky[0], deg), p.sky[1]] } };
      a.lighting = { ...a.lighting, rim: { ...a.lighting.rim, color: mixColor(a.palette.primary, '#FFFFFF', 0.25) } };
      a.sources.push({ field: 'defaut', value: c.id, rule: `palette déjà prise : teinte tournée de ${deg}°` });
    }
    seen.add(atmosphereSignature(a));
    out.set(c.id, a);
  }
  return out;
}

/** point d'entrée nommé de la demande (« CoachAtmosphereResolver ») */
export const CoachAtmosphereResolver = { resolve: resolveCoachAtmosphere, resolveAll, overrides: ATMOSPHERE_OVERRIDES } as const;
