import { beforeAll, describe, expect, test } from 'vitest';
import { get, keys } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProfile, profileWrites } from '../../store/profile';
import { useStats } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { useCustom } from '../../store/custom';
import { useFighters } from '../../store/fighters';
import { useCatalogUser } from '../../store/catalog';
import { currentScope, idbStorage } from '../../store/storage';
import { registerScopedStore, setReloadForTests, switchScope, wipeScope } from '../scope';
import { useSyncPrefs } from '../syncPrefs';
import { hydrated, tick } from './helpers';

const rec = (id: string, sec = 60) => ({ id, start: '2026-10-10T10:00:00.000Z', discipline: 'boxe' as const, level: 'debutant' as const, exerciseId: 'ex', exerciseName: 'Jab', mode: 'libre' as const });
const settle = async () => {
  await tick(20);
  await profileWrites();
};

beforeAll(async () => {
  for (const s of [useProfile, useStats, useGoals, useCustom, useFighters, useCatalogUser, useSyncPrefs]) await hydrated(s as never);
});

describe('isolation des données entre utilisateurs', () => {
  test('changer d’utilisateur recharge les stores sans rien mélanger ni écraser', async () => {
    expect(currentScope()).toBe('local');
    useProfile.getState().update({ pseudo: 'Invité', limitations: 'dos', completed: true });
    useStats.getState().record(rec('g1'), 60, 1);
    useGoals.getState().toggleTechnique('jab');
    await settle();

    await switchScope('fb-alice');
    expect(currentScope()).toBe('fb-alice');
    expect(useProfile.getState().profile.pseudo).toBe('');
    expect(useProfile.getState().profile.limitations).toBe('');
    expect(useProfile.getState().hydrated).toBe(true);
    expect(useStats.getState().sessions).toEqual([]);
    expect(useGoals.getState().favTechniques).toEqual([]);
    useProfile.getState().update({ pseudo: 'Alice', limitations: 'poignet' });
    useStats.getState().record(rec('a1'), 30, 1);
    useSyncPrefs.getState().setEnabled(true);
    await settle();

    await switchScope('local');
    expect(useProfile.getState().profile.pseudo).toBe('Invité');
    expect(useProfile.getState().profile.limitations).toBe('dos');
    expect(useStats.getState().sessions.map((s) => s.id)).toEqual(['g1']);
    expect(useGoals.getState().favTechniques).toEqual(['jab']);
    expect(useSyncPrefs.getState().enabled).toBe(false); // per-user setting

    await switchScope('fb-alice');
    expect(useProfile.getState().profile.pseudo).toBe('Alice');
    expect(useProfile.getState().profile.limitations).toBe('poignet');
    expect(useStats.getState().sessions.map((s) => s.id)).toEqual(['a1']);
    expect(useSyncPrefs.getState().enabled).toBe(true);
    // the scope is remembered for the next launch
    expect(await get('css-meta:current-scope')).toBe('fb-alice');
  });

  test('créer un compte depuis l’invité déplace ses données (limitations rechiffrées) et vide l’invité', async () => {
    await switchScope('local');
    expect(useProfile.getState().profile.pseudo).toBe('Invité');
    await switchScope('fb-bob', { moveFrom: 'local' });
    expect(useProfile.getState().profile.pseudo).toBe('Invité');
    expect(useProfile.getState().profile.limitations).toBe('dos');
    expect(useStats.getState().sessions.map((s) => s.id)).toEqual(['g1']);
    const all = (await keys()).map(String);
    expect(all.filter((k) => k.startsWith('u:local:'))).toEqual([]);
    await switchScope('local');
    expect(useProfile.getState().profile.pseudo).toBe('');
    expect(useStats.getState().sessions).toEqual([]);
  });

  test('supprimer les données d’un utilisateur efface toutes ses clés et remet les stores à zéro', async () => {
    await switchScope('fb-bob');
    await wipeScope('fb-bob');
    expect(useProfile.getState().profile.pseudo).toBe('');
    expect(useStats.getState().sessions).toEqual([]);
    const all = (await keys()).map(String);
    expect(all.filter((k) => k.startsWith('u:fb-bob:'))).toEqual([]);
    expect(all.some((k) => k.startsWith('u:fb-alice:'))).toBe(true); // others untouched
  });

  test('un store persistant inconnu provoque un rechargement complet plutôt qu’une fuite', async () => {
    const useOther = create<{ n: number }>()(persist(() => ({ n: 1 }), { name: 'css-autre-module', storage: createJSONStorage(() => idbStorage) }));
    await hydrated(useOther as never);
    let reloaded = 0;
    setReloadForTests(() => reloaded++);
    await switchScope('fb-carol');
    expect(reloaded).toBe(1);
    expect(currentScope()).toBe('fb-carol');
    registerScopedStore(useOther as never);
    await switchScope('fb-alice');
    expect(reloaded).toBe(1);
  });
});
