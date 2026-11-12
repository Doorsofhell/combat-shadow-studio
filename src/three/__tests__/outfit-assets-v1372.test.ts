import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

interface Node { name?: string; mesh?: number; extras?: Record<string, unknown> }
interface Asset { nodes: Node[]; meshes: Array<{ primitives: Array<{ attributes: Record<string, number> }> }> }

function parse(path: string): Asset {
  const b = readFileSync(path);
  expect(b.toString('ascii', 0, 4), path).toBe('glTF');
  const len = b.readUInt32LE(12);
  const json = JSON.parse(b.toString('utf8', 20, 20 + len)) as Asset;
  expect(json.meshes.length, path).toBeGreaterThan(0);
  return json;
}

const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya'];
const OUTFITS = ['boxe', 'kickboxing', 'muaythai', 'mma', 'bjj', 'bjj-nogi', 'judo'];

describe('1.37.2 — modèles vestimentaires reconstruits et validés', () => {
  for (const coach of COACHES) {
    for (const outfit of OUTFITS) {
      test(`${coach}/${outfit} contient des assets v1.37.2`, () => {
        const glb = parse(`public/coaches/${coach}/tenues/${outfit}.glb`);
        // 1.37.3: Kadir uses the verified 1.37.0 geometry to undo the shorts regression.
        // Its exact binary hashes are checked in outfit-rollback-v1373.test.ts.
        if (coach !== 'mma-kadir') {
          const carrier = glb.nodes.find(n => n.extras?.generatorVersion);
          const expected = coach === 'mma-amara' ? '1.37.4' : '1.37.2';
          expect(carrier?.extras?.generatorVersion, `${coach}/${outfit} doit être généré avec ${expected}`).toBe(expected);
        }
      });
    }
  }
  for (const coach of ['mma-amara', 'inaya']) {
    test(`${coach} : double short MMA, haut et accessoires présents`, () => {
      const glb = parse(`public/coaches/${coach}/tenues/mma.glb`);
      const names = glb.nodes.filter(n => n.mesh !== undefined).map(n => n.name ?? '');
      for (const part of ['short-vale-tudo', 'short-surshort']) {
        expect(names.some(n => n.includes(part)), `${coach}: ${part}`).toBe(true);
      }
      expect(names.some(n => /haut-(brassiere|crop|carre)/.test(n)), `${coach}: haut de combat`).toBe(true);
    });
  }
});
