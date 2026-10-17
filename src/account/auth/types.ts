/**
 * Provider-agnostic authentication. The app talks to an `AuthProvider`; two implementations exist:
 * - `guest`: always available, no account, everything on the device (default);
 * - `firebase`: Firebase Authentication, enabled only when the build has a Firebase web config.
 * No provider ever stores a password: Firebase hashes it on its servers (scrypt) and keeps only
 * its own short-lived ID token and refresh token, managed by the SDK.
 */
export type SignInMethod = 'password' | 'google.com';

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  /** sign-in methods linked to this account */
  methods: SignInMethod[];
  createdAt?: string;
  lastSignInAt?: string;
}

export interface AuthCapabilities {
  /** e-mail + password, verification e-mail, password reset */
  email: boolean;
  /** Google sign-in that really works on this platform (web popup; native needs a plugin, see docs/COMPTES.md) */
  google: boolean;
  /** passkeys: not offered (Firebase Authentication has no passkey provider, see docs/COMPTES.md) */
  passkey: false;
  /** several sign-in methods on one account */
  link: boolean;
}

export interface AuthProvider {
  readonly id: 'guest' | 'firebase';
  readonly capabilities: AuthCapabilities;
  /** current user (null = guest); resolves once the persisted session was read */
  init(): Promise<AuthUser | null>;
  onChange(cb: (u: AuthUser | null) => void): () => void;
  signUpEmail(email: string, password: string): Promise<AuthUser>;
  signInEmail(email: string, password: string): Promise<AuthUser>;
  signInGoogle(): Promise<AuthUser>;
  sendPasswordReset(email: string): Promise<void>;
  sendVerification(): Promise<void>;
  /** reloads the user from the server (after clicking the verification link) */
  refresh(): Promise<AuthUser | null>;
  linkEmail(email: string, password: string): Promise<AuthUser>;
  linkGoogle(): Promise<AuthUser>;
  unlink(method: SignInMethod): Promise<AuthUser>;
  updateDisplayName(name: string): Promise<void>;
  /** confirms identity before a sensitive operation (account deletion) */
  reauthenticate(method: SignInMethod, password?: string): Promise<void>;
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
  /** ID token for a future backend; never stored by the app */
  getIdToken(): Promise<string | null>;
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const MIN_PASSWORD = 8;

/** password rules checked before any request: 8 characters, a letter and a digit */
export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Au moins ${MIN_PASSWORD} caractères.`;
  if (!/[A-Za-zÀ-ÿ]/.test(pw) || !/\d/.test(pw)) return 'Mélange au moins une lettre et un chiffre.';
  return null;
}

export const emailLooksValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
