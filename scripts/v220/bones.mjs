// liste les os (position de liaison, mètres) d'un GLB de coach : node scripts/v220/bones.mjs <glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const s = doc.getRoot().listSkins()[0];
const ibm = s.getInverseBindMatrices();
// la translation de l'inverse de l'IBM : pour une IBM rigide, -R^T t
s.listJoints().forEach((j, i) => {
  const m = ibm.getElement(i, []);
  const R = [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]];
  const t = [m[12], m[13], m[14]];
  const p = [0, 1, 2].map((c) => -(R[0][c] * t[0] + R[1][c] * t[1] + R[2][c] * t[2]));
  if (!process.argv[3] || new RegExp(process.argv[3]).test(j.getName())) console.log(j.getName().padEnd(22), p.map((x) => x.toFixed(3)).join(' '));
});
