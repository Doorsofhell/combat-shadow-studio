import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** The validated gender-specific reference assets are immutable in this fix.
 * Reference meshes cannot be assigned to another coach's skeleton.
 * In v1.37.3 Kadir's own, previously approved GLBs are restored verbatim.
 */
// 1.44.2: Naël's and Inaya's MMA shorts take the textile folds (short_folds.mjs, Youssef 14/11 « mutualiser… pour tous les
// coachs »); only the short's positions and normals change. Fingerprints of 1.37.2 in the git history
// 2.4.0 prototype 2 (Youssef 25/11, carte « Oui, toutes les tenues ») : ourlets redressés (tools/generator/rocketbox/hem_straight.py, hauteur des points du bas
// seulement). Nouvelles empreintes ; celles de 1.44.2 dans l'historique git
const references = [
  {
    coach: 'nael',
    sha: '3c23114b72b875f7af8845eaea5eadc124766f7c',
  },
  {
    coach: 'inaya',
    sha: 'df7b9b652c3b25c7a58d758abadd60ec399a1823',
  },
] as const;

function gitBlobSha(data: Buffer) {
  const header = Buffer.from('blob ' + data.length + '\0');
  return createHash('sha1').update(header).update(data).digest('hex');
}

describe('MMA short reference models — v1.37.2', () => {
  for (const { coach, sha } of references) {
    test(`${coach} retains the approved outfit unchanged`, () => {
      const path = `public/coaches/${coach}/tenues/mma.glb`;
      const data = readFileSync(path);
      expect(data.toString('ascii', 0, 4)).toBe('glTF');
      expect(gitBlobSha(data)).toBe(sha);
    });
  }

  test('the recovery script operates on Kadir only', () => {
    const script = readFileSync('scripts/dev/restore-kadir-v1373.sh', 'utf8');
    expect(script).toContain('BASELINE=bcb49f9281');
    expect(script).toContain('OUT=public/coaches/mma-kadir/tenues');
    expect(script).not.toContain('build_one nael');
    expect(script).not.toContain('build_one inaya');
  });
});
