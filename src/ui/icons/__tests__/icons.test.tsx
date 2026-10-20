import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DISCIPLINES } from '../../../domain/types';
import { THEME_BG } from '../../theme/theme';
import { AppIcon, DisciplineIcon, DISCIPLINE_ICON_ALT, GLYPHS, ICON_REGISTRY, ICON_ROLE, iconRole, type GlyphId } from '..';

const ids = Object.keys(GLYPHS) as GlyphId[];

/** every .tsx file of the interface (the icon module itself excluded) */
function uiFiles(dir = 'src/ui'): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return p.endsWith('icons') ? [] : uiFiles(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
}

describe('bibliothèque d’icônes : référentiel central', () => {
  it('chaque icône a un identifiant stable, une famille et un nom français', () => {
    expect(ids.length).toBeGreaterThanOrEqual(90);
    for (const id of ids) {
      expect(ICON_REGISTRY[id], id).toBeDefined();
      expect(ICON_REGISTRY[id].name.length, id).toBeGreaterThan(2);
    }
    expect(Object.keys(ICON_REGISTRY).sort()).toEqual([...ids].sort());
  });

  it('AppIcon : vectoriel carré, décoratif sans libellé, nommé avec un libellé', () => {
    for (const id of ids) {
      const html = renderToStaticMarkup(<AppIcon id={id} size={24} />);
      expect(html, id).toContain('viewBox="0 0 24 24"');
      expect(html, id).toContain('width="24"');
      expect(html, id).toContain('height="24"');
      expect(html, id).toContain('aria-hidden="true"');
      expect(html, id).toContain('<mask');
    }
    const named = renderToStaticMarkup(<AppIcon id="favorite" label="Favori" />);
    expect(named).toContain('role="img"');
    expect(named).toContain('aria-label="Favori"');
    expect(named).not.toContain('aria-hidden');
  });

  it('deux icônes sur une page n’ont jamais les mêmes identifiants de dégradé', () => {
    const html = renderToStaticMarkup(
      <>
        <AppIcon id="play" />
        <AppIcon id="play" />
        <DisciplineIcon id="boxe" />
        <DisciplineIcon id="boxe" />
      </>,
    );
    const defs = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(defs).size).toBe(defs.length);
  });

  it('les six disciplines ont leur icône officielle, en version détaillée et compacte', () => {
    for (const d of DISCIPLINES) {
      expect(DISCIPLINE_ICON_ALT[d.id], d.id).toBeTruthy();
      const big = renderToStaticMarkup(<DisciplineIcon id={d.id} size={96} />);
      const small = renderToStaticMarkup(<DisciplineIcon id={d.id} size={24} />);
      expect(big, d.id).toContain('viewBox="0 0 64 64"');
      expect(big, d.id).toContain(`data-discipline="${d.id}"`);
      expect(small.length, `${d.id} compacte plus légère`).toBeLessThan(big.length);
    }
    expect(renderToStaticMarkup(<DisciplineIcon id="inconnue" />)).toBe('');
  });

  it('aucune image, police d’icônes ni ressource externe : tout est embarqué, donc disponible hors ligne', () => {
    for (const f of ['glyphs.tsx', 'disciplines.tsx', 'AppIcon.tsx']) {
      const src = readFileSync(join('src/ui/icons', f), 'utf8');
      expect(src, f).not.toMatch(/https?:\/\/|<image|\.png|\.webp|\.jpg/);
    }
  });
});

describe('bibliothèque d’icônes : intégration dans les écrans', () => {
  const files = uiFiles();

  it('plus aucun ancien composant Icon* ni dessin SVG local dans les écrans', () => {
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/<Icon[A-Z]\w*[\s/>]/);
      expect(src, f).not.toMatch(/from '[./]*\/icons\/index'|from '\.\/icons\.tsx'/);
    }
  });

  it('pas d’émoji ni de symbole texte utilisé comme icône', () => {
    const symbols = /[★☆✕✖✓✔❤♥▶⏸⏹⏪⏩]|\p{Extended_Pictographic}/u;
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(symbols);
  });

  // 0.24: the Coach tab (coach choice and creator) is removed (Youssef, 2026-10-19); Légendes gets its own tab and
  // the AI coach becomes a floating bubble on every screen (Youssef, 2026-10-20)
  it('la navigation principale a ses 5 entrées réelles : Légendes à la place de l’ancien onglet Coach', () => {
    const app = readFileSync('src/ui/App.tsx', 'utf8');
    const nav = app.slice(app.indexOf('const NAV = ['), app.indexOf('];', app.indexOf('const NAV = [')));
    const labels = [...nav.matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
    expect(labels).toEqual(['Accueil', 'Entraîner', 'Techniques', 'Progrès', 'Légendes']);
    expect([...nav.matchAll(/<AppIcon id="(\w+)"/g)].map((m) => m[1])).toEqual(['home', 'train', 'techniques', 'progress', 'legends']);
  });
});

describe('palette officielle', () => {
  const css = readFileSync('src/ui/styles.css', 'utf8');
  const dark = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
  it.each([
    ['--c-bg', '#0b0f14'],
    ['--c-surface', '#1f2937'],
    ['--c-accent', '#e11d2f'],
    ['--c-gold', '#d4af37'],
    ['--c-text', '#f4f4f5'],
    ['--c-text-2', '#9ca3af'],
  ])('%s = %s', (token, value) => {
    expect(dark).toMatch(new RegExp(`${token}: ${value};`));
  });
  it('la barre d’état Android suit le fond du thème sombre', () => {
    expect(THEME_BG.dark).toBe('#0b0f14');
  });

  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  it('contrastes AA : texte blanc sur rouge, textes sur fond et surfaces', () => {
    expect(ratio('#ffffff', '#e11d2f')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#f4f4f5', '#1f2937')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#9ca3af', '#1f2937')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#9ca3af', '#0b0f14')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#ff6b77', '#1f2937')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#d4af37', '#1f2937')).toBeGreaterThanOrEqual(4.5);
  });

  // 0.24, icon sheet v2: role colours stay readable as icons (non-text contrast ≥ 3:1) on both themes
  it.each([
    ['#4f8ff7', '#1f2937'],
    ['#f2783a', '#1f2937'],
    ['#a66cf2', '#1f2937'],
    ['#4cc38a', '#1f2937'],
    ['#1d5fc9', '#ffffff'],
    ['#b9480f', '#ffffff'],
    ['#7a3fc4', '#ffffff'],
  ])('couleur de rôle %s lisible sur %s', (c, bg) => {
    expect(ratio(c, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('rôles de couleur (planche v2)', () => {
  it('chaque rôle désigne une icône existante', () => {
    for (const id of Object.keys(ICON_ROLE)) expect(GLYPHS).toHaveProperty(id);
  });
  it('navigation comme sur la planche : Entraîner et Progrès rouges, Légendes or, le reste neutre', () => {
    expect(['home', 'train', 'techniques', 'progress', 'legends'].map((id) => iconRole(id as GlyphId))).toEqual(['neutral', 'accent', 'neutral', 'accent', 'gold']);
  });
  it('chaque icône porte son rôle en attribut data-role', () => {
    const html = renderToStaticMarkup(<AppIcon id="verified" tone="auto" />);
    expect(html).toContain('data-role="success"');
    expect(html).toContain('tone-auto');
  });
});
