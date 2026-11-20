import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { EYE_CATCHLIGHT } from '../../photoMaterials';

// 1.40.3 (Youssef 13/11 23:24, « Met en place les options conseillées »): light sporty makeup painted in the head
// texture of the women coaches (tools/generator/rocketbox/makeup.py), and a much smaller white dot in the eyes.
function glbJson(path: string) {
  const b = readFileSync(path);
  const n = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + n).toString('utf8'));
}
const makeup = (path: string) => glbJson(path).asset?.extras?.cssMakeup;

describe('1.40.3 maquillage léger sportif', () => {
  test('Amara porte « Frais d’entraînement » (B) avec et sans tenue', () => {
    for (const f of ['photo.glb', 'photo-clean.glb']) expect(makeup(`public/coaches/mma-amara/${f}`)).toMatchObject({ coach: 'amara', look: 'B' });
  });
  test('Inaya porte « Bonne mine » (A)', () => {
    expect(makeup('public/coaches/inaya/photo.glb')).toMatchObject({ coach: 'inaya', look: 'A' });
  });
  test('les coachs hommes ne sont pas maquillés', () => {
    for (const c of ['mma-kadir', 'nael']) expect(makeup(`public/coaches/${c}/photo.glb`)).toBeUndefined();
  });
  test('la texture de tête reste à 2048 px dans le même format', () => {
    for (const [p, mime] of [
      ['public/coaches/mma-amara/photo.glb', 'image/png'],
      ['public/coaches/mma-amara/photo-clean.glb', 'image/jpeg'],
      ['public/coaches/inaya/photo.glb', 'image/jpeg'],
    ]) {
      const head = glbJson(p).images.find((i: { name?: string }) => i.name === 'f021_head_color');
      expect(head.mimeType).toBe(mime);
    }
  });
});

describe('1.40.3 reflet des yeux discret', () => {
  test('le point blanc est beaucoup plus faible et plus petit qu’en 1.39 (force 2,2, netteté 260)', () => {
    expect(EYE_CATCHLIGHT.strength).toBeLessThanOrEqual(0.5);
    expect(EYE_CATCHLIGHT.sharpness).toBeGreaterThanOrEqual(600);
  });
});
