// 1.9: the eyes of a Rocketbox coach (Kadir, Amara) get their own material, "Eyes_opacity", so the app draws them
// wet and glossy like the eyes of Axel and Kaila (src/three/PhotoCoach.tsx). The geometry, the skin and the
// texture are unchanged: the triangles of the eyeballs (skinned to LeftEye / RightEye) move to a second primitive
// that shares the head's vertices and texture.
//   run from a folder where @gltf-transform/core and /extensions are installed (ES modules ignore NODE_PATH):
//   cp split_eyes.mjs <that folder>/ && node <that folder>/split_eyes.mjs in.glb out.glb
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [src, out] = process.argv.slice(2);
// separate attributes, as before: the tests (src/three/__tests__/outfit.test.ts) read the positions directly
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(src);
const root = doc.getRoot();
const skin = root.listSkins()[0];
const joints = skin.listJoints();
const eyeJoints = new Set(joints.map((j, i) => (/^(Left|Right)Eye$/.test(j.getName()) ? i : -1)).filter((i) => i >= 0));
if (eyeJoints.size !== 2) throw new Error('no LeftEye / RightEye joints');
let moved = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    if (!mat || !/head$/i.test(mat.getName())) continue;
    const J = prim.getAttribute('JOINTS_0');
    const W = prim.getAttribute('WEIGHTS_0');
    const idx = prim.getIndices();
    const onEye = (v) => {
      let w = 0;
      const j = J.getElement(v, []);
      const ws = W.getElement(v, []);
      for (let k = 0; k < 4; k++) if (eyeJoints.has(j[k])) w += ws[k];
      return w > 0.5;
    };
    const head = [];
    const eyes = [];
    for (let t = 0; t < idx.getCount(); t += 3) {
      const tri = [idx.getScalar(t), idx.getScalar(t + 1), idx.getScalar(t + 2)];
      (tri.every(onEye) ? eyes : head).push(...tri);
    }
    if (!eyes.length) continue;
    const Arr = idx.getArray().constructor;
    idx.setArray(new Arr(head));
    const eyeIdx = doc.createAccessor('eyes-indices').setType('SCALAR').setArray(new Arr(eyes)).setBuffer(idx.getBuffer());
    const eyeMat = mat.clone().setName('Eyes_opacity').setAlphaMode('OPAQUE');
    const p2 = prim.clone().setIndices(eyeIdx).setMaterial(eyeMat);
    mesh.addPrimitive(p2);
    moved += eyes.length / 3;
  }
}
if (!moved) throw new Error('no eye triangles found');
await io.write(out, doc);
console.log('eye triangles', moved);
