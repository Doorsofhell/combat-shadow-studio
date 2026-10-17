import { create } from 'zustand';
import { GUEST_SCOPE, currentScope, scopeReady, scopedGet, scopedSet } from '../store/storage';
import { FIRESTORE_EMULATOR, firebaseConfig } from './auth/config';
import { AuthError, getAuthProvider } from './auth';
import type { AuthCapabilities, AuthProvider, AuthUser, SignInMethod } from './auth';
import { scopeForUid, switchScope, wipeScope } from './scope';
import { useSyncPrefs } from './syncPrefs';
import { SyncEngine } from './sync/engine';
import type { SyncAdapter, SyncState, SyncStatus } from './sync/engine';
import { COLLECTIONS } from './sync/collections';

interface AccountState {
  status: 'loading' | 'guest' | 'signedIn';
  providerId: 'guest' | 'firebase';
  capabilities: AuthCapabilities;
  user: AuthUser | null;
  scope: string;
  sync: SyncStatus | null;
}

const NO_CAPS: AuthCapabilities = { email: false, google: false, passkey: false, link: false };

/** session state (not persisted: Firebase keeps its own session, the scope is kept by the storage) */
export const useAccount = create<AccountState>()(() => ({ status: 'loading', providerId: 'guest', capabilities: NO_CAPS, user: null, scope: GUEST_SCOPE, sync: null }));

let provider: AuthProvider | null = null;
let chain: Promise<void> = Promise.resolve();
/** set just before a sign-in so the guest data is moved into the account it opens */
let moveGuestOnNextUser = false;
let engine: SyncEngine | null = null;
let adapterFactory: ((uid: string) => Promise<SyncAdapter>) | null = null;

/** tests (and the emulator) can inject the provider and the sync adapter */
export function configureAccountForTests(p: AuthProvider, adapter?: (uid: string) => Promise<SyncAdapter>) {
  provider = p;
  adapterFactory = adapter ?? null;
}

async function getProvider() {
  return (provider ??= await getAuthProvider());
}

async function getAdapter(uid: string): Promise<SyncAdapter | null> {
  if (adapterFactory) return adapterFactory(uid);
  const cfg = firebaseConfig();
  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_APP_ID || !cfg) return null;
  const m = await import('./sync/firestore');
  return m.createFirestoreAdapter(cfg, FIRESTORE_EMULATOR);
}

const serial = (fn: () => Promise<void>) => (chain = chain.then(fn, fn).catch(() => undefined));

/** called once at start-up; never blocks the guest mode */
export async function initAccount() {
  await scopeReady();
  useAccount.setState({ scope: currentScope() });
  let p: AuthProvider;
  try {
    p = await getProvider();
  } catch {
    useAccount.setState({ status: 'guest' });
    return;
  }
  useAccount.setState({ providerId: p.id, capabilities: p.capabilities });
  const user = await p.init().catch(() => null);
  await adopt(user);
  p.onChange((u) => void adopt(u));
  useSyncPrefs.subscribe((s, prev) => s.enabled !== prev.enabled && void serial(() => restartSync()));
}

function adopt(user: AuthUser | null) {
  return serial(async () => {
    const want = user ? scopeForUid(user.uid) : GUEST_SCOPE;
    if (want !== currentScope()) {
      stopSync();
      const move = !!user && moveGuestOnNextUser && currentScope() === GUEST_SCOPE;
      await switchScope(want, move ? { moveFrom: GUEST_SCOPE } : {});
    }
    moveGuestOnNextUser = false;
    useAccount.setState({ user, status: user ? 'signedIn' : 'guest', scope: currentScope() });
    await restartSync();
  });
}

/** sync runs only for a signed-in user with a verified e-mail who turned it on */
async function restartSync() {
  stopSync();
  const { user } = useAccount.getState();
  if (!user || !useSyncPrefs.getState().enabled) {
    useAccount.setState({ sync: null });
    return;
  }
  if (!user.emailVerified) {
    useAccount.setState({ sync: { phase: 'error', lastSyncAt: null, pending: 0, message: 'Vérifie ton adresse e-mail pour activer la synchronisation.' } });
    return;
  }
  const adapter = await getAdapter(user.uid).catch(() => null);
  if (!adapter) {
    useAccount.setState({ sync: { phase: 'offline', lastSyncAt: null, pending: 0 } });
    return;
  }
  const scope = currentScope();
  const e = new SyncEngine({
    adapter,
    uid: user.uid,
    defs: COLLECTIONS,
    load: () => scopedGet<SyncState>('css-sync-state', scope),
    save: (s) => scopedSet('css-sync-state', s, scope),
    onStatus: (s) => engine === e && useAccount.setState({ sync: s }),
  });
  engine = e;
  await e.start();
}

function stopSync() {
  engine?.stop();
  engine = null;
}

export const syncNow = () => engine?.syncNow() ?? Promise.resolve();

// ------------------------------------------------------------------ actions used by the screens
export async function signUpEmail(email: string, password: string, moveGuestData: boolean) {
  const p = await getProvider();
  moveGuestOnNextUser = moveGuestData;
  try {
    const u = await p.signUpEmail(email, password);
    await adopt(u);
    return u;
  } finally {
    moveGuestOnNextUser = false;
  }
}

export async function signInEmail(email: string, password: string, moveGuestData: boolean) {
  const p = await getProvider();
  moveGuestOnNextUser = moveGuestData;
  try {
    const u = await p.signInEmail(email, password);
    await adopt(u);
    return u;
  } finally {
    moveGuestOnNextUser = false;
  }
}

export async function signInGoogle(moveGuestData: boolean) {
  const p = await getProvider();
  moveGuestOnNextUser = moveGuestData;
  try {
    const u = await p.signInGoogle();
    await adopt(u);
    return u;
  } finally {
    moveGuestOnNextUser = false;
  }
}

export const sendPasswordReset = async (email: string) => (await getProvider()).sendPasswordReset(email);
export const sendVerification = async () => (await getProvider()).sendVerification();

export async function refreshUser() {
  const u = await (await getProvider()).refresh();
  const was = useAccount.getState().user?.emailVerified;
  useAccount.setState({ user: u });
  if (u && u.emailVerified && !was) await serial(() => restartSync());
  return u;
}

export async function linkEmail(email: string, password: string) {
  const u = await (await getProvider()).linkEmail(email, password);
  useAccount.setState({ user: u });
}
export async function linkGoogle() {
  const u = await (await getProvider()).linkGoogle();
  useAccount.setState({ user: u });
}
export async function unlinkMethod(m: SignInMethod) {
  const u = await (await getProvider()).unlink(m);
  useAccount.setState({ user: u });
}
export const reauthenticate = async (m: SignInMethod, password?: string) => (await getProvider()).reauthenticate(m, password);

/** sign out; the account's data stays on this device for the next sign-in unless `wipe` */
export async function signOut(wipe: boolean) {
  const scope = currentScope();
  await engine?.flush().catch(() => undefined);
  stopSync();
  await (await getProvider()).signOut();
  await adopt(null);
  if (wipe && scope !== GUEST_SCOPE) await wipeScope(scope);
}

/**
 * "Supprimer mes données": the cloud copy first (if sync was used), then everything on this device,
 * including the encryption key. Returns what was actually deleted.
 */
export async function deleteMyData(): Promise<{ remote: boolean }> {
  const { user } = useAccount.getState();
  stopSync();
  let remote = false;
  if (user) {
    const adapter = await getAdapter(user.uid).catch(() => null);
    if (adapter) {
      try {
        await adapter.deleteAll(user.uid, COLLECTIONS.map((c) => c.name));
        remote = true;
      } catch {
        throw new AuthError('remote-delete-failed', 'Impossible de supprimer la copie en ligne pour l’instant (connexion ?). Rien n’a été effacé ; réessaie une fois en ligne.');
      }
    }
  }
  await wipeScope(currentScope());
  return { remote };
}

/** deletes the cloud data, the Firebase account and the local data; may require `reauthenticate` first */
export async function deleteAccount() {
  const { user } = useAccount.getState();
  if (!user) throw new AuthError('no-user', 'Aucun compte à supprimer.');
  const p = await getProvider();
  stopSync();
  const adapter = await getAdapter(user.uid).catch(() => null);
  if (adapter) {
    try {
      await adapter.deleteAll(user.uid, COLLECTIONS.map((c) => c.name));
    } catch {
      throw new AuthError('remote-delete-failed', 'Impossible de supprimer tes données en ligne pour l’instant (connexion ?). Ton compte n’a pas été supprimé ; réessaie une fois en ligne.');
    }
  }
  await p.deleteAccount();
  const scope = currentScope();
  await adopt(null);
  await wipeScope(scope);
}
