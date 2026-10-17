export type CoachId = 'homme' | 'femme';
export type DisciplineId = 'boxe' | 'kickboxing' | 'mma' | 'muaythai';
export type LevelId = 'debutant' | 'intermediaire' | 'avance' | 'expert';
export type Guard = 'orthodoxe' | 'gaucher';

export const DISCIPLINES: { id: DisciplineId; name: string; short: string; tagline: string }[] = [
  { id: 'boxe', name: 'Boxe anglaise', short: 'Boxe', tagline: 'Poings, esquives, déplacements' },
  { id: 'kickboxing', name: 'Kick-boxing', short: 'Kick', tagline: 'Poings et pieds' },
  { id: 'mma', name: 'MMA', short: 'MMA', tagline: 'Striking, lutte et sol en solo' },
  { id: 'muaythai', name: 'Muay-thaï', short: 'Muay', tagline: 'Poings, pieds, genoux, coudes' },
];

export const LEVELS: { id: LevelId; name: string; goal: string }[] = [
  { id: 'debutant', name: 'Débutant', goal: 'Posture, garde, gestes fondamentaux et premières combinaisons.' },
  { id: 'intermediaire', name: 'Intermédiaire', goal: 'Associer plusieurs techniques, défendre et contrer.' },
  { id: 'avance', name: 'Avancé', goal: 'Fluidité, automatismes, angles et rythme soutenu.' },
  { id: 'expert', name: 'Expert', goal: 'Séquences longues et exigeantes, rounds complets.' },
];

export type TechniqueCategory = 'garde' | 'poing' | 'pied' | 'genou' | 'coude' | 'defense' | 'deplacement' | 'lutte' | 'sol' | 'feinte' | 'clinch';

/** A technique as shown to the user, linked to an animation (motion id). */
export interface Technique {
  id: string;
  name: string;
  /** short spoken cue */
  call: string;
  category: TechniqueCategory;
  disciplines: DisciplineId[];
  /** motion id in the animation library; the guard selects the mirrored variant */
  motion: string;
  description: string;
  cues: string[];
  keyPoints: string[];
  /** shown when the move is a solo adaptation of a partner technique */
  soloNote?: string;
}

export interface ComboStep {
  technique: string;
}

export type ExerciseKind = 'technique' | 'combinaison' | 'defense' | 'deplacement' | 'cardio' | 'round';

export interface Exercise {
  id: string;
  discipline: DisciplineId;
  level: LevelId;
  name: string;
  kind: ExerciseKind;
  description: string;
  /** sequence of technique ids, repeated */
  sequence: string[];
  /** default speed factor (1 = real speed) */
  speed: number;
  /** pause between repetitions, seconds */
  rest: number;
  instructions: string[];
  soloNote?: string;
}

export interface ProgramBlock {
  label: string;
  phase: 'echauffement' | 'technique' | 'combinaisons' | 'cardio' | 'recuperation';
  exercise: string;
  /** seconds of work */
  work: number;
  rounds: number;
  /** rest between rounds, seconds */
  rest: number;
}

export interface Program {
  id: string;
  name: string;
  discipline: DisciplineId | 'mixte';
  durationMin: number;
  frequency: string;
  goals: string[];
  progression: string;
  blocks: ProgramBlock[];
}

export type TrainingMode = 'libre' | 'technique' | 'cardio' | 'rounds' | 'programme' | 'personnalise';
