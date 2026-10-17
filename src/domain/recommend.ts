import type { Profile } from '../store/profile';
import { exercisesFor } from './exercises';
import { PROGRAMS } from './programs';
import type { DisciplineId, Exercise, LevelId, Program } from './types';

export interface Recommendation {
  discipline: DisciplineId;
  level: LevelId;
  speed: number;
  exercises: Exercise[];
  programs: Program[];
  notes: string[];
}

const GOAL_KIND: Record<string, Exercise['kind'][]> = {
  technique: ['technique', 'combinaison'],
  cardio: ['cardio', 'round'],
  coordination: ['combinaison', 'deplacement'],
  defense: ['defense'],
  competition: ['round', 'combinaison'],
  forme: ['cardio', 'technique'],
  // current goal ids (src/store/profile.ts SPORT_GOALS)
  'apprentissage-technique': ['technique'],
  deplacements: ['deplacement'],
  vitesse: ['combinaison', 'cardio'],
  endurance: ['cardio', 'round'],
  mobilite: ['deplacement', 'technique'],
  enchainements: ['combinaison'],
  decouverte: ['technique'],
};

/** Indicative recommendations from the questionnaire; every exercise stays freely accessible. */
export function recommend(p: Profile): Recommendation {
  const discipline = p.mainDiscipline;
  const level = p.levels[discipline];
  const notes: string[] = [];
  let speed = { debutant: 0.55, intermediaire: 0.75, avance: 0.9, expert: 1 }[level];
  // age, height and weight never change the recommendation: nothing medical is inferred from them
  if (p.limitations.trim()) {
    speed = Math.min(speed, 0.65);
    notes.push('Tu as indiqué une limitation : évite les mouvements douloureux et demande l’avis d’un professionnel de santé si besoin.');
  }
  if (p.experience === 'aucune') notes.push('Commence par la garde et les déplacements avant d’enchaîner les coups.');
  const kinds = new Set(p.goals.flatMap((g) => GOAL_KIND[g] ?? []));
  const pool = exercisesFor(discipline, level);
  const exercises = [...pool.filter((e) => kinds.has(e.kind)), ...pool.filter((e) => !kinds.has(e.kind))].slice(0, 4);
  const programs = PROGRAMS.filter(
    (x) =>
      (x.discipline === discipline || x.discipline === 'mixte') &&
      x.durationMin <= p.sessionMinutes + 5 &&
      (level === 'debutant' ? !x.id.includes('avancee') : true),
  ).slice(0, 3);
  notes.push(`${p.daysPerWeek} séance(s) de ${p.sessionMinutes} min par semaine : alterne technique et cardio, garde un jour de repos entre deux séances intenses.`);
  return { discipline, level, speed, exercises, programs, notes };
}
