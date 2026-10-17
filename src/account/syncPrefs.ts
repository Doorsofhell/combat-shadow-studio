import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from '../store/storage';

/** per-user choice: cloud sync is off until the user turns it on */
interface SyncPrefsState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

export const useSyncPrefs = create<SyncPrefsState>()(
  persist(
    (setState) => ({
      enabled: false,
      setEnabled: (enabled) => setState({ enabled }),
    }),
    { name: 'css-sync-prefs', storage: createJSONStorage(() => idbStorage), partialize: (s) => ({ enabled: s.enabled }) },
  ),
);
