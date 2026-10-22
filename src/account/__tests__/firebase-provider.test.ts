// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { createFirebaseProvider, toAuthError } from '../auth/firebase';
import { emailLooksValid, passwordProblem } from '../auth/types';
import { guestProvider } from '../auth/guest';
import { FIREBASE_ENABLED, firebaseConfig } from '../auth/config';

describe('fournisseur Firebase (sans réseau)', () => {
  test('dans l’application Android, Google est masqué tant que le module natif n’est pas installé', async () => {
    const p = await createFirebaseProvider({ apiKey: 'k', authDomain: 'demo.firebaseapp.com', projectId: 'demo-x', appId: 'a' }, { native: true });
    expect(p.capabilities).toEqual({ email: true, google: false, passkey: false, link: true });
    await expect(p.signInGoogle()).rejects.toMatchObject({ code: 'unavailable' });
  });

  test('messages d’erreur en français, sans révéler si un compte existe', () => {
    expect(toAuthError({ code: 'auth/user-not-found' }).message).toBe(toAuthError({ code: 'auth/wrong-password' }).message);
    expect(toAuthError({ code: 'auth/network-request-failed' }).message).toContain('connexion');
    expect(toAuthError(new Error('x')).message).toBe('Une erreur est survenue. Réessaie.');
  });

  test('sans configuration à la compilation, seul le mode invité existe', async () => {
    expect(FIREBASE_ENABLED).toBe(false);
    expect(firebaseConfig()).toBeNull();
    expect(guestProvider.capabilities).toEqual({ email: false, google: false, passkey: false, link: false });
    await expect(guestProvider.signInEmail('a@b.fr', 'x')).rejects.toThrow('pas activés');
  });

  test('règles du mot de passe et de l’e-mail', () => {
    expect(passwordProblem('court1')).toContain('8');
    expect(passwordProblem('motdepasse')).toContain('chiffre');
    expect(passwordProblem('motdepasse1')).toBeNull();
    expect(emailLooksValid('yan@example.com')).toBe(true);
    expect(emailLooksValid('yan@example')).toBe(false);
  });
});

describe('robustesse du mot de passe (v0.37)', () => {
  test('indication progressive, jamais au-dessus de 0 sans les règles minimales', async () => {
    const { passwordStrength } = await import('../auth/types');
    expect(passwordStrength('court1')).toBe(0);
    expect(passwordStrength('motdepasse')).toBe(0);
    expect(passwordStrength('boxeur12')).toBe(1);
    expect(passwordStrength('boxeurfou12')).toBe(2);
    expect(passwordStrength('Boxeur-Fou-2026')).toBe(3);
  });
});
