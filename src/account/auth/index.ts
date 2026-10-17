import { AUTH_EMULATOR, firebaseConfig } from './config';
import { guestProvider } from './guest';
import type { AuthProvider } from './types';

export * from './types';
export { FIREBASE_ENABLED } from './config';

let provider: Promise<AuthProvider> | null = null;

/**
 * The active provider: Firebase when the build has a config (the SDK is fetched on demand),
 * the guest provider otherwise or when Firebase fails to load (offline first launch).
 */
export function getAuthProvider(): Promise<AuthProvider> {
  if (!provider) {
    const cfg = firebaseConfig();
    // written with import.meta.env inline so the build drops the Firebase chunks when it is not configured
    provider =
      import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_APP_ID && cfg
        ? import('./firebase')
            .then((m) => m.createFirebaseProvider(cfg, { emulator: AUTH_EMULATOR }))
            .catch(() => {
              provider = null; // retried next time
              return guestProvider;
            })
        : Promise.resolve(guestProvider);
  }
  return provider;
}
