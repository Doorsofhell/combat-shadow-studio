import { EXERCISE_BY_ID, exercisesFor } from '../../domain/exercises';
import { PROGRAM_BY_ID } from '../../domain/programs';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import type { DisciplineId, Exercise, LevelId, TrainingMode } from '../../domain/types';
import type { CustomCombo } from '../../store/custom';

/** One block of a training session: a sequence played for `rounds` rounds of `work` seconds. */
export interface PlanItem {
  key: string;
  name: string;
  label?: string;
  discipline: DisciplineId;
  level: LevelId;
  sequence: string[];
  /** playback speed and pause between repetitions of the sequence (seconds) */
  speed: number;
  rest: number;
  soloNote?: string;
  /** seconds of work per round, null = free practice without end */
  work: number | null;
  rounds: number;
  /** rest between rounds (seconds) */
  roundRest: number;
}

export interface Plan {
  mode: TrainingMode;
  title: string;
  items: PlanItem[];
  start: number;
}

export const MODE_LABEL: Record<TrainingMode, string> = {
  libre: 'Libre',
  technique: 'Technique',
  cardio: 'Cardio',
  rounds: 'Rounds',
  programme: 'Programme',
  personnalise: 'Personnalisé',
};

export const MODE_HELP: Record<TrainingMode, string> = {
  libre: 'L’enchaînement tourne en boucle, sans limite de temps.',
  technique: 'Vitesse lente, consignes vocales et points clés entre les répétitions.',
  cardio: 'Rythme soutenu : 5 blocs de 60 s avec 20 s de récupération.',
  rounds: 'Rounds chronométrés avec cloche et repos configurable.',
  programme: 'Séance structurée : échauffement, technique, combinaisons, retour au calme.',
  personnalise: 'Ton propre enchaînement, créé dans le créateur.',
};

export interface ModeOptions {
  roundSec: number;
  restSec: number;
  rounds: number;
}

function fromExercise(e: Exercise, mode: TrainingMode, o: ModeOptions): PlanItem {
  const base = { key: e.id, name: e.name, discipline: e.discipline, level: e.level, sequence: e.sequence, soloNote: e.soloNote };
  switch (mode) {
    case 'technique':
      return { ...base, speed: Math.min(e.speed, 0.45), rest: Math.max(e.rest, 2.4), work: null, rounds: 1, roundRest: 0 };
    case 'cardio':
      return { ...base, speed: Math.min(1.15, Math.max(e.speed, 0.85) * 1.1), rest: 0.15, work: 60, rounds: 5, roundRest: 20 };
    case 'rounds':
      return { ...base, speed: e.speed, rest: Math.min(e.rest, 0.8), work: o.roundSec, rounds: o.rounds, roundRest: o.restSec };
    default:
      return { ...base, speed: e.speed, rest: e.rest, work: null, rounds: 1, roundRest: 0 };
  }
}

/** All exercises of the level, so "previous / next exercise" walks the level list. */
export function exercisePlan(exerciseId: string, mode: TrainingMode, o: ModeOptions): Plan | null {
  const e = EXERCISE_BY_ID.get(exerciseId);
  if (!e) return null;
  const list = exercisesFor(e.discipline, e.level);
  return {
    mode,
    title: e.name,
    items: list.map((x) => fromExercise(x, mode, o)),
    start: list.findIndex((x) => x.id === e.id),
  };
}

export function programPlan(programId: string): Plan | null {
  const p = PROGRAM_BY_ID.get(programId);
  if (!p) return null;
  const items = p.blocks.flatMap((b): PlanItem[] => {
    const e = EXERCISE_BY_ID.get(b.exercise);
    if (!e) return [];
    const speed = b.phase === 'echauffement' || b.phase === 'recuperation' ? Math.min(e.speed, 0.6) : e.speed;
    return [
      {
        key: e.id,
        name: e.name,
        label: b.label,
        discipline: e.discipline,
        level: e.level,
        sequence: e.sequence,
        soloNote: e.soloNote,
        speed,
        rest: b.phase === 'cardio' ? 0.2 : e.rest,
        work: b.work,
        rounds: b.rounds,
        roundRest: b.rest,
      },
    ];
  });
  return { mode: 'programme', title: p.name, items, start: 0 };
}

const LEVEL_SPEED: Record<LevelId, { speed: number; rest: number }> = {
  debutant: { speed: 0.55, rest: 1.6 },
  intermediaire: { speed: 0.75, rest: 1.0 },
  avance: { speed: 0.9, rest: 0.6 },
  expert: { speed: 1.0, rest: 0.4 },
};

export function customPlan(c: CustomCombo, level: LevelId, mode: TrainingMode, o: ModeOptions): Plan {
  const e: Exercise = {
    id: `perso-${c.id}`,
    discipline: c.discipline,
    level,
    name: c.name,
    kind: 'combinaison',
    description: '',
    sequence: c.sequence,
    ...LEVEL_SPEED[level],
    instructions: [],
    soloNote: c.sequence.map((id) => TECHNIQUE_BY_ID.get(id)?.soloNote).find(Boolean),
  };
  const item = fromExercise(e, mode === 'personnalise' ? 'libre' : mode, o);
  return { mode: 'personnalise', title: c.name, items: [item], start: 0 };
}

/** steps for the animation player */
export const playerSteps = (seq: string[]) =>
  seq.map((id) => ({ techniqueId: id, motionId: TECHNIQUE_BY_ID.get(id)?.motion ?? 'garde' }));
