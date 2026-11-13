import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';

/**
 * Personal goals and favourites, all on this device. Goals only compare the user's own active time
 * and session count with the target they chose: no quality score is computed anywhere.
 */
export interface Goals {
  /** active minutes per week, 0 = no goal */
  weeklyMinutes: number;
  /** training days per week, 0 = no goal (1.1.0: the number of trainingDays once days are picked) */
  weeklySessions: number;
  /**
   * 1.1.0 (Youssef, 2026-10-27: « grille sur une ligne type agenda Google où on clique pour sélectionner les jours de
   * la semaine, pas besoin de aucun, multi-sélection possible »): the days chosen, 0 = Monday … 6 = Sunday. Absent
   * for a goal saved before 1.1.0 (a number of days only, kept as it is until days are picked).
   */
  trainingDays?: number[];
}

interface GoalsState {
  goals: Goals;
  /** favourite technique ids */
  favTechniques: string[];
  /** favourite exercise ids (combinations, drills) */
  favExercises: string[];
  /** 0.46: favourite sheets of the encyclopedia (term ids) */
  favTerms: string[];
  /** 0.24: how the user rates each technique himself (Youssef, 2026-10-20): assimilated or still hard */
  mastery: Record<string, Mastery>;
  setGoals: (g: Partial<Goals>) => void;
  toggleTechnique: (id: string) => void;
  toggleExercise: (id: string) => void;
  toggleTerm: (id: string) => void;
  /** sets the state, or clears it when the same state is chosen again */
  toggleMastery: (id: string, m: Mastery) => void;
  clear: () => void;
}

export type Mastery = 'acquise' | 'a-revoir';

export const DEFAULT_GOALS: Goals = { weeklyMinutes: 0, weeklySessions: 0 };

const toggle = (xs: string[], id: string) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]);

export const useGoals = create<GoalsState>()(
  persist(
    (setState) => ({
      goals: DEFAULT_GOALS,
      favTechniques: [],
      favExercises: [],
      favTerms: [],
      mastery: {},
      setGoals: (g) => setState((s) => ({ goals: { ...s.goals, ...g } })),
      toggleTechnique: (id) => setState((s) => ({ favTechniques: toggle(s.favTechniques, id) })),
      toggleExercise: (id) => setState((s) => ({ favExercises: toggle(s.favExercises, id) })),
      toggleTerm: (id) => setState((s) => ({ favTerms: toggle(s.favTerms, id) })),
      toggleMastery: (id, m) =>
        setState((s) => {
          const next = { ...s.mastery };
          if (next[id] === m) delete next[id];
          else next[id] = m;
          return { mastery: next };
        }),
      clear: () => setState({ goals: DEFAULT_GOALS, favTechniques: [], favExercises: [], favTerms: [], mastery: {} }),
    }),
    {
      name: 'css-goals',
      storage: createJSONStorage(() => idbStorage),
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<GoalsState>;
        // 0.46: favTerms is new, older saved states simply have none
        return { ...current, ...s, goals: { ...DEFAULT_GOALS, ...(s.goals ?? {}) }, mastery: { ...(s.mastery ?? {}) }, favTerms: Array.isArray(s.favTerms) ? s.favTerms : [] };
      },
    },
  ),
);
