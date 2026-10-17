import { describe, expect, it } from 'vitest';
import { resolveTheme } from '../theme';
import { DEFAULT_SETTINGS } from '../../../store/settings';

describe('thème des menus', () => {
  it('Automatique par défaut', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('auto');
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
