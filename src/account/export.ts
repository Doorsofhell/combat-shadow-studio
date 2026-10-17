import { useProfile } from '../store/profile';
import { useSettings } from '../store/settings';
import { useStats } from '../store/stats';
import { useCustom } from '../store/custom';
import { useGoals } from '../store/goals';
import { useFighters } from '../store/fighters';
import { useCatalogUser } from '../store/catalog';
import { currentScope, scopeKeys } from '../store/storage';
import { useSyncPrefs } from './syncPrefs';
import type { AuthUser } from './auth/types';

/** keys exported from the stores themselves (decrypted) or internal to the sync */
const HANDLED = new Set(['css-profile', 'css-stats', 'css-custom', 'css-goals', 'css-fighters', 'css-catalog', 'css-sync-prefs', 'css-sync-state']);

/**
 * Full export of the current user's data (right of access / portability). Physical limitations are
 * included in clear in this file, which the user keeps. The top-level `sessions`, `perExercise` and
 * `custom` keep the file importable by the existing import (Réglages > Importer).
 */
export async function buildFullExport(user: AuthUser | null) {
  const stats = useStats.getState();
  const g = useGoals.getState();
  const f = useFighters.getState();
  const c = useCatalogUser.getState();
  const other: Record<string, unknown> = {};
  // data of other features saved in this user's scope (for example the AI coach)
  for (const [name, v] of await scopeKeys(currentScope())) {
    if (HANDLED.has(name)) continue;
    try {
      other[name] = typeof v === 'string' ? JSON.parse(v) : v;
    } catch {
      other[name] = v;
    }
  }
  return JSON.stringify(
    {
      app: 'combat-shadow-studio',
      kind: 'export-complet',
      version: 2,
      exportedAt: new Date().toISOString(),
      account: user ? { type: 'compte', uid: user.uid, email: user.email, emailVerified: user.emailVerified, methods: user.methods, createdAt: user.createdAt } : { type: 'invite' },
      profile: useProfile.getState().profile,
      settings: useSettings.getState().settings,
      sync: { enabled: useSyncPrefs.getState().enabled },
      sessions: stats.sessions,
      perExercise: stats.perExercise,
      custom: useCustom.getState().combos,
      goals: { goals: g.goals, favTechniques: g.favTechniques, favExercises: g.favExercises },
      fighters: { fighters: f.fighters, activeId: f.activeId },
      catalog: { favorites: c.favorites, history: c.history, collections: c.collections, imported: c.imported },
      other,
    },
    null,
    2,
  );
}
