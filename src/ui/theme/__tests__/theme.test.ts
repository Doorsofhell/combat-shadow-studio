import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY, readSavedTheme, resolveTheme } from '../theme';
import { DEFAULT_SETTINGS } from '../../../store/settings';

describe('thème des menus', () => {
  // 1.0.0 (refonte ergonomique, Youssef 2026-10-27, « n'oublie pas le mode jour/nuit »): Nuit by default for a new
  // install; a choice already made (Jour, Nuit or Auto) is kept
  afterEach(() => vi.unstubAllGlobals());
  const withSaved = (v: string | null) => vi.stubGlobal('localStorage', { getItem: (k: string) => (k === THEME_KEY ? v : null), setItem: () => {} });
  it('Nuit par défaut pour une nouvelle installation', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('sombre');
    withSaved(null);
    expect(readSavedTheme()).toBe('sombre');
  });
  it('le choix déjà fait par un utilisateur existant est conservé', () => {
    for (const v of ['clair', 'sombre', 'auto'] as const) {
      withSaved(v);
      expect(readSavedTheme()).toBe(v);
    }
  });
  it('un choix manuel prime sur le système', () => {
    expect(resolveTheme('clair', false)).toBe('light');
    expect(resolveTheme('sombre', true)).toBe('dark');
  });
  it('Automatique suit le système', () => {
    expect(resolveTheme('auto', true)).toBe('light');
    expect(resolveTheme('auto', false)).toBe('dark');
  });
});
