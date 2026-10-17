import { useProfile } from '../store/profile';
import { useStats } from '../store/stats';
import { useCustom } from '../store/custom';
import { useGoals } from '../store/goals';
import { useFighters } from '../store/fighters';
import { useCatalogUser } from '../store/catalog';
import { clearScope, copyScope, currentScope, isDeviceKey, pauseWrites, rawGet, rawSet, scopeKeys, scopeReady, scopedKey, seenNames, setCurrentScope } from '../store/storage';
import { deleteKey, isSealed, openText, sealText } from './crypto';
import { useSyncPrefs } from './syncPrefs';
import { useCoachAi } from '../store/coachAi';

/** the part of a zustand persisted store the scope switcher needs */
export interface ScopedStore {
  getInitialState(): unknown;
  setState(s: never, replace: true): void;
  persist: { rehydrate(): Promise<void> | void; getOptions(): { name?: string } };
}

const stores = new Set<ScopedStore>([useProfile, useStats, useCustom, useGoals, useFighters, useCatalogUser, useSyncPrefs, useCoachAi] as unknown as ScopedStore[]);

/**
 * Stores created elsewhere (e.g. the AI coach) can register here to be reloaded in place when the
 * user changes; an unregistered persisted store triggers a full page reload instead, so no data of
 * the previous user can stay in memory.
 */
export function registerScopedStore(s: ScopedStore) {
  stores.add(s);
}

export const scopeForUid = (uid: string) => `fb-${uid}`;

let reloadPage = () => window.location.reload();
/** tests replace the page reload */
export function setReloadForTests(fn: () => void) {
  reloadPage = fn;
}

async function rehydrateAll() {
  for (const s of stores) s.setState(s.getInitialState() as never, true);
  await Promise.all([...stores].map((s) => s.persist.rehydrate()));
}

/**
 * Makes `next` the current user scope and reloads every store from it. Writes are paused while the
 * stores are reset, so neither the previous nor the next user's data is overwritten.
 * `moveFrom`: copies that scope into `next` first (keys the target already has are kept), then
 * deletes it (guest data becoming an account's data).
 */
export async function switchScope(next: string, opts: { moveFrom?: string } = {}) {
  await scopeReady();
  const known = new Set([...stores].map((s) => s.persist.getOptions().name));
  const unknown = seenNames().filter((n) => !isDeviceKey(n) && !known.has(n));
  const targetHadProfile = (await scopeKeys(next)).some(([n]) => n === 'css-profile');
  pauseWrites(true);
  try {
    if (opts.moveFrom && opts.moveFrom !== next) {
      await copyScope(opts.moveFrom, next);
      if (!targetHadProfile) await resealProfile(opts.moveFrom, next);
    }
    await setCurrentScope(next);
    if (unknown.length) {
      if (opts.moveFrom && opts.moveFrom !== next) await wipeLocal(opts.moveFrom);
      reloadPage();
      return;
    }
    await rehydrateAll();
  } finally {
    pauseWrites(false);
  }
  if (opts.moveFrom && opts.moveFrom !== next) await wipeLocal(opts.moveFrom);
}

/** the limitations copied from another scope were sealed with that scope's key: seal them with the new one */
async function resealProfile(from: string, to: string) {
  const raw = await rawGet<string>(scopedKey('css-profile', to));
  if (typeof raw !== 'string') return;
  const v = JSON.parse(raw) as { state: { profile: { limitationsSealed?: unknown } } };
  const box = v.state?.profile?.limitationsSealed;
  if (!isSealed(box)) return;
  const plain = await openText(box, from);
  if (plain === null) delete v.state.profile.limitationsSealed;
  else v.state.profile.limitationsSealed = await sealText(plain, to);
  await rawSet(scopedKey('css-profile', to), JSON.stringify(v));
}

async function wipeLocal(scope: string) {
  await clearScope(scope);
  await deleteKey(scope);
}

/** deletes every local datum of a scope (and its encryption key); reloads the stores if it is the current one */
export async function wipeScope(scope: string) {
  await scopeReady();
  pauseWrites(true);
  try {
    await wipeLocal(scope);
    if (scope === currentScope()) await rehydrateAll();
  } finally {
    pauseWrites(false);
  }
}
