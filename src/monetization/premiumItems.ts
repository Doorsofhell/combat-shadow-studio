import type { LevelId, Program } from '../domain/types';
import { EXERCISES } from '../domain/exercises';
import { PROGRAMS } from '../domain/programs';
import { programLevel, programObjective } from '../domain/programMeta';

/**
 * 2.8.2 (Youssef, 2026-11-24, « le petit diamant sur tous les items, options, programmes »): which items will be
 * Premium, one by one, after his choices of 2026-11-20 (docs/monetisation/DECISIONS.md). Only the diamond reads this
 * file: nothing is locked while MONETIZATION_ENABLED is false (rights.ts).
 *
 * - niveaux : débutant et intermédiaire gratuits, avancé et expert Premium (choix 7) ;
 * - coachs : Kadir et Amara gratuits, les autres Premium (choix 8) ;
 * - programmes : un programme d'initiation gratuit par discipline, les autres Premium (choix 9) ;
 * - fiches techniques : gratuites pour les techniques des niveaux gratuits (choix 18).
 */
export const FREE_LEVELS: readonly LevelId[] = ['debutant', 'intermediaire'];
export const isPremiumLevel = (l: LevelId | undefined) => !!l && !FREE_LEVELS.includes(l);

export const FREE_COACH_IDS: readonly string[] = ['mma-kadir', 'mma-amara'];
export const isPremiumCoach = (id: string) => !FREE_COACH_IDS.includes(id);

/**
 * the free programme of each discipline: its first beginner programme whose objective is « bases », else its first
 * beginner programme; the multi-discipline programmes are Premium
 */
export const FREE_PROGRAM_IDS: ReadonlySet<string> = new Set(
  [...new Set(PROGRAMS.map((p) => p.discipline))]
    .filter((d) => d !== 'mixte')
    .map((d) => {
      const beginners = PROGRAMS.filter((p) => p.discipline === d && programLevel(p) === 'debutant');
      return (beginners.find((p) => programObjective(p) === 'bases') ?? beginners[0])?.id;
    })
    .filter((id): id is string => !!id),
);
export const isPremiumProgram = (p: Pick<Program, 'id'>) => !FREE_PROGRAM_IDS.has(p.id);

const ORDER: readonly LevelId[] = ['debutant', 'intermediaire', 'avance', 'expert'];
const firstLevel = new Map<string, LevelId>();
for (const e of EXERCISES)
  for (const t of e.sequence) {
    const cur = firstLevel.get(t);
    if (!cur || ORDER.indexOf(e.level) < ORDER.indexOf(cur)) firstLevel.set(t, e.level);
  }

/**
 * the first level at which the technique is practised, all disciplines together (a move learnt as a beginner in one
 * discipline stays free in the others); undefined when no exercise uses it
 */
export const techniqueFirstLevel = (id: string) => firstLevel.get(id);

/** a technique sheet is Premium when the technique is first practised at a Premium level; never practised = free */
export const isPremiumTechnique = (id: string) => isPremiumLevel(techniqueFirstLevel(id));
