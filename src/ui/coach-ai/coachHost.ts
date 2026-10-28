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
  /** 1.0.0 (lot 3): a question typed in « Rechercher ou demander au coach », asked as soon as the panel opens */
  pending: string | null;
  setOpen: (open: boolean) => void;
  setHost: (host: CoachHost | null) => void;
  ask: (question: string) => void;
  takePending: () => string | null;
}

export const useCoachBubble = create<CoachBubbleState>((set, get) => ({
  open: false,
  host: null,
  pending: null,
  setOpen: (open) => set({ open }),
  setHost: (host) => set({ host }),
  ask: (question) => set({ open: true, pending: question.trim() || null }),
  takePending: () => {
    const q = get().pending;
    if (q) set({ pending: null });
    return q;
  },
}));
