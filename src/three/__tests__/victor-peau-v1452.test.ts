import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 1.45.2 (Youssef 14/11 23:43 : « des taches sombres sur son corps… moins brun comme sur la palette source », validé
 * le 15/11 « Ok pour peau victor ») : le modèle de Victor porte les textures nettoyées par
 * tools/generator/victor/peau_propre.py (plaques sombres effacées, teint de la planche ; mesures dans le journal).
 * Kadir, dont Victor copie la structure, n'est pas touché.
 */
const ROOT = resolve(__dirname, '../../..');

function glb(path: string) {
  const b = readFileSync(resolve(ROOT, path));
  const jl = b.readUInt32LE(12);
  return { json: JSON.parse(b.subarray(20, 20 + jl).toString('utf8')), bin: b.subarray(20 + jl + 8) };
}
function image(path: string, name: string) {
  const { json, bin } = glb(path);
  const im = json.images.find((i: { name?: string }) => i.name === name);
  const bv = json.bufferViews[im.bufferView];
  return Buffer.from(bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength));
}

describe('1.45.2 : peau de Victor', () => {
  test.each([
    ['m021_body_color', 'body_color.jpg'],
    ['m021_head_color', 'head_color.jpg'],
  ])('%s = texture nettoyée %s', (name, file) => {
    const src = readFileSync(resolve(ROOT, 'tools/generator/victor/donnees', file));
    expect(Buffer.compare(image('public/coaches/victor/photo.glb', name), src)).toBe(0);
  });

  test('les textures de Kadir ne sont pas celles de Victor', () => {
    const k = image('public/coaches/mma-kadir/photo.glb', 'm021_body_color');
    expect(Buffer.compare(k, image('public/coaches/victor/photo.glb', 'm021_body_color'))).not.toBe(0);
  });
});
