import { beforeAll, describe, expect, test } from 'vitest';
import { keys } from 'idb-keyval';
import { useProfile, profileWrites } from '../../store/profile';
import { useStats } from '../../store/stats';
import { useFighters } from '../../store/fighters';
import { useGoals } from '../../store/goals';
import { useCatalogUser } from '../../store/catalog';
import { useCustom } from '../../store/custom';
import { currentScope } from '../../store/storage';
import { changeEmail, changePassword, configureAccountForTests, deleteAccount, deleteMyData, initAccount, signInEmail, signOut, signUpEmail, syncNow, useAccount } from '../session';
import { useSyncPrefs } from '../syncPrefs';
import { memoryAdapter } from '../sync/engine';
import { COLLECTIONS } from '../sync/collections';
import { buildFullExport } from '../export';
import { AuthError } from '../auth/types';
import type { AuthProvider, AuthUser } from '../auth/types';
import { hydrated, tick } from './helpers';

/** fake provider standing in for Firebase (no network) */
function fakeProvider() {
  const users = new Map<string, { pw: string; user: AuthUser }>();
  let current: AuthUser | null = null;
  const pendingEmail = new Map<string, string>();
  const listeners = new Set<(u: AuthUser | null) => void>();
  const emit = () => listeners.forEach((l) => l(current));
  const p: AuthProvider = {
    id: 'firebase',
    capabilities: { email: true, google: false, passkey: false, link: true },
    init: async () => current,
    onChange: (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    signUpEmail: async (email, pw) => {
      if (users.has(email)) throw new AuthError('auth/email-already-in-use', 'existe');
      const user: AuthUser = { uid: `uid-${users.size + 1}`, email, emailVerified: true, displayName: null, methods: ['password'] };
      users.set(email, { pw, user });
      current = user;
      emit();
      return user;
    },
    signInEmail: async (email, pw) => {
      const u = users.get(email);
      if (!u || u.pw !== pw) throw new AuthError('auth/invalid-credential', 'E-mail ou mot de passe incorrect.');
      current = u.user;
      emit();
      return u.user;
    },
    signInGoogle: async () => {
      throw new AuthError('unavailable', '');
    },
    sendPasswordReset: async () => undefined,
    sendVerification: async () => undefined,
    refresh: async () => current,
    linkEmail: async () => current!,
    linkGoogle: async () => current!,
    unlink: async () => current!,
    updateDisplayName: async () => undefined,
    // like Firebase: the address changes only once the link sent to it is opened (not simulated here)
    changeEmail: async (e) => {
      if (!current) throw new AuthError('no-user', '');
      pendingEmail.set(current.uid, e);
    },
    changePassword: async (pw) => {
      const u = [...users.values()].find((v) => v.user.uid === current?.uid);
      if (!u) throw new AuthError('no-user', '');
      u.pw = pw;
    },
    reauthenticate: async () => undefined,
    deleteAccount: async () => {
      users.forEach((v, k) => v.user.uid === current?.uid && users.delete(k));
      current = null;
      emit();
    },
    signOut: async () => {
      current = null;
      emit();
    },
    getIdToken: async () => null,
  };
  return Object.assign(p, { pendingEmail });
}

const server = memoryAdapter();
const settle = async () => {
  await tick(30);
  await profileWrites();
};

beforeAll(async () => {
  for (const s of [useProfile, useStats, useFighters, useGoals, useCatalogUser, useCustom, useSyncPrefs]) await hydrated(s as never);
  configureAccountForTests(fakeProvider(), async () => server);
  await initAccount();
});

describe('comptes : invité, création, connexion, synchronisation, suppression', () => {
  test('mode invité par défaut', () => {
    expect(useAccount.getState().status).toBe('guest');
    expect(currentScope()).toBe('local');
  });

  test('convertir l’invité en compte garde ses données ; la déconnexion revient à un invité vide', async () => {
    useProfile.getState().update({ pseudo: 'Yan', completed: true, limitations: 'genou' });
    useStats.getState().record({ id: 's1#a', start: '2026-10-10T10:00:00Z', discipline: 'boxe', level: 'debutant', exerciseId: 'a', exerciseName: 'Jab', mode: 'libre' }, 90, 3);
    await settle();
    await signUpEmail('yan@example.com', 'motdepasse1', true);
    expect(useAccount.getState().status).toBe('signedIn');
    expect(currentScope()).toBe('fb-uid-1');
    expect(useProfile.getState().profile.pseudo).toBe('Yan');
    expect(useProfile.getState().profile.limitations).toBe('genou');
    expect(useStats.getState().sessions).toHaveLength(1);

    await signOut(false);
    expect(useAccount.getState().status).toBe('guest');
    expect(useProfile.getState().profile.pseudo).toBe('');
    expect(useStats.getState().sessions).toHaveLength(0);

    await signInEmail('yan@example.com', 'motdepasse1', false);
    expect(useProfile.getState().profile.pseudo).toBe('Yan'); // kept on the device
    await expect(signInEmail('yan@example.com', 'faux', false)).rejects.toThrow('incorrect');
  });

  test('synchronisation activée : envoi au serveur, sans les limitations', async () => {
    useSyncPrefs.getState().setEnabled(true);
    await settle();
    await syncNow();
    const prof = server.data.get('uid-1/profile');
    expect(prof?.fields.pseudo.value).toBe('Yan');
    expect(prof?.fields).not.toHaveProperty('limitations');
    expect(JSON.stringify([...server.data.values()])).not.toContain('genou');
    expect(Object.keys(server.data.get('uid-1/stats')!.items)).toEqual(['s1#a']);
    expect(useAccount.getState().sync?.phase).toBe('idle');
  });

  test('changer le mot de passe et demander le changement d’adresse (v0.37)', async () => {
    await changePassword('nouveau2026');
    await signOut(false);
    await expect(signInEmail('yan@example.com', 'motdepasse1', false)).rejects.toThrow('incorrect');
    await signInEmail('yan@example.com', 'nouveau2026', false);
    expect(useProfile.getState().profile.pseudo).toBe('Yan');
    // the address is not changed until the link sent to the new one is opened
    await changeEmail('yan.nouveau@example.com');
    expect(useAccount.getState().user?.email).toBe('yan@example.com');
    await changePassword('motdepasse1');
  });

  test('export complet lisible et réimportable', async () => {
    const json = JSON.parse(await buildFullExport(useAccount.getState().user));
    expect(json.app).toBe('combat-shadow-studio');
    expect(json.account.email).toBe('yan@example.com');
    expect(json.profile.pseudo).toBe('Yan');
    expect(json.profile.limitations).toBe('genou');
    expect(json.sessions).toHaveLength(1);
    expect(json.other).toEqual({}); // sync bookkeeping is not exported
  });

  test('supprimer mes données efface la copie en ligne et l’appareil', async () => {
    const r = await deleteMyData();
    expect(r.remote).toBe(true);
    for (const c of COLLECTIONS) expect(server.data.has(`uid-1/${c.name}`)).toBe(false);
    expect(useProfile.getState().profile.pseudo).toBe('');
    expect(useProfile.getState().profile.completed).toBe(false);
    expect((await keys()).map(String).filter((k) => k.startsWith('u:fb-uid-1:'))).toEqual([]);
    expect(useSyncPrefs.getState().enabled).toBe(false);
  });

  test('supprimer le compte : retour en invité, plus aucune donnée du compte', async () => {
    useProfile.getState().update({ pseudo: 'Encore' });
    await settle();
    await deleteAccount();
    expect(useAccount.getState().status).toBe('guest');
    expect((await keys()).map(String).filter((k) => k.startsWith('u:fb-uid-1:'))).toEqual([]);
    await expect(signInEmail('yan@example.com', 'motdepasse1', false)).rejects.toThrow();
  });
});

describe('collections synchronisées', () => {
  test('aller-retour instantané → application sans perte pour chaque store', async () => {
    useProfile.getState().update({ pseudo: 'Rt', heightCm: 180, goals: ['mobilite'] });
    useGoals.getState().toggleTechnique('jab');
    useCatalogUser.getState().toggleFavorite('combo-x');
    useFighters.getState().create('homme', 'Test');
    for (const c of COLLECTIONS) {
      const s = c.snapshot();
      c.apply(structuredClone(s));
      expect(c.snapshot()).toEqual(s);
    }
  });
});
