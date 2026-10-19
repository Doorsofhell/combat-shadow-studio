import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Bone, BoxGeometry, Mesh, Object3D } from 'three';
import type { CoachId } from '../domain/types';

interface GNode {
  name?: string;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  mesh?: number;
}

/**
 * Rebuilds the coach skeleton from the GLB's JSON chunk (the node hierarchy is not Draco-compressed),
 * so the animation engine can be tested in Node without WebGL. A box stands in for the body mesh to
 * give the real height.
 */
export function loadSkeleton(coach: CoachId, model?: string): Object3D {
  // model: a champion-inspired coach's own GLB, relative to public/ (e.g. coaches/mma-kadir/model.glb)
  const file = model ? resolve(__dirname, '../../public', model) : resolve(__dirname, '../../public/models', coach === 'homme' ? 'coach_male.glb' : 'coach_female.glb');
  const buf = readFileSync(file);
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
  const nodes: GNode[] = json.nodes;
  const joints = new Set<number>(json.skins?.[0]?.joints ?? []);
  let top = 0;
  for (const m of json.meshes ?? []) {
    for (const p of m.primitives) {
      const acc = json.accessors[p.attributes.POSITION];
      if (acc?.max) top = Math.max(top, acc.max[1]);
    }
  }
  const objs = nodes.map((n, i) => {
    const o = joints.has(i) ? new Bone() : new Object3D();
    o.name = (n.name ?? '').replace(/:/g, '');
    if (n.translation) o.position.fromArray(n.translation);
    if (n.rotation) o.quaternion.fromArray(n.rotation);
    if (n.scale) o.scale.fromArray(n.scale);
    return o;
  });
  nodes.forEach((n, i) => n.children?.forEach((c) => objs[i].add(objs[c])));
  const root = new Object3D();
  const scene = json.scenes[json.scene ?? 0];
  for (const i of scene.nodes) root.add(objs[i]);
  const body = new Mesh(new BoxGeometry(0.1, top, 0.1).translate(0, top / 2, 0));
  root.add(body);
  root.updateMatrixWorld(true);
  return root;
}
