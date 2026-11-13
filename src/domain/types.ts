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

/** v0.41: one session of a programme, with its own blocks (a week of the programme plays its own session) */
export interface ProgramSession {
  week: number;
  /** what this session adds, in one sentence */
  focus: string;
  blocks: ProgramBlock[];
}

/** what a programme mainly works (v0.33 filter; v0.41 adds défense, déplacements and enchaînements) */
export type ProgramObjective = 'bases' | 'technique' | 'cardio' | 'coordination' | 'mobilite' | 'defense' | 'deplacements' | 'enchainements';

/** v0.41: where a programme comes from (Youssef: « distinguer explicitement ») */
export type ProgramOrigin = 'original' | 'adapte';

export interface ProgramSourceRef {
  /** a source of src/domain/programSources.ts */
  id: string;
  /** what was taken from it for this programme */
  usage: string;
}

export interface Program {
  id: string;
  name: string;
  discipline: DisciplineId | 'mixte';
  /** minutes of one session, computed from its blocks, rests and transitions (programSessionSeconds) */
  durationMin: number;
  frequency: string;
  goals: string[];
  progression: string;
  /** the first session; programmes without `sessions` repeat this one */
  blocks: ProgramBlock[];
  // v0.41 (Youssef, « Enrichissement des programmes »), optional so the first ten keep their shape
  level?: LevelId;
  objective?: ProgramObjective;
  description?: string;
  weeks?: number;
  perWeek?: number;
  prerequisites?: string[];
  equipment?: string[];
  safety?: string[];
  /** one session per week, each with its own blocks; absent = the same session every time */
  sessions?: ProgramSession[];
  origin?: ProgramOrigin;
  sources?: ProgramSourceRef[];
}

export type TrainingMode = 'libre' | 'technique' | 'cardio' | 'rounds' | 'programme' | 'personnalise';
