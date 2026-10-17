/**
 * Firebase Authentication provider (modular SDK). This module and the SDK are loaded with a dynamic
 * import only when the build has a Firebase config, so they never weigh on the main bundle.
 *
 * - e-mail + password: sign-up sends a verification e-mail; reset by e-mail; Firebase hashes passwords.
 * - Google: popup on the web. In the Android app (WebView) popups are not supported, so the Google
 *   option is hidden there until the native plugin is added (see docs/COMPTES.md).
 * - sessions: kept by the SDK in IndexedDB (ID token valid one hour, refreshed automatically);
 *   the app never copies tokens elsewhere.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { AuthError } from './types';
import type { AuthProvider, AuthUser, SignInMethod } from './types';
import type { FirebaseWebConfig } from './config';

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'E-mail ou mot de passe incorrect.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connecte-toi ou réinitialise ton mot de passe.',
  'auth/weak-password': 'Mot de passe trop faible.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Pas de connexion internet. Réessaie une fois en ligne.',
  'auth/requires-recent-login': 'Pour ta sécurité, confirme ton identité avant cette action.',
  'auth/popup-closed-by-user': 'Connexion Google annulée.',
  'auth/cancelled-popup-request': 'Connexion Google annulée.',
  'auth/popup-blocked': 'Le navigateur a bloqué la fenêtre de connexion Google.',
  'auth/credential-already-in-use': 'Ce compte Google est déjà relié à un autre compte.',
  'auth/provider-already-linked': 'Cette méthode est déjà reliée à ton compte.',
  'auth/no-such-provider': 'Cette méthode n’est pas reliée à ton compte.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet e-mail : connecte-toi avec ta méthode habituelle, puis relie Google depuis ton profil.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/operation-not-allowed': 'Cette méthode de connexion n’est pas activée pour ce projet.',
};

export function toAuthError(e: unknown): AuthError {
  if (e instanceof AuthError) return e;
  const code = (e as { code?: string })?.code ?? 'unknown';
  return new AuthError(code, MESSAGES[code] ?? 'Une erreur est survenue. Réessaie.');
}

export function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    emailVerified: u.emailVerified,
    displayName: u.displayName,
    methods: u.providerData.map((p) => p.providerId).filter((p): p is SignInMethod => p === 'password' || p === 'google.com'),
    createdAt: u.metadata.creationTime,
    lastSignInAt: u.metadata.lastSignInTime,
  };
}

let appPromise: Promise<FirebaseApp> | null = null;
/** shared Firebase app (also used by the Firestore sync adapter) */
export function firebaseApp(cfg: FirebaseWebConfig) {
  return (appPromise ??= import('firebase/app').then(({ getApps, initializeApp }) => getApps()[0] ?? initializeApp(cfg)));
}

export async function createFirebaseProvider(cfg: FirebaseWebConfig, opts: { emulator?: string; native?: boolean } = {}): Promise<AuthProvider> {
  const m = await import('firebase/auth');
  const app = await firebaseApp(cfg);
  const native = opts.native ?? Capacitor.isNativePlatform();
  let auth: Auth;
  try {
    auth = m.initializeAuth(app, {
      persistence: [m.indexedDBLocalPersistence, m.browserLocalPersistence],
      popupRedirectResolver: native ? undefined : m.browserPopupRedirectResolver,
    });
  } catch {
    auth = m.getAuth(app); // already initialised (hot reload)
  }
  auth.languageCode = 'fr';
  if (opts.emulator) m.connectAuthEmulator(auth, opts.emulator, { disableWarnings: true });

  const google = () => {
    const p = new m.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    return p;
  };
  const current = () => {
    if (!auth.currentUser) throw new AuthError('no-user', 'Tu n’es pas connecté.');
    return auth.currentUser;
  };
  const wrap = async <T,>(fn: () => Promise<T>) => {
    try {
      return await fn();
    } catch (e) {
      throw toAuthError(e);
    }
  };

  return {
    id: 'firebase',
    capabilities: { email: true, google: !native, passkey: false, link: true },
    init: async () => {
      await auth.authStateReady();
      return auth.currentUser ? toAuthUser(auth.currentUser) : null;
    },
    onChange: (cb) => m.onAuthStateChanged(auth, (u) => cb(u ? toAuthUser(u) : null)),
    signUpEmail: (email, password) =>
      wrap(async () => {
        const r = await m.createUserWithEmailAndPassword(auth, email.trim(), password);
        await m.sendEmailVerification(r.user).catch(() => undefined);
        return toAuthUser(r.user);
      }),
    signInEmail: (email, password) => wrap(async () => toAuthUser((await m.signInWithEmailAndPassword(auth, email.trim(), password)).user)),
    signInGoogle: () =>
      wrap(async () => {
        if (native) throw new AuthError('unavailable', 'La connexion Google n’est pas encore disponible dans l’application Android.');
        return toAuthUser((await m.signInWithPopup(auth, google())).user);
      }),
    // the same neutral answer whether or not the address has an account (no account enumeration)
    sendPasswordReset: (email) => wrap(async () => void (await m.sendPasswordResetEmail(auth, email.trim()).catch((e) => {
      if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    }))),
    sendVerification: () => wrap(() => m.sendEmailVerification(current())),
    refresh: () =>
      wrap(async () => {
        if (!auth.currentUser) return null;
        const before = auth.currentUser.emailVerified;
        await m.reload(auth.currentUser);
        // the ID token keeps the old email_verified claim until refreshed; the Firestore rules read it
        if (auth.currentUser.emailVerified && !before) await auth.currentUser.getIdToken(true);
        return toAuthUser(auth.currentUser);
      }),
    linkEmail: (email, password) =>
      wrap(async () => {
        const r = await m.linkWithCredential(current(), m.EmailAuthProvider.credential(email.trim(), password));
        if (!r.user.emailVerified) await m.sendEmailVerification(r.user).catch(() => undefined);
        return toAuthUser(r.user);
      }),
    linkGoogle: () =>
      wrap(async () => {
        if (native) throw new AuthError('unavailable', 'La connexion Google n’est pas encore disponible dans l’application Android.');
        return toAuthUser((await m.linkWithPopup(current(), google())).user);
      }),
    unlink: (method) =>
      wrap(async () => {
        const u = current();
        if (u.providerData.length <= 1) throw new AuthError('last-method', 'Garde au moins une méthode de connexion.');
        return toAuthUser(await m.unlink(u, method));
      }),
    updateDisplayName: (name) => wrap(() => m.updateProfile(current(), { displayName: name.trim() || null })),
    reauthenticate: (method, password) =>
      wrap(async () => {
        const u = current();
        if (method === 'password') {
          if (!u.email || !password) throw new AuthError('missing-password', 'Entre ton mot de passe.');
          await m.reauthenticateWithCredential(u, m.EmailAuthProvider.credential(u.email, password));
        } else {
          if (native) throw new AuthError('unavailable', 'La connexion Google n’est pas encore disponible dans l’application Android.');
          await m.reauthenticateWithPopup(u, google());
        }
      }),
    deleteAccount: () => wrap(() => m.deleteUser(current())),
    signOut: () => wrap(() => m.signOut(auth)),
    getIdToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
  };
}
