// 1.51 Kanya « La Tigresse » (Youssef, 2026-11-15 : « PROFIL 3D : KANYA — COACH MUAY THAÏ »).
// Kanya est construite à partir d'une COPIE du modèle d'Inaya : public/coaches/inaya/photo.glb n'est jamais modifié.
// Même méthode que victor_build.mjs (structure, os, poids et 25 expressions ARKit d'Inaya gardés) et en plus :
//   - le chignon haut (tools/generator/kanya/chignon.py) : un maillage à part, lié à l'os Head, sa propre texture ;
//   - la taille de la planche (1,68 m au sommet de la tête au lieu de 1,734 m) : tout le squelette et toutes les
//     formes sont mis à l'échelle (positions, expressions, translations des os, matrices de liaison), pas de nœud
//     mis à l'échelle (les tests et le moteur lisent les os tels quels).
//   node tools/generator/rocketbox/kanya_build.mjs inaya.glb disp.f32 tete.jpg corps.jpg chignon.npz chignon.jpg out.glb
import { readFileSync } from 'node:fs';
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [src, dispFile, headJpg, bodyJpg, bunNpz, bunJpg, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(src);
const root = doc.getRoot();

// déplacements : 9 floats par point (position d'origine, déplacement, normale), axes glTF, mètres
const raw = new Float32Array(readFileSync(dispFile).buffer.slice(0));
const n = raw.length / 9;
const grid = new Map();
const cell = 0.002;
const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
for (let i = 0; i < n; i++) {
  const k = key(raw[i * 9], raw[i * 9 + 1], raw[i * 9 + 2]);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(i);
}
function nearest(x, y, z) {
  let best = -1;
  let bd = Infinity;
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    for (const i of grid.get(`${cx + a},${cy + b},${cz + c}`) ?? []) {
      const d = (raw[i * 9] - x) ** 2 + (raw[i * 9 + 1] - y) ** 2 + (raw[i * 9 + 2] - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
  }
  return [best, Math.sqrt(bd)];
}

// 4x4 helpers (glTF column-major)
const mul = (A, B) => { const C = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) C[c * 4 + r] += A[k * 4 + r] * B[c * 4 + k]; return C; };
function inv(m) {
  // general inverse (gl-matrix style)
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const d = 1 / det;
  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d,
  ];
}
const xf = (M, v, w = 1) => [0, 1, 2].map((r) => M[r] * v[0] + M[4 + r] * v[1] + M[8 + r] * v[2] + M[12 + r] * w);

const meshNode = root.listNodes().find((nd) => nd.getMesh());
const skin = meshNode.getSkin();
// glTF: a skinned mesh ignores its node's transform, its points are already in the skeleton's bind (world) space
const W = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const Wi = inv(W);
const done = new Set();
let worst = 0;
let moved = 0;
for (const prim of meshNode.getMesh().listPrimitives()) {
  const pos = prim.getAttribute('POSITION');
  const nor = prim.getAttribute('NORMAL');
  if (done.has(pos)) continue; // the eyes share the head's points
  done.add(pos);
  const p = pos.getArray().slice();
  const nr = nor.getArray().slice();
  for (let v = 0; v < pos.getCount(); v++) {
    const w = xf(W, [p[v * 3], p[v * 3 + 1], p[v * 3 + 2]]);
    const [i, dist] = nearest(w[0], w[1], w[2]);
    if (i < 0 || dist > 0.0005) throw new Error(`point ${v} sans correspondance (${dist})`);
    worst = Math.max(worst, dist);
    const t = [w[0] + raw[i * 9 + 3], w[1] + raw[i * 9 + 4], w[2] + raw[i * 9 + 5]];
    const l = xf(Wi, t);
    p.set(l, v * 3);
    // normale nouvelle seulement là où la forme change (ailleurs, celle d'Inaya : coutures uv intactes)
    if (Math.hypot(raw[i * 9 + 3], raw[i * 9 + 4], raw[i * 9 + 5]) > 1e-6) {
      const nl = xf(Wi, [raw[i * 9 + 6], raw[i * 9 + 7], raw[i * 9 + 8]], 0);
      const len = Math.hypot(...nl) || 1;
      nr.set(nl.map((x) => x / len), v * 3);
      moved++;
    }
  }
  pos.setArray(p);
  nor.setArray(nr);
}

// eye bones: moved like the eyes. Their displacement is read from the displacement file (points within 15 mm
// of each eye centre), then the joint's local translation and its inverse bind matrix are updated together
const joints = skin.listJoints();
const ibm = skin.getInverseBindMatrices();
const ib = ibm.getArray().slice();
for (const name of ['LeftEye', 'RightEye']) {
  const node = joints.find((j) => j.getName() === name);
  const ji = joints.indexOf(node);
  const jw = node.getWorldMatrix();
  const c = [jw[12], jw[13], jw[14]];
  // mean displacement of the original points within 15 mm of the eye centre
  const d = [0, 0, 0];
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (Math.hypot(raw[i * 9] - c[0], raw[i * 9 + 1] - c[1], raw[i * 9 + 2] - c[2]) < 0.015) {
      d[0] += raw[i * 9 + 3]; d[1] += raw[i * 9 + 4]; d[2] += raw[i * 9 + 5]; k++;
    }
  }
  if (!k) throw new Error(`œil ${name} introuvable`);
  const D = d.map((x) => x / k);
  // new local translation: parent^-1 · (world translation + D)
  const parent = node.getParentNode();
  const Pi = inv(parent.getWorldMatrix());
  const nl = xf(Pi, [c[0] + D[0], c[1] + D[1], c[2] + D[2]]);
  node.setTranslation(nl);
  // inverse bind matrix of the moved joint: old IBM · T(-D)
  const old = Array.from(ib.slice(ji * 16, ji * 16 + 16));
  const T = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -D[0], -D[1], -D[2], 1];
  ib.set(mul(old, T), ji * 16);
  console.log(name, 'déplacé (mm)', D.map((x) => (x * 1000).toFixed(1)).join(' '), 'points', k);
}
ibm.setArray(ib);


// les deux textures de couleur
for (const tex of root.listTextures()) {
  if (/head_color/.test(tex.getURI() + tex.getName())) tex.setImage(readFileSync(headJpg)).setMimeType('image/jpeg');
  if (/body_color/.test(tex.getURI() + tex.getName())) tex.setImage(readFileSync(bodyJpg)).setMimeType('image/jpeg');
}

if (process.env.HEAD_NORMAL) {
  const t = root.listTextures().find((x) => /head_normal/.test(x.getURI() + x.getName()));
  t.setImage(readFileSync(process.env.HEAD_NORMAL)).setMimeType('image/jpeg');
}

// chignon : npz (numpy, non compressé) lu à la main
function readNpz(file) {
  const buf = readFileSync(file);
  const out = {};
  let o = 0;
  while (o < buf.length - 4 && buf.readUInt32LE(o) === 0x04034b50) {
    const comp = buf.readUInt16LE(o + 8);
    if (comp !== 0) throw new Error('npz compressé non lu');
    let size = buf.readUInt32LE(o + 18);
    const nl = buf.readUInt16LE(o + 26), el = buf.readUInt16LE(o + 28);
    const name = buf.toString('latin1', o + 30, o + 30 + nl).replace(/\.npy$/, '');
    let start = o + 30 + nl + el;
    if (size === 0xffffffff) { // zip64
      const ex = buf.subarray(o + 30 + nl, o + 30 + nl + el);
      for (let k = 0; k < ex.length;) { const id = ex.readUInt16LE(k), ln = ex.readUInt16LE(k + 2); if (id === 1) size = Number(ex.readBigUInt64LE(k + 4)); k += 4 + ln; }
    }
    const npy = buf.subarray(start, start + size);
    const hl = npy.readUInt16LE(8); const hdr = npy.toString('latin1', 10, 10 + hl);
    const shape = hdr.match(/'shape': \(([^)]*)\)/)[1].split(',').filter((x) => x.trim()).map(Number);
    const descr = hdr.match(/'descr': '([^']*)'/)[1];
    const data = npy.subarray(10 + hl);
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    out[name] = { shape, a: descr === '<f4' ? new Float32Array(ab) : descr === '<u4' ? new Uint32Array(ab) : null };
    if (!out[name].a) throw new Error('type ' + descr);
    o = start + size;
  }
  return out;
}
const bun = readNpz(bunNpz);
const headIdx = joints.findIndex((j) => j.getName() === 'Head');
const nb = bun.P.shape[0];
const buffer = root.listBuffers()[0];
const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer);
const J = new Uint16Array(nb * 4); const Wt = new Float32Array(nb * 4);
for (let i = 0; i < nb; i++) { J[i * 4] = headIdx; Wt[i * 4] = 1; }
const bunTex = doc.createTexture('kanya_chignon_color').setImage(readFileSync(bunJpg)).setMimeType('image/jpeg');
const headMat = root.listMaterials().find((m) => /head/.test(m.getName()));
const bunMat = doc.createMaterial('Hair_chignon').setBaseColorTexture(bunTex).setRoughnessFactor(0.6).setMetallicFactor(0).setDoubleSided(false);
if (headMat?.getBaseColorTextureInfo()) bunMat.getBaseColorTextureInfo().setWrapS(10497).setWrapT(33071);
const prim = doc.createPrimitive()
  .setAttribute('POSITION', acc('VEC3', bun.P.a))
  .setAttribute('NORMAL', acc('VEC3', bun.N.a))
  .setAttribute('TEXCOORD_0', acc('VEC2', bun.UV.a))
  .setAttribute('JOINTS_0', acc('VEC4', J))
  .setAttribute('WEIGHTS_0', acc('VEC4', Wt))
  .setIndices(acc('SCALAR', nb < 65536 ? Uint16Array.from(bun.T.a) : bun.T.a))
  .setMaterial(bunMat);
const bunMesh = doc.createMesh('Kanya_chignon').addPrimitive(prim);
const bunNode = doc.createNode('Kanya_chignon').setMesh(bunMesh).setSkin(skin);
root.listScenes()[0].addChild(bunNode);

// taille : 1,68 m au sommet de la tête (cheveux tirés), chignon au-dessus
// 1.51.0 : taille d'Inaya gardée (1,73 m). À 1,68 m (KANYA_SCALE=0.9687) les gestes du moteur, écrits en mètres pour
// des corps de 1,73 à 1,81 m, plient l'aine plus fort en high kick et font glisser le pied en judo (tests deformation et glide)
// 1.55 (Youssef 2026-11-17, « n'oublie sa taille ») : le moteur compare désormais la vitesse des pas par longueur de
// corps (src/engine/motion.ts, glideSpeedOf) ; Kanya passe à sa taille de planche, 1,68 m (KANYA_SCALE=1 : celle d'Inaya)
const K = Number(process.env.KANYA_SCALE ?? 0.9687);
if (K !== 1) {
  const seenAcc = new Set();
  const scaleAcc = (a) => { if (!a || seenAcc.has(a)) return; seenAcc.add(a); a.setArray(a.getArray().map((x) => x * K)); };
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) {
    scaleAcc(p.getAttribute('POSITION'));
    for (const t of p.listTargets()) scaleAcc(t.getAttribute('POSITION'));
  }
  for (const nd of root.listNodes()) {
    if (nd.getMesh()) continue;
    nd.setTranslation(nd.getTranslation().map((x) => x * K));
  }
  // matrices de liaison : translation x K (S·M·S⁻¹ pour une échelle uniforme)
  const ib2 = ibm.getArray().slice();
  for (let j = 0; j < joints.length; j++) for (const r of [12, 13, 14]) ib2[j * 16 + r] *= K;
  ibm.setArray(ib2);
  console.log('échelle', K.toFixed(4));
}
root.getAsset().extras = { ...(root.getAsset().extras ?? {}), cssCoach: 'kanya', cssBase: 'inaya', generatorVersion: process.env.GEN_VERSION ?? '1.51.0' };
await io.write(out, doc);
console.log('points déplacés', moved, 'écart max de correspondance (mm)', (worst * 1000).toFixed(3), '→', out);
