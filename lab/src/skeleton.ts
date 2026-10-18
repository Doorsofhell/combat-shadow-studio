/**
 * Coach skeleton rebuilt from a GLB's JSON chunk with three.js maths only, as in the engine tests
 * (src/test/skeleton.ts), for driving another renderer with the app's rig.
 */
import { Bone, BoxGeometry, Mesh, Object3D } from 'three';

interface GNode {
  name?: string;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
}

export function buildSkeleton(glb: ArrayBuffer) {
  const dv = new DataView(glb);
  const len = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, len)));
  const gnodes: GNode[] = json.nodes;
  const joints = new Set<number>(json.skins?.[0]?.joints ?? []);
  let top = 0;
  for (const m of json.meshes ?? []) {
    for (const p of m.primitives) {
      const acc = json.accessors[p.attributes.POSITION];
      if (acc?.max) top = Math.max(top, acc.max[1]);
    }
  }
  const objs = gnodes.map((n, i) => {
    const o = joints.has(i) ? new Bone() : new Object3D();
    o.name = (n.name ?? '').replace(/:/g, '');
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  gnodes.forEach((n, i) => n.children?.forEach((c) => objs[i].add(objs[c])));
  const root = new Object3D();
  for (const i of json.scenes[json.scene ?? 0].nodes) root.add(objs[i]);
  root.add(new Mesh(new BoxGeometry(0.1, top, 0.1).translate(0, top / 2, 0)));
  root.updateMatrixWorld(true);
  const nodes = gnodes.map((n, i) => ({ name: n.name ?? '', obj: objs[i], joint: joints.has(i) })).filter((n) => n.joint);
  return { root, nodes };
}
