import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Bone, BufferAttribute, BufferGeometry, Matrix4, MeshLambertMaterial, Object3D, Skeleton, SkinnedMesh } from 'three';
import type { CoachId } from '../domain/types';
import type { CoachMeta } from '../three/customize';

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array } as const;
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as const;

/**
 * Loads the manga coach GLB in Node (no WebGL, no images): skeleton, and every skinned mesh with
 * positions, normals, uvs, skinning and a plain material carrying the GLB material name.
 */
export function loadCoach(coach: CoachId) {
  const who = coach === 'homme' ? 'male' : 'female';
  const file = resolve(__dirname, '../../public/models', `coach_${who}_manga.glb`);
  const buf = readFileSync(file);
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jlen).toString('utf8'));
  const binStart = 20 + jlen + 8;
  const bin = buf.subarray(binStart, binStart + buf.readUInt32LE(20 + jlen));
  const acc = (i: number) => {
    const a = json.accessors[i];
    const v = json.bufferViews[a.bufferView];
    const T = COMP[a.componentType as keyof typeof COMP];
    const n = a.count * SIZE[a.type as keyof typeof SIZE];
    const off = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const copy = Buffer.from(bin.subarray(off, off + n * T.BYTES_PER_ELEMENT));
    return { array: new T(copy.buffer, copy.byteOffset, n), size: SIZE[a.type as keyof typeof SIZE], normalized: !!a.normalized };
  };
  const joints: number[] = json.skins[0].joints;
  const nodes = json.nodes.map((n: { name?: string; translation?: number[]; rotation?: number[]; scale?: number[] }, i: number) => {
    const o = joints.includes(i) ? new Bone() : new Object3D();
    o.name = n.name ?? '';
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  json.nodes.forEach((n: { children?: number[] }, i: number) => n.children?.forEach((c) => nodes[i].add(nodes[c])));
  const root = new Object3D();
  for (const i of json.scenes[json.scene ?? 0].nodes) root.add(nodes[i]);
  root.updateMatrixWorld(true);
  const ibm = acc(json.skins[0].inverseBindMatrices).array as Float32Array;
  const bones = joints.map((j) => nodes[j] as Bone);
  const inverses = joints.map((_, k) => new Matrix4().fromArray(ibm, k * 16));
  const skeleton = new Skeleton(bones, inverses);
  json.nodes.forEach((n: { mesh?: number }, i: number) => {
    if (n.mesh === undefined) return;
    const prim = json.meshes[n.mesh].primitives[0];
    const g = new BufferGeometry();
    const map: Record<string, string> = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', JOINTS_0: 'skinIndex', WEIGHTS_0: 'skinWeight' };
    for (const [k, name] of Object.entries(map)) {
      if (prim.attributes[k] === undefined) continue;
      const a = acc(prim.attributes[k]);
      g.setAttribute(name, new BufferAttribute(a.array, a.size, a.normalized));
    }
    g.setIndex(new BufferAttribute(acc(prim.indices).array, 1));
    const mat = new MeshLambertMaterial({ name: json.materials[prim.material].name });
    const m = new SkinnedMesh(g, mat);
    m.name = nodes[i].name;
    const host = nodes[i];
    host.parent!.add(m);
    host.parent!.remove(host);
    m.bind(skeleton, new Matrix4());
  });
  root.updateMatrixWorld(true);
  const meta = JSON.parse(readFileSync(resolve(__dirname, '../../public/models', `coach_${who}_manga.meta.json`), 'utf8')) as CoachMeta;
  return { root, meta, skeleton };
}
