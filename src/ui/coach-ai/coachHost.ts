import { create } from 'zustand';
import type { CoachAction } from '../../coach/engine';
import type { CoachAskPanelProps } from './CoachAskPanel';

/**
 * 0.25 (Youssef, 2026-10-20 12:30: « le coach IA doit être identique sur tous les écrans, une bulle
 * flottante en bas à droite »): one bubble for the whole app. A screen that runs something the coach
 * can act on (the training session) registers here as the bubble's host: the bubble then asks with the
 * host's context and hands it the actions (demo, slow motion, repeat…), and shows itself in the host's
 * slot so it never covers the screen's own controls.
 */
export interface CoachHost {
  /** where the bubble and its panel are shown (inside the host's layout) */
  slot: HTMLElement;
  context: CoachAskPanelProps['context'];
  /** acts on the host; the panel closes first when the action says so */
  onAction: (a: CoachAction) => void;
}

interface CoachBubbleState {
  open: boolean;
  host: CoachHost | null;
  setOpen: (open: boolean) => void;
  setHost: (host: CoachHost | null) => void;
}

export const useCoachBubble = create<CoachBubbleState>((set) => ({
  open: false,
  host: null,
  setOpen: (open) => set({ open }),
  setHost: (host) => set({ host }),
}));
