import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import { FighterLook, defaultLook } from '../editor/look';
import type { CoachId } from '../domain/types';
import { useProfile } from './profile';
import { normalizeLook } from '../editor/normalize';

export interface Fighter {
  id: string;
  name: string;
  look: FighterLook;
  createdAt: string;
  updatedAt: string;
}

interface FightersState {
  fighters: Fighter[];
  activeId: string | null;
  hydrated: boolean;
  create: (sex: CoachId, name?: string) => string;
  update: (id: string, look: FighterLook) => void;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
  reset: (id: string) => void;
  setActive: (id: string) => void;
  /** "Tout effacer" in the settings: every fighter is deleted from this device */
  clearAll: () => void;
}

const uid = () => `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

/** keeps the profile's coach (homme / femme, used by older screens) in line with the active fighter */
function syncProfile(f: Fighter | undefined) {
  if (f && useProfile.getState().profile.coach !== f.look.sex) useProfile.getState().setCoach(f.look.sex);
}

/**
 * Saved fighters (several, named), all on this device. The active one is the coach shown in
 * every discipline, in the studio and in augmented reality.
 */
export const useFighters = create<FightersState>()(
  persist(
    (setState, getState) => ({
      fighters: [],
      activeId: null,
      hydrated: false,
      create: (sex, name) => {
        const f: Fighter = { id: uid(), name: name ?? (sex === 'homme' ? 'Mon combattant' : 'Ma combattante'), look: defaultLook(sex), createdAt: now(), updatedAt: now() };
        setState((s) => ({ fighters: [...s.fighters, f], activeId: f.id }));
        syncProfile(f);
        return f.id;
      },
      update: (id, look) => {
        setState((s) => ({ fighters: s.fighters.map((f) => (f.id === id ? { ...f, look, updatedAt: now() } : f)) }));
        if (getState().activeId === id) syncProfile(getState().fighters.find((f) => f.id === id));
      },
      rename: (id, name) => setState((s) => ({ fighters: s.fighters.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name, updatedAt: now() } : f)) })),
      duplicate: (id) => {
        const src = getState().fighters.find((f) => f.id === id);
        if (!src) return null;
        const f: Fighter = { ...structuredClone(src), id: uid(), name: `${src.name} (copie)`, createdAt: now(), updatedAt: now() };
        setState((s) => ({ fighters: [...s.fighters, f] }));
        return f.id;
      },
      remove: (id) => {
        setState((s) => {
          const fighters = s.fighters.filter((f) => f.id !== id);
          return { fighters, activeId: s.activeId === id ? (fighters[0]?.id ?? null) : s.activeId };
        });
        syncProfile(getState().fighters.find((f) => f.id === getState().activeId));
      },
      reset: (id) => setState((s) => ({ fighters: s.fighters.map((f) => (f.id === id ? { ...f, look: defaultLook(f.look.sex), updatedAt: now() } : f)) })),
      clearAll: () => setState({ fighters: [], activeId: null }),
      setActive: (id) => {
        setState({ activeId: id });
        syncProfile(getState().fighters.find((f) => f.id === id));
      },
    }),
    {
      name: 'css-fighters',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ fighters: s.fighters, activeId: s.activeId }),
      // saves from older versions: missing or unknown values fall back to valid ones instead of breaking the coach
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<Pick<FightersState, 'fighters' | 'activeId'>>;
        const fighters = (Array.isArray(p.fighters) ? p.fighters : []).map((f) => ({ ...f, look: normalizeLook(f.look, f.look?.sex) }));
        return { ...current, fighters, activeId: fighters.some((f) => f.id === p.activeId) ? (p.activeId ?? null) : (fighters[0]?.id ?? null) };
      },
      onRehydrateStorage: () => () => useFighters.setState({ hydrated: true }),
    },
  ),
);

/** the active fighter, or null before the first choice */
export const useActiveFighter = () => useFighters((s) => s.fighters.find((f) => f.id === s.activeId) ?? null);
