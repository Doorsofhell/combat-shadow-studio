import { EXERCISE_BY_ID, exercisesFor } from '../../domain/exercises';
import { PROGRAM_BY_ID, programSessions } from '../../domain/programs';
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
  /** v0.47: the Cardio intensity chosen (kept in the history) */
  intensity?: CardioIntensity;
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
  cardio: 'Intervalles : effort, récupération et nombre de cycles à choisir, avec trois intensités.',
  rounds: 'Rounds chronométrés avec cloche et repos configurable.',
  programme: 'Séance structurée : échauffement, technique, combinaisons, retour au calme.',
  personnalise: 'Ton propre enchaînement, créé dans le créateur.',
};

export interface ModeOptions {
  roundSec: number;
  restSec: number;
  rounds: number;
  /** v0.47 Cardio intervals; missing: the former 5 × 60 s with 20 s of recovery, sustained */
  cardio?: CardioOptions;
}

/**
 * v0.47 (« Chronomètre intégré au coach 3D » §7): the intensity changes the programming of the moves (the pause
 * between two repetitions of the combination), never the playback speed past the natural tempo of the moves.
 */
export type CardioIntensity = 'moderee' | 'soutenue' | 'intense';

export interface CardioOptions {
  work: number;
  rest: number;
  cycles: number;
  intensity: CardioIntensity;
}

export const DEFAULT_CARDIO: CardioOptions = { work: 60, rest: 20, cycles: 5, intensity: 'soutenue' };

export const INTENSITY_LABEL: Record<CardioIntensity, string> = { moderee: 'Modérée', soutenue: 'Soutenue', intense: 'Intense' };

export const INTENSITY_HELP: Record<CardioIntensity, string> = {
  moderee: 'Cadence contrôlée, le temps de revenir en garde entre deux enchaînements.',
  soutenue: 'Enchaînements plus rapprochés, retour en garde rapide.',
  intense: 'Enchaînements serrés, chaque mouvement gardant sa durée réelle.',
};

/** pause between two repetitions of the combination (seconds) */
const CARDIO_GAP: Record<CardioIntensity, number> = { moderee: 0.9, soutenue: 0.45, intense: 0.2 };
/** a throw, a fall, a sprawl or a move on the ground needs time to come back up: never less than this */
const CARDIO_GAP_GROUND: Record<CardioIntensity, number> = { moderee: 1.4, soutenue: 1.0, intense: 0.7 };
const GROUND = new Set(['sol', 'projection', 'chute', 'lutte']);

/**
 * Cadence of a Cardio combination: the moves keep their natural tempo (speed between 0.85 and 1, never faster
 * than the authored motion), the intensity only brings the repetitions closer.
 */
export function cardioCadence(sequence: string[], base: { speed: number; rest: number }, intensity: CardioIntensity) {
  const ground = sequence.some((id) => GROUND.has(TECHNIQUE_BY_ID.get(id)?.category ?? ''));
  const gap = intensity === 'moderee' ? Math.max(base.rest, CARDIO_GAP.moderee) : CARDIO_GAP[intensity];
  return {
    speed: Math.min(1, Math.max(base.speed, 0.85)),
    rest: ground ? Math.max(gap, CARDIO_GAP_GROUND[intensity]) : gap,
  };
}

/** Cardio block: `cycles` periods of effort with recovery between them */
export function cardioTiming(o: ModeOptions) {
  const c = o.cardio ?? DEFAULT_CARDIO;
  return { work: c.work, rounds: c.cycles, roundRest: c.rest };
}

function fromExercise(e: Exercise, mode: TrainingMode, o: ModeOptions): PlanItem {
  const base = { key: e.id, name: e.name, discipline: e.discipline, level: e.level, sequence: e.sequence, soloNote: e.soloNote };
  switch (mode) {
    case 'technique':
      return { ...base, speed: Math.min(e.speed, 0.45), rest: Math.max(e.rest, 2.4), work: null, rounds: 1, roundRest: 0 };
    case 'cardio':
      return { ...base, ...cardioCadence(e.sequence, e, (o.cardio ?? DEFAULT_CARDIO).intensity), ...cardioTiming(o) };
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
    intensity: mode === 'cardio' ? (o.cardio ?? DEFAULT_CARDIO).intensity : undefined,
  };
}

export function programPlan(programId: string, session = 0): Plan | null {
  const p = PROGRAM_BY_ID.get(programId);
  if (!p) return null;
  // v0.41: each week of an enriched programme plays its own session
  const sessions = programSessions(p);
  const s = sessions[Math.max(0, Math.min(session, sessions.length - 1))];
  const items = s.blocks.flatMap((b): PlanItem[] => {
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
  return { mode: 'programme', title: sessions.length > 1 ? `${p.name} · semaine ${s.week}` : p.name, items, start: 0 };
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
  return { mode: 'personnalise', title: c.name, items: [item], start: 0, intensity: mode === 'cardio' ? (o.cardio ?? DEFAULT_CARDIO).intensity : undefined };
}

/**
 * 1.3.0 (Youssef, 2026-10-28: the button « S'entraîner » of a technique sheet was greyed out): a technique that no
 * exercise of its discipline works yet is trained on its own, in a session of that one technique.
 */
export function techniquePlan(techniqueId: string, discipline: DisciplineId, level: LevelId, mode: TrainingMode, o: ModeOptions): Plan | null {
  const t = TECHNIQUE_BY_ID.get(techniqueId);
  if (!t) return null;
  const e: Exercise = {
    id: `tech-${t.id}`,
    discipline: t.disciplines.includes(discipline) ? discipline : t.disciplines[0],
    level,
    name: t.name,
    kind: 'technique',
    description: t.description,
    sequence: [t.id],
    ...LEVEL_SPEED[level],
    instructions: [],
    soloNote: t.soloNote,
  };
  return { mode, title: t.name, items: [fromExercise(e, mode, o)], start: 0, intensity: mode === 'cardio' ? (o.cardio ?? DEFAULT_CARDIO).intensity : undefined };
}

/** steps for the animation player */
export const playerSteps = (seq: string[]) =>
  seq.map((id) => ({ techniqueId: id, motionId: TECHNIQUE_BY_ID.get(id)?.motion ?? 'garde' }));
