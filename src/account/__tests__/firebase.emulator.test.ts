// @vitest-environment node
/**
 * Runs against the Firebase Auth + Firestore emulators only (no real project):
 *   npx firebase-tools emulators:exec --only auth,firestore --project demo-css \
 *     "FIREBASE_EMULATORS=1 npx vitest run src/account/__tests__/firebase.emulator.test.ts"
 * Skipped otherwise.
 */
import { describe, expect, test } from 'vitest';
import { createFirebaseProvider } from '../auth/firebase';
import { createFirestoreAdapter } from '../sync/firestore';
import { track } from '../sync/model';

const RUN = process.env.FIREBASE_EMULATORS === '1';
const PROJECT = 'demo-css';
const AUTH = 'http://127.0.0.1:9099';
const cfg = { apiKey: 'demo-key', authDomain: 'demo-css.firebaseapp.com', projectId: PROJECT, appId: 'demo-app' };

/** reads the out-of-band codes (verification, reset) the emulator "sent" by e-mail */
async function oob(email: string, type: 'VERIFY_EMAIL' | 'PASSWORD_RESET') {
  const r = await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`);
  const { oobCodes } = (await r.json()) as { oobCodes: { email: string; requestType: string; oobLink: string; oobCode: string }[] };
  return oobCodes.filter((c) => c.email === email && c.requestType === type).at(-1);
}

describe.skipIf(!RUN)('Firebase (émulateurs)', () => {
  test('inscription, vérification de l’e-mail, connexion, réinitialisation, synchronisation et règles, suppression', async () => {
    await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
    const p = await createFirebaseProvider(cfg, { emulator: AUTH, native: false });
    expect(await p.init()).toBeNull();
    const email = `yan-${Date.now()}@example.com`;

    // sign-up sends the verification e-mail
    const u = await p.signUpEmail(email, 'motdepasse1');
    expect(u.emailVerified).toBe(false);
    expect(u.methods).toEqual(['password']);
    const verify = await oob(email, 'VERIFY_EMAIL');
    expect(verify).toBeTruthy();

    // unverified: the rules refuse the sync documents
    const db = await createFirestoreAdapter(cfg, '127.0.0.1:8080');
    const doc = track(null, { fields: { pseudo: 'Yan' }, items: {} }, 'profile', 1000).doc;
    await expect(db.push(u.uid, 'profile', doc)).rejects.toBeTruthy();

    // click on the link, then refresh
    await fetch(verify!.oobLink);
    const fresh = await p.refresh();
    expect(fresh?.emailVerified).toBe(true);
    // refresh() also renews the ID token so the rules see email_verified = true
    await db.push(u.uid, 'profile', doc);
    expect((await db.pull(u.uid, 'profile'))?.fields.pseudo.value).toBe('Yan');
    // another user's subtree is refused
    await expect(db.pull('someone-else', 'profile')).rejects.toBeTruthy();
    await expect(db.push('someone-else', 'profile', doc)).rejects.toBeTruthy();
    // malformed document refused
    await expect(db.push(u.uid, 'profile', { foo: 1 } as never)).rejects.toBeTruthy();

    // wrong password, sign-out, sign-in
    await p.signOut();
    await expect(p.signInEmail(email, 'mauvais123')).rejects.toMatchObject({ message: 'E-mail ou mot de passe incorrect.' });
    expect((await p.signInEmail(email, 'motdepasse1')).uid).toBe(u.uid);
    await expect(p.signUpEmail(email, 'motdepasse1')).rejects.toMatchObject({ code: 'auth/email-already-in-use' });

    // password reset e-mail
    await p.sendPasswordReset(email);
    expect(await oob(email, 'PASSWORD_RESET')).toBeTruthy();
    // unknown address: same neutral success (no account enumeration)
    await expect(p.sendPasswordReset('inconnu@example.com')).resolves.toBeUndefined();

    // a single method cannot be unlinked
    await expect(p.unlink('password')).rejects.toMatchObject({ code: 'last-method' });

    // data deletion then account deletion
    await db.deleteAll(u.uid, ['profile']);
    expect(await db.pull(u.uid, 'profile')).toBeNull();
    await p.reauthenticate('password', 'motdepasse1');
    await p.deleteAccount();
    await expect(p.signInEmail(email, 'motdepasse1')).rejects.toBeTruthy();
  }, 60_000);
});
