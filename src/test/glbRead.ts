import { readFileSync } from 'node:fs';
import { Matrix4, Vector3 } from 'three';

/**
 * 1.10 test helper: reads the skinned meshes of a shipped GLB (positions, normals, four joints and weights per point)
 * and where each joint stands at bind time (inverse of its inverse bind matrix), in the same space as the points.
 * Spatial checks of the skin weights need both: which bone moves which part of a garment, measured where it is.
 */
export interface Gltf {
  nodes: { name?: string; mesh?: number; skin?: number; extras?: Record<string, unknown> }[];
  meshes: { name?: string; extras?: Record<string, unknown>; primitives: { attributes: Record<string, number>; indices?: number; material?: number }[] }[];
  materials?: { name?: string; doubleSided?: boolean; alphaMode?: string; extras?: Record<string, unknown> }[];
  skins: { joints: number[]; inverseBindMatrices?: number }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; componentType: number; type: string; normalized?: boolean }[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
}

const SIZE: Record<number, number> = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
const COMP: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export interface SkinnedPart {
  name: string;
  material: string;
  positions: Vector3[];
  joints: string[][];
  weights: number[][];
  index: number[];
  /** 1.15 texture coordinates of each point (empty when the part has none) */
  uvs: number[][];
  /** weight of a bone at a point (0 when it does not influence it) */
  weightOf(i: number, bone: string): number;
}

export function readGlb(path: string) {
  const b = readFileSync(path);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8')) as Gltf;
  const bin = b.subarray(20 + jsonLen + 8);
  const read = (acc: number): number[][] => {
    const a = json.accessors[acc];
    const v = json.bufferViews[a.bufferView];
    const sz = SIZE[a.componentType];
    const n = COMP[a.type];
    const stride = v.byteStride ?? sz * n;
    const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const out: number[][] = [];
    for (let i = 0; i < a.count; i++) {
      const row: number[] = [];
      for (let k = 0; k < n; k++) {
        const o = off + i * stride + k * sz;
        const x =
          a.componentType === 5126 ? bin.readFloatLE(o) : a.componentType === 5125 ? bin.readUInt32LE(o) : a.componentType === 5123 ? bin.readUInt16LE(o) : bin.readUInt8(o);
        row.push(a.componentType !== 5126 && a.normalized ? x / (a.componentType === 5123 ? 65535 : 255) : x);
      }
      out.push(row);
    }
    return out;
  };
  /** where each joint of a skin stands at bind time */
  const bindPositions = (skin: number) => {
    const s = json.skins[skin];
    const ibm = read(s.inverseBindMatrices!);
    const out = new Map<string, Vector3>();
    s.joints.forEach((j, k) => {
      const m = new Matrix4().fromArray(ibm[k]).invert();
      out.set(json.nodes[j].name ?? '', new Vector3().setFromMatrixPosition(m));
    });
    return out;
  };
  const parts: SkinnedPart[] = [];
  let bind = new Map<string, Vector3>();
  for (const n of json.nodes) {
    if (n.mesh === undefined || n.skin === undefined) continue;
    const names = json.skins[n.skin].joints.map((j) => json.nodes[j].name ?? '');
    if (!bind.size) bind = bindPositions(n.skin);
    for (const p of json.meshes[n.mesh].primitives) {
      const pos = read(p.attributes.POSITION).map((r) => new Vector3(r[0], r[1], r[2]));
      const J = read(p.attributes.JOINTS_0).map((r) => r.map((j) => names[j]));
      const W = read(p.attributes.WEIGHTS_0);
      const index = p.indices !== undefined ? read(p.indices).map((r) => r[0]) : pos.map((_, i) => i);
      parts.push({
        name: json.meshes[n.mesh].name ?? '',
        material: json.materials?.[p.material ?? -1]?.name ?? '',
        positions: pos,
        joints: J,
        weights: W,
        index,
        uvs: p.attributes.TEXCOORD_0 !== undefined ? read(p.attributes.TEXCOORD_0) : [],
        weightOf: (i, bone) => J[i].reduce((s, j, k) => s + (j === bone ? W[i][k] : 0), 0),
      });
    }
  }
  return { json, parts, bind };
}
