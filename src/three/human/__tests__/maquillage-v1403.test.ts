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
/** bytes of one buffer view of the GLB binary chunk */
function glbImage(path: string, view: number) {
  const b = readFileSync(path);
  const n = b.readUInt32LE(12);
  const v = JSON.parse(b.subarray(20, 20 + n).toString('utf8')).bufferViews[view];
  return b.subarray(20 + n + 8).subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
}
/** [width, height] read from the JPEG start-of-frame marker */
function jpegSize(d: Buffer): [number, number] {
  let i = 2;
  while (i < d.length) {
    const m = d[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [d.readUInt16BE(i + 7), d.readUInt16BE(i + 5)];
    i += 2 + d.readUInt16BE(i + 2);
  }
  return [0, 0];
}

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
  // 2.10.2 : la tête d'Amara (photo.glb) passe de PNG à JPEG, comme photo-clean.glb et les cinq autres coachs. Raison :
  // le PNG pesait 2 Mo et mettait photo.glb à 5,0 Mo, au-delà des 3,5 Mo exigés par expressions-v1160 (perte de
  // performance mobile = critère bloquant). Même image (PSNR 50 dB), même taille ; la taille 2048 px, annoncée par le
  // nom du test mais jamais vérifiée, l'est maintenant.
  test('la texture de tête reste à 2048 px dans le même format', () => {
    for (const [p, mime] of [
      ['public/coaches/mma-amara/photo.glb', 'image/jpeg'],
      ['public/coaches/mma-amara/photo-clean.glb', 'image/jpeg'],
      ['public/coaches/inaya/photo.glb', 'image/jpeg'],
    ]) {
      const head = glbJson(p).images.find((i: { name?: string }) => i.name === 'f021_head_color');
      expect(head.mimeType).toBe(mime);
      expect(jpegSize(glbImage(p, head.bufferView)), p).toEqual([2048, 2048]);
    }
  });
});

describe('1.40.3 reflet des yeux discret', () => {
  test('le point blanc est beaucoup plus faible et plus petit qu’en 1.39 (force 2,2, netteté 260)', () => {
    expect(EYE_CATCHLIGHT.strength).toBeLessThanOrEqual(0.5);
    expect(EYE_CATCHLIGHT.sharpness).toBeGreaterThanOrEqual(600);
  });
});
