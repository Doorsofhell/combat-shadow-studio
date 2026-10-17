import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { idbStorage } from './storage';

/**
 * Réglages et historique local du coach IA. L’historique est désactivé par défaut ; quand il est
 * activé, il reste sur l’appareil (IndexedDB) et n’est jamais envoyé.
 */
export interface CoachExchange {
  id: string;
  at: string;
  question: string;
  answer: string;
  intent: string;
  techniqueId?: string;
}

export interface CoachAiSettings {
  enabled: boolean;
  /** lire les réponses à voix haute (voix locale uniquement) */
  voiceReplies: boolean;
  detail: 'court' | 'detaille';
  keepHistory: boolean;
  /** saisie vocale du navigateur, EN LIGNE : l’audio part au service de reconnaissance ; désactivée par défaut */
  onlineSpeechOptIn: boolean;
}

export const DEFAULT_COACH_AI: CoachAiSettings = { enabled: true, voiceReplies: false, detail: 'court', keepHistory: false, onlineSpeechOptIn: false };
export const COACH_HISTORY_MAX = 100;

interface CoachAiState extends CoachAiSettings {
  history: CoachExchange[];
  set: (p: Partial<CoachAiSettings>) => void;
  /** ajoute un échange (ignoré si keepHistory est désactivé) */
  push: (e: Omit<CoachExchange, 'id' | 'at'>) => void;
  clearHistory: () => void;
}

export const useCoachAi = create<CoachAiState>()(
  persist(
    (setState, getState) => ({
      ...DEFAULT_COACH_AI,
      history: [],
      // désactiver l’historique l’efface aussitôt
      set: (p) => setState((s) => ({ ...p, history: p.keepHistory === false ? [] : s.history })),
      push: (e) => {
        if (!getState().keepHistory) return;
        const item: CoachExchange = { ...e, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() };
        setState((s) => ({ history: [item, ...s.history].slice(0, COACH_HISTORY_MAX) }));
      },
      clearHistory: () => setState({ history: [] }),
    }),
    {
      name: 'css-coach-ai',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ enabled: s.enabled, voiceReplies: s.voiceReplies, detail: s.detail, keepHistory: s.keepHistory, onlineSpeechOptIn: s.onlineSpeechOptIn, history: s.history }),
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CoachAiSettings & { history: CoachExchange[] }>;
        const keep = typeof p.keepHistory === 'boolean' ? p.keepHistory : DEFAULT_COACH_AI.keepHistory;
        return {
          ...current,
          enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULT_COACH_AI.enabled,
          voiceReplies: typeof p.voiceReplies === 'boolean' ? p.voiceReplies : DEFAULT_COACH_AI.voiceReplies,
          detail: p.detail === 'detaille' ? 'detaille' : 'court',
          keepHistory: keep,
          onlineSpeechOptIn: p.onlineSpeechOptIn === true,
          history: keep && Array.isArray(p.history) ? p.history.slice(0, COACH_HISTORY_MAX) : [],
        };
      },
    },
  ),
);
