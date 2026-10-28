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
}

export const CHAMPIONS: Record<CoachId, ChampionCoach> = {
  homme: {
    id: 'mma-kadir',
    coach: 'homme',
    name: 'Kadir',
    nickname: 'L’Aigle',
    style: 'Lutteur patient, pression constante',
    bio: 'Garde basse, pas courts, changements de niveau : Kadir avance sans relâche et ne gaspille aucun geste.',
    portrait: './coaches/mma-kadir/portrait.webp',
  },
  femme: {
    id: 'mma-amara',
    coach: 'femme',
    name: 'Amara',
    nickname: 'La Lionne',
    style: 'Frappeuse puissante, garde haute',
    bio: 'Garde de face, poings fermés, droite chargée : Amara frappe fort et juste, puis enchaîne.',
    portrait: './coaches/mma-amara/portrait.webp',
  },
};

/**
 * 1.5 (Youssef 2026-10-28: « 2 coachs supplémentaires mieux aboutis », built from MakeHuman, all assets CC0, see
 * tools/generator/makehuman): Axel and Kaila. The stored coach stays 'homme' | 'femme' (the body type the rest of the app
 * reads); the profile's `champion` names which coach of that body type is shown.
 */
export const EXTRA_COACHES: ChampionCoach[] = [
  {
    id: 'axel',
    coach: 'homme',
    name: 'Axel',
    nickname: 'Aura-Stone',
    style: 'Frappeur longiligne, regard de pierre',
    bio: 'Grand, sec, posture droite et bras relâchés : Axel ne gaspille rien et frappe de loin, sans prévenir.',
    portrait: './coaches/axel/portrait.webp',
  },
  {
    id: 'kaila',
    coach: 'femme',
    name: 'Kaila',
    nickname: 'La Valkyrie',
    style: 'Puissante et compacte, toujours vers l’avant',
    bio: 'Centre de gravité bas, mains ouvertes prêtes à saisir : Kaila avance sans cesse et impose son rythme.',
    portrait: './coaches/kaila/portrait.webp',
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
