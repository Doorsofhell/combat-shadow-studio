// 1.43.0 Victor « Le Loup gris » (Youssef, 2026-11-14 : « Intégrer à l'application »).
// Victor est construit à partir d'une COPIE du modèle de Kadir : public/coaches/mma-kadir/photo.glb n'est jamais
// modifié. Ce script garde exactement la structure du fichier de Kadir (mêmes primitives, mêmes os, mêmes
// 25 expressions ARKit, mêmes poids) et ne remplace que :
//   - la forme au repos (tête, carrure, volume des cheveux), donnée point par point par le fichier de déplacements
//     produit par Blender (tools/generator/victor/body.py, mode glbexport) : position d'origine, déplacement
//     et nouvelle normale de chaque point, en mètres, axes glTF ;
//   - les deux textures de couleur (tête, corps) peintes d'après les planches de Youssef ;
//   - la position au repos des os LeftEye / RightEye, déplacés comme les yeux (et leurs matrices de liaison).
// Les expressions sont des différences : le même déplacement ayant été appliqué à chaque expression dans Blender,
// leurs différences ne changent pas et restent celles de Kadir.
//   node tools/generator/rocketbox/victor_build.mjs kadir.glb disp.f32 head.jpg body.jpg out.glb
// 1.46 (Kadir d'après ses planches) : le même script reconstruit Kadir lui-même à partir de la copie de 1.45 gardée
// dans tools/generator/kadir/donnees/photo-1.45.glb (variable COACH=mma-kadir), avec en option une carte de rugosité
// du corps (ROUGH_BODY=fichier.jpg : caleçon mat, peau un peu moins lisse).
import { readFileSync } from 'node:fs';
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [src, dispFile, headJpg, bodyJpg, out] = process.argv.slice(2);
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
    const nl = xf(Wi, [raw[i * 9 + 6], raw[i * 9 + 7], raw[i * 9 + 8]], 0);
    const len = Math.hypot(...nl) || 1;
    nr.set(nl.map((x) => x / len), v * 3);
    if (Math.hypot(raw[i * 9 + 3], raw[i * 9 + 4], raw[i * 9 + 5]) > 1e-6) moved++;
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

// the two colour textures
for (const tex of root.listTextures()) {
  if (tex.getName() === 'm021_head_color' || /head_color/.test(tex.getURI() + tex.getName())) tex.setImage(readFileSync(headJpg)).setMimeType('image/jpeg');
  if (tex.getName() === 'm021_body_color' || /body_color/.test(tex.getURI() + tex.getName())) tex.setImage(readFileSync(bodyJpg)).setMimeType('image/jpeg');
}
const coach = process.env.COACH ?? 'victor';
if (process.env.HEAD_NORMAL) {
  const t = root.listTextures().find((x) => x.getName() === 'm021_head_normal');
  t.setImage(readFileSync(process.env.HEAD_NORMAL)).setMimeType('image/jpeg');
}
if (process.env.ROUGH_BODY) {
  // carte de rugosité du corps (canal vert, glTF) : le facteur passe à 1, la carte donne la valeur
  const mat = root.listMaterials().find((m) => m.getName() === 'm021_body');
  const t = doc.createTexture('m021_body_rough').setImage(readFileSync(process.env.ROUGH_BODY)).setMimeType('image/jpeg');
  mat.setMetallicRoughnessTexture(t).setRoughnessFactor(1);
  const bc = mat.getBaseColorTextureInfo();
  if (bc) mat.getMetallicRoughnessTextureInfo().setTexCoord(bc.getTexCoord());
}
if (process.env.ROUGH_HEAD) {
  // 1.46 réalisme : rugosité de la tête (peau du visage moins lisse, front et nez un peu plus luisants, cheveux mats)
  const mat = root.listMaterials().find((m) => m.getName() === 'm021_head');
  const t = doc.createTexture('m021_head_rough').setImage(readFileSync(process.env.ROUGH_HEAD)).setMimeType('image/jpeg');
  mat.setMetallicRoughnessTexture(t).setRoughnessFactor(1);
  const bc = mat.getBaseColorTextureInfo();
  if (bc) mat.getMetallicRoughnessTextureInfo().setTexCoord(bc.getTexCoord());
}
root.getAsset().extras = coach === 'victor'
  ? { ...(root.getAsset().extras ?? {}), cssCoach: 'victor', cssBase: 'mma-kadir', generatorVersion: '1.43.0' }
  : { ...(root.getAsset().extras ?? {}), cssCoach: coach, cssPlanches: process.env.GEN_VERSION ?? '1.46.0' };
await io.write(out, doc);
console.log('points déplacés', moved, 'écart max de correspondance (mm)', (worst * 1000).toFixed(3), '→', out);
