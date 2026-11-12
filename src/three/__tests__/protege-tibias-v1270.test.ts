import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * 1.27 (Youssef, 2026-11-06, three photos of sock-style guards: « pour le MMA, rajoute aux coachs des protège-tibias
 * bien faits comme les autres, pas de bavures »): every coach's MMA outfit carries shin-and-instep guards
 * (tools/generator/rocketbox/outfits.py mma_shin_guards), checked on the shipped files.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya'];

interface Gltf {
  nodes: { name?: string; mesh?: number; skin?: number }[];
  meshes: { name?: string; primitives: { attributes: Record<string, number>; indices?: number }[] }[];
  skins: { joints: number[] }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; normalized?: boolean; min?: number[]; max?: number[] }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
}

function read(path: string) {
  const b = readFileSync(path);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8')) as Gltf;
  const bin = b.subarray(20 + jsonLen + 8);
  const SIZE: Record<number, number> = { 5121: 1, 5123: 2, 5126: 4 };
  const vec4 = (acc: number) => {
    const a = json.accessors[acc];
    const v = json.bufferViews[a.bufferView];
    const sz = SIZE[a.componentType];
    const stride = v.byteStride ?? sz * 4;
    const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const out: number[][] = [];
    for (let i = 0; i < a.count; i++) {
      const row: number[] = [];
      for (let k = 0; k < 4; k++) {
        const o = off + i * stride + k * sz;
        const x = a.componentType === 5126 ? bin.readFloatLE(o) : a.componentType === 5123 ? bin.readUInt16LE(o) : bin.readUInt8(o);
        row.push(a.componentType !== 5126 && a.normalized ? x / (a.componentType === 5123 ? 65535 : 255) : x);
      }
      out.push(row);
    }
    return out;
  };
  return { json, vec4 };
}

describe.each(COACHES)('protège-tibias MMA (1.27), %s', (coach) => {
  const { json, vec4 } = read(`public/coaches/${coach}/tenues/mma.glb`);
  const node = json.nodes.find((n) => n.mesh !== undefined && /^protege-tibias-mma/.test(json.meshes[n.mesh].name ?? ''));

  test('la tenue de MMA porte des protège-tibias', () => {
    expect(node).toBeDefined();
  });

  test('du dessous du genou au cou-de-pied, les deux jambes', () => {
    const m = json.meshes[node!.mesh!];
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (const p of m.primitives) {
      const a = json.accessors[p.attributes.POSITION];
      a.min!.forEach((v, k) => (lo[k] = Math.min(lo[k], v)));
      a.max!.forEach((v, k) => (hi[k] = Math.max(hi[k], v)));
    }
    // glTF: y up, metres; the coach stands on y = 0
    expect(lo[1]).toBeLessThan(0.06); // down over the foot (the sole stays bare: a little above the floor)
    expect(lo[1]).toBeGreaterThan(0.005);
    expect(hi[1]).toBeGreaterThan(0.36); // up to under the knee
    expect(hi[1]).toBeLessThan(0.56);
    expect(hi[0] - lo[0]).toBeGreaterThan(0.2); // both legs
  });

  test('il suit le tibia et le pied seulement (bord du haut net quand le genou plie)', () => {
    const joints = json.skins[node!.skin!].joints.map((j) => json.nodes[j].name ?? '');
    const used = new Set<string>();
    for (const p of json.meshes[node!.mesh!].primitives) {
      const J = vec4(p.attributes.JOINTS_0);
      const W = vec4(p.attributes.WEIGHTS_0);
      J.forEach((row, i) => row.forEach((j, k) => W[i][k] > 0.01 && used.add(joints[j])));
    }
    expect(used.size).toBeGreaterThan(0);
    for (const b of used) expect(b, b).toMatch(/(Left|Right)(Leg|Foot|ToeBase)$/);
  });
});
