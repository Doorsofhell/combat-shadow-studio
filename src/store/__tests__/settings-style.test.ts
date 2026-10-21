import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, useSettings } from '../settings';

describe('style du coach', () => {
  // v0.29: the default became « Ultra-réaliste » (Youssef, PROMPT MAÎTRE v0.29.0); it was « Encre » from 0.14
  test('« Ultra-réaliste » est le style par défaut d’une nouvelle installation', () => {
    expect(DEFAULT_SETTINGS.coachStyle).toBe('realiste');
  });

  test('0.29 : le style déjà enregistré est gardé, un réglage sans style prend Ultra-réaliste', () => {
    const { migrate, merge } = useSettings.persist.getOptions();
    const kept = migrate!({ settings: { coachStyle: 'encre', voice: false } }, 1) as { settings: { coachStyle: string; voice: boolean } };
    expect(kept.settings.coachStyle).toBe('encre');
    expect(kept.settings.voice).toBe(false);
    const cur = useSettings.getState();
    const a = merge!(kept, cur) as typeof cur;
    expect(a.settings.coachStyle).toBe('encre');
    const b = merge!({ settings: { voice: false } }, cur) as typeof cur;
    expect(b.settings.coachStyle).toBe('realiste');
    expect(b.settings.voice).toBe(false);
  });

  test('anciens réglages : l’ancien défaut « manga » passe à « Encre », un choix « réaliste » est gardé', () => {
    const migrate = useSettings.persist.getOptions().migrate!;
    const a = migrate({ settings: { coachStyle: 'manga', voice: false } }, 0) as { settings: { coachStyle: string; voice: boolean } };
    expect(a.settings.coachStyle).toBe('encre');
    expect(a.settings.voice).toBe(false);
    const b = migrate({ settings: { coachStyle: 'realiste' } }, 0) as { settings: { coachStyle: string } };
    expect(b.settings.coachStyle).toBe('realiste');
  });
});
