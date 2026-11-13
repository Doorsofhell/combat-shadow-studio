import type { DisciplineId, LevelId, Program, ProgramBlock, ProgramObjective, ProgramSession, ProgramSourceRef } from './types';

/**
 * v0.41 (Youssef, 2026-10-22, « Enrichissement des programmes »): the programmes added to the first ten. Each one is
 * written as a recipe of real exercises of the catalogue (src/domain/exercises.ts), chosen by hand for its discipline,
 * level and objective; `buildProgram` turns it into one session per week. Each week plays its own exercises
 * (the pools rotate) with more work: one more round, longer rounds, shorter rests, within the limits of the level.
 *
 * All are original programmes (no federation publishes a programme that could be reproduced, see programSources.ts),
 * built on two principles taken from the sources: technique first at low speed, then volume, then intensity; and,
 * for judo and jiu-jitsu, only solo work (footwork, entries without a throw, low breakfalls on a mat, mobility).
 */

export interface ProgramRecipe {
  id: string;
  name: string;
  discipline: DisciplineId;
  level: LevelId;
  objective: ProgramObjective;
  description: string;
  goals: string[];
  perWeek: number;
  weeks?: number;
  warm: string;
  cool: string;
  /** technique, defence or footwork exercises, two per session, rotating */
  main: string[];
  /** combinations, one in the first week then two, rotating */
  combos?: string[];
  /** a cardio or round exercise, from the second week */
  finisher?: string[];
  prerequisites?: string[];
  equipment?: string[];
  safety?: string[];
}

/** seconds: work of a main block, rest between its rounds, and the shortest rest the level allows */
const LEVEL_LOAD: Record<LevelId, { work: number; rest: number; minRest: number; finisher: number }> = {
  debutant: { work: 60, rest: 30, minRest: 20, finisher: 120 },
  intermediaire: { work: 90, rest: 30, minRest: 20, finisher: 150 },
  avance: { work: 120, rest: 40, minRest: 30, finisher: 180 },
  expert: { work: 150, rest: 60, minRest: 45, finisher: 180 },
};

const FOCUS = [
  'Découverte : vitesse lente, la forme avant tout.',
  'Volume : un round de plus, et une deuxième combinaison.',
  'Intensité : des rounds plus longs, des repos plus courts.',
  'Consolidation : tout enchaîner sans perdre la forme.',
];

const pick = <T,>(pool: readonly T[], start: number, n: number) => Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(start + i) % pool.length]);

export function buildSessions(r: ProgramRecipe, nameOf: (exerciseId: string) => string): ProgramSession[] {
  const L = LEVEL_LOAD[r.level];
  const weeks = r.weeks ?? 4;
  const b = (exercise: string, phase: ProgramBlock['phase'], work: number, rounds: number, rest: number): ProgramBlock => ({ label: nameOf(exercise), phase, exercise, work, rounds, rest });
  return Array.from({ length: weeks }, (_, w) => {
    const rest = Math.max(L.minRest, L.rest - 5 * w);
    const blocks: ProgramBlock[] = [b(r.warm, 'echauffement', r.level === 'debutant' ? 60 : 90, w === 0 ? 1 : 2, 20)];
    for (const id of pick(r.main, w * 2, 2)) blocks.push(b(id, 'technique', L.work + 15 * Math.min(w, 3), 2 + (w >= 2 ? 1 : 0), rest));
    if (r.combos?.length) for (const id of pick(r.combos, w, w === 0 ? 1 : 2)) blocks.push(b(id, 'combinaisons', L.work + 30 + 15 * Math.min(w, 2), 2 + (w >= 1 ? 1 : 0), rest + 10));
    if (r.finisher?.length && w >= 1) {
      const id = r.finisher[(w - 1) % r.finisher.length];
      blocks.push(b(id, 'cardio', L.finisher, w >= 3 ? 2 : 1, 60));
    }
    blocks.push(b(r.cool, 'recuperation', 60, 1, 0));
    return { week: w + 1, focus: FOCUS[Math.min(w, FOCUS.length - 1)], blocks };
  });
}

// ------------------------------------------------------------------------------------------------ shared texts

const STRIKE_EQUIP = ['Aucun matériel : un espace dégagé de 2 m × 2 m', 'Bandes et gants facultatifs (le travail reste dans le vide)'];
const MAT_EQUIP = ['Un tapis épais (chutes et travail au sol)', 'Un espace dégagé de 2 m × 3 m'];
const MMA_EQUIP = ['Un espace dégagé de 2 m × 3 m', 'Un tapis conseillé pour le sprawl et le sol'];

const SAFETY_STRIKE = [
  'Échauffe-toi avant de frapper vite ; ne verrouille jamais le coude ni le genou en fin de coup.',
  'Arrête en cas de douleur articulaire ; un essoufflement fort est le signal de ralentir.',
];
const SAFETY_MAT = [
  'Chutes en version basse uniquement, sur un tapis épais ; le menton reste rentré.',
  'Ce programme complète le club ou le dojo : les projections et le travail avec partenaire s’apprennent avec un enseignant.',
];
const SAFETY_MMA = ['Sprawl et descentes au sol sur un tapis ; les genoux ne tombent jamais sur un sol dur.', ...SAFETY_STRIKE];

const PREREQ: Record<LevelId, string[]> = {
  debutant: ['Aucun : le programme part de la garde.'],
  intermediaire: ['Tenir la garde et revenir en garde après chaque coup, sans y penser.', 'Avoir suivi le programme débutant de la discipline, ou un équivalent en club.'],
  avance: ['Enchaîner les combinaisons intermédiaires à vitesse 0,8 en gardant la forme.', 'Une condition physique qui permet des rounds de 2 minutes.'],
  expert: ['Les combinaisons avancées coulent à vitesse 1.', 'Une condition physique qui permet des rounds de 3 minutes.'],
};

const SRC: Record<DisciplineId, ProgramSourceRef[]> = {
  boxe: [
    { id: 'boxe-S2', usage: 'Ordre d’apprentissage : garde, pas, directs, crochets, uppercuts, défenses.' },
    { id: 'boxe-S1', usage: 'Contenu technique de base : garde, pas, coups, défenses, feintes.' },
    { id: 'prog-EB', usage: 'Format de référence du round amateur : trois minutes.' },
  ],
  kickboxing: [
    { id: 'kbmt-S15', usage: 'Techniques autorisées en low kick.' },
    { id: 'kbmt-S16', usage: 'Techniques autorisées en K1 (genoux).' },
    { id: 'prog-WAKO', usage: 'Règlements de la fédération internationale.' },
  ],
  mma: [
    { id: 'mma-S13', usage: 'Le sprawl : principe et placement.' },
    { id: 'mma-S15', usage: 'Défense contre les amenées au sol, debout.' },
    { id: 'mma-S26', usage: 'Risques des chutes et de la lutte : travail sur tapis.' },
  ],
  muaythai: [
    { id: 'kbmt-S30', usage: 'Défenses thaï : check, garde longue, rattrapage.' },
    { id: 'kbmt-S28', usage: 'Le coup de pied circulaire.' },
  ],
  judo: [
    { id: 'jb-S5', usage: 'Déplacements, saisies et entrées des techniques travaillées en solo.' },
    { id: 'jb-S11', usage: 'Progression des chutes (couché, assis, accroupi) et sécurité.' },
    { id: 'prog-IJF', usage: 'Classification des techniques (annonce seulement).' },
  ],
  bjj: [
    { id: 'jb-S51', usage: 'Exercices solo : chutes assises, relevé, sit-out, entrées de lutte.' },
    { id: 'jb-S52', usage: 'Le sit-out : mécanique et erreurs.' },
    { id: 'prog-IBJJF', usage: 'Système de grades (présentation seulement).' },
  ],
};

export const disciplineDefaults = (d: DisciplineId) => ({
  equipment: d === 'judo' || d === 'bjj' ? MAT_EQUIP : d === 'mma' ? MMA_EQUIP : STRIKE_EQUIP,
  safety: d === 'judo' || d === 'bjj' ? SAFETY_MAT : d === 'mma' ? SAFETY_MMA : SAFETY_STRIKE,
  sources: SRC[d],
});
export const levelPrerequisites = (l: LevelId) => PREREQ[l];

// ------------------------------------------------------------------------------------------------ recipes

export const PROGRAM_RECIPES: ProgramRecipe[] = [
  // ------------------------------------------------------------------ boxe anglaise
  {
    id: 'boxe-defense-deplacements-debutant', name: 'Boxe anglaise - Bouger et se protéger', discipline: 'boxe', level: 'debutant', objective: 'defense', perWeek: 2,
    description: 'Les pas et les premières défenses, avant de chercher la vitesse : avancer, reculer, sortir sur le côté, bloquer et esquiver en restant en garde.',
    goals: ['Des pas courts, sans croiser les pieds', 'Bloquer et esquiver en gardant les yeux sur l’adversaire'],
    warm: 'boxe-debutant-06', cool: 'boxe-debutant-01', main: ['boxe-debutant-07', 'boxe-debutant-10', 'boxe-debutant-11', 'boxe-debutant-06'], combos: ['boxe-debutant-12', 'boxe-debutant-08'],
  },
  {
    id: 'boxe-enchainements-intermediaire', name: 'Boxe anglaise - Combinaisons de trois et quatre coups', discipline: 'boxe', level: 'intermediaire', objective: 'enchainements', perWeek: 3,
    description: 'Les combinaisons classiques à trois et quatre coups, tête et corps, avec le retour en garde après chaque série.',
    goals: ['Enchaîner sans pause entre les coups', 'Revenir en garde après chaque série'],
    warm: 'boxe-debutant-12', cool: 'boxe-debutant-01', main: ['boxe-intermediaire-09', 'boxe-intermediaire-13'], combos: ['boxe-intermediaire-01', 'boxe-intermediaire-02', 'boxe-intermediaire-04', 'boxe-intermediaire-05', 'boxe-intermediaire-06', 'boxe-intermediaire-11'],
  },
  {
    id: 'boxe-defense-contre-intermediaire', name: 'Boxe anglaise - Défendre et contrer', discipline: 'boxe', level: 'intermediaire', objective: 'defense', perWeek: 2,
    description: 'Parades, roll, retrait et shoulder roll, chaque fois suivis d’un contre : la défense devient le début de l’attaque.',
    goals: ['Une défense qui finit toujours par un contre', 'Rester en équilibre pendant le roll'],
    warm: 'boxe-debutant-07', cool: 'boxe-debutant-01', main: ['boxe-intermediaire-07', 'boxe-intermediaire-08', 'boxe-intermediaire-10', 'boxe-intermediaire-12'], combos: ['boxe-intermediaire-03', 'boxe-intermediaire-13'],
  },
  {
    id: 'boxe-angles-avance', name: 'Boxe anglaise - Angles et pivots', discipline: 'boxe', level: 'avance', objective: 'deplacements', perWeek: 2,
    description: 'Sortir de la ligne après avoir frappé : pivots, sorties d’angle et combinaisons qui finissent sur le côté.',
    goals: ['Finir chaque série hors de la ligne d’attaque', 'Pivoter sur l’avant du pied, sans perdre la garde'],
    warm: 'boxe-intermediaire-09', cool: 'boxe-debutant-01', main: ['boxe-avance-09', 'boxe-intermediaire-09', 'boxe-avance-05'], combos: ['boxe-avance-03', 'boxe-avance-06', 'boxe-avance-01'],
  },
  {
    id: 'boxe-combinaisons-avance', name: 'Boxe anglaise - Combinaisons avancées', discipline: 'boxe', level: 'avance', objective: 'enchainements', perWeek: 3,
    description: 'Des combinaisons de quatre et cinq coups avec feintes, uppercuts et défenses glissées entre les coups.',
    goals: ['Changer de niveau (corps, tête) dans la même série', 'Une feinte qui ressemble au vrai coup'],
    warm: 'boxe-intermediaire-01', cool: 'boxe-debutant-01', main: ['boxe-avance-12', 'boxe-avance-08'], combos: ['boxe-avance-02', 'boxe-avance-04', 'boxe-avance-07', 'boxe-avance-10', 'boxe-avance-13', 'boxe-avance-01'],
  },
  {
    id: 'boxe-endurance-avance', name: 'Boxe anglaise - Endurance du boxeur', discipline: 'boxe', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Tenir le rythme sur la durée : combinaisons longues puis un bloc cardio, en gardant des coups propres quand la fatigue arrive.',
    goals: ['Garder des coups précis en fin de séance', 'Respirer pendant les combinaisons'],
    warm: 'boxe-intermediaire-01', cool: 'boxe-debutant-01', main: ['boxe-avance-08', 'boxe-avance-05'], combos: ['boxe-avance-02', 'boxe-avance-04', 'boxe-avance-06'], finisher: ['boxe-avance-11'],
  },
  {
    id: 'boxe-rounds-expert', name: 'Boxe anglaise - Rounds d’expert', discipline: 'boxe', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Des séries de six à dix coups, des changements de rythme et des rounds complets de trois minutes.',
    goals: ['Des séries longues sans baisser les mains', 'Varier le rythme dans un même round'],
    warm: 'boxe-avance-09', cool: 'boxe-debutant-01', main: ['boxe-expert-04', 'boxe-expert-10', 'boxe-expert-06'], combos: ['boxe-expert-01', 'boxe-expert-05', 'boxe-expert-07', 'boxe-expert-02', 'boxe-expert-03'], finisher: ['boxe-expert-08', 'boxe-expert-09'],
  },
  // ------------------------------------------------------------------ kick-boxing
  {
    id: 'kick-fondamentaux-debutant', name: 'Kick-boxing - Fondamentaux', discipline: 'kickboxing', level: 'debutant', objective: 'bases', perWeek: 3,
    description: 'La garde, les poings et les coups de pied de base, un par un, puis les premières combinaisons poings-pieds.',
    goals: ['Des coups de pied qui pivotent sur le pied d’appui', 'Revenir en garde après chaque coup de pied'],
    warm: 'kickboxing-debutant-11', cool: 'kickboxing-debutant-01', main: ['kickboxing-debutant-02', 'kickboxing-debutant-03', 'kickboxing-debutant-04', 'kickboxing-debutant-05', 'kickboxing-debutant-06', 'kickboxing-debutant-07'], combos: ['kickboxing-debutant-10', 'kickboxing-debutant-09'],
  },
  {
    id: 'kick-defense-intermediaire', name: 'Kick-boxing - Défenses et contres', discipline: 'kickboxing', level: 'intermediaire', objective: 'defense', perWeek: 2,
    description: 'Check du low kick, blocages et retraits de buste, chacun suivi d’un retour en attaque.',
    goals: ['Un check réflexe sur le low kick', 'Contrer juste après la défense'],
    warm: 'kickboxing-debutant-11', cool: 'kickboxing-debutant-01', main: ['kickboxing-debutant-08', 'kickboxing-intermediaire-07', 'kickboxing-intermediaire-08', 'kickboxing-intermediaire-05'], combos: ['kickboxing-intermediaire-05', 'kickboxing-intermediaire-03'],
  },
  {
    id: 'kick-distance-intermediaire', name: 'Kick-boxing - Gestion de la distance', discipline: 'kickboxing', level: 'intermediaire', objective: 'deplacements', perWeek: 2,
    description: 'Entrer et sortir de la distance des pieds à celle des poings, avec le front kick pour garder l’adversaire loin.',
    goals: ['Choisir pieds ou poings selon la distance', 'Entrer et sortir sans rester devant'],
    warm: 'kickboxing-debutant-11', cool: 'kickboxing-debutant-01', main: ['kickboxing-intermediaire-09', 'kickboxing-debutant-04', 'kickboxing-debutant-11'], combos: ['kickboxing-intermediaire-06', 'kickboxing-intermediaire-02', 'kickboxing-intermediaire-04'],
  },
  {
    id: 'kick-genoux-k1-intermediaire', name: 'Kick-boxing - Genoux et switch kick (K1)', discipline: 'kickboxing', level: 'intermediaire', objective: 'technique', perWeek: 2,
    description: 'Les armes propres au K1 : genou direct, genou circulaire et switch kick, puis leurs combinaisons avec les poings. À éviter si tu t’entraînes pour le full contact ou le low kick, qui n’autorisent pas les genoux.',
    goals: ['Des genoux qui montent avec les hanches', 'Un switch kick sans signal'],
    warm: 'kickboxing-debutant-11', cool: 'kickboxing-debutant-01', main: ['kickboxing-debutant-12', 'kickboxing-intermediaire-12', 'kickboxing-intermediaire-14'], combos: ['kickboxing-debutant-13', 'kickboxing-intermediaire-13'],
  },
  {
    id: 'kick-enchainements-avance', name: 'Kick-boxing - Enchaînements poings-pieds', discipline: 'kickboxing', level: 'avance', objective: 'enchainements', perWeek: 3,
    description: 'Des combinaisons de quatre et cinq coups qui mélangent poings, low, middle et high kicks, avec les défenses entre les séries.',
    goals: ['Finir les combinaisons par un coup de pied', 'Changer de cible dans la même série'],
    warm: 'kickboxing-intermediaire-09', cool: 'kickboxing-debutant-01', main: ['kickboxing-avance-05', 'kickboxing-avance-08'], combos: ['kickboxing-avance-01', 'kickboxing-avance-02', 'kickboxing-avance-03', 'kickboxing-avance-04', 'kickboxing-avance-06', 'kickboxing-avance-09', 'kickboxing-avance-10'],
  },
  {
    id: 'kick-endurance-avance', name: 'Kick-boxing - Endurance poings-pieds', discipline: 'kickboxing', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Des combinaisons puis un bloc cardio : garder des coups de pied hauts et propres quand la fatigue arrive.',
    goals: ['Des coups de pied précis en fin de séance', 'Revenir en garde même fatigué'],
    warm: 'kickboxing-intermediaire-09', cool: 'kickboxing-debutant-01', main: ['kickboxing-avance-07', 'kickboxing-avance-05'], combos: ['kickboxing-avance-01', 'kickboxing-avance-03', 'kickboxing-avance-06'], finisher: ['kickboxing-avance-11'],
  },
  {
    id: 'kick-rounds-expert', name: 'Kick-boxing - Rounds d’expert', discipline: 'kickboxing', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Des séries de six à dix mouvements, des rythmes cassés et des rounds techniques et cardio.',
    goals: ['Des séries longues sans perdre l’équilibre', 'Casser le rythme sans baisser la garde'],
    warm: 'kickboxing-avance-07', cool: 'kickboxing-debutant-01', main: ['kickboxing-expert-04', 'kickboxing-expert-15', 'kickboxing-expert-06', 'kickboxing-expert-10'], combos: ['kickboxing-expert-01', 'kickboxing-expert-05', 'kickboxing-expert-11', 'kickboxing-expert-02', 'kickboxing-expert-13', 'kickboxing-expert-07'], finisher: ['kickboxing-expert-08', 'kickboxing-expert-09'],
  },
  // ------------------------------------------------------------------ MMA
  {
    id: 'mma-fondamentaux-debutant', name: 'MMA - Fondamentaux debout', discipline: 'mma', level: 'debutant', objective: 'bases', perWeek: 3,
    description: 'La garde de MMA, les poings, le low kick et le changement de niveau, puis la première combinaison.',
    goals: ['Une garde plus basse et plus large qu’en boxe', 'Changer de niveau en gardant le dos droit'],
    warm: 'mma-debutant-11', cool: 'mma-debutant-01', main: ['mma-debutant-02', 'mma-debutant-03', 'mma-debutant-04', 'mma-debutant-05'], combos: ['mma-debutant-08'],
  },
  {
    id: 'mma-defense-lutte-debutant', name: 'MMA - Défendre l’entrée en lutte', discipline: 'mma', level: 'debutant', objective: 'defense', perWeek: 2,
    description: 'Les réflexes debout contre une entrée en lutte : défense des mains, sprawl, descente au sol et relevé.',
    goals: ['Un sprawl qui part vite, hanches vers le sol', 'Te relever proprement après une descente'],
    warm: 'mma-debutant-11', cool: 'mma-debutant-01', main: ['mma-debutant-07', 'mma-debutant-06', 'mma-debutant-10', 'mma-debutant-05'], combos: ['mma-debutant-09'],
  },
  {
    id: 'mma-enchainements-intermediaire', name: 'MMA - Frappes et feintes de lutte', discipline: 'mma', level: 'intermediaire', objective: 'enchainements', perWeek: 3,
    description: 'Des combinaisons qui mélangent poings, coups de pied et feintes de lutte, pour cacher l’entrée.',
    goals: ['Une feinte de lutte crédible', 'Sortir d’angle après la série'],
    warm: 'mma-debutant-11', cool: 'mma-debutant-01', main: ['mma-intermediaire-09', 'mma-debutant-05'], combos: ['mma-intermediaire-01', 'mma-intermediaire-02', 'mma-intermediaire-03', 'mma-intermediaire-04', 'mma-intermediaire-07', 'mma-intermediaire-10', 'mma-intermediaire-11'],
  },
  {
    id: 'mma-entrees-sol-intermediaire', name: 'MMA - Entrées et mobilité au sol', discipline: 'mma', level: 'intermediaire', objective: 'mobilite', perWeek: 2,
    description: 'Entrée en single-leg en solo, sit-out, mobilité au sol et retour debout, sur un tapis.',
    goals: ['Entrer bas, tête haute', 'Revenir debout en te protégeant'],
    warm: 'mma-debutant-11', cool: 'mma-debutant-01', main: ['mma-intermediaire-12', 'mma-intermediaire-08', 'mma-intermediaire-13', 'mma-debutant-10'], combos: ['mma-intermediaire-05'],
  },
  {
    id: 'mma-defense-lutte-avance', name: 'MMA - Défense de lutte et contre', discipline: 'mma', level: 'avance', objective: 'defense', perWeek: 2,
    description: 'Double sprawl, défense de lutte suivie d’un coup de pied, retour debout depuis le sol, puis des combinaisons qui finissent en défense.',
    goals: ['Enchaîner deux sprawls sans t’arrêter', 'Contrer dès que tu es revenu debout'],
    warm: 'mma-avance-09', cool: 'mma-debutant-01', main: ['mma-avance-05', 'mma-avance-08', 'mma-avance-06'], combos: ['mma-avance-01', 'mma-avance-03', 'mma-avance-13'],
  },
  {
    id: 'mma-endurance-avance', name: 'MMA - Endurance', discipline: 'mma', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Des combinaisons debout puis un bloc cardio qui mêle frappes, sprawls et descentes.',
    goals: ['Des sprawls rapides même en fin de séance', 'Respirer pendant les combinaisons'],
    warm: 'mma-avance-09', cool: 'mma-debutant-01', main: ['mma-avance-09', 'mma-avance-05'], combos: ['mma-avance-04', 'mma-avance-10', 'mma-avance-02'], finisher: ['mma-avance-11'],
  },
  {
    id: 'mma-rounds-expert', name: 'MMA - Rounds d’expert', discipline: 'mma', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Des séquences longues debout-lutte-sol et des rounds techniques et cardio.',
    goals: ['Passer du debout au sol et revenir sans pause', 'Des séries de huit mouvements propres'],
    warm: 'mma-avance-09', cool: 'mma-debutant-01', main: ['mma-expert-03', 'mma-expert-04', 'mma-expert-06'], combos: ['mma-expert-01', 'mma-expert-05', 'mma-expert-11', 'mma-expert-02', 'mma-expert-10', 'mma-expert-07'], finisher: ['mma-expert-08', 'mma-expert-09'],
  },
  // ------------------------------------------------------------------ muay-thaï
  {
    id: 'muay-defense-intermediaire', name: 'Muay-thaï - Défenses thaï', discipline: 'muaythai', level: 'intermediaire', objective: 'defense', perWeek: 2,
    description: 'Check, garde longue et rattrapage du middle kick, chacun suivi d’un contre.',
    goals: ['Un check qui part tout seul', 'Contrer juste après avoir défendu'],
    warm: 'muaythai-debutant-01', cool: 'muaythai-debutant-01', main: ['muaythai-debutant-09', 'muaythai-intermediaire-12', 'muaythai-intermediaire-13'], combos: ['muaythai-intermediaire-05'],
  },
  {
    id: 'muay-coudes-genoux-intermediaire', name: 'Muay-thaï - Coudes et genoux', discipline: 'muaythai', level: 'intermediaire', objective: 'technique', perWeek: 2,
    description: 'Les armes courtes : coudes horizontal, diagonal et remontant, genoux direct et circulaire, puis le clinch simulé.',
    goals: ['Des coudes courts, la main opposée en garde', 'Des genoux qui montent avec les hanches'],
    warm: 'muaythai-debutant-01', cool: 'muaythai-debutant-01', main: ['muaythai-debutant-07', 'muaythai-debutant-08', 'muaythai-intermediaire-06', 'muaythai-intermediaire-07', 'muaythai-intermediaire-08'], combos: ['muaythai-intermediaire-03', 'muaythai-intermediaire-04', 'muaythai-intermediaire-09'],
  },
  {
    id: 'muay-enchainements-intermediaire', name: 'Muay-thaï - Combinaisons poings-pieds', discipline: 'muaythai', level: 'intermediaire', objective: 'enchainements', perWeek: 3,
    description: 'Teep, poings et coups de pied dans les combinaisons de base du muay-thaï.',
    goals: ['Finir les poings par un coup de pied', 'Un teep qui ouvre la distance'],
    warm: 'muaythai-debutant-01', cool: 'muaythai-debutant-01', main: ['muaythai-intermediaire-11', 'muaythai-debutant-04'], combos: ['muaythai-intermediaire-01', 'muaythai-intermediaire-02', 'muaythai-intermediaire-10', 'muaythai-intermediaire-04'],
  },
  {
    id: 'muay-enchainements-avance', name: 'Muay-thaï - Combinaisons avancées', discipline: 'muaythai', level: 'avance', objective: 'enchainements', perWeek: 3,
    description: 'Poings, pieds, genoux et coudes dans des séries de trois et quatre coups, avec le switch kick.',
    goals: ['Utiliser les quatre armes dans une même série', 'Un switch kick sans signal'],
    warm: 'muaythai-avance-10', cool: 'muaythai-debutant-01', main: ['muaythai-avance-12', 'muaythai-avance-07'], combos: ['muaythai-avance-01', 'muaythai-avance-05', 'muaythai-avance-06', 'muaythai-avance-08', 'muaythai-avance-09', 'muaythai-avance-13'],
  },
  {
    id: 'muay-endurance-avance', name: 'Muay-thaï - Endurance', discipline: 'muaythai', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Pression vers l’avant, défenses et combinaisons, puis un bloc cardio thaï.',
    goals: ['Avancer en frappant sans t’épuiser', 'Des middles des deux côtés jusqu’à la fin'],
    warm: 'muaythai-avance-10', cool: 'muaythai-debutant-01', main: ['muaythai-avance-10', 'muaythai-avance-03'], combos: ['muaythai-avance-06', 'muaythai-avance-01'], finisher: ['muaythai-avance-11'],
  },
  {
    id: 'muay-rounds-expert', name: 'Muay-thaï - Rounds d’expert', discipline: 'muaythai', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Combinaisons longues, rythme thaï, défense complète et rounds technique et puissance.',
    goals: ['Des séries de six à dix mouvements', 'Garder le rythme thaï tout le round'],
    warm: 'muaythai-avance-10', cool: 'muaythai-debutant-01', main: ['muaythai-expert-03', 'muaythai-expert-07'], combos: ['muaythai-expert-01', 'muaythai-expert-06', 'muaythai-expert-10', 'muaythai-expert-11', 'muaythai-expert-05'], finisher: ['muaythai-expert-08', 'muaythai-expert-09'],
  },
  // ------------------------------------------------------------------ judo (solo)
  {
    id: 'judo-deplacements-debutant', name: 'Judo - Déplacements (ashi-sabaki)', discipline: 'judo', level: 'debutant', objective: 'deplacements', perWeek: 3,
    description: 'Posture naturelle, tsugi-ashi, ayumi-ashi et tai-sabaki : se déplacer sans croiser les pieds, avant toute entrée.',
    goals: ['Des pieds qui glissent, sans croiser', 'Pivoter (tai-sabaki) en restant équilibré'],
    warm: 'judo-debutant-02', cool: 'judo-debutant-01', main: ['judo-debutant-02', 'judo-debutant-03', 'judo-debutant-05', 'judo-debutant-04'],
  },
  {
    id: 'judo-ukemi-intermediaire', name: 'Judo - Chutes basses', discipline: 'judo', level: 'intermediaire', objective: 'bases', perWeek: 2,
    description: 'Ushiro-ukemi et yoko-ukemi en version basse, sur un tapis épais, avec la garde et les déplacements autour.',
    goals: ['Menton rentré, frappe du bras à 45°', 'Des chutes basses, sans à-coup'],
    warm: 'judo-debutant-02', cool: 'judo-debutant-01', main: ['judo-debutant-07', 'judo-intermediaire-07', 'judo-debutant-06', 'judo-debutant-04'],
  },
  {
    id: 'judo-uchikomi-intermediaire', name: 'Judo - Uchikomi en solo', discipline: 'judo', level: 'intermediaire', objective: 'technique', perWeek: 2,
    description: 'Le déséquilibre (kuzushi) puis les entrées de seoi-nage, o-goshi et o-soto-gari, sans projection.',
    goals: ['Déséquilibrer avant d’entrer', 'Des entrées genoux fléchis, dos droit'],
    warm: 'judo-debutant-02', cool: 'judo-debutant-01', main: ['judo-intermediaire-01', 'judo-intermediaire-02', 'judo-intermediaire-05', 'judo-intermediaire-06'], combos: ['judo-intermediaire-03', 'judo-intermediaire-08'],
  },
  {
    id: 'judo-kuzushi-avance', name: 'Judo - Déséquilibres et entrées', discipline: 'judo', level: 'avance', objective: 'enchainements', perWeek: 2,
    description: 'Les fauchages intérieurs et des séquences marcher, saisir, déséquilibrer, entrer.',
    goals: ['Lier le déplacement et l’entrée', 'Enchaîner deux fauchages'],
    warm: 'judo-intermediaire-04', cool: 'judo-debutant-01', main: ['judo-avance-05', 'judo-avance-06'], combos: ['judo-avance-01', 'judo-avance-02', 'judo-avance-04', 'judo-avance-07', 'judo-avance-08'],
  },
  {
    id: 'judo-endurance-avance', name: 'Judo - Endurance d’uchikomi', discipline: 'judo', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Des séquences d’entrées puis des séries d’uchikomi, pour tenir le rythme sans perdre la forme.',
    goals: ['Des entrées propres même fatigué', 'Garder le dos droit jusqu’à la dernière'],
    warm: 'judo-intermediaire-04', cool: 'judo-debutant-01', main: ['judo-intermediaire-04', 'judo-avance-05'], combos: ['judo-avance-02', 'judo-avance-08'], finisher: ['judo-avance-03'],
  },
  {
    id: 'judo-rounds-expert', name: 'Judo - Rounds d’expert en solo', discipline: 'judo', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Déplacements et entrées enchaînés, chutes basses enchaînées et rounds d’uchikomi.',
    goals: ['Des rounds complets sans perdre l’équilibre', 'Des chutes enchaînées, toujours basses'],
    warm: 'judo-intermediaire-04', cool: 'judo-debutant-01', main: ['judo-expert-05', 'judo-intermediaire-04'], combos: ['judo-expert-02'], finisher: ['judo-expert-01', 'judo-expert-04', 'judo-expert-03'],
  },
  // ------------------------------------------------------------------ jiu-jitsu brésilien (solo)
  {
    id: 'bjj-bases-debutant', name: 'Jiu-jitsu brésilien - Mouvements de base', discipline: 'bjj', level: 'debutant', objective: 'bases', perWeek: 3,
    description: 'Les mouvements solo que tout pratiquant répète : posture, pont, sortie de hanche, changement de base, sit-out, chute et relevé.',
    goals: ['Un pont qui part des pieds', 'Une sortie de hanche qui éloigne vraiment les hanches'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-debutant-03', 'bjj-debutant-04', 'bjj-debutant-05', 'bjj-debutant-06', 'bjj-debutant-07', 'bjj-debutant-08', 'bjj-debutant-02'],
  },
  {
    id: 'bjj-garde-sorties-intermediaire', name: 'Jiu-jitsu brésilien - Garde et sorties', discipline: 'bjj', level: 'intermediaire', objective: 'technique', perWeek: 2,
    description: 'La rétention de garde en solo et les sorties enchaînées : pont, shrimp, changement de base.',
    goals: ['Garder les genoux entre toi et l’adversaire', 'Enchaîner pont et sortie de hanche'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-intermediaire-02', 'bjj-debutant-03', 'bjj-debutant-04'], combos: ['bjj-intermediaire-01', 'bjj-intermediaire-03', 'bjj-intermediaire-04'],
  },
  {
    id: 'bjj-lutte-debout-intermediaire', name: 'Jiu-jitsu brésilien - Lutte debout en solo', discipline: 'bjj', level: 'intermediaire', objective: 'technique', perWeek: 2,
    description: 'Posture debout, changement de niveau et entrée en double-leg sans partenaire, puis la descente et le relevé.',
    goals: ['Changer de niveau en gardant la tête haute', 'Te relever proprement après la descente'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-intermediaire-05', 'bjj-intermediaire-06', 'bjj-debutant-02', 'bjj-debutant-08'], combos: ['bjj-intermediaire-07'],
  },
  {
    id: 'bjj-enchainements-avance', name: 'Jiu-jitsu brésilien - Enchaînements au sol', discipline: 'bjj', level: 'avance', objective: 'enchainements', perWeek: 2,
    description: 'Sorties enchaînées, garde et relevé, mobilité complète et entrées de lutte.',
    goals: ['Passer d’un mouvement au suivant sans t’arrêter', 'Revenir debout en te protégeant'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-intermediaire-02', 'bjj-intermediaire-04'], combos: ['bjj-avance-01', 'bjj-avance-03', 'bjj-avance-06', 'bjj-avance-02', 'bjj-avance-05'],
  },
  {
    id: 'bjj-endurance-avance', name: 'Jiu-jitsu brésilien - Endurance au sol', discipline: 'bjj', level: 'avance', objective: 'cardio', perWeek: 2,
    description: 'Mobilité enchaînée puis un circuit de mobilité au sol, pour tenir sans perdre la technique.',
    goals: ['Des sorties de hanche propres en fin de séance', 'Respirer pendant le travail au sol'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-intermediaire-04', 'bjj-debutant-06'], combos: ['bjj-avance-02', 'bjj-avance-01'], finisher: ['bjj-avance-04'],
  },
  {
    id: 'bjj-rounds-expert', name: 'Jiu-jitsu brésilien - Rounds d’expert en solo', discipline: 'bjj', level: 'expert', objective: 'enchainements', perWeek: 2,
    description: 'Un enchaînement long, puis des rounds de mobilité au sol, de cardio et de lutte.',
    goals: ['Des rounds complets sans perdre la technique', 'Passer de la lutte au sol et revenir'],
    warm: 'bjj-debutant-01', cool: 'bjj-debutant-01', main: ['bjj-avance-06', 'bjj-intermediaire-02'], combos: ['bjj-expert-03'], finisher: ['bjj-expert-01', 'bjj-expert-02', 'bjj-expert-04'],
  },
];

/** disciplines with fewer than eight programmes, and why (Youssef: « Ne pas inventer de programme uniquement pour atteindre un quota ») */
export const CATALOGUE_GAPS: Partial<Record<DisciplineId, string>> = {
  judo: 'Sept programmes : le travail solo vérifié (déplacements, chutes basses, entrées sans projection) ne permet pas un huitième programme qui ne répète pas les autres.',
  bjj: 'Sept programmes : même raison, le travail solo au sol et debout est couvert par les sept.',
};

export function buildProgram(r: ProgramRecipe, nameOf: (id: string) => string, minutesOf: (blocks: ProgramBlock[]) => number): Program {
  const sessions = buildSessions(r, nameOf);
  const def = disciplineDefaults(r.discipline);
  const weeks = sessions.length;
  return {
    id: r.id,
    name: r.name,
    discipline: r.discipline,
    durationMin: Math.round(sessions.reduce((a, s) => a + minutesOf(s.blocks), 0) / weeks),
    frequency: `${r.perWeek} séances par semaine pendant ${weeks} semaines`,
    goals: r.goals,
    progression: sessions.map((s) => `Semaine ${s.week} : ${s.focus}`).join(' '),
    blocks: sessions[0].blocks,
    level: r.level,
    objective: r.objective,
    description: r.description,
    weeks,
    perWeek: r.perWeek,
    prerequisites: r.prerequisites ?? levelPrerequisites(r.level),
    equipment: r.equipment ?? def.equipment,
    safety: r.safety ?? def.safety,
    sessions,
    origin: 'original',
    sources: def.sources,
  };
}
