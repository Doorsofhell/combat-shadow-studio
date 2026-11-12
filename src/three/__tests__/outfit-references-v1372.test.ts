import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** The validated gender-specific reference assets are immutable in this fix.
 * Kadir and Amara receive new GLBs skinned on their own rigs; copying either
 * source GLB directly would use the wrong bone inverse bind matrices.
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

  test('the generation script rebuilds only the follower coaches', () => {
    const script = readFileSync('scripts/dev/regenerate-outfits-v1371.sh', 'utf8');
    expect(script).toContain('export ONLY=mma');
    expect(script).toContain('build_one mma-kadir homme default');
    expect(script).toContain('build_one mma-amara femme default');
    expect(script).not.toContain('build_one nael homme nael');
    expect(script).not.toContain('build_one inaya femme inaya');
  });
});
