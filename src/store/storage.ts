import { del, entries, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * zustand storage backed by IndexedDB (falls back to memory if IndexedDB is unavailable).
 *
 * Every persisted key is namespaced per user ("scope") so several people, or a guest and an
 * account, never share data on one device:
 *   css-profile  ->  u:<scope>:css-profile
 * The guest scope is `local`. Device-level keys (settings, account metadata) are not namespaced.
 * On the first run of this version the old un-namespaced keys are moved into the guest scope.
 */
export const GUEST_SCOPE = 'local';
/** keys that belong to the device, not to a person */
export const DEVICE_KEYS = new Set(['css-settings']);
/** device-level account metadata (current scope, migration marker) */
export const META_PREFIX = 'css-meta:';
export const CURRENT_SCOPE_KEY = `${META_PREFIX}current-scope`;
export const MIGRATION_KEY = `${META_PREFIX}scope-migrated`;

const memory = new Map<string, unknown>();

export async function rawGet<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch {
    return memory.get(key) as T | undefined;
  }
}
export async function rawSet(key: string, value: unknown) {
  try {
    await set(key, value);
  } catch {
    memory.set(key, value);
  }
}
export async function rawDel(key: string) {
  try {
    await del(key);
  } catch {
    memory.delete(key);
  }
}
export async function rawEntries(): Promise<[string, unknown][]> {
  try {
    return (await entries()).map(([k, v]) => [String(k), v]);
  } catch {
    return [...memory.entries()];
  }
}

export const isDeviceKey = (name: string) => DEVICE_KEYS.has(name) || name.startsWith(META_PREFIX);
export const scopePrefix = (scope: string) => `u:${scope}:`;
export const scopedKey = (name: string, scope: string) => (isDeviceKey(name) ? name : `${scopePrefix(scope)}${name}`);

let scope = GUEST_SCOPE;
let readyPromise: Promise<void> | null = null;
let isReady = false;
let paused = 0;
/** names read by persisted stores during this session (used to detect stores the switcher does not know) */
const seen = new Set<string>();

/**
 * Moves the keys written by older versions (`css-profile`, `css-stats`… without namespace) into the
 * guest scope. Copy first, mark, then delete: an interruption can only leave a duplicate, never a loss.
 * An existing namespaced value is never overwritten.
 */
export async function migrateLegacyKeys() {
  if (await rawGet(MIGRATION_KEY)) return { moved: [] as string[] };
  const all = await rawEntries();
  const legacy = all.filter(([k]) => k.startsWith('css-') && !isDeviceKey(k));
  const existing = new Set(all.map(([k]) => k));
  const moved: string[] = [];
  for (const [k, v] of legacy) {
    const target = scopedKey(k, GUEST_SCOPE);
    if (!existing.has(target)) await rawSet(target, v);
    moved.push(k);
  }
  await rawSet(MIGRATION_KEY, { at: new Date().toISOString(), moved });
  for (const k of moved) await rawDel(k);
  return { moved };
}

async function init() {
  try {
    await migrateLegacyKeys();
  } catch {
    // never block the app: the old keys stay where they are and are retried next launch
  }
  const cur = await rawGet<string>(CURRENT_SCOPE_KEY);
  if (typeof cur === 'string' && cur) scope = cur;
  isReady = true;
}

/** resolves once the legacy migration ran and the current scope is known */
export function scopeReady() {
  return (readyPromise ??= init());
}
export const currentScope = () => scope;
/** the scope if it is already known, without waiting */
export const captureScope = () => (isReady ? scope : null);
export const writesPaused = () => paused > 0;
export const seenNames = () => [...seen];

/** while switching user, store resets must not be written to either scope */
export function pauseWrites(on: boolean) {
  paused = Math.max(0, paused + (on ? 1 : -1));
}

/** changes the current scope and remembers it for the next launch (stores are rehydrated by the caller) */
export async function setCurrentScope(next: string) {
  await scopeReady();
  scope = next;
  await rawSet(CURRENT_SCOPE_KEY, next);
}

export async function scopeKeys(s: string) {
  const p = scopePrefix(s);
  return (await rawEntries()).filter(([k]) => k.startsWith(p)).map(([k, v]) => [k.slice(p.length), v] as [string, unknown]);
}

/** deletes every key of a scope from this device */
export async function clearScope(s: string) {
  for (const [name] of await scopeKeys(s)) await rawDel(scopedKey(name, s));
  // 0.33: synchronous copy of the interrupted sessions (src/store/resume.ts)
  try {
    localStorage.removeItem(`css-resume-mirror:${s}`);
  } catch {
    // no localStorage: nothing to remove
  }
}

/** copies a scope into another one (guest -> new account); `overwrite` false keeps the target's values */
export async function copyScope(from: string, to: string, overwrite = false) {
  const target = new Set((await scopeKeys(to)).map(([n]) => n));
  for (const [name, v] of await scopeKeys(from)) if (overwrite || !target.has(name)) await rawSet(scopedKey(name, to), v);
}

/** reads / writes a named value in a given scope (the current one by default) */
export async function scopedGet<T>(name: string, s?: string) {
  await scopeReady();
  return rawGet<T>(scopedKey(name, s ?? scope));
}
export async function scopedSet(name: string, value: unknown, s?: string) {
  await scopeReady();
  await rawSet(scopedKey(name, s ?? scope), value);
}

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    seen.add(name);
    await scopeReady();
    const v = await rawGet<string>(scopedKey(name, scope));
    return typeof v === 'string' ? v : null;
  },
  setItem: async (name, value) => {
    if (writesPaused()) return;
    // the key is fixed at call time so a write never lands in the scope of the next user
    const s = captureScope();
    await scopeReady();
    await rawSet(scopedKey(name, s ?? scope), value);
  },
  removeItem: async (name) => {
    if (writesPaused()) return;
    const s = captureScope();
    await scopeReady();
    await rawDel(scopedKey(name, s ?? scope));
  },
};
