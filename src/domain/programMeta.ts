import { EXERCISE_BY_ID } from './exercises';
import { LEVELS, LevelId, Program } from './types';

/**
 * 0.33 (Entraîner, §10): what the Programmes space filters on. The level is not a new value: it is the highest
 * level of the exercises the programme really plays. The objective is a classification of the existing goals of
 * each programme (written in programs.ts), so the filter has a short list; no programme was added or changed.
 */
export type ProgramObjective = 'bases' | 'technique' | 'cardio' | 'coordination' | 'mobilite';

export const OBJECTIVE_LABEL: Record<ProgramObjective, string> = {
  bases: 'Bases',
  technique: 'Technique',
  cardio: 'Cardio',
  coordination: 'Coordination',
  mobilite: 'Mobilité',
};

const OBJECTIVE: Record<string, ProgramObjective> = {
  'boxe-initiation-4-semaines': 'bases',
  'kick-poings-pieds': 'technique',
  'mma-striking-mobilite': 'mobilite',
  'muay-fondamentaux': 'bases',
  'cardio-combat-20': 'cardio',
  'coordination-15': 'coordination',
  'technique-avancee-30': 'technique',
  'muay-armes-completes': 'technique',
  'judo-bases-solo': 'bases',
  'bjj-mobilite-solo': 'mobilite',
};

/** a programme added later without a classification falls in « Technique » until it gets one */
export const programObjective = (p: Program): ProgramObjective => OBJECTIVE[p.id] ?? 'technique';

const RANK = new Map(LEVELS.map((l, i) => [l.id, i]));

export function programLevel(p: Program): LevelId {
  let best = 0;
  for (const b of p.blocks) best = Math.max(best, RANK.get(EXERCISE_BY_ID.get(b.exercise)?.level ?? 'debutant') ?? 0);
  return LEVELS[best].id;
}

export type DurationBucket = 'court' | 'moyen' | 'long';
export const DURATION_LABEL: Record<DurationBucket, string> = { court: '20 min ou moins', moyen: '25 à 30 min', long: '35 min et plus' };
export const durationBucket = (p: Program): DurationBucket => (p.durationMin <= 20 ? 'court' : p.durationMin <= 30 ? 'moyen' : 'long');

export interface ProgramFilters {
  discipline: string;
  level: LevelId | 'tous';
  duration: DurationBucket | 'tous';
  objective: ProgramObjective | 'tous';
}

export const NO_PROGRAM_FILTER: ProgramFilters = { discipline: 'tous', level: 'tous', duration: 'tous', objective: 'tous' };

export function filterPrograms(list: Program[], f: ProgramFilters) {
  return list.filter(
    (p) =>
      (f.discipline === 'tous' || p.discipline === f.discipline) &&
      (f.level === 'tous' || programLevel(p) === f.level) &&
      (f.duration === 'tous' || durationBucket(p) === f.duration) &&
      (f.objective === 'tous' || programObjective(p) === f.objective),
  );
}

export const activeFilterCount = (f: ProgramFilters) => (Object.keys(f) as (keyof ProgramFilters)[]).filter((k) => f[k] !== 'tous').length;
