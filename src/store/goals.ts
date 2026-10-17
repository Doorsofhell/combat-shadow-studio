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
  /** training days per week, 0 = no goal */
  weeklySessions: number;
}

interface GoalsState {
  goals: Goals;
  /** favourite technique ids */
  favTechniques: string[];
  /** favourite exercise ids (combinations, drills) */
  favExercises: string[];
  setGoals: (g: Partial<Goals>) => void;
  toggleTechnique: (id: string) => void;
  toggleExercise: (id: string) => void;
  clear: () => void;
}

export const DEFAULT_GOALS: Goals = { weeklyMinutes: 0, weeklySessions: 0 };

const toggle = (xs: string[], id: string) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]);

export const useGoals = create<GoalsState>()(
  persist(
    (setState) => ({
      goals: DEFAULT_GOALS,
      favTechniques: [],
      favExercises: [],
      setGoals: (g) => setState((s) => ({ goals: { ...s.goals, ...g } })),
      toggleTechnique: (id) => setState((s) => ({ favTechniques: toggle(s.favTechniques, id) })),
      toggleExercise: (id) => setState((s) => ({ favExercises: toggle(s.favExercises, id) })),
      clear: () => setState({ goals: DEFAULT_GOALS, favTechniques: [], favExercises: [] }),
    }),
    {
      name: 'css-goals',
      storage: createJSONStorage(() => idbStorage),
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<GoalsState>;
        return { ...current, ...s, goals: { ...DEFAULT_GOALS, ...(s.goals ?? {}) } };
      },
    },
  ),
);
