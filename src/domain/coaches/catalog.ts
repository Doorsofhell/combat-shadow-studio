import { recommendedGear, type FighterLook, type Paint } from '../../editor/look';
import type { CoachId, DisciplineId } from '../types';
import { COACH_LOOKS } from './looks';
import { coachProfile } from './motion';

/**
 * The coaches of the app (0.24): Kadir and Amara, the first two champion-inspired coaches. The
 * user's coach choice keeps its stored value ('homme' | 'femme'), so no saved data changes: 'homme'
 * shows Kadir, 'femme' shows Amara. The real champions who inspired them are named in the design
 * documents only, never in the app.
 */
export interface ChampionCoach {
  id: string;
  coach: CoachId;
  name: string;
  nickname: string;
  /** one line for the coach card */
  style: string;
  /** a short presentation, fictional */
  bio: string;
  /** rendered from our own 3D model */
  portrait: string;
  /** 1.9 (back of the coach card): height of the 3D model, rounded; how the guard looks (src/domain/coaches/motion.ts) */
  height: string;
  guard: string;
  /** what the coach shows best, taken from the motion profile and the bio (no invented numbers) */
  strengths: string[];
  /** 1.13 (Youssef 2026-11-04, option B « écran de sélection »): weight of the 3D model in kg, from the volume of its
   * mesh at the density of the body (1,06); absent when it could not be measured */
  weightKg?: number;
  /** 1.13: style profile out of 10 for the selection screen's bars. Not a measure: read from the coach's style, guard
   * and strengths above (shown as « profil de style » in the app) */
  skills: Record<SkillId, number>;
}

/** 1.13: the bars of the selection screen, in their order */
export const SKILLS = [
  { id: 'poings', label: 'Poings' },
  { id: 'pieds', label: 'Pieds' },
  { id: 'lutte', label: 'Lutte' },
  { id: 'sol', label: 'Sol' },
  { id: 'vitesse', label: 'Vitesse' },
  { id: 'defense', label: 'Défense' },
  { id: 'endurance', label: 'Endurance' },
] as const;
export type SkillId = (typeof SKILLS)[number]['id'];
const sk = (poings: number, pieds: number, lutte: number, sol: number, vitesse: number, defense: number, endurance: number): Record<SkillId, number> => ({ poings, pieds, lutte, sol, vitesse, defense, endurance });

export const CHAMPIONS: Record<CoachId, ChampionCoach> = {
  homme: {
    id: 'mma-kadir',
    coach: 'homme',
    name: 'Kadir',
    nickname: 'L’Aigle',
    style: 'Lutteur patient, pression constante',
    bio: 'Garde basse, pas courts, changements de niveau : Kadir avance sans relâche et ne gaspille aucun geste.',
    portrait: './coaches/mma-kadir/portrait.webp',
    height: '1,80 m',
    guard: 'Basse, buste au-dessus des genoux, mains ouvertes devant pour saisir',
    strengths: ['Changements de niveau', 'Pression constante', 'Lutte et contrôle'],
    skills: sk(6, 5, 9, 8, 6, 7, 9),
    weightKg: 91,
  },
  femme: {
    id: 'mma-amara',
    coach: 'femme',
    name: 'Amara',
    nickname: 'La Lionne',
    style: 'Frappeuse puissante, garde haute',
    bio: 'Garde de face, poings fermés, droite chargée : Amara frappe fort et juste, puis enchaîne.',
    portrait: './coaches/mma-amara/portrait.webp',
    height: '1,73 m',
    guard: 'Haute et de profil, poings fermés, droite chargée',
    strengths: ['Puissance des frappes', 'Précision', 'Enchaînements'],
    skills: sk(9, 6, 5, 5, 7, 6, 7),
    weightKg: 61,
  },
};

/**
 * Coaches added to Kadir and Amara. 1.5 added Axel and Kaila (MakeHuman); 1.37 (Youssef, 2026-11-12: « supprime les
 * deux coachs qui ne sont pas faits en Microsoft ») removes them, their files are kept in « backup CS/ ». A profile
 * that chose one of them gets Kadir or Amara (championFor), see RETIRED_COACHES in src/store/profile.ts.
 */
export const EXTRA_COACHES: ChampionCoach[] = [
  // 1.11 (Youssef 2026-11-03 23:03: « créé 2 joueurs supplémentaires, ne remplace pas les autres, nomme-les
  // différemment, colore leurs vêtements différemment, même moteur 3D »): the Rocketbox sports bodies of Kadir and
  // Amara with a Rocketbox face grafted on (tools/generator/rocketbox/face_transfer.py), Rocketbox Male_Adult_07
  // for Naël (« Axel B » of the proposals page) and Female_Adult_01 for Inaya (« Kaila A »)
  {
    id: 'nael',
    coach: 'homme',
    name: 'Naël',
    nickname: 'Le Faucon',
    style: 'Contreur rapide, toujours en mouvement',
    bio: 'Appuis légers, main avant basse, regard qui guette : Naël laisse venir, esquive et répond aussitôt.',
    portrait: './coaches/nael/portrait.webp',
    height: '1,80 m',
    guard: 'Mobile, main avant basse, menton rentré derrière l’épaule',
    strengths: ['Contres', 'Jeu de jambes', 'Vitesse de bras'],
    skills: sk(8, 6, 5, 5, 9, 8, 7),
    weightKg: 87,
  },
  {
    id: 'inaya',
    coach: 'femme',
    name: 'Inaya',
    nickname: 'La Panthère',
    style: 'Explosive, coups de pied à distance',
    bio: 'De profil, sur l’avant des pieds, jambe avant légère : Inaya garde la distance et frappe des jambes avant d’entrer.',
    portrait: './coaches/inaya/portrait.webp',
    height: '1,73 m',
    guard: 'De profil, sur l’avant des pieds, mains hautes',
    strengths: ['Coups de pied', 'Gestion de la distance', 'Explosivité'],
    skills: sk(6, 9, 4, 4, 8, 7, 7),
    weightKg: 65,
  },
];

/** every coach, in the order of the choice screen */
export const ALL_COACHES: ChampionCoach[] = [CHAMPIONS.homme, EXTRA_COACHES[0], CHAMPIONS.femme, EXTRA_COACHES[1]];

export const championById = (id: string | null | undefined) => ALL_COACHES.find((c) => c.id === id);

/** the coach shown for a body type: the chosen coach when it has that body type, else Kadir or Amara */
export const championFor = (coach: CoachId | null | undefined, chosen?: string | null): ChampionCoach => {
  const sex: CoachId = coach === 'femme' ? 'femme' : 'homme';
  const c = championById(chosen);
  return c && c.coach === sex ? c : CHAMPIONS[sex];
};

/** the coach's own model, without extension */
export const championModel = (c: ChampionCoach) => `./coaches/${c.id}/model`;

/**
 * The coach dressed for a discipline: their own body, hair and colours, with the gear the rules of
 * the discipline call for (gloves, shorts, shin guards). Grappling has no gi yet: MMA shorts, bare hands.
 */
export function championLook(c: ChampionCoach, d: DisciplineId): FighterLook {
  const base = COACH_LOOKS[c.id];
  const g = recommendedGear(d);
  const shorts = d === 'mma' || d === 'bjj' || d === 'judo' ? 'short-mma-court' : g.bottom;
  const gloves: Paint = base.gear.handsPaint;
  return {
    ...base,
    outfit: { ...base.outfit, bottom: shorts, shoes: g.shoes, shoesPaint: { color: '#16171a', color2: '#2a2b30', pattern: 'uni' } },
    gear: {
      ...base.gear,
      hands: g.hands,
      handsPaint: g.hands === 'bandes' ? { color: '#ece8df', color2: '#ece8df', pattern: 'uni' } : gloves,
      shins: g.shins,
      shinsPaint: { color: '#16171a', color2: base.outfit.bottomPaint.color2, pattern: 'uni' },
      feet: g.feet,
      feetPaint: { color: '#16171a', color2: '#16171a', pattern: 'uni' },
    },
  };
}

/** the coach's own guard is an MMA guard (open hands for Kadir): the other disciplines keep their rules */
export const championStance = (c: ChampionCoach, d: DisciplineId) => (d === 'mma' ? coachProfile(c.id) : undefined);
