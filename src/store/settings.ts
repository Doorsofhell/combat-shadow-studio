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

/** ground marks of the training screen, each one switched on or off on its own (all off by default) */
export type GroundMarkId = 'pieds' | 'orientation' | 'avantArriere' | 'pivot' | 'trajectoire';

export const GROUND_MARK_LABEL: Record<GroundMarkId, string> = {
  pieds: 'Position des pieds',
  orientation: 'Orientation des pieds',
  avantArriere: 'Pied avant / arrière',
  pivot: 'Direction du pivot',
  trajectoire: 'Trajectoires',
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
  /** look of the coaches: ink drawing in colour (default since v0.14), cel-shaded manga, or realistic */
  coachStyle: 'encre' | 'manga' | 'realiste';
  /**
   * v0.23 render of the coaches (one model for both looks, clean cel shading) or the previous render,
   * kept as a fallback until the new one is validated on the devices
   */
  coachRender: 'premium' | 'precedent';
  cameraAngle: number;
  /** teaching camera mode; auto picks the best angle for each technique */
  cameraMode: import('../domain/camera').CameraMode;
  /** visual teaching marks of the "Décomposer" mode */
  cues: Record<CueId, boolean>;
  /** gear drawn see-through in the "Décomposer" mode so joints stay visible (saved look unchanged) */
  seeThroughGear: boolean;
  groundMarks: Record<GroundMarkId, boolean>;
  defaultRoundSec: number;
  defaultRestSec: number;
  /** kick-boxing rule set shown in the lists (K1, low kick, full contact) or every technique */
  kickboxingStyle: import('../domain/kickboxingStyles').KbStyleChoice;
  /**
   * 0.27 (Youssef, 2026-10-20 21:45: « prévoir une option pour enrouler / dérouler »): the action pill folded
   * into its round handle. Unfolded by default; settings saved before 0.27 get the default through `merge`.
   */
  actionPillCollapsed: boolean;
  /**
   * 0.27 (Youssef, 2026-10-20 21:59: « Permet d'agrandir la fenêtre ia et de la réduire »): size of the Coach IA
   * panel, the last one chosen. Normal by default; older saves get it through `merge`.
   */
  coachPanelSize: CoachPanelSize;
  /** 0.27: the one-time tip « touche deux fois le coach pour le plein écran » was shown and dismissed (or used) */
  stageFsHintSeen: boolean;
}

export type CoachPanelSize = 'reduit' | 'normal' | 'agrandi';
export const COACH_PANEL_SIZES: readonly CoachPanelSize[] = ['reduit', 'normal', 'agrandi'];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  voiceVolume: 1,
  effectsVolume: 0.8,
  voice: true,
  announceMoves: true,
  techniqueTips: true,
  impactSounds: false,
  quality: 'auto',
  coachStyle: 'encre',
  coachRender: 'premium',
  cameraAngle: 35,
  cameraMode: 'auto',
  cues: { trajectoire: true, hanches: true, pivot: true, articulations: true, pieds: true, garde: false, comparaison: false },
  seeThroughGear: false,
  groundMarks: { pieds: false, orientation: false, avantArriere: false, pivot: false, trajectoire: false },
  defaultRoundSec: 180,
  defaultRestSec: 60,
  kickboxingStyle: 'tous',
  actionPillCollapsed: false,
  coachPanelSize: 'normal',
  stageFsHintSeen: false,
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
      // v1 (0.14.0): the ink style becomes the default; 'manga' was the default before, so it moves to 'encre'
      // (an explicit 'realiste' choice is kept)
      version: 1,
      migrate: (saved, version) => {
        const st = (saved ?? {}) as { settings?: Partial<Settings> };
        if (version < 1 && st.settings?.coachStyle === 'manga') st.settings = { ...st.settings, coachStyle: 'encre' };
        return st as unknown as SettingsState;
      },
      // settings saved by an older version get the new fields with their default value
      merge: (saved, current) => {
        const s = (saved as { settings?: Partial<Settings> })?.settings ?? {};
        const size = COACH_PANEL_SIZES.includes(s.coachPanelSize as CoachPanelSize) ? s.coachPanelSize : DEFAULT_SETTINGS.coachPanelSize;
        return { ...current, settings: { ...DEFAULT_SETTINGS, theme: readSavedTheme(), ...s, coachPanelSize: size!, groundMarks: { ...DEFAULT_SETTINGS.groundMarks, ...(s.groundMarks ?? {}) } } };
      },
    },
  ),
);
