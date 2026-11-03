import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, useSettings } from '../settings';

describe('style du coach', () => {
  // v0.29: the default became « Ultra-réaliste » (Youssef, PROMPT MAÎTRE v0.29.0); it was « Encre » from 0.14
  test('« Ultra-réaliste » est le style par défaut d’une nouvelle installation', () => {
    expect(DEFAULT_SETTINGS.coachStyle).toBe('realiste');
  });

  // 1.9 (Youssef, 2026-10-29: « supprime définitivement le rendu Anime »): the saved Anime / Manga looks are no
  // longer kept (the 0.29 test « le style déjà enregistré est gardé » is replaced by this one)
  test('1.9 : un style Anime ou Manga enregistré devient Ultra-réaliste, les autres réglages sont gardés', () => {
    const { migrate, merge } = useSettings.persist.getOptions();
    for (const [old, v] of [['encre', 2], ['manga', 2], ['encre', 1], ['manga', 0]] as const) {
      const m = migrate!({ settings: { coachStyle: old, voice: false } }, v) as { settings: { coachStyle: string; voice: boolean } };
      expect(m.settings.coachStyle).toBe('realiste');
      expect(m.settings.voice).toBe(false);
    }
    const cur = useSettings.getState();
    // even a value that skipped the migration is drawn in Ultra-réaliste
    const a = merge!({ settings: { coachStyle: 'encre', voice: false } }, cur) as typeof cur;
    expect(a.settings.coachStyle).toBe('realiste');
    const b = merge!({ settings: { voice: false } }, cur) as typeof cur;
    expect(b.settings.coachStyle).toBe('realiste');
    expect(b.settings.voice).toBe(false);
  });

  test('anciens réglages : un choix « réaliste » est gardé', () => {
    const migrate = useSettings.persist.getOptions().migrate!;
    const b = migrate({ settings: { coachStyle: 'realiste' } }, 0) as { settings: { coachStyle: string } };
    expect(b.settings.coachStyle).toBe('realiste');
  });
});
