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

describe('v1.37.5 — Inaya référence immuable et Amara morphologie adaptée', () => {
  for (const outfit of OUTFITS) {
    test(`Inaya/${outfit} conservée à l’octet près`, () => {
      const { b } = binary(`public/coaches/inaya/tenues/${outfit}.glb`);
      expect(gitHash(b)).toBe(INAYA_GIT_SHA[outfit]);
    });
    test(`Amara/${outfit} reconstruite sur son propre squelette`, () => {
      const { gltf } = binary(`public/coaches/mma-amara/tenues/${outfit}.glb`);
      expect(gltf.skins.length).toBeGreaterThan(0);
      expect(gltf.nodes.some((n) => n.extras?.generatorVersion === '1.37.5' &&
        n.extras?.clothingReference === 'inaya' &&
        n.extras?.clothingMorphology === 'mma-amara')).toBe(true);
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
  });
});
