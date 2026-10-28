import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * v0.32 finishing of the discipline outfits (Youssef, 2026-10-22 10:33, « CORRECTIONS PREMIUM »), checked on the
 * shipped files (tools/generator/rocketbox/outfits.py): hems that no longer follow the hand or the foot (toothed
 * edges), gis with a real colour weave, a belt with its knot and two ends.
 */
const COACHES = ['mma-kadir', 'mma-amara'];

interface Gltf {
  nodes: { name?: string; mesh?: number; skin?: number }[];
  meshes: { name?: string; primitives: { attributes: Record<string, number>; material?: number }[] }[];
  skins: { joints: number[] }[];
  materials: { name?: string; normalTexture?: object; pbrMetallicRoughness?: { baseColorTexture?: object; roughnessFactor?: number } }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; type: string; normalized?: boolean }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
}

function glb(path: string) {
  const b = readFileSync(path);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8')) as Gltf;
  const bin = b.subarray(20 + jsonLen + 8);
  const SIZE: Record<number, number> = { 5121: 1, 5123: 2, 5126: 4 };
  /** VEC4 accessor read as numbers (bytes, shorts, normalised or floats) */
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

/** largest weight a garment gives to bones whose name matches `bones` */
function maxWeight(path: string, garment: RegExp, bones: RegExp) {
  const { json, vec4 } = glb(path);
  let worst = 0;
  let seen = 0;
  for (const n of json.nodes) {
    if (n.mesh === undefined || n.skin === undefined || !garment.test(n.name ?? '')) continue;
    seen++;
    const joints = json.skins[n.skin].joints.map((j) => json.nodes[j].name ?? '');
    for (const p of json.meshes[n.mesh].primitives) {
      const J = vec4(p.attributes.JOINTS_0);
      const W = vec4(p.attributes.WEIGHTS_0);
      J.forEach((row, i) => row.forEach((j, k) => bones.test(joints[j]) && (worst = Math.max(worst, W[i][k]))));
    }
  }
  return { worst, seen };
}

describe.each(COACHES)('finition des tenues v0.32, %s', (coach) => {
  const f = (o: string) => `public/coaches/${coach}/tenues/${o}.glb`;

  test.each(['judo', 'bjj'])('%s : manches sans poids de la main, pantalon sans poids du pied (ourlets droits)', (o) => {
    const sleeve = maxWeight(f(o), /^veste/, /Hand/);
    expect(sleeve.seen).toBeGreaterThan(0);
    expect(sleeve.worst).toBeLessThan(0.01);
    const legs = maxWeight(f(o), /^pantalon/, /Foot|ToeBase/);
    expect(legs.seen).toBeGreaterThan(0);
    expect(legs.worst).toBeLessThan(0.01);
  });

  test('protège-tibias : manchon complet sans poids du pied', () => {
    const r = maxWeight(f('kickboxing'), /^protege-tibias/, /Foot|ToeBase/);
    expect(r.seen).toBeGreaterThan(0);
    expect(r.worst).toBeLessThan(0.01);
  });

  test.each(['judo', 'bjj'])('%s : tissage en couleur et en relief, ceinture nouée avec deux extrémités, revers cousus', (o) => {
    const { json } = glb(f(o));
    const gi = json.materials.find((m) => m.name?.startsWith(`gi-`));
    expect(gi?.normalTexture).toBeTruthy();
    expect(gi?.pbrMetallicRoughness?.baseColorTexture).toBeTruthy();
    // matt cotton, not a shiny material
    expect(gi?.pbrMetallicRoughness?.roughnessFactor ?? 1).toBeGreaterThan(0.85);
    const names = json.nodes.map((n) => n.name ?? '');
    expect(names.some((n) => n.startsWith('noeud'))).toBe(true);
    expect(names.filter((n) => n.startsWith('pan-')).length).toBe(2);
    expect(names.filter((n) => n.startsWith('revers-')).length).toBe(2);
  });

  test('shorts : satin et élastique mats (plus d’aspect plastique)', () => {
    for (const o of ['boxe', 'kickboxing', 'muaythai', 'mma']) {
      const { json } = glb(f(o));
      for (const m of json.materials.filter((x) => /^(short|ceinture)-/.test(x.name ?? ''))) expect(m.pbrMetallicRoughness?.roughnessFactor ?? 1, `${o} ${m.name}`).toBeGreaterThanOrEqual(0.575);
    }
  });
});

/** width and height of a WebP file (lossy VP8, lossless VP8L or extended VP8X) */
function webpSize(path: string) {
  const b = readFileSync(path);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8L') {
    const v = b.readUInt32LE(21);
    return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) };
  }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
}

describe('écran « Choisis ton coach »', () => {
  // v0.32: the cartoon drawings are replaced by renders of the shipped 3D coaches (scripts/visuels since 1.2.1),
  // at a resolution sharp on Android screens (450 x 600 points at density 2)
  test.each(COACHES)('%s : portrait rendu depuis le modèle 3D, 900 x 1200', (coach) => {
    expect(webpSize(`public/coaches/${coach}/portrait.webp`)).toEqual({ w: 900, h: 1200 });
  });
});
