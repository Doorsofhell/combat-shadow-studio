import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import type { DisciplineId, ExerciseKind, LevelId } from '../domain/types';
import type { PeriodPreset } from '../domain/progress';

export type ProgressTab = 'activite' | 'niveaux' | 'categories' | 'exercices' | 'historique' | 'maitrise';

/** the size of a course seen on a previous visit, to explain a change of percentage */
export interface SeenCourse {
  total: number;
  /** previous total, when the course changed size */
  before?: number;
  /** local day the change was noticed */
  changedOn?: string;
}

interface ProgressViewState {
  discipline: DisciplineId | 'toutes';
  preset: PeriodPreset;
  custom: { from: string; to: string } | null;
  level: LevelId | null;
  kind: ExerciseKind | null;
  tab: ProgressTab;
  /** by course key (discipline + level) */
  seen: Record<string, SeenCourse>;
  set: (p: Partial<Omit<ProgressViewState, 'set' | 'noteCourse'>>) => void;
  noteCourse: (key: string, total: number, today: string) => void;
}

/**
 * How the Progrès screen was last left (filters, period, tab), on this device. Recorded sessions are
 * not stored here (src/store/stats.ts): this store can be cleared without losing any history.
 */
export const useProgressView = create<ProgressViewState>()(
  persist(
    (setState, getState) => ({
      discipline: 'toutes',
      preset: '30j',
      custom: null,
      level: null,
      kind: null,
      tab: 'activite',
      seen: {},
      set: (p) => setState(p),
      noteCourse: (key, total, today) => {
        const was = getState().seen[key];
        if (was?.total === total) return;
        const next: SeenCourse = was ? { total, before: was.total, changedOn: today } : { total };
        setState((s) => ({ seen: { ...s.seen, [key]: next } }));
      },
    }),
    {
      name: 'css-progress-view',
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ set: _s, noteCourse: _n, ...rest }) => rest,
    },
  ),
);
