// v2.2.0 Phase A — audit automatique de tous les coachs réellement présents dans public/coaches/.
// node scripts/v220/audit-coachs.mjs [dossier-sortie]  → audit.json + textures extraites (pour l'analyse Python).
// Mesures en position de liaison (bind pose) du GLB, sans rien modifier.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'docs/v220/audit';
mkdirSync(join(OUT, 'textures'), { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const ROOT = 'public/coaches';

function mat4MulVec(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}
function invert(m) {
  // 4x4 inverse (column-major)
  const a = m, inv = new Array(16);
  inv[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
  inv[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
  inv[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
  inv[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
  inv[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
  inv[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
  inv[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
  inv[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
  inv[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
  inv[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
  inv[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
  inv[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
  inv[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
  inv[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
  inv[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
  inv[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
  let det = a[0] * inv[0] + a[1] * inv[4] + a[2] * inv[8] + a[3] * inv[12];
  return inv.map((v) => v / det);
}

/** périmètre de l'enveloppe convexe (x,z) d'une tranche */
function hullPerimeter(pts) {
  if (pts.length < 3) return 0;
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1));
  let s = 0;
  for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; s += Math.hypot(a[0] - b[0], a[1] - b[1]); }
  return s;
}

const TORSO = /^(Hips|Spine\d?|Spine)$/;

async function auditFile(path, withAnatomy) {
  const doc = await io.read(path);
  const r = doc.getRoot();
  const res = { file: path, bytes: statSync(path).size, meshes: [], textures: [], materials: [], joints: 0, morphTargets: 0, skinning: {} };
  for (const t of r.listTextures()) res.textures.push({ name: t.getName(), mime: t.getMimeType(), size: t.getSize(), bytes: t.getImage()?.byteLength ?? 0 });
  for (const m of r.listMaterials()) res.materials.push({ name: m.getName(), normal: m.getNormalTexture()?.getName() ?? null, normalScale: m.getNormalScale(), roughness: m.getRoughnessFactor(), metal: m.getMetallicFactor(), roughTex: m.getMetallicRoughnessTexture()?.getName() ?? null, ao: m.getOcclusionTexture()?.getName() ?? null, alpha: m.getAlphaMode(), double: m.getDoubleSided(), extras: m.getExtras() });
  const skins = r.listSkins();
  res.joints = Math.max(0, ...skins.map((s) => s.listJoints().length));
  // positions des os en liaison
  const bones = {};
  for (const s of skins) {
    const ibm = s.getInverseBindMatrices();
    s.listJoints().forEach((j, i) => {
      const m = invert(Array.from(ibm.getElement(i, new Array(16))));
      bones[j.getName()] = [m[12], m[13], m[14]];
    });
  }
  let tris = 0, verts = 0, badSum = 0, unweighted = 0, maxInf = 0, total = 0;
  const torsoPts = [], allPts = [];
  for (const node of r.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    // maillage skinné : glTF ignore la transformation du nœud, les sommets sont dans l'espace du squelette
    const W = node.getSkin() ? [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] : node.getWorldMatrix();
    const jointNames = node.getSkin()?.listJoints().map((j) => j.getName()) ?? [];
    for (const p of mesh.listPrimitives()) {
      const pos = p.getAttribute('POSITION');
      const n = pos.getCount();
      const t = p.getIndices() ? p.getIndices().getCount() / 3 : n / 3;
      tris += t; verts += n;
      res.morphTargets = Math.max(res.morphTargets, p.listTargets().length);
      res.meshes.push({ mesh: mesh.getName(), material: p.getMaterial()?.getName() ?? null, verts: n, tris: t, targets: p.listTargets().length });
      const J = p.getAttribute('JOINTS_0'), Wt = p.getAttribute('WEIGHTS_0'), Wt1 = p.getAttribute('WEIGHTS_1');
      if (!J || !Wt) continue;
      const a = [], w = [], w1 = [], v = [];
      const isBody = /body/i.test(p.getMaterial()?.getName() ?? '');
      for (let i = 0; i < n; i++) {
        Wt.getElement(i, w); J.getElement(i, a);
        let s = w[0] + w[1] + w[2] + w[3], k = w.filter((x) => x > 0.01).length;
        if (Wt1) { Wt1.getElement(i, w1); s += w1[0] + w1[1] + w1[2] + w1[3]; k += w1.filter((x) => x > 0.01).length; }
        total++;
        if (Math.abs(s - 1) > 0.01) badSum++;
        if (s < 1e-4) unweighted++;
        maxInf = Math.max(maxInf, k);
        if (withAnatomy && isBody) {
          pos.getElement(i, v);
          const q = mat4MulVec(W, v[0], v[1], v[2]);
          let best = 0; for (let c = 1; c < 4; c++) if (w[c] > w[best]) best = c;
          const jn = jointNames[a[best]] ?? '';
          allPts.push(q);
          if (TORSO.test(jn) || /Shoulder|UpLeg/.test(jn)) torsoPts.push([...q, jn]);
        }
      }
    }
  }
  res.tris = tris; res.verts = verts;
  res.skinning = { vertices: total, badWeightSum: badSum, unweighted, maxInfluences: maxInf };
  if (withAnatomy) res.anatomy = anatomy(bones, allPts, torsoPts);
  return res;
}

function anatomy(bones, all, torso) {
  // unités : le GLB Rocketbox converti est en mètres (vérifié par la hauteur)
  let ymin = Infinity, ymax = -Infinity;
  for (const p of all) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
  const head = bones.HeadTop_End ?? bones.Head;
  const H = ymax - ymin;
  const b = (n) => bones[n] ?? bones['mixamorig:' + n];
  const dist = (p, q) => (p && q ? Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) : null);
  const shoulderW = dist(b('LeftArm'), b('RightArm'));
  const hipJointW = dist(b('LeftUpLeg'), b('RightUpLeg'));
  // tranches du tronc : points du tronc (os dominant bassin/colonne/épaules/haut des cuisses) dans une bande de ±1 cm
  const slice = (y, pts, maxAbsX = Infinity) => {
    const s = pts.filter((p) => Math.abs(p[1] - y) < 0.01 && Math.abs(p[0]) < maxAbsX).map((p) => [p[0], p[2]]);
    if (!s.length) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, z] of s) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return { y, width: x1 - x0, depth: z1 - z0, perimeter: hullPerimeter(s) };
  };
  const spine = b('Spine'), hips = b('Hips'), neck = b('Neck');
  const profile = [];
  const yHip = hips ? hips[1] : ymin + 0.52 * H;
  const yNeck = neck ? neck[1] : ymin + 0.85 * H;
  for (let y = yHip - 0.14; y <= yNeck - 0.04; y += 0.02) {
    const s = slice(y, torso.filter((p) => !/UpLeg/.test(p[3]) || y < yHip));
    if (s) profile.push(s);
  }
  // tour de taille = périmètre minimal entre le bassin et 60 % du tronc ; hanches = max sous le bassin ; poitrine = max au-dessus
  const between = (a, c) => profile.filter((s) => s.y >= a && s.y <= c);
  const yTorsoTop = yNeck - 0.08;
  const waist = between(yHip + 0.04, yHip + 0.6 * (yTorsoTop - yHip)).sort((p, q) => p.perimeter - q.perimeter)[0] ?? null;
  const hip = between(yHip - 0.14, yHip + 0.02).sort((p, q) => q.perimeter - p.perimeter)[0] ?? null;
  const chest = between(yHip + 0.6 * (yTorsoTop - yHip), yTorsoTop).sort((p, q) => q.perimeter - p.perimeter)[0] ?? null;
  // longueurs segmentaires
  const seg = (a, c) => dist(b(a), b(c));
  const legL = (seg('LeftUpLeg', 'LeftLeg') ?? 0) + (seg('LeftLeg', 'LeftFoot') ?? 0);
  const armL = (seg('LeftArm', 'LeftForeArm') ?? 0) + (seg('LeftForeArm', 'LeftHand') ?? 0);
  const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
  return {
    height: r3(H),
    headTop: r3(head ? head[1] - ymin : null),
    shoulderJointWidth: r3(shoulderW),
    hipJointWidth: r3(hipJointW),
    legLength: r3(legL), armLength: r3(armL),
    legToHeight: r3(legL / H), armToHeight: r3(armL / H),
    chest: chest && { y: r3(chest.y - ymin), width: r3(chest.width), depth: r3(chest.depth), perimeter: r3(chest.perimeter) },
    waist: waist && { y: r3(waist.y - ymin), width: r3(waist.width), depth: r3(waist.depth), perimeter: r3(waist.perimeter) },
    hips: hip && { y: r3(hip.y - ymin), width: r3(hip.width), depth: r3(hip.depth), perimeter: r3(hip.perimeter) },
    waistToHip: chest && waist && hip ? r3(waist.perimeter / hip.perimeter) : null,
    chestToWaist: chest && waist ? r3(chest.perimeter / waist.perimeter) : null,
    shoulderToHip: shoulderW && hip ? r3(shoulderW / hip.width) : null,
    torsoProfile: profile.map((s) => ({ y: r3(s.y - ymin), w: r3(s.width), d: r3(s.depth), p: r3(s.perimeter) })),
  };
}

const coaches = readdirSync(ROOT).filter((d) => existsSync(join(ROOT, d, 'photo.glb')));
const out = { date: new Date().toISOString(), coaches: {} };
for (const id of coaches) {
  const body = await auditFile(join(ROOT, id, 'photo.glb'), true);
  const outfits = {};
  const dir = join(ROOT, id, 'tenues');
  if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => x.endsWith('.glb'))) outfits[f.replace('.glb', '')] = await auditFile(join(dir, f), false);
  out.coaches[id] = { body, outfits };
  // textures du corps extraites pour l'analyse d'image (scripts/v220/audit-textures.py)
  const doc = await io.read(join(ROOT, id, 'photo.glb'));
  for (const t of doc.getRoot().listTextures()) {
    const ext = t.getMimeType() === 'image/png' ? 'png' : 'jpg';
    writeFileSync(join(OUT, 'textures', `${id}__${t.getName()}.${ext}`), t.getImage());
  }
  console.log(id, body.verts, body.tris, body.anatomy?.height);
}
writeFileSync(join(OUT, 'audit.json'), JSON.stringify(out, null, 1));
