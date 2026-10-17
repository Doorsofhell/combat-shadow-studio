import { useEffect, useState } from 'react';
import { useSettings } from '../../store/settings';
import { onSystemThemeChange, resolveTheme, type ResolvedTheme } from './theme';

/** theme the menus are drawn in right now (follows the system live in automatic mode) */
export function useResolvedTheme(): ResolvedTheme {
  const pref = useSettings((s) => s.settings.theme);
  const [, setTick] = useState(0);
  useEffect(() => (pref === 'auto' ? onSystemThemeChange(() => setTick((n) => n + 1)) : undefined), [pref]);
  return resolveTheme(pref);
}
