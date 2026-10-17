import { describe, expect, test } from 'vitest';
import { get, keys, set } from 'idb-keyval';
import { hydrated, tick } from './helpers';

const wrap = (state: object) => JSON.stringify({ state, version: 0 });
const session = { id: 's1#boxe-debutant-02', start: '2026-10-01T10:00:00.000Z', discipline: 'boxe', level: 'debutant', exerciseId: 'boxe-debutant-02', exerciseName: 'Jab', mode: 'libre', activeSec: 120, reps: 10 };

describe('migration des données existantes vers l’espace invité', () => {
  test('les anciennes clés sont déplacées dans u:local:, sans perte, et les stores les relisent', async () => {
    // data written by the previous version (keys without namespace)
    await set('css-profile', wrap({ profile: { guard: 'gaucher', goals: ['technique', 'cardio'], limitations: 'genou droit fragile', completed: true, coach: 'femme', mainDiscipline: 'mma', levels: { boxe: 'avance' } } }));
    await set('css-stats', wrap({ sessions: [session], perExercise: { 'boxe-debutant-02': 120 } }));
    await set('css-custom', wrap({ combos: [{ id: 'c1', name: 'Mon combo', discipline: 'boxe', sequence: ['jab'], createdAt: '2026-10-01' }] }));
    await set('css-goals', wrap({ goals: { weeklyMinutes: 90 }, favTechniques: ['jab'], favExercises: [] }));
    await set('css-fighters', wrap({ fighters: [{ id: 'f1', name: 'Nadia', look: { sex: 'femme' }, createdAt: 'x', updatedAt: 'x' }], activeId: 'f1' }));
    await set('css-catalog', wrap({ favorites: ['combo-1'], history: [], collections: [] }));
    await set('css-coach-ai', wrap({ history: ['question'] }));
    await set('css-settings', wrap({ settings: { voice: false } }));

    const { useProfile, profileWrites } = await import('../../store/profile');
    const { useStats } = await import('../../store/stats');
    const { useCustom } = await import('../../store/custom');
    const { useGoals } = await import('../../store/goals');
    const { useFighters } = await import('../../store/fighters');
    const { useCatalogUser } = await import('../../store/catalog');
    const { useSettings } = await import('../../store/settings');
    for (const s of [useProfile, useStats, useCustom, useGoals, useFighters, useCatalogUser, useSettings]) await hydrated(s as never);

    const p = useProfile.getState().profile;
    expect(p.guard).toBe('gaucher');
    expect(p.completed).toBe(true);
    expect(p.limitations).toBe('genou droit fragile');
    expect(p.goals).toEqual(['apprentissage-technique', 'endurance']); // old goal ids mapped
    expect(p.levels).toEqual({ boxe: 'avance', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' });
    expect(p.pseudo).toBe(''); // new fields get their defaults
    expect(p.difficulty).toBe('progressive');
    expect(useStats.getState().sessions).toHaveLength(1);
    expect(useCustom.getState().combos[0].name).toBe('Mon combo');
    expect(useGoals.getState().goals.weeklyMinutes).toBe(90);
    expect(useFighters.getState().activeId).toBe('f1');
    expect(useCatalogUser.getState().favorites).toEqual(['combo-1']);
    expect(useSettings.getState().settings.voice).toBe(false);

    const all = (await keys()).map(String);
    for (const k of ['css-profile', 'css-stats', 'css-custom', 'css-goals', 'css-fighters', 'css-catalog', 'css-coach-ai']) {
      expect(all).not.toContain(k);
      expect(all).toContain(`u:local:${k}`);
    }
    expect(all).toContain('css-settings'); // device-level
    expect(all).not.toContain('u:local:css-settings');
    expect(await get('u:local:css-coach-ai')).toBe(wrap({ history: ['question'] }));

    // the limitations are sealed as soon as the profile is written again (hydration writes once)
    await tick(20);
    await profileWrites();
    const raw = (await get('u:local:css-profile')) as string;
    expect(raw).not.toContain('genou');
    expect(JSON.parse(raw).state.profile.limitationsSealed.alg).toBe('AES-GCM');

    // a second run changes nothing
    const { migrateLegacyKeys } = await import('../../store/storage');
    expect((await migrateLegacyKeys()).moved).toEqual([]);
  });
});
