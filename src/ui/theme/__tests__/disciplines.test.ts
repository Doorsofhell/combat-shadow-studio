import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISCIPLINES } from '../../../domain/types';
import { DISCIPLINE_COLOR, ON_DISCIPLINE } from '../disciplines';

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('couleurs des six disciplines (1.0.0)', () => {
  it('une couleur par discipline, la même dans le CSS', () => {
    const css = readFileSync('src/ui/styles.css', 'utf8');
    for (const d of DISCIPLINES) {
      expect(DISCIPLINE_COLOR[d.id], d.id).toMatch(/^#[0-9a-f]{6}$/);
      expect(css, d.id).toContain(`--disc-${d.id}: ${DISCIPLINE_COLOR[d.id]};`);
    }
    expect(new Set(Object.values(DISCIPLINE_COLOR)).size).toBe(6);
  });
  it('le texte du gros bouton reste lisible sur chaque couleur (WCAG AA, 4,5:1)', () => {
    for (const [id, c] of Object.entries(DISCIPLINE_COLOR)) expect(contrast(c, ON_DISCIPLINE), id).toBeGreaterThanOrEqual(4.5);
  });
});
