import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** The validated gender-specific reference assets are immutable in this fix.
 * Reference meshes cannot be assigned to another coach's skeleton.
 * In v1.37.3 Kadir's own, previously approved GLBs are restored verbatim.
 */
// 1.44.2: Naël's and Inaya's MMA shorts take the textile folds (short_folds.mjs, Youssef 14/11 « mutualiser… pour tous les
// coachs »); only the short's positions and normals change. Fingerprints of 1.37.2 in the git history
const references = [
  {
    coach: 'nael',
    sha: '08481bf54bd7c191d870a4a1ff50b0ab3c4895d5',
  },
  {
    coach: 'inaya',
    sha: 'af445c42b327b865fa0538899c59a1f2374a5c2f',
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
