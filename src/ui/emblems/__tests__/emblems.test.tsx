import { existsSync, readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DISCIPLINES } from '../../../domain/types';
import { DETAILED_FILES, DisciplineEmblem, EMBLEMS, EMBLEM_SIZES, OUTLINE_DRAWINGS, defaultVariant, emblemFile } from '..';

/** width and height of a WebP file (VP8, VP8L or VP8X header) */
function webpSize(buf: Buffer) {
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buf.toString('ascii', 8, 12)).toBe('WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), alpha: (buf[20] & 0x10) !== 0 };
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff), alpha: ((b >> 28) & 1) === 1 };
  }
  return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, alpha: false };
}

/** weight budget per file (bytes): the six detailed emblems stay far below one coach texture */
const BUDGET: Record<number, number> = { 64: 4096, 128: 8192, 256: 20480 };

describe('registre des emblèmes de discipline', () => {
  it('une entrée par discipline officielle, avec son nom et sa description', () => {
    expect(Object.keys(EMBLEMS).sort()).toEqual(DISCIPLINES.map((d) => d.id).sort());
    for (const d of DISCIPLINES) {
      expect(EMBLEMS[d.id].name).toBe(d.name);
      expect(EMBLEMS[d.id].alt.length).toBeGreaterThan(5);
    }
  });

  it('variante détaillée : trois fichiers WebP carrés, transparents, aux bonnes dimensions et légers', () => {
    for (const d of DISCIPLINES)
      for (const px of DETAILED_FILES) {
        const p = `public/${emblemFile(d.id, px)}`;
        expect(existsSync(p), p).toBe(true);
        const buf = readFileSync(p);
        const s = webpSize(buf);
        expect(s, p).toEqual({ w: px, h: px, alpha: true });
        expect(buf.length, `${p} poids`).toBeLessThanOrEqual(BUDGET[px]);
      }
  });

  it('variante contour : dessinée pour les six disciplines, sans couleur fixe', () => {
    for (const d of DISCIPLINES) {
      const html = renderToStaticMarkup(<DisciplineEmblem id={d.id} variant="contour" size={24} />);
      expect(html).toContain('viewBox="0 0 24 24"');
      expect(html).toContain('stroke="currentColor"');
      expect(html).not.toMatch(/#[0-9a-f]{3,6}/i);
      expect((html.match(/<(path|rect|ellipse)/g) ?? []).length, d.id).toBeGreaterThanOrEqual(3);
      expect(OUTLINE_DRAWINGS[d.id]).toBeTruthy();
    }
  });

  it('les trois variantes rendent aux quatre tailles, et la taille choisit la variante par défaut', () => {
    expect(EMBLEM_SIZES).toEqual([128, 64, 32, 24]);
    expect(EMBLEM_SIZES.map(defaultVariant)).toEqual(['detaille', 'detaille', 'semi', 'contour']);
    for (const d of DISCIPLINES)
      for (const size of EMBLEM_SIZES) {
        const auto = renderToStaticMarkup(<DisciplineEmblem id={d.id} size={size} />);
        expect(auto).toContain(`data-variant="${defaultVariant(size)}"`);
        for (const variant of ['detaille', 'semi', 'contour'] as const) {
          const html = renderToStaticMarkup(<DisciplineEmblem id={d.id} size={size} variant={variant} />);
          expect(html).toContain(`data-emblem="${d.id}"`);
          expect(html).toContain(`width="${size}"`);
          if (variant === 'detaille') {
            // 1x and 2x files: never more than the 256 px export
            expect(html).toMatch(new RegExp(`emblems/${d.id}-(64|128)\\.webp 1x, .*emblems/${d.id}-(128|256)\\.webp 2x`));
            expect(html).toContain('alt=""');
          }
          if (variant === 'semi') expect(html).toContain('class="discipline-icon"');
        }
      }
  });

  it('un nom parlé rend l’emblème lisible par les lecteurs d’écran, sinon il est décoratif', () => {
    expect(renderToStaticMarkup(<DisciplineEmblem id="judo" size={64} label="Judo" />)).toContain('alt="Judo"');
    expect(renderToStaticMarkup(<DisciplineEmblem id="judo" size={24} label="Judo" />)).toContain('aria-label="Judo"');
    expect(renderToStaticMarkup(<DisciplineEmblem id="judo" size={24} />)).toContain('aria-hidden="true"');
  });
});
