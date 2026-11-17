import { describe, expect, test } from 'vitest';
import sharp from 'sharp';
import { resolve } from 'node:path';

/**
 * 1.53.1 (Youssef 15/11 : « encore des traces et des tâches sur le corps de Victor… une jonction plus claire entre la
 * tête et son buste ») : deuxième nettoyage par tools/generator/victor/peau_unie.py. Mesures sur les textures de
 * donnees/ (le modèle les porte : victor-peau-v1452.test.ts le vérifie octet pour octet).
 * Avant (1.53.0, mêmes textures qu'en 1.47.0) : plaques p1 0,70 / p99 1,25 ; poitrine de la tête (199, 141, 116) contre (163, 124, 105) au corps.
 * Après : p1 0,88 / p99 1,10 ; (160, 120, 100) contre (153, 115, 97).
 */
const DIR = resolve(__dirname, '../../../tools/generator/victor/donnees');

async function pixels(file: string, size: number) {
  const { data, info } = await sharp(resolve(DIR, file)).resize(size, size).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width };
}

function boxBlur(src: Float64Array, w: number, r: number) {
  const tmp = new Float64Array(w * w);
  const out = new Float64Array(w * w);
  const clamp = (v: number) => Math.min(w - 1, Math.max(0, v));
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += src[y * w + clamp(x + k)];
    tmp[y * w + x] = s / (2 * r + 1);
  }
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += tmp[clamp(y + k) * w + x];
    out[y * w + x] = s / (2 * r + 1);
  }
  return out;
}

function median(d: Buffer, w: number, x0: number, y0: number, x1: number, y1: number) {
  return [0, 1, 2].map((c) => {
    const v: number[] = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) v.push(d[3 * (y * w + x) + c]);
    v.sort((a, b) => a - b);
    return v[v.length >> 1];
  });
}

describe('1.53.1 : peau de Victor sans plaques ni col clair', () => {
  test('corps : plus de plaques moyennes sombres ou claires', async () => {
    const { data, w } = await pixels('body_color.jpg', 256);
    const Y = new Float64Array(w * w);
    const M = new Float64Array(w * w);
    for (let i = 0; i < w * w; i++) {
      const l = 0.2126 * (data[3 * i] / 255) ** 2.2 + 0.7152 * (data[3 * i + 1] / 255) ** 2.2 + 0.0722 * (data[3 * i + 2] / 255) ** 2.2;
      Y[i] = l;
      M[i] = l > 0.03 ? 1 : 0; // peau (le sous-vêtement peint, noir, est exclu)
    }
    const ym = Y.map((v, i) => v * M[i]);
    const [n3, d3, n11, d11] = [boxBlur(ym, w, 3), boxBlur(M, w, 3), boxBlur(ym, w, 11), boxBlur(M, w, 11)];
    const r: number[] = [];
    for (let i = 0; i < w * w; i++) if (d11[i] > 0.99 && d3[i] > 0.99) r.push(n3[i] / d3[i] / (n11[i] / d11[i]));
    r.sort((a, b) => a - b);
    expect(r[Math.floor(r.length * 0.01)]).toBeGreaterThan(0.82); // 1.53.0 : 0,70
    expect(r[Math.floor(r.length * 0.99)]).toBeLessThan(1.15); // 1.53.0 : 1,25
  });

  test('tête : le cou et la poitrine ont la couleur de la poitrine du corps', async () => {
    const body = await pixels('body_color.jpg', 1024);
    const head = await pixels('head_color.jpg', 1024);
    const b = median(body.data, 1024, 440, 560, 600, 600);
    for (const h of [median(head.data, 1024, 430, 700, 600, 860), median(head.data, 1024, 440, 600, 580, 640)]) {
      for (let c = 0; c < 3; c++) expect(Math.abs(h[c] - b[c])).toBeLessThanOrEqual(14); // 1.53.0 : jusqu'à 36
    }
  });
});
