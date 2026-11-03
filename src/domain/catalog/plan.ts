import { TECHNIQUE_BY_ID } from '../techniques';
import type { LevelId, TrainingMode } from '../types';
import { cardioCadence, cardioTiming, DEFAULT_CARDIO, type ModeOptions, type Plan, type PlanItem } from '../../ui/training/plan';
import type { CatalogCombo } from './types';

/** vitesse de lecture et pause entre deux répétitions selon le niveau de la fiche */
const LEVEL_SPEED: Record<LevelId, { speed: number; rest: number }> = {
  debutant: { speed: 0.55, rest: 1.6 },
  intermediaire: { speed: 0.75, rest: 1.0 },
  avance: { speed: 0.9, rest: 0.6 },
  expert: { speed: 1.0, rest: 0.4 },
};

/** élément de séance pour une fiche, selon le mode (mêmes règles que les exercices du programme) */
export function catalogItem(c: CatalogCombo, mode: TrainingMode, o: ModeOptions): PlanItem {
  const { speed, rest } = LEVEL_SPEED[c.level];
  const base = {
    key: `cat-${c.id}`,
    name: c.name,
    discipline: c.discipline,
    level: c.level,
    sequence: c.sequence,
    soloNote: c.sequence.map((id) => TECHNIQUE_BY_ID.get(id)?.soloNote).find(Boolean),
  };
  switch (mode) {
    case 'technique':
      return { ...base, speed: Math.min(speed, 0.45), rest: Math.max(rest, 2.4), work: null, rounds: 1, roundRest: 0 };
    case 'cardio':
      return { ...base, ...cardioCadence(c.sequence, { speed, rest }, (o.cardio ?? DEFAULT_CARDIO).intensity), ...cardioTiming(o) };
    case 'rounds':
      return { ...base, speed, rest: Math.min(rest, 0.8), work: o.roundSec, rounds: o.rounds, roundRest: o.restSec };
    default:
      return { ...base, speed, rest, work: null, rounds: 1, roundRest: 0 };
  }
}

export interface CatalogPlanOptions extends ModeOptions {
  /** fiches voisines (ex. résultats de recherche) pour « précédent / suivant » ; par défaut la fiche seule */
  siblings?: CatalogCombo[];
}

/**
 * Séance pour une fiche du catalogue, au format Plan (comme customPlan / exercisePlan dans
 * src/ui/training/plan.ts). Modes utiles : libre, technique, cardio, rounds.
 */
export function catalogPlan(entry: CatalogCombo, mode: TrainingMode, options: CatalogPlanOptions): Plan {
  const m: TrainingMode = mode === 'personnalise' || mode === 'programme' ? 'libre' : mode;
  const list = options.siblings?.some((c) => c.id === entry.id) ? options.siblings : [entry];
  return {
    mode: m,
    title: entry.name,
    items: list.map((c) => catalogItem(c, m, options)),
    start: Math.max(0, list.findIndex((c) => c.id === entry.id)),
    intensity: m === 'cardio' ? (options.cardio ?? DEFAULT_CARDIO).intensity : undefined,
  };
}
