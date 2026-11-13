import { describe, expect, test } from 'vitest';
import { DEFAULT_CROP, PHOTO_MAX_BYTES, cropRect, photoProblem } from '../photo';

describe('photo de profil : cadrage et contrôles (v0.37)', () => {
  test('par défaut, le plus grand carré centré', () => {
    expect(cropRect(400, 300, DEFAULT_CROP)).toEqual({ sx: 50, sy: 0, side: 300 });
    expect(cropRect(300, 400, DEFAULT_CROP)).toEqual({ sx: 0, sy: 50, side: 300 });
  });
  test('zoom et position restent dans l’image', () => {
    for (const zoom of [1, 2, 3, 9])
      for (const x of [-5, -1, 0, 1, 5])
        for (const y of [-1, 0.5, 1]) {
          const r = cropRect(1200, 900, { zoom, x, y });
          expect(r.side).toBeGreaterThanOrEqual(300);
          expect(r.sx).toBeGreaterThanOrEqual(0);
          expect(r.sy).toBeGreaterThanOrEqual(0);
          expect(r.sx + r.side).toBeLessThanOrEqual(1200 + 1e-9);
          expect(r.sy + r.side).toBeLessThanOrEqual(900 + 1e-9);
        }
    expect(cropRect(1200, 900, { zoom: 2, x: -1, y: 0 }).sx).toBe(0);
  });
  test('formats et poids', () => {
    expect(photoProblem({ type: 'image/jpeg', size: 2e6 })).toBeNull();
    expect(photoProblem({ type: 'image/heic', size: 2e6 })).toBeNull();
    expect(photoProblem({ type: 'application/pdf', size: 10 })).toContain('photo');
    expect(photoProblem({ type: 'image/png', size: PHOTO_MAX_BYTES + 1 })).toContain('lourde');
  });
});
