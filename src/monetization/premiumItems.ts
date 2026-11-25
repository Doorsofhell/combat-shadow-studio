import type { Exercise, LevelId, Program, ProgramBlock } from '../domain/types';
import { EXERCISES, EXERCISE_BY_ID } from '../domain/exercises';
import type { EntitlementId } from './entitlements';
import { canAccessFeature } from './rights';
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

/**
 * 2.9.0: the preview build's example of a mixed programme (simulation.tsx) is a free programme whose last weeks play PRO
 * exercises. Only the preview calls this; the catalogue itself has no mixed programme (docs/monetisation/DECISIONS.md).
 */
export function addPreviewFreeProgram(id: string) {
  (FREE_PROGRAM_IDS as Set<string>).add(id);
}

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

/* ---------------------------------------------------------------------------------------------------------------
 * 2.9.0 (Youssef, 2026-11-25, « Identification visuelle des contenus Freemium et Premium », §8): two separate
 * questions, answered here only.
 * - membership: « is this item in the Shadow Pro catalogue? » → the PRO badge, for everyone;
 * - access: « may THIS user open it now? » → the padlock and the guards, through canAccessFeature (rights.ts).
 * The screens never decide either one themselves.
 * ------------------------------------------------------------------------------------------------------------ */

/** the right that opens each kind of item */
export const ITEM_RIGHT = {
  exercise: 'advanced_techniques',
  technique: 'advanced_techniques',
  program: 'all_programs',
  coach: 'all_fighters',
} as const satisfies Record<string, EntitlementId>;

export const isProExercise = (e: Pick<Exercise, 'level'> | undefined) => !!e && isPremiumLevel(e.level);
export const canOpenExercise = (e: Pick<Exercise, 'level'> | undefined) => !isProExercise(e) || canAccessFeature(ITEM_RIGHT.exercise);
export const canOpenTechnique = (id: string) => !isPremiumTechnique(id) || canAccessFeature(ITEM_RIGHT.technique);
export const canOpenCoach = (id: string) => !isPremiumCoach(id) || canAccessFeature(ITEM_RIGHT.coach);

/** a session (sub-programme) is PRO when its programme is, or when one of its blocks plays a PRO exercise */
export function isProSession(p: Program, blocks: readonly ProgramBlock[], exerciseOf: (id: string) => Pick<Exercise, 'level'> | undefined = (id) => EXERCISE_BY_ID.get(id)) {
  return isPremiumProgram(p) || blocks.some((b) => isProExercise(exerciseOf(b.exercise)));
}

export interface ProgramShare {
  /** PRO sessions */
  pro: number;
  total: number;
  kind: 'gratuit' | 'mixte' | 'pro';
}

/** computed from the sessions each time (never stored): « 3/6 PRO » for a mixed programme */
export function programProShare(p: Program, exerciseOf?: (id: string) => Pick<Exercise, 'level'> | undefined): ProgramShare {
  const sessions = p.sessions ?? [{ week: 1, focus: '', blocks: p.blocks }];
  const pro = sessions.filter((s) => isProSession(p, s.blocks, exerciseOf)).length;
  const total = sessions.length;
  return { pro, total, kind: pro === 0 ? 'gratuit' : pro === total ? 'pro' : 'mixte' };
}

/** the right a PRO session needs: the programme's own when the whole programme is PRO, else the exercises' */
const sessionRight = (p: Program): EntitlementId => (isPremiumProgram(p) ? ITEM_RIGHT.program : ITEM_RIGHT.exercise);

/** whether session `i` may start; a mixed programme keeps its free sessions open */
export function canOpenSession(p: Program, i: number, exerciseOf?: (id: string) => Pick<Exercise, 'level'> | undefined) {
  const sessions = p.sessions ?? [{ week: 1, focus: '', blocks: p.blocks }];
  const s = sessions[Math.min(Math.max(i, 0), sessions.length - 1)];
  return !s || !isProSession(p, s.blocks, exerciseOf) || canAccessFeature(sessionRight(p));
}

/** the programme card: locked only when NO session can start (a mixed programme is never shown fully locked) */
export function isProgramLocked(p: Program, exerciseOf?: (id: string) => Pick<Exercise, 'level'> | undefined) {
  const sessions = p.sessions ?? [{ week: 1, focus: '', blocks: p.blocks }];
  return sessions.every((_, i) => !canOpenSession(p, i, exerciseOf));
}

/**
 * the guard of the training screen: the right a session address needs and this user lacks, or null. Read on every
 * start, so a link, a resumed session or a typed address cannot open a locked item (a hidden button is never the only
 * barrier). The final barrier of a paid build stays the store-verified status (rights.ts, purchases.ts).
 */
export function lockedTrainingRight(q: URLSearchParams): EntitlementId | null {
  const ex = q.get('ex');
  if (ex && !canOpenExercise(EXERCISE_BY_ID.get(ex))) return ITEM_RIGHT.exercise;
  const prog = q.get('prog');
  const p = prog ? PROGRAMS.find((x) => x.id === prog) : undefined;
  if (p && !canOpenSession(p, Math.max(0, Number(q.get('s') ?? 1) - 1) || 0)) return sessionRight(p);
  const tech = q.get('tech');
  if (tech && !canOpenTechnique(tech)) return ITEM_RIGHT.technique;
  return null;
}
