import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { gloveGeometry } from '../customize';

/**
 * v0.43 equipment (Youssef, 2026-10-23, « REFONTE RÉALISTE DES ÉQUIPEMENTS 3D »), checked on the shipped files
 * (tools/generator/rocketbox/outfits.py, glove.py): sculpted gloves and shoes in one piece each (one draw call),
 * coloured by zone, light enough for phones, bound only to the bones they follow; braided prajioud laid on the arm.
 */
const COACHES = ['mma-kadir', 'mma-amara'];

interface Gltf {
  nodes: { name?: string; mesh?: number; skin?: number }[];
  meshes: { name?: string; primitives: { attributes: Record<string, number>; indices?: number; material?: number }[] }[];
  skins: { joints: number[] }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; type: string; normalized?: boolean; min?: number[]; max?: number[] }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
}

function glb(path: string) {
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
  const mesh = (name: RegExp) => json.meshes.filter((m) => name.test(m.name ?? ''));
  const triangles = (m: Gltf['meshes'][number]) => m.primitives.reduce((n, p) => n + json.accessors[p.indices!].count / 3, 0);
  /** bones a garment gives a real weight to */
  const bones = (garment: RegExp) => {
    const out = new Set<string>();
    for (const n of json.nodes) {
      if (n.mesh === undefined || n.skin === undefined || !garment.test(json.meshes[n.mesh].name ?? '')) continue;
      const joints = json.skins[n.skin].joints.map((j) => json.nodes[j].name ?? '');
      for (const p of json.meshes[n.mesh].primitives) {
        const J = vec4(p.attributes.JOINTS_0);
        const W = vec4(p.attributes.WEIGHTS_0);
        J.forEach((row, i) => row.forEach((j, k) => W[i][k] > 0.01 && out.add(joints[j])));
      }
    }
    return out;
  };
  const drawCalls = json.meshes.reduce((n, m) => n + m.primitives.length, 0);
  return { json, mesh, triangles, bones, drawCalls };
}

describe.each(COACHES)('équipements v0.43, %s', (coach) => {
  const f = (o: string) => glb(`public/coaches/${coach}/tenues/${o}.glb`);

  test.each(['boxe', 'kickboxing', 'muaythai'])('%s : un gant sculpté d’une seule pièce par main, coloré par zone', (o) => {
    const g = f(o);
    const gloves = g.mesh(/^gant-(Left|Right)/);
    expect(gloves.map((m) => m.name?.replace(/\.\d+$/, '')).sort()).toEqual(['gant-Left', 'gant-Right']);
    // the 4 pieces of before (mitt, thumb, cuff, strap) are gone
    expect(g.mesh(/^(pouce|manchette|sangle)-/)).toHaveLength(0);
    for (const m of gloves) {
      expect(m.primitives).toHaveLength(1);
      expect(m.primitives[0].attributes.COLOR_0).toBeDefined();
      const t = g.triangles(m);
      // no heavier than the 4 pieces of v0.42 (2 916 triangles per hand): the coach must keep its frame rate
      expect(t).toBeGreaterThan(2200);
      expect(t).toBeLessThanOrEqual(3100);
    }
    // the glove follows the hand and the forearm only
    for (const b of g.bones(/^gant-/)) expect(b).toMatch(/(Hand|ForeArm)$/);
  });

  test('boxe : chaussures d’une seule pièce par pied, sans orteils, liées au pied et à la jambe', () => {
    const g = f('boxe');
    const shoes = g.mesh(/^chaussure-(Left|Right)/);
    expect(shoes).toHaveLength(2);
    for (const m of shoes) {
      expect(m.primitives).toHaveLength(1);
      expect(m.primitives[0].attributes.COLOR_0).toBeDefined();
      expect(g.triangles(m)).toBeLessThan(3600);
    }
    for (const b of g.bones(/^chaussure-/)) expect(b).toMatch(/(Foot|ToeBase|Leg)$/);
    expect(g.bones(/^chaussure-/).has(`LeftUpLeg`)).toBe(false);
  });

  test('moins d’appels de dessin qu’avant (gants : 4 pièces par main en v0.42)', () => {
    // v0.42: boxe 12 (Kadir) / 14 (Amara), kick-boxing 11 / 13, muay-thaï 12 / 14
    const before: Record<string, number> = { boxe: 12, kickboxing: 11, muaythai: 12 };
    const extra = coach === 'mma-amara' ? 2 : 0;
    for (const o of Object.keys(before)) expect(f(o).drawCalls, o).toBeLessThanOrEqual(before[o] + extra - 4);
  });

  test('muay-thaï : prajioud tressé avec nœud et deux pans, lié au bras', () => {
    const g = f('muaythai');
    const pr = g.mesh(/^prajioud-/);
    expect(pr).toHaveLength(2);
    for (const m of pr) {
      // v0.42: a plain ring (320 points); now a twisted cord, a knot and two tails
      expect(g.json.accessors[m.primitives[0].attributes.POSITION].count).toBeGreaterThan(500);
      const pos = g.json.accessors[m.primitives[0].attributes.POSITION];
      // the cord round the upper arm, knot and tails included, stays within 16 cm
      const size = pos.max!.map((x, i) => x - pos.min![i]);
      expect(Math.max(...size)).toBeLessThan(0.16);
    }
    for (const b of g.bones(/^prajioud-/)) expect(b).toMatch(/Arm$/);
  });

  test('MMA : sangle de poignet dans la couleur d’accent', () => {
    const g = f('mma');
    const mats = g.json as unknown as { materials: { name?: string }[] };
    expect(mats.materials.some((m) => m.name?.startsWith('sangle-mma-'))).toBe(true);
  });
});

describe('gant Anime (forme sculptée partagée)', () => {
  // a right hand in the bind pose, glTF axes: arm along -x, back of the hand up
  const bones = {
    RightForeArm: new Vector3(-0.3, 1.4, 0),
    RightHand: new Vector3(-0.55, 1.4, 0),
    RightHandMiddle1: new Vector3(-0.645, 1.4, 0),
    RightHandIndex1: new Vector3(-0.64, 1.4, 0.025),
    RightHandPinky1: new Vector3(-0.63, 1.4, -0.03),
  };
  test('taille d’un gant d’entraînement et faces tournées vers l’extérieur', () => {
    const g = gloveGeometry(bones, 'Right');
    g.computeBoundingBox();
    const s = new Vector3();
    g.boundingBox!.getSize(s);
    // about 30 cm from the cuff to the striking face, 13 to 18 cm wide with the thumb
    expect(s.x).toBeGreaterThan(0.27);
    expect(s.x).toBeLessThan(0.34);
    expect(Math.max(s.y, s.z)).toBeGreaterThan(0.11);
    expect(Math.max(s.y, s.z)).toBeLessThan(0.18);
    // signed volume > 0: the triangles turn outward (a mirrored hand would show inside out)
    const p = g.getAttribute('position');
    const ix = g.index!;
    let vol = 0;
    const a = new Vector3(), b = new Vector3(), c = new Vector3();
    for (let t = 0; t < ix.count; t += 3) {
      a.fromBufferAttribute(p, ix.getX(t));
      b.fromBufferAttribute(p, ix.getX(t + 1));
      c.fromBufferAttribute(p, ix.getX(t + 2));
      vol += a.dot(b.cross(c)) / 6;
    }
    expect(vol).toBeGreaterThan(0.0005);
  });
});
