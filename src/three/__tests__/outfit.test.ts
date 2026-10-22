import { describe, expect, test } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { hiddenKeys, maskedIndex, outfitFor, type OutfitId } from '../outfit';

/** v0.31 discipline outfits: files, skeleton, hidden skin (tools/generator/rocketbox/outfits.py) */
const OUTFITS: OutfitId[] = ['boxe', 'kickboxing', 'muaythai', 'mma', 'bjj', 'bjj-nogi', 'judo'];
const COACHES = ['mma-kadir', 'mma-amara'];

interface Gltf {
  nodes: { name?: string; mesh?: number; skin?: number; extras?: Record<string, unknown> }[];
  meshes: { name?: string; primitives: { attributes: Record<string, number> }[] }[];
  skins?: { joints: number[] }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; type: string }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
}

function glb(path: string) {
  const b = readFileSync(path);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8')) as Gltf;
  const binStart = 20 + jsonLen + 8;
  const bin = b.subarray(binStart);
  const floats = (acc: number) => {
    const a = json.accessors[acc];
    const v = json.bufferViews[a.bufferView];
    const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const out = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count * 3; i++) out[i] = bin.readFloatLE(off + i * 4);
    return out;
  };
  return { json, floats };
}

describe('tenues des coachs Ultra-réalistes', () => {
  test('choix de la tenue selon la discipline et les réglages', () => {
    expect(outfitFor('muaythai', true, 'gi')).toBe('muaythai');
    expect(outfitFor('bjj', true, 'nogi')).toBe('bjj-nogi');
    expect(outfitFor('bjj', true, 'gi')).toBe('bjj');
    expect(outfitFor('judo', false, 'gi')).toBeNull();
  });

  test('seuls les triangles entièrement couverts disparaissent', () => {
    const pos = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0];
    const keys = new Set(['0,0,0', '10,0,0', '0,10,0']);
    const { index, matched } = maskedIndex(pos, [0, 1, 2, 1, 3, 2], keys, 10);
    expect(matched).toBe(3);
    expect(index).toEqual([1, 3, 2]);
    const b64 = Buffer.from(new Int16Array([1, -2, 3, 40, 50, -60]).buffer).toString('base64');
    expect([...hiddenKeys(b64)]).toEqual(['1,-2,3', '40,50,-60']);
  });

  describe.each(COACHES)('%s', (coach) => {
    const body = glb(`public/coaches/${coach}/photo.glb`);
    const bodyNode = body.json.nodes.find((n) => n.mesh !== undefined && n.skin !== undefined)!;
    // body and head: one primitive each
    const bodyPos = body.json.meshes[bodyNode.mesh!].primitives.flatMap((p) => [...body.floats(p.attributes.POSITION)]);
    const bones = new Set(body.json.skins![0].joints.map((j) => body.json.nodes[j].name));

    test.each(OUTFITS)('%s : fichier, squelette du coach, peau masquée sous la tenue', (o) => {
      const path = `public/coaches/${coach}/tenues/${o}.glb`;
      expect(existsSync(path), path).toBe(true);
      const { json } = glb(path);
      // every garment is skinned, and only to bones the coach has
      const meshNodes = json.nodes.filter((n) => n.mesh !== undefined);
      expect(meshNodes.length).toBeGreaterThan(0);
      for (const n of meshNodes) {
        expect(n.skin, n.name).toBeDefined();
        for (const j of json.skins![n.skin!].joints) expect(bones.has(json.nodes[j].name), json.nodes[j].name).toBe(true);
      }
      // the list of hidden body points matches the real body (same file the app loads)
      const carrier = json.nodes.find((n) => n.extras?.hideBody);
      expect(carrier, 'hideBody').toBeDefined();
      const keys = hiddenKeys(carrier!.extras!.hideBody as string);
      const scale = Number(carrier!.extras!.hideScale);
      const all = new Set<string>();
      for (let i = 0; i < bodyPos.length; i += 3) all.add(`${Math.round(bodyPos[i] * scale)},${Math.round(bodyPos[i + 1] * scale)},${Math.round(bodyPos[i + 2] * scale)}`);
      let found = 0;
      for (const k of keys) if (all.has(k)) found++;
      expect(found / keys.size).toBeGreaterThan(0.98);
    });
  });
});
