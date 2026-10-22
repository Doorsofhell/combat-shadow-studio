import { AuthError } from './types';
import type { AuthProvider } from './types';

const none = (): never => {
  throw new AuthError('unavailable', 'Les comptes en ligne ne sont pas activés dans cette version.');
};

/** Guest mode: no account, no network, the data lives in the `local` scope of this device. */
export const guestProvider: AuthProvider = {
  id: 'guest',
  capabilities: { email: false, google: false, passkey: false, link: false },
  init: async () => null,
  onChange: () => () => undefined,
  signUpEmail: async () => none(),
  signInEmail: async () => none(),
  signInGoogle: async () => none(),
  sendPasswordReset: async () => none(),
  sendVerification: async () => none(),
  refresh: async () => null,
  linkEmail: async () => none(),
  linkGoogle: async () => none(),
  unlink: async () => none(),
  updateDisplayName: async () => undefined,
  changeEmail: async () => none(),
  changePassword: async () => none(),
  reauthenticate: async () => none(),
  deleteAccount: async () => none(),
  signOut: async () => undefined,
  getIdToken: async () => null,
};
