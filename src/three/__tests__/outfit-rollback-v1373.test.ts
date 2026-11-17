import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** Prevent re-introducing the shorts regression seen after the 1.37.1 rebuild.
 * 1.46.0 (Youssef 15/11, Kadir plus réaliste : cou, mâchoire, trapèzes) : new body, and the three outfits that cover
 * the neck and the trapezius (judo, bjj, bjj-nogi) follow it by tools/generator/kadir/tenues_suivent.py (garment
 * points moved with the body, hidden skin keys renamed); the shorts and the other outfits keep their 1.37.0 bytes.
 * 1.54.0 (Youssef 15/11 « kimonos trop gros, trop épais », option B « Tombé » choisie le 17/11) : judo and bjj rebuilt
 * on the current body by outfits.py (GI_STYLE tombe: real cloth thicknesses, the cloth spans the hollows). New approved
 * fingerprints for these two only; the 1.46 ones are in the git history. The shorts guard is untouched. */
const GOOD_1370 = {
  'boxe': '9c4a33b36d2468a9f653cce3e62260e69c3c9664',
  'kickboxing': '8cbced0c2a190539c7f3c172da3e9ca4ed4e4010',
  'muaythai': 'c6c183d9a4784ad02d5390eddf272ff6772b41a1',
  'mma': '0408bed276844fa7d85e469aab825fe301ef1e0c',
  'judo': 'acbb0bf5ae6c839462d9a348c5d69eadd0c96d30',
  'bjj': 'a0cfa6863ce6cb938d9e212553ee696f88936699',
  'bjj-nogi': 'cadc6b5cc30f20cd87b98bd9dfbbe2d027393fcc',
} as const;
function gitSha(path: string) {
  const data = readFileSync(path);
  expect(data.toString('ascii', 0, 4)).toBe('glTF');
  return createHash('sha1').update(Buffer.from('blob ' + data.length + '\0')).update(data).digest('hex');
}
describe('v1.37.3 — rollback non régressif des shorts de Kadir', () => {
  for (const [outfit, expected] of Object.entries(GOOD_1370)) {
    test(outfit + ' : correspond aux modèles validés v1.37.0', () => {
      expect(gitSha('public/coaches/mma-kadir/tenues/' + outfit + '.glb')).toBe(expected);
    });
  }
  test('modèle corporel Kadir intact', () => {
    expect(gitSha('public/coaches/mma-kadir/photo.glb')).toBe('c31999b521a53267262e77679afbc53d594c4ae2');
  });
});
