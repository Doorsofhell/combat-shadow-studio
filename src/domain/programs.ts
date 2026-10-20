import type { Program, ProgramBlock } from './types';

const b = (label: string, phase: ProgramBlock['phase'], exercise: string, work: number, rounds: number, rest: number): ProgramBlock => ({
  label, phase, exercise, work, rounds, rest,
});

/**
 * Structured sessions: warm-up, technique, combinations, cardio, recovery.
 * Durations and frequencies are indicative and should be adapted to the declared abilities.
 */
export const PROGRAMS: Program[] = [
  {
    id: 'boxe-initiation-4-semaines', name: 'Boxe anglaise - Initiation 4 semaines', discipline: 'boxe', durationMin: 25,
    frequency: '3 séances par semaine pendant 4 semaines',
    goals: ['Tenir une garde solide', 'Des jabs et des directs propres', 'Te déplacer sans croiser les pieds'],
    progression: 'Semaines 1-2 en douceur, vitesse lente. Semaines 3-4 : vitesse 0,8 et rounds de 2 minutes.',
    blocks: [
      b('Échauffement : garde et pas', 'echauffement', 'boxe-debutant-06', 60, 2, 20),
      b('Jab', 'technique', 'boxe-debutant-02', 90, 2, 30),
      b('Direct', 'technique', 'boxe-debutant-03', 90, 2, 30),
      b('Jab → Direct', 'combinaisons', 'boxe-debutant-08', 120, 3, 45),
      b('Double jab → Direct', 'combinaisons', 'boxe-debutant-09', 120, 2, 45),
      b('Retour au calme : garde et respiration', 'recuperation', 'boxe-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'kick-poings-pieds', name: 'Kick-boxing - Techniques poings-pieds', discipline: 'kickboxing', durationMin: 30,
    frequency: '2 à 3 séances par semaine',
    goals: ['Enchaîner poings et pieds sans lâcher la garde', 'Bien pivoter sur les coups de pied'],
    progression: 'Monte la vitesse par paliers de 0,1, seulement quand tes pivots restent propres.',
    blocks: [
      b('Échauffement : pas et garde', 'echauffement', 'kickboxing-debutant-11', 60, 2, 20),
      b('Low kick', 'technique', 'kickboxing-debutant-05', 90, 2, 30),
      b('Middle kick', 'technique', 'kickboxing-debutant-06', 90, 2, 30),
      b('Jab → Direct → Low kick', 'combinaisons', 'kickboxing-debutant-10', 120, 3, 45),
      b('Direct → Crochet → Low kick', 'combinaisons', 'kickboxing-intermediaire-01', 120, 3, 45),
      b('Retour au calme', 'recuperation', 'kickboxing-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'mma-striking-mobilite', name: 'MMA - Shadow striking et mobilité', discipline: 'mma', durationMin: 30,
    frequency: '2 séances par semaine',
    goals: ['Descendre sur les jambes sans casser le dos', 'Un sprawl rapide', 'Te relever proprement'],
    progression: 'Commence par des rounds de 2 minutes, puis passe à 3 minutes avec moins de repos.',
    blocks: [
      b('Échauffement : déplacements', 'echauffement', 'mma-debutant-11', 60, 2, 20),
      b('Changement de niveau', 'technique', 'mma-debutant-05', 60, 2, 30),
      b('Sprawl', 'technique', 'mma-debutant-06', 60, 3, 40),
      b('Jab → Direct → Sprawl', 'combinaisons', 'mma-debutant-09', 120, 3, 45),
      b('Mobilité au sol', 'technique', 'mma-intermediaire-08', 90, 2, 30),
      b('Retour au calme', 'recuperation', 'mma-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'muay-fondamentaux', name: 'Muay-thaï - Techniques fondamentales', discipline: 'muaythai', durationMin: 30,
    frequency: '3 séances par semaine',
    goals: ['Un teep, un low kick et un genou propres', 'Un check réflexe, qui part tout seul'],
    progression: 'Passe aux exercices intermédiaires quand tu reviens en garde sans y penser.',
    blocks: [
      b('Échauffement : garde thaï', 'echauffement', 'muaythai-debutant-01', 60, 2, 20),
      b('Teep', 'technique', 'muaythai-debutant-04', 90, 2, 30),
      b('Low kick', 'technique', 'muaythai-debutant-05', 90, 2, 30),
      b('Genou', 'technique', 'muaythai-debutant-07', 90, 2, 30),
      b('Jab → Direct → Low kick', 'combinaisons', 'muaythai-debutant-10', 120, 3, 45),
      b('Retour au calme', 'recuperation', 'muaythai-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'cardio-combat-20', name: 'Cardio combat - 20 minutes', discipline: 'mixte', durationMin: 20,
    frequency: '2 à 4 séances par semaine, jamais deux jours d’affilée au début',
    goals: ['Gagner en endurance', 'Rester précis même quand tu es fatigué'],
    progression: 'Chaque semaine, retire 15 s de repos, sans descendre sous 30 s.',
    blocks: [
      b('Échauffement : pas et jab', 'echauffement', 'boxe-debutant-12', 90, 1, 20),
      b('Cardio boxe', 'cardio', 'boxe-avance-11', 120, 2, 45),
      b('Cardio poings-pieds', 'cardio', 'kickboxing-avance-11', 120, 2, 45),
      b('Cardio MMA', 'cardio', 'mma-avance-11', 120, 2, 45),
      b('Retour au calme', 'recuperation', 'boxe-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'coordination-15', name: 'Coordination - 15 minutes', discipline: 'mixte', durationMin: 15,
    frequency: '3 séances par semaine, possible en complément',
    goals: ['Bras et jambes qui travaillent ensemble', 'Rester stable pendant les défenses'],
    progression: 'Accélère quand l’enchaînement passe fluide trois fois de suite.',
    blocks: [
      b('Pas latéraux', 'echauffement', 'boxe-debutant-07', 60, 1, 15),
      b('Jab → Esquive → Direct', 'technique', 'boxe-intermediaire-03', 90, 2, 30),
      b('Check et contre', 'technique', 'kickboxing-intermediaire-05', 90, 2, 30),
      b('Pivot après le jab', 'combinaisons', 'boxe-intermediaire-09', 90, 2, 30),
      b('Retour au calme', 'recuperation', 'boxe-debutant-01', 45, 1, 0),
    ],
  },
  {
    id: 'technique-avancee-30', name: 'Technique avancée - 30 minutes', discipline: 'mixte', durationMin: 30,
    frequency: '2 séances par semaine',
    goals: ['De longues combinaisons fluides', 'Angles et défenses glissés dedans'],
    progression: 'Passe aux exercices experts quand les combinaisons avancées coulent à vitesse 1.',
    blocks: [
      b('Échauffement', 'echauffement', 'boxe-intermediaire-01', 90, 1, 20),
      b('Jab → Direct → Roll → Crochet', 'technique', 'boxe-avance-01', 120, 2, 40),
      b('Poings-pieds-genoux', 'combinaisons', 'muaythai-avance-01', 120, 2, 40),
      b('Striking + défense de lutte', 'combinaisons', 'mma-avance-01', 120, 2, 40),
      b('Série de 8 frappes', 'combinaisons', 'boxe-expert-02', 120, 2, 45),
      b('Retour au calme', 'recuperation', 'boxe-debutant-01', 60, 1, 0),
    ],
  },
  {
    id: 'muay-armes-completes', name: 'Muay-thaï - Huit armes', discipline: 'muaythai', durationMin: 35,
    frequency: '2 séances par semaine',
    goals: ['Coudes et genoux de près', 'Le clinch simulé (corps à corps)'],
    progression: 'Commence à vitesse 0,7. Tes coudes restent courts et bien protégés.',
    blocks: [
      b('Échauffement : teep et pas', 'echauffement', 'muaythai-avance-10', 90, 1, 20),
      b('Coudes en série', 'technique', 'muaythai-avance-02', 90, 2, 30),
      b('Clinch : tirage et genoux', 'technique', 'muaythai-avance-04', 90, 2, 30),
      b('Combinaison 8 armes', 'combinaisons', 'muaythai-expert-02', 120, 3, 45),
      b('Round technique', 'cardio', 'muaythai-expert-08', 180, 2, 60),
      b('Retour au calme', 'recuperation', 'muaythai-debutant-01', 60, 1, 0),
    ],
  },
];

export const PROGRAM_BY_ID = new Map(PROGRAMS.map((p) => [p.id, p]));

export const programSeconds = (p: Program) => p.blocks.reduce((a, x) => a + x.work * x.rounds + x.rest * Math.max(0, x.rounds - 1), 0);
