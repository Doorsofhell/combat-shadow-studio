/**
 * Firebase web configuration, read at build time from VITE_FIREBASE_* variables.
 * These values are public identifiers of the project (they ship in every Firebase web app),
 * not secrets: access is protected by Firebase Authentication and the Firestore security rules.
 * No private key, service account or admin secret ever belongs in the frontend.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

const env = import.meta.env;

export function firebaseConfig(): FirebaseWebConfig | null {
  const c = { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID };
  return c.apiKey && c.authDomain && c.projectId && c.appId ? (c as FirebaseWebConfig) : null;
}

/** true only when the four values were provided at build time */
export const FIREBASE_ENABLED = !!(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);

/** local emulators (development only), e.g. http://127.0.0.1:9099 and 127.0.0.1:8080 */
export const AUTH_EMULATOR: string | undefined = env.VITE_FIREBASE_AUTH_EMULATOR || undefined;
export const FIRESTORE_EMULATOR: string | undefined = env.VITE_FIREBASE_FIRESTORE_EMULATOR || undefined;
