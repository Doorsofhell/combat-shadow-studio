import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Bone, BoxGeometry, BufferGeometry, Float32BufferAttribute, Matrix4, Mesh, Object3D, Skeleton, SkinnedMesh, Uint16BufferAttribute } from 'three';

/**
 * 1.8.0 (audit des mouvements): the coach's body as the player sees it, in Node. Like loadSkeleton (skeleton.ts) it
 * rebuilds the bones from the GLB, and it also keeps the skinned meshes (positions, joints, weights, inverse bind
 * matrices) so the skin can be posed on the CPU: what touches or goes through the floor is read on the body's own
 * surface, not guessed from the joints.
 */
export interface SkinnedBody {
  root: Object3D;
  /** the body's vertices, every `step`-th one: rest position, 4 joints, 4 weights */
  pos: Float32Array;
  joints: Uint16Array;
  weights: Float32Array;
  count: number;
  /** the skin's joints and their inverse bind matrices */
  bones: Object3D[];
  ibm: Matrix4[];
  /** name of the bone that weighs most on each vertex */
  part: string[];
}

interface GNode {
  name?: string;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  mesh?: number;
  skin?: number;
}

const SIZE: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function loadSkinnedBody(model: string, step = 3, meshes?: (name: string) => boolean): SkinnedBody {
  const buf = readFileSync(resolve(__dirname, '../../public', model));
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jlen).toString('utf8'));
  const binStart = 20 + jlen + 8;
  const read = (ai: number): number[] => {
    const a = json.accessors[ai];
    const bv = json.bufferViews[a.bufferView];
    const n = SIZE[a.type];
    const off = binStart + (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const comp = a.componentType;
    const bytes = comp === 5126 || comp === 5125 ? 4 : comp === 5123 || comp === 5122 ? 2 : 1;
    const stride = bv.byteStride ?? n * bytes;
    const out: number[] = new Array(a.count * n);
    for (let i = 0; i < a.count; i++)
      for (let k = 0; k < n; k++) {
        const p = off + i * stride + k * bytes;
        let v = comp === 5126 ? buf.readFloatLE(p) : comp === 5125 ? buf.readUInt32LE(p) : comp === 5123 ? buf.readUInt16LE(p) : comp === 5121 ? buf.readUInt8(p) : 0;
        if (a.normalized) v /= comp === 5121 ? 255 : 65535;
        out[i * n + k] = v;
      }
    return out;
  };

  const nodes: GNode[] = json.nodes;
  const skin = json.skins[0];
  const jointSet = new Set<number>(skin.joints);
  const objs = nodes.map((n, i) => {
    const o = jointSet.has(i) ? new Bone() : new Object3D();
    o.name = (n.name ?? '').replace(/:/g, '');
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  nodes.forEach((n, i) => n.children?.forEach((c) => objs[i].add(objs[c])));
  const root = new Object3D();
  for (const i of json.scenes[json.scene ?? 0].nodes) root.add(objs[i]);
  // the same stand-in box as loadSkeleton, which gives the rig the real height
  let top = 0;
  for (const m of json.meshes ?? []) for (const p of m.primitives) top = Math.max(top, json.accessors[p.attributes.POSITION]?.max?.[1] ?? 0);
  if (top > 3) top /= 100;
  root.add(new Mesh(new BoxGeometry(0.1, top, 0.1).translate(0, top / 2, 0)));
  root.updateMatrixWorld(true);

  const bones = (skin.joints as number[]).map((j) => objs[j]);
  const ibmFlat = read(skin.inverseBindMatrices);
  const ibm = bones.map((_, i) => new Matrix4().fromArray(ibmFlat, i * 16));

  const P: number[] = [];
  const J: number[] = [];
  const W: number[] = [];
  nodes.forEach((n) => {
    if (n.mesh === undefined || n.skin === undefined) return;
    const mesh = json.meshes[n.mesh];
    if (meshes && !meshes(mesh.name ?? n.name ?? '')) return;
    for (const prim of mesh.primitives) {
      const pos = read(prim.attributes.POSITION);
      const jo = read(prim.attributes.JOINTS_0);
      const we = read(prim.attributes.WEIGHTS_0);
      for (let v = 0; v < pos.length / 3; v += step) {
        P.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        J.push(jo[v * 4], jo[v * 4 + 1], jo[v * 4 + 2], jo[v * 4 + 3]);
        W.push(we[v * 4], we[v * 4 + 1], we[v * 4 + 2], we[v * 4 + 3]);
      }
    }
  });
  const count = P.length / 3;
  const part: string[] = [];
  for (let v = 0; v < count; v++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (W[v * 4 + k] > W[v * 4 + best]) best = k;
    part.push(bones[J[v * 4 + best]].name);
  }
  // a real skinned mesh as well, so that the rig reads the outline of the body from it as it does in the app
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(P, 3));
  geo.setAttribute('skinIndex', new Uint16BufferAttribute(J, 4));
  geo.setAttribute('skinWeight', new Float32BufferAttribute(W, 4));
  const sm = new SkinnedMesh(geo);
  root.add(sm);
  root.updateMatrixWorld(true);
  sm.bind(new Skeleton(bones as Bone[], ibm), sm.matrixWorld);
  return { root, pos: Float32Array.from(P), joints: Uint16Array.from(J), weights: Float32Array.from(W), count, bones, ibm, part };
}

/**
 * The posed body (after rig.apply): for each body part, the lowest point of its skin and where it is.
 * `out` receives the y of every vertex when given (same order as `part`).
 */
export function lowestByPart(b: SkinnedBody, out?: Float32Array): Map<string, number> {
  b.root.updateMatrixWorld(true);
  const mats = b.bones.map((bone, i) => new Matrix4().multiplyMatrices(bone.matrixWorld, b.ibm[i]).elements);
  const low = new Map<string, number>();
  for (let v = 0; v < b.count; v++) {
    const x = b.pos[v * 3];
    const y = b.pos[v * 3 + 1];
    const z = b.pos[v * 3 + 2];
    let wy = 0;
    for (let k = 0; k < 4; k++) {
      const w = b.weights[v * 4 + k];
      if (!w) continue;
      const e = mats[b.joints[v * 4 + k]];
      wy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
    }
    if (out) out[v] = wy;
    const p = b.part[v];
    const prev = low.get(p);
    if (prev === undefined || wy < prev) low.set(p, wy);
  }
  return low;
}
