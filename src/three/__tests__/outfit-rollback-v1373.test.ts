import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** Prevent re-introducing the shorts regression seen after the 1.37.1 rebuild. */
// 1.45.2 (Youssef 15/11, carte « Ajouter aussi les plis sur les shorts de Kadir ? » → oui): the four shorts are the
// validated v1.37.0 models plus the textile folds of tools/generator/rocketbox/short_folds.mjs (short positions and
// normals only). The v1.37.0 fingerprints are in the git history
const GOOD_1370 = {
  'boxe': 'c381b22b0880cf3d0ee1bbdba1583acdc237ff80',
  'kickboxing': 'a095d46c4cf418b233c595ce2f98a3606f37b55d',
  'muaythai': '04764626a6c2018051b667a8bc0311a8b9b743bb',
  'mma': 'd2638d08e8f7d12d35f8e3a6b3147dc21e5ebd3c',
  'judo': '9ec4ec99f383d5bde97f9ea46efc9d78e131e804',
  'bjj': '18546da1ff3acb931583d642b2e04e53ec1cbb4c',
  'bjj-nogi': 'fdbeded76c3b976e6c95d81001529cc692ac3518',
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
    expect(gitSha('public/coaches/mma-kadir/photo.glb')).toBe('9b720189cdd3a9f27e55c14d0a90fb423b3801a2');
  });
});
