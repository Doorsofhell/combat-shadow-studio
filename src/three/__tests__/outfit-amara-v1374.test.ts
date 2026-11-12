import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const OUTFITS = ['boxe', 'kickboxing', 'muaythai', 'mma', 'bjj', 'bjj-nogi', 'judo'] as const;

/** Approved Inaya models are a locked pattern reference, not a replacement rig. */
const INAYA_GIT_SHA: Record<(typeof OUTFITS)[number], string> = {
  boxe: '6ae0e87eab10edc1586ec00e48635557cb7a38b9',
  kickboxing: '00f89d185790d9515edb08f7f5864d4d611418f2',
  muaythai: 'd292d31dc7d04d641d197cc74fd6394f32ec6db2',
  mma: '0237f76c9fc0db9e154efa5321cb0c17ace813b4',
  bjj: 'd867e25d3dd16fe4e227ee4b34ad6b15fab15ba1',
  'bjj-nogi': 'f874d571568e3d5c3abb7023954410fd3d2e594c',
  judo: '0f79f8a23c0b65b92224f88f8387acc4cb74c5f5',
};

function binary(path: string) {
  const b = readFileSync(path);
  expect(b.toString('ascii', 0, 4)).toBe('glTF');
  const n = b.readUInt32LE(12);
  const gltf = JSON.parse(b.toString('utf8', 20, 20 + n)) as {
    nodes: Array<{ name?: string; mesh?: number; extras?: Record<string, unknown> }>;
    skins: unknown[];
  };
  return { b, gltf };
}

function gitHash(b: Buffer) {
  return createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
}

describe('v1.37.7 — Inaya référence immuable et Amara morphologie adaptée', () => {
  for (const outfit of OUTFITS) {
    test(`Inaya/${outfit} conservée à l’octet près`, () => {
      const { b } = binary(`public/coaches/inaya/tenues/${outfit}.glb`);
      expect(gitHash(b)).toBe(INAYA_GIT_SHA[outfit]);
    });
    test(`Amara/${outfit} reconstruite sur son propre squelette`, () => {
      const { gltf } = binary(`public/coaches/mma-amara/tenues/${outfit}.glb`);
      expect(gltf.skins.length).toBeGreaterThan(0);
      // 1.37.7: the 1.37.6 square cut (holes, torn edges) is replaced by Inaya's crop with the higher front, built
      // on Amara's skin with the old sculpted bikini flattened first (see docs/JOURNAL_CORRECTIONS.md, v1.37.7)
      expect(gltf.nodes.some((n) => n.extras?.generatorVersion === '1.37.7' &&
        n.extras?.clothingReference === 'inaya' &&
        n.extras?.clothingMorphology === 'mma-amara' &&
        n.extras?.sportsTopCut === 'inaya-crop-high-front-1377' &&
        n.extras?.oldBikiniFlattened === true)).toBe(true);
    });
  }

  for (const outfit of ['boxe', 'kickboxing', 'muaythai', 'mma']) {
    test(`Amara/${outfit} : haut crop féminin de référence`, () => {
      const { gltf } = binary(`public/coaches/mma-amara/tenues/${outfit}.glb`);
      expect(gltf.nodes.some((n) => n.name?.includes('haut-crop') && n.mesh !== undefined)).toBe(true);
    });
  }

  test('MMA : short intérieur et surshort conservés, sans copier les GLB d’Inaya', () => {
    const { gltf } = binary('public/coaches/mma-amara/tenues/mma.glb');
    for (const part of ['short-vale-tudo', 'short-surshort']) {
      expect(gltf.nodes.some((n) => n.name?.includes(part) && n.mesh !== undefined)).toBe(true);
    }
    // 1.37.7: the over-short is whole again (the 1.37.6 central cut left a loose dark piece between the thighs);
    // only the liner, under it, is parted at the middle (the thin panel that stretched into a strand at a high kick)
    expect(gltf.nodes.some((n) => n.name?.includes('short-surshort') && n.extras?.cssCrotchGapCut !== undefined)).toBe(false);
    expect(gltf.nodes.some((n) => n.name?.includes('short-vale-tudo') &&
      typeof n.extras?.cssLinerGap === 'number' && (n.extras.cssLinerGap as number) >= 0.008)).toBe(true);
    expect(gltf.nodes.some((n) => n.extras?.shortCrotchGeometry === 'liner-split-1377')).toBe(true);
  });
});
