#!/usr/bin/env node
/**
 * 1.44.2 (Youssef 14/11, « Correction des shorts 3D — Entrejambe et réalisme textile », point 2) : plis textiles des
 * shorts, un seul outil pour tous les coachs et toutes les disciplines.
 *
 * Les shorts sortent du générateur (outfits.py) comme des copies lisses de la peau. Cet outil ajoute, sur le fichier
 * fini, des plis procéduraux mesurés sur le squelette de chaque coach :
 *   1. plis de compression sous la ceinture (petites ondulations verticales, sur 5 cm) ;
 *   2. plis obliques de la hanche, le long du pli de l'aine, de l'extérieur de la hanche vers l'entrejambe (devant) ;
 *   3. un éventail de plis légers autour de l'entrejambe ;
 *   4. plis de tension sur le devant des cuisses, un peu obliques ;
 *   5. une ondulation irrégulière le long des ourlets.
 * Chaque point du short s'écarte de l'axe de la jambe (ou du bassin) : jamais vers la peau. L'amplitude et la phase
 * varient avec un bruit lisse (rien ne se répète à l'identique) ; un short ajusté (kick, vale-tudo, compression) plisse
 * moins qu'un short ample (thaï, boxe). Les plis suivent ensuite le squelette comme le reste du short (mêmes poids) :
 * aucune simulation, aucun coût sur le téléphone (même nombre de points).
 *
 * Seules les positions et les normales des maillages « short-* » changent : les autres vêtements de la tenue, les
 * textures, les poids et la liste de peau masquée restent identiques, octet pour octet. Un fichier déjà traité est
 * reconnu (asset.extras.cssShortFolds) et laissé tel quel.
 *
 * Usage : node tools/generator/rocketbox/short_folds.mjs <tenue.glb>... [--out <dossier>] [--gain 1.4] [--force] [--drape]
 * --drape (1.45.2) : shorts amples (boxe, thaï) en tombé souple au lieu des plis ; les autres shorts gardent leurs plis.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const VERSION = '1.44.2';
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args.splice(i, 2)[1] : d;
};
const outDir = opt('--out', null);
const GAIN = Number(opt('--gain', '1.4'));
const force = args.includes('--force') ? (args.splice(args.indexOf('--force'), 1), true) : false;
// 1.45.2 (Youssef 15/11 : « Shorts : tombée souple ») : les shorts amples (boxe, thaï) reçoivent un tombé souple au lieu
// des plis : de grandes ondulations verticales qui s'élargissent vers l'ourlet, comme un tissu qui tombe
const drapeMode = args.includes('--drape') ? (args.splice(args.indexOf('--drape'), 1), true) : false;
const DRAPE_KINDS = new Set(['boxe', 'thai']);
const DRAPE = { amp: 0.016, lobes: 6 };

// ------------------------------------------------------------------ smooth noise (deterministic, -1..1)
const hash = (x, y, z) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  const v = l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
  return v * 2 - 1;
}

// ------------------------------------------------------------------ glb
const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function parse(buf) {
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jlen).toString('utf8'));
  const binHead = 20 + jlen;
  const bin = buf.subarray(binHead + 8, binHead + 8 + buf.readUInt32LE(binHead));
  return { json, bin };
}
function view(g, ai) {
  const a = g.json.accessors[ai];
  const bv = g.json.bufferViews[a.bufferView];
  const n = SIZE[a.type];
  const comp = a.componentType;
  const bytes = comp === 5126 || comp === 5125 ? 4 : comp === 5123 || comp === 5122 ? 2 : 1;
  const stride = bv.byteStride ?? n * bytes;
  const off = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const get = (i, k) => {
    const p = off + i * stride + k * bytes;
    let v = comp === 5126 ? g.bin.readFloatLE(p) : comp === 5125 ? g.bin.readUInt32LE(p) : comp === 5123 ? g.bin.readUInt16LE(p) : comp === 5121 ? g.bin.readUInt8(p) : 0;
    if (a.normalized) v /= comp === 5121 ? 255 : 65535;
    return v;
  };
  const set = (i, k, v) => {
    if (comp !== 5126) throw new Error('écriture : flottants seulement');
    g.bin.writeFloatLE(v, off + i * stride + k * bytes);
  };
  return { a, n, count: a.count, get, set };
}

// 4x4 column-major helpers
const mul = (a, b) => {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
};
function local(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  return [
    (1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
    2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
function worlds(json) {
  const W = new Array(json.nodes.length);
  const walk = (i, parent) => {
    W[i] = mul(parent, local(json.nodes[i]));
    for (const c of json.nodes[i].children ?? []) walk(c, W[i]);
  };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const r of json.scenes[json.scene ?? 0].nodes) walk(r, I);
  return W;
}
const apply = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

// ------------------------------------------------------------------ the folds (Blender axes: x left, y back, z up)
const sm = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
// a fold is a rounded crest between wider flat hollows (a plain sine read as corrugated sheet)
const ridge = (a) => (0.5 + 0.5 * Math.sin(a)) ** 2;
const LOOSE = { thai: 1.0, boxe: 0.9, mma: 0.8, surshort: 0.8, kick: 0.45, compression: 0.3, 'vale-tudo': 0.35 };

/** même formule que drape() d'outfits.py (DRAPE=1) : vers l'extérieur de l'axe de la cuisse, jamais vers la peau */
function draper({ hips, legs }) {
  const hipZ = hips[2];
  return (q) => {
    const [x, y, z] = q;
    const s = x > 0 ? 'Left' : 'Right';
    const [a, b] = legs[s];
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const u = Math.max(0, Math.min(1, ((x - a[0]) * d[0] + (y - a[1]) * d[1] + (z - a[2]) * d[2]) / (d[0] ** 2 + d[1] ** 2 + d[2] ** 2)));
    const rx = x - (a[0] + d[0] * u), ry = y - (a[1] + d[1] * u);
    const rl = Math.hypot(rx, ry);
    if (rl < 1e-6) return null;
    const th = Math.atan2(ry, rx) * (s === 'Left' ? 1 : -1);
    const ph = s === 'Left' ? 0.7 : 2.1;
    const wave = (0.5 + 0.5 * Math.sin(DRAPE.lobes * th + ph + 0.8 * Math.sin(3 * th))) ** 1.6;
    let zf = Math.max(0, Math.min(1, (z - (hipZ - 0.04)) / -0.18));
    zf = zf * zf * (3 - 2 * zf);
    const crotch = Math.max(0, 1 - Math.abs(x) / 0.05);
    const m = (DRAPE.amp * wave * zf * (1 - 0.8 * crotch)) / rl;
    return m > 0 ? [rx * m, ry * m, 0] : null;
  };
}

function folder({ kind, hips, legs, bandLow, hem }) {
  const k = (LOOSE[kind] ?? 0.5) * GAIN;
  const hipZ = hips[2];
  const crotchZ = hipZ - 0.1;
  return (q) => {
    const [x, y, z] = q;
    const nz = noise(x * 9, y * 9, z * 9);
    const nz2 = noise(x * 4 + 3.1, y * 4 + 1.7, z * 4 + 0.4);
    const ampMod = 0.65 + 0.7 * (0.5 + 0.5 * nz2);
    const s = x > 0 ? 'Left' : 'Right';
    const ax = Math.abs(x);
    let d = 0;
    // 1. compression under the waistband
    if (z < bandLow) d += 0.005 * (1 - sm((bandLow - z) / 0.05)) * ridge(Math.atan2(y, x) * 26 + 2.5 * nz);
    // 2. oblique folds of the hip, across the crease from the outer hip to the crotch (front only)
    const a0 = [0.03, crotchZ + 0.02], a1 = [0.16, hipZ + 0.01];
    const u = [a1[0] - a0[0], a1[1] - a0[1]];
    const t = Math.max(0, Math.min(1, ((ax - a0[0]) * u[0] + (z - a0[1]) * u[1]) / (u[0] ** 2 + u[1] ** 2)));
    const dist = Math.hypot(ax - (a0[0] + u[0] * t), z - (a0[1] + u[1] * t));
    const w2 = Math.exp(-((dist / 0.035) ** 2)) * sm((0.06 - y) / 0.08);
    if (w2 > 0.02) d += 0.011 * w2 * ridge((2 * Math.PI * ((z - crotchZ) * 0.77 - ax * 0.64)) / 0.045 + 2 * nz);
    // 3. a fan of light folds around the crotch
    const r = Math.hypot(x, z - crotchZ);
    if (r < 0.09 && z > crotchZ - 0.04) d += 0.007 * (1 - r / 0.09) ** 2 * sm(r / 0.02) * ridge(Math.atan2(z - crotchZ, ax) * 9 + 2 * nz);
    // 4. tension folds over the front of the thigh
    const [up, lo] = legs[s];
    const hz = hem[s];
    const axisAt = (zz) => {
      const tl = (zz - lo[2]) / Math.max(1e-6, up[2] - lo[2]);
      return [lo[0] + (up[0] - lo[0]) * tl, lo[1] + (up[1] - lo[1]) * tl, zz];
    };
    if (z > hz && z < crotchZ + 0.01) {
      const axis = axisAt(z);
      const w4 = sm((axis[1] - y) / 0.05) * sm((z - hz) / 0.03) * sm((crotchZ + 0.01 - z) / 0.04);
      d += 0.005 * w4 * ridge((2 * Math.PI * (z + 0.25 * ax)) / 0.06 + 2.2 * nz);
    }
    // 5. an irregular wave along the hem
    if (z > hz - 0.005 && z < hz + 0.04) {
      const axis = axisAt(hz);
      d += 0.006 * (1 - sm((z - hz) / 0.04)) * ridge(Math.atan2(y - axis[1], x - axis[0]) * 7 + 2.5 * nz);
    }
    if (d <= 0) return null;
    // straight away from the limb's (or the pelvis's) axis: never toward the skin
    const c = z < crotchZ ? axisAt(z) : [0, hips[1], z];
    const rx = x - c[0], ry = y - c[1];
    const rl = Math.hypot(rx, ry);
    if (rl < 1e-6) return null;
    const m = (d * k * ampMod) / rl;
    return [rx * m, ry * m, 0];
  };
}

// ------------------------------------------------------------------ one file
function processFile(path) {
  const buf = Buffer.from(readFileSync(path));
  const g = parse(buf);
  const { json } = g;
  json.asset.extras = json.asset.extras ?? {};
  if (json.asset.extras.cssShortFolds && !force) {
    console.log(`${basename(path)} : plis déjà posés (${json.asset.extras.cssShortFolds})`);
    return null;
  }
  const W = worlds(json);
  // bone heads (rest pose), glTF -> Blender axes
  const toB = (p) => [p[0], -p[2], p[1]];
  const toG = (v) => [v[0], v[2], -v[1]];
  const head = {};
  for (const sk of json.skins ?? []) for (const j of sk.joints) head[(json.nodes[j].name ?? '').replace(/^mixamorig:?/, '')] ??= toB(apply(W[j], [0, 0, 0]));
  for (const b of ['Hips', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg']) if (!head[b]) throw new Error(`${path} : os ${b} absent`);
  const legs = { Left: [head.LeftUpLeg, head.LeftLeg], Right: [head.RightUpLeg, head.RightLeg] };
  let touched = 0;
  json.nodes.forEach((node, ni) => {
    if (node.mesh === undefined) return;
    const mesh = json.meshes[node.mesh];
    const name = mesh.name ?? node.name ?? '';
    if (!name.startsWith('short-')) return;
    const kind = name.replace(/^short-/, '').replace(/\.\d+$/, '');
    // a skinned mesh ignores its node's transform (glTF): its points are in the space of the skeleton's bind pose
    const M = node.skin !== undefined ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] : W[ni];
    // inverse of the node's world matrix (rotation/scale/translation)
    const inv = invert(M);
    const prims = mesh.primitives.map((p) => ({ p, pos: view(g, p.attributes.POSITION), nor: p.attributes.NORMAL !== undefined ? view(g, p.attributes.NORMAL) : null, mat: json.materials?.[p.material ?? -1]?.name ?? '' }));
    // measures on this short: the lowest point of its waistband, the hem of each leg
    const world = prims.map(({ pos }) => Array.from({ length: pos.count }, (_, i) => toB(apply(M, [pos.get(i, 0), pos.get(i, 1), pos.get(i, 2)]))));
    let bandLow = Infinity;
    prims.forEach((pr, k) => {
      if (/^ceinture/.test(pr.mat)) for (const q of world[k]) bandLow = Math.min(bandLow, q[2]);
    });
    for (const m2 of json.meshes) if (/^ceinture-short/.test(m2.name ?? '')) for (const p2 of m2.primitives) bandLow = Math.min(bandLow, json.accessors[p2.attributes.POSITION].min[1]);
    if (!Number.isFinite(bandLow)) bandLow = head.Hips[2] + 0.03;
    const hem = { Left: Infinity, Right: Infinity };
    for (const pts of world) for (const q of pts) if (q[2] < head.Hips[2] - 0.1) hem[q[0] > 0 ? 'Left' : 'Right'] = Math.min(hem[q[0] > 0 ? 'Left' : 'Right'], q[2]);
    const drape = drapeMode && DRAPE_KINDS.has(kind);
    const fold = drape ? draper({ hips: head.Hips, legs }) : folder({ kind, hips: head.Hips, legs, bandLow, hem });
    if (drape) json.asset.extras.cssShortDrape = '1.45.2';
    // displaced positions (one function of the place: the points a colour line or a seam splits get the same move)
    const moved = world.map((pts) => pts.map((q) => {
      const d = fold(q);
      return d ? [q[0] + d[0], q[1] + d[1], q[2] + d[2]] : q;
    }));
    // normals: the change of the surface's own normal (area weighted, points welded by place over the whole short)
    // added to the stored one, so the flat rims of the hems and the smooth cloth keep their character
    const keyOf = (q) => `${Math.round(q[0] * 2e4)},${Math.round(q[1] * 2e4)},${Math.round(q[2] * 2e4)}`;
    const acc = (pts) => {
      const nmap = new Map();
      prims.forEach(({ p }, k) => {
        const idx = p.indices !== undefined ? view(g, p.indices) : null;
        const n = idx ? idx.count : pts[k].length;
        for (let t = 0; t < n; t += 3) {
          const [a, b, c] = [0, 1, 2].map((e) => (idx ? idx.get(t + e, 0) : t + e));
          const A = pts[k][a], B = pts[k][b], C = pts[k][c];
          const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
          const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          for (const v of [a, b, c]) {
            const key = `${k}:${keyOf(world[k][v])}`;
            const o = nmap.get(key) ?? [0, 0, 0];
            nmap.set(key, [o[0] + nn[0], o[1] + nn[1], o[2] + nn[2]]);
          }
        }
      });
      return nmap;
    };
    const n0 = acc(world), n1 = acc(moved);
    const unit = (v) => {
      const l = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    prims.forEach(({ pos, nor }, k) => {
      const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pos.count; i++) {
        const lp = apply(inv, toG(moved[k][i]));
        for (let c = 0; c < 3; c++) {
          pos.set(i, c, lp[c]);
          mn[c] = Math.min(mn[c], lp[c]);
          mx[c] = Math.max(mx[c], lp[c]);
        }
        if (nor && moved[k][i] !== world[k][i]) {
          const key = `${k}:${keyOf(world[k][i])}`;
          const a = unit(n0.get(key) ?? [0, 0, 1]), b = unit(n1.get(key) ?? [0, 0, 1]);
          // stored normal (glTF, node space) -> Blender world, plus the change, back
          const sn = toB(applyDir(M, [nor.get(i, 0), nor.get(i, 1), nor.get(i, 2)]));
          const nn = unit(toG(unit([sn[0] + b[0] - a[0], sn[1] + b[1] - a[1], sn[2] + b[2] - a[2]])));
          const ln = unit(applyDir(inv, nn));
          for (let c = 0; c < 3; c++) nor.set(i, c, ln[c]);
        }
        if (moved[k][i] !== world[k][i]) touched++;
      }
      pos.a.min = mn;
      pos.a.max = mx;
    });
  });
  json.asset.extras.cssShortFolds = VERSION;
  // the JSON chunk is rewritten (padded to 4 bytes), the binary chunk keeps its size and layout
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - (js.length % 4), 0x20)]);
  const binChunk = buf.subarray(20 + buf.readUInt32LE(12));
  const head12 = Buffer.alloc(12);
  head12.write('glTF', 0);
  head12.writeUInt32LE(2, 4);
  head12.writeUInt32LE(12 + 8 + js.length + binChunk.length, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(js.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const out = Buffer.concat([head12, jh, js, binChunk]);
  const dest = outDir ? join(outDir, basename(path)) : path;
  writeFileSync(dest, out);
  console.log(`${basename(path)} : plis posés sur ${touched} points -> ${dest}`);
  return dest;
}
function applyDir(m, v) {
  return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2], m[1] * v[0] + m[5] * v[1] + m[9] * v[2], m[2] * v[0] + m[6] * v[1] + m[10] * v[2]];
}
function invert(m) {
  // general 4x4 inverse (column-major)
  const a = m, o = new Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}

if (!args.length) {
  console.error('usage : short_folds.mjs <tenue.glb>... [--out dossier] [--gain 1.4] [--force]');
  process.exit(1);
}
for (const f of args) processFile(f);
