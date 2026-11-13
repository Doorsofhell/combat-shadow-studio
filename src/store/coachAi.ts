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

/** questions suggérées montrées récemment (0.27) : le panneau en propose d’autres à l’ouverture suivante */
export const COACH_SEEN_MAX = 60;

interface CoachAiState extends CoachAiSettings {
  history: CoachExchange[];
  /** questions suggérées déjà montrées, la plus récente d’abord (textes de l’application, rien de saisi) */
  recentSuggestions: string[];
  /** retient les questions qui viennent d’être montrées (après le chargement des réglages) */
  noteSuggestions: (shown: string[]) => void;
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
      recentSuggestions: [],
      noteSuggestions: (shown) => {
        const add = () => {
          const prev = getState().recentSuggestions;
          const fresh = shown.filter((q, i) => typeof q === 'string' && q && shown.indexOf(q) === i);
          const next = [...fresh, ...prev.filter((q) => !fresh.includes(q))].slice(0, COACH_SEEN_MAX);
          if (next.length === prev.length && next.every((q, i) => q === prev[i])) return;
          setState({ recentSuggestions: next });
        };
        // never write before the saved settings are read back (it would overwrite them)
        const p = useCoachAi.persist;
        if (p && !p.hasHydrated()) {
          const stop = p.onFinishHydration(() => {
            stop();
            add();
          });
          return;
        }
        add();
      },
      // désactiver l’historique l’efface aussitôt
      set: (p) => setState((s) => ({ ...p, history: p.keepHistory === false ? [] : s.history })),
      push: (e) => {
        const add = () => {
          if (!getState().keepHistory) return;
          const item: CoachExchange = { ...e, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() };
          setState((s) => ({ history: [item, ...s.history].slice(0, COACH_HISTORY_MAX) }));
        };
        // 0.25: a question asked right after the app opens, before the saved settings are read back,
        // was dropped (keepHistory still at its default): wait for them instead
        const p = useCoachAi.persist;
        if (p && !p.hasHydrated()) {
          const stop = p.onFinishHydration(() => {
            stop();
            add();
          });
          return;
        }
        add();
      },
      clearHistory: () => setState({ history: [] }),
    }),
    {
      name: 'css-coach-ai',
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ enabled: s.enabled, voiceReplies: s.voiceReplies, detail: s.detail, keepHistory: s.keepHistory, onlineSpeechOptIn: s.onlineSpeechOptIn, history: s.history, recentSuggestions: s.recentSuggestions }),
      merge: (saved, current) => {
        const p = (saved ?? {}) as Partial<CoachAiSettings & { history: CoachExchange[]; recentSuggestions: unknown }>;
        const keep = typeof p.keepHistory === 'boolean' ? p.keepHistory : DEFAULT_COACH_AI.keepHistory;
        return {
          ...current,
          enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULT_COACH_AI.enabled,
          voiceReplies: typeof p.voiceReplies === 'boolean' ? p.voiceReplies : DEFAULT_COACH_AI.voiceReplies,
          detail: p.detail === 'detaille' ? 'detaille' : 'court',
          keepHistory: keep,
          onlineSpeechOptIn: p.onlineSpeechOptIn === true,
          history: keep && Array.isArray(p.history) ? p.history.slice(0, COACH_HISTORY_MAX) : [],
          // 0.27: absent from older saves
          recentSuggestions: Array.isArray(p.recentSuggestions) ? p.recentSuggestions.filter((q): q is string => typeof q === 'string').slice(0, COACH_SEEN_MAX) : [],
        };
      },
    },
  ),
);
