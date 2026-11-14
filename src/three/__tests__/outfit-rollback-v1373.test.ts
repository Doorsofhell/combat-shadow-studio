import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** Prevent re-introducing the shorts regression seen after the 1.37.1 rebuild. */
const GOOD_1370 = {
  'boxe': '9c4a33b36d2468a9f653cce3e62260e69c3c9664',
  'kickboxing': '8cbced0c2a190539c7f3c172da3e9ca4ed4e4010',
  'muaythai': 'c6c183d9a4784ad02d5390eddf272ff6772b41a1',
  'mma': '0408bed276844fa7d85e469aab825fe301ef1e0c',
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
