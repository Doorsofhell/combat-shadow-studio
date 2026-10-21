export type CoachId = 'homme' | 'femme';
export type DisciplineId = 'boxe' | 'kickboxing' | 'mma' | 'muaythai' | 'bjj' | 'judo';
export type LevelId = 'debutant' | 'intermediaire' | 'avance' | 'expert';
export type Guard = 'orthodoxe' | 'gaucher';

export const DISCIPLINES: { id: DisciplineId; name: string; short: string; tagline: string }[] = [
  { id: 'boxe', name: 'Boxe anglaise', short: 'Boxe', tagline: 'Poings, esquives, déplacements' },
  { id: 'kickboxing', name: 'Kick-boxing', short: 'Kick', tagline: 'Poings et pieds' },
  { id: 'mma', name: 'MMA', short: 'MMA', tagline: 'Striking, lutte et sol en solo' },
  { id: 'muaythai', name: 'Muay-thaï', short: 'Muay', tagline: 'Poings, pieds, genoux, coudes' },
  { id: 'bjj', name: 'Jiu-jitsu brésilien', short: 'BJJ', tagline: 'Mobilité au sol, sorties et relevés' },
  { id: 'judo', name: 'Judo', short: 'Judo', tagline: 'Postures, déplacements et entrées' },
];

export const LEVELS: { id: LevelId; name: string; goal: string }[] = [
  { id: 'debutant', name: 'Débutant', goal: 'Posture, garde, gestes fondamentaux et premières combinaisons.' },
  { id: 'intermediaire', name: 'Intermédiaire', goal: 'Associer plusieurs techniques, défendre et contrer.' },
  { id: 'avance', name: 'Avancé', goal: 'Fluidité, automatismes, angles et rythme soutenu.' },
  { id: 'expert', name: 'Expert', goal: 'Séquences longues et exigeantes, rounds complets.' },
];

export type TechniqueCategory = 'garde' | 'poing' | 'pied' | 'genou' | 'coude' | 'defense' | 'deplacement' | 'lutte' | 'sol' | 'feinte' | 'clinch' | 'projection' | 'chute';

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
  /**
   * how it can be practised: 'solo' really works alone (default); 'duo' is shown with a virtual
   * partner; 'partenaire' needs a real partner and a qualified coach: consultable, never a solo drill
   */
  mode?: TechniqueMode;
  /**
   * what this shared technique means in one discipline (« En judo… »), shown on the sheet when the
   * user looks at it from that discipline: one definition, a note per discipline, never a copy
   */
  notes?: Partial<Record<DisciplineId, string>>;
  /** safety reminder shown on the sheet (falls, kneeling, partner work) */
  safety?: string;
  /** ids of the sources the sheet is written from (biomech/sources.ts) */
  sources?: string[];
}

export type TechniqueMode = 'solo' | 'duo' | 'partenaire';

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
