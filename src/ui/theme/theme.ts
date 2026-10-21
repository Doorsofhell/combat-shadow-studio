/**
 * Menu theme: light, dark or automatic (follows the system, live). Since 0.27 the training studio follows
 * it too (dark or pearl grey). The choice is saved with the device settings and mirrored in localStorage so
 * the inline script of index.html applies it before the first paint (no flash).
 */
export type ThemePref = 'auto' | 'clair' | 'sombre';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'css-theme';
/** status bar colour of each theme; must match --c-bg in styles.css */
export const THEME_BG: Record<ResolvedTheme, string> = { dark: '#0b0f14', light: '#f4f5f7' };
/**
 * status bar colour of the training studio; 0.27 (Youssef, 2026-10-20 21:48, « Suit le thème »): it follows the
 * menu theme, anthracite or pearl grey; must match --bg of .training in training.css and index.html
 */
export const STUDIO_BG: Record<ResolvedTheme, string> = { dark: '#0b0f14', light: '#eef0f3' };

const mq = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null);

export function resolveTheme(pref: ThemePref, systemLight = !!mq()?.matches): ResolvedTheme {
  if (pref === 'clair') return 'light';
  if (pref === 'sombre') return 'dark';
  return systemLight ? 'light' : 'dark';
}

export function readSavedTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'clair' || v === 'sombre' || v === 'auto' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** sets data-theme on <html> and remembers the choice for the next start */
export function applyTheme(pref: ThemePref): ResolvedTheme {
  const t = resolveTheme(pref);
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* private mode: the choice still applies to this session */
  }
  return t;
}

/** calls back whenever the system theme changes (only matters in automatic mode) */
export function onSystemThemeChange(cb: () => void): () => void {
  const m = mq();
  if (!m) return () => {};
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}
