import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** The validated gender-specific reference assets are immutable in this fix.
 * Reference meshes cannot be assigned to another coach's skeleton.
 * In v1.37.3 Kadir's own, previously approved GLBs are restored verbatim.
 */
const references = [
  {
    coach: 'nael',
    sha: 'e4d1e0e46de56ea8a702d776f055a0b4fe2d9478',
  },
  {
    coach: 'inaya',
    sha: '0237f76c9fc0db9e154efa5321cb0c17ace813b4',
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
