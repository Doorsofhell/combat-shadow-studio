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
          // 1.38.0: Amara's seven outfits rebuilt on her body cleaned at its source (journal, v1.38.0)
          const expected = coach === 'mma-amara' ? '1.38.0' : '1.37.2';
          expect(carrier?.extras?.generatorVersion, `${coach}/${outfit} doit être généré avec ${expected}`).toBe(expected);
        }
      });
    }
  }
  for (const coach of ['mma-amara', 'inaya']) {
    test(`${coach} : coupe MMA approuvée et accessoires présents`, () => {
      const glb = parse(`public/coaches/${coach}/tenues/mma.glb`);
      const meshes = glb.nodes.filter(n => n.mesh !== undefined);
      const names = meshes.map(n => n.name ?? '');
      expect(names.some(n => n.includes('short-vale-tudo')), `${coach}: short de combat`).toBe(true);
      if (coach === 'mma-amara') {
        // 1.37.9: user-approved feminine boxer (ONE layer), intentionally replaces
        // the old double-layered MMA liner/overshort; Inaya remains untouched.
        expect(names.some(n => n.includes('short-surshort')), 'old Amara overshort returned').toBe(false);
        expect(meshes.some(n => n.name?.startsWith('short-vale-tudo') && n.extras?.cssNoOvershort === true)).toBe(true);
        // 1.38.0: the under-band is a fitted ring (thin, on the body's outline), no longer the 4.4 cm ring of 1.37.9
        expect(meshes.some(n => n.name?.startsWith('bande-brassiere-mma') && n.extras?.cssFittedBand === '1.38.0')).toBe(true);
      } else {
        expect(names.some(n => n.includes('short-surshort')), 'Inaya historical MMA outer-short missing').toBe(true);
      }
      expect(names.some(n => /haut-(brassiere|crop|carre)/.test(n)), `${coach}: haut de combat`).toBe(true);
    });
  }
});
