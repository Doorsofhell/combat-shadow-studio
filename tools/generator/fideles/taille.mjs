// 2.4.0 prototype 2 — taille de la planche (Amara 1,70 m, Victor 1,88 m) : même mise à l'échelle que Kanya
// (tools/generator/rocketbox/kanya_build.mjs) : points, écarts des expressions, translations des os, matrices de
// liaison ; aucun nœud mis à l'échelle (le moteur lit les os tels quels).
//   node tools/generator/fideles/taille.mjs entrée.glb sortie.glb hauteur_m
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [src, out, h] = process.argv.slice(2);
// attributs séparés, comme kanya_build.mjs (les tests lisent les points sans entrelacement)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(src);
const root = doc.getRoot();
let top = -Infinity;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  const a = p.getAttribute('POSITION').getArray();
  for (let i = 1; i < a.length; i += 3) top = Math.max(top, a[i]);
}
const K = Number(h) / top;
const seen = new Set();
const scaleAcc = (a) => { if (!a || seen.has(a)) return; seen.add(a); a.setArray(a.getArray().map((x) => x * K)); };
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
  scaleAcc(p.getAttribute('POSITION'));
  for (const t of p.listTargets()) scaleAcc(t.getAttribute('POSITION'));
}
for (const nd of root.listNodes()) {
  if (nd.getMesh()) continue;
  nd.setTranslation(nd.getTranslation().map((x) => x * K));
}
for (const skin of root.listSkins()) {
  const ibm = skin.getInverseBindMatrices();
  if (seen.has(ibm)) continue;
  seen.add(ibm);
  const a = ibm.getArray().slice();
  for (let j = 0; j < a.length / 16; j++) for (const r of [12, 13, 14]) a[j * 16 + r] *= K;
  ibm.setArray(a);
}
const ex = root.getAsset().extras ?? {};
root.getAsset().extras = { ...ex, cssTaille240: { avant: Number(top.toFixed(3)), apres: Number(h) } };
await io.write(out, doc);
console.log('taille', top.toFixed(3), '->', h, 'échelle', K.toFixed(4), '→', out);
