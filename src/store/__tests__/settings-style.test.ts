import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, useSettings } from '../settings';

/**
 * 1.37 (Youssef, 2026-11-12: « ne garder que les coachs ultra-réalistes ») — one render only: the look (coachStyle,
 * Ultra-réaliste only since 1.9) and the render version (coachRender, « Précédente (secours) ») are no longer settings.
 * Replaces the 1.9 tests « style par défaut » and « un style enregistré devient Ultra-réaliste »: there is no style left
 * to default to; the saves of every older version must still open, without these fields and with the rest kept.
 * The values below are the ones the older versions really saved (the only place they are still written).
 */
const OLD_SAVES = [
  { coachStyle: 'encre', coachRender: 'premium', seeThroughGear: true, voice: false },
  { coachStyle: 'manga', coachRender: 'precedent', voice: false },
  { coachStyle: 'realiste', coachRender: 'precedent', voice: false },
];

describe('un seul rendu de coach (1.37)', () => {
  test('ni style ni version de rendu dans les réglages d’une nouvelle installation', () => {
    expect('coachStyle' in DEFAULT_SETTINGS).toBe(false);
    expect('coachRender' in DEFAULT_SETTINGS).toBe(false);
    expect('seeThroughGear' in DEFAULT_SETTINGS).toBe(false);
  });

  test('les réglages enregistrés par toutes les anciennes versions perdent ces champs et gardent le reste', () => {
    const { migrate, merge, version } = useSettings.persist.getOptions();
    expect(version).toBe(4);
    for (const old of OLD_SAVES)
      for (const v of [0, 1, 2, 3]) {
        const m = migrate!({ settings: { ...old } }, v) as { settings: Record<string, unknown> };
        expect(m.settings, `version ${v}`).not.toHaveProperty('coachStyle');
        expect(m.settings).not.toHaveProperty('coachRender');
        expect(m.settings).not.toHaveProperty('seeThroughGear');
        expect(m.settings.voice).toBe(false);
      }
    // even a save that skipped the migration
    const cur = useSettings.getState();
    for (const old of OLD_SAVES) {
      const a = merge!({ settings: { ...old } }, cur) as typeof cur;
      expect(a.settings).not.toHaveProperty('coachStyle');
      expect(a.settings).not.toHaveProperty('coachRender');
      expect(a.settings.voice).toBe(false);
      expect(a.settings.coachLight).toBe(DEFAULT_SETTINGS.coachLight);
    }
  });
});
