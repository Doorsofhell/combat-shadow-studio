import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import type { DisciplineId } from '../domain/types';
import type { StoredAnalysis } from '../domain/comboAnalysis';

export interface CustomCombo {
  id: string;
  name: string;
  discipline: DisciplineId;
  sequence: string[];
  createdAt: string;
  /** v0.38: last real change of the name, discipline or moves (absent on sequences saved before) */
  updatedAt?: string;
  /** v0.38: the last local analysis; valid only while its hash matches (domain/comboAnalysis.ts) */
  analysis?: StoredAnalysis;
}

interface CustomState {
  combos: CustomCombo[];
  /** adds or replaces a sequence, keeping its place in the list */
  save: (c: CustomCombo) => void;
  remove: (id: string) => void;
}

export const useCustom = create<CustomState>()(
  persist(
    (setState) => ({
      combos: [],
      save: (c) =>
        setState((s) => {
          const i = s.combos.findIndex((x) => x.id === c.id);
          if (i < 0) return { combos: [...s.combos, c] };
          const combos = [...s.combos];
          combos[i] = c;
          return { combos };
        }),
      remove: (id) => setState((s) => ({ combos: s.combos.filter((x) => x.id !== id) })),
    }),
    { name: 'css-custom', storage: createJSONStorage(() => idbStorage) },
  ),
);

/** whether two versions differ in what the user made (name, discipline, moves): only then updatedAt moves */
export function contentChanged(a: Pick<CustomCombo, 'name' | 'discipline' | 'sequence'>, b: Pick<CustomCombo, 'name' | 'discipline' | 'sequence'>) {
  return a.name !== b.name || a.discipline !== b.discipline || a.sequence.join(',') !== b.sequence.join(',');
}

export const newComboId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
