import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import type { DisciplineId } from '../domain/types';

export interface CustomCombo {
  id: string;
  name: string;
  discipline: DisciplineId;
  sequence: string[];
  createdAt: string;
}

interface CustomState {
  combos: CustomCombo[];
  save: (c: CustomCombo) => void;
  remove: (id: string) => void;
}

export const useCustom = create<CustomState>()(
  persist(
    (setState) => ({
      combos: [],
      save: (c) => setState((s) => ({ combos: [...s.combos.filter((x) => x.id !== c.id), c] })),
      remove: (id) => setState((s) => ({ combos: s.combos.filter((x) => x.id !== id) })),
    }),
    { name: 'css-custom', storage: createJSONStorage(() => idbStorage) },
  ),
);
