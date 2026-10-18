import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS, useSettings } from '../settings';

describe('style du coach', () => {
  test('« Encre » est le style par défaut', () => {
    expect(DEFAULT_SETTINGS.coachStyle).toBe('encre');
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
