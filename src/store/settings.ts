import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';
import { readSavedTheme, type ThemePref } from '../ui/theme/theme';

export type CueId = 'trajectoire' | 'hanches' | 'pivot' | 'articulations' | 'pieds' | 'garde' | 'comparaison';

export const CUE_LABEL: Record<CueId, string> = {
  trajectoire: 'Trajectoire',
  hanches: 'Rotation des hanches',
  pivot: 'Pivot du pied',
  articulations: 'Articulations',
  pieds: 'Position des pieds',
  garde: 'Garde de départ',
  comparaison: 'Position clé',
};

export interface Settings {
  /** menu theme; the training studio stays white */
  theme: ThemePref;
  voiceVolume: number;
  effectsVolume: number;
  voice: boolean;
  announceMoves: boolean;
  techniqueTips: boolean;
  impactSounds: boolean;
  quality: 'auto' | 'haute' | 'basse';
  /** look of the coaches: cel-shaded manga (default) or realistic */
  coachStyle: 'manga' | 'realiste';
  cameraAngle: number;
  /** teaching camera mode; auto picks the best angle for each technique */
  cameraMode: import('../domain/camera').CameraMode;
  /** visual teaching marks of the "Décomposer" mode */
  cues: Record<CueId, boolean>;
  /** gear drawn see-through in the "Décomposer" mode so joints stay visible (saved look unchanged) */
  seeThroughGear: boolean;
  defaultRoundSec: number;
  defaultRestSec: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  voiceVolume: 1,
  effectsVolume: 0.8,
  voice: true,
  announceMoves: true,
  techniqueTips: true,
  impactSounds: false,
  quality: 'auto',
  coachStyle: 'manga',
  cameraAngle: 35,
  cameraMode: 'auto',
  cues: { trajectoire: true, hanches: true, pivot: true, articulations: true, pieds: true, garde: false, comparaison: false },
  seeThroughGear: false,
  defaultRoundSec: 180,
  defaultRestSec: 60,
};

interface SettingsState {
  settings: Settings;
  set: (p: Partial<Settings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (setState) => ({
      // the theme saved for the first paint is the starting value until the store is loaded
      settings: { ...DEFAULT_SETTINGS, theme: readSavedTheme() },
      set: (p) => setState((s) => ({ settings: { ...s.settings, ...p } })),
    }),
    {
      name: 'css-settings',
      storage: createJSONStorage(() => idbStorage),
      // settings saved by an older version get the new fields with their default value
      merge: (saved, current) => ({ ...current, settings: { ...DEFAULT_SETTINGS, theme: readSavedTheme(), ...((saved as { settings?: Partial<Settings> })?.settings ?? {}) } }),
    },
  ),
);
