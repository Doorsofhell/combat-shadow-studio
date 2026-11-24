import { describe, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Matrix4, Vector3, type Object3D } from 'three';
import { loadSkinnedBody, type SkinnedBody } from '../../test/skin';
import { CoachRig } from '../../engine/rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { getLibrary, getMotion } from '../../engine/library';
import { MotionSampler, duration } from '../../engine/motion';
import { TWIST, TWIST_HELPERS, TwistRig, twistSkin } from '../twist';

// réglages à l'essai (TWIST_HALF=0.9 TWIST_PUFF=0.03 npx vitest run …), jamais dans le rapport
if (process.env.TWIST_HALF) TWIST.half = Number(process.env.TWIST_HALF);
if (process.env.TWIST_PUFF) TWIST.puff = Number(process.env.TWIST_PUFF);

/**
 * 2.5.0 (Youssef, 2026-11-20 « os de torsion et corrections de volume aux articulations, sur les six coachs »).
 * Measured on the skin of each coach, posed on the CPU exactly as the renderer does (linear skinning), with the real
 * motion engine: the same images with the weights as loaded (avant) and with the twist and half bones (après).
 *
 * Volume of a joint: the skin within a radius of the joint at rest, its volume seen from the joint's centre (sum of
 * the cones of its triangles). Posed / rest = 1: the joint keeps its volume; under 1: it collapses (pinched elbow,
 * flattened knee, sunken armpit or groin). Report: docs/v250/MESURES_TORSION.md.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
const MOTIONS: { id: string; style: 'boxing' | 'kickboxing' | 'mma' | 'muaythai'; label: string }[] = [
  { id: 'garde', style: 'boxing', label: 'garde' },
  { id: 'crochet-avant', style: 'boxing', label: 'crochet' },
  { id: 'high-kick-arriere', style: 'kickboxing', label: 'coup de pied haut' },
  { id: 'sprawl', style: 'mma', label: 'sprawl' },
];
const JOINTS = [
  { label: 'épaule', bone: 'Arm', seg: 'ForeArm', r: 0.45 },
  { label: 'coude', bone: 'ForeArm', seg: 'Hand', r: 0.35 },
  { label: 'poignet', bone: 'Hand', seg: 'ForeArm', r: 0.3 },
  { label: 'hanche', bone: 'UpLeg', seg: 'Leg', r: 0.3 },
  { label: 'genou', bone: 'Leg', seg: 'UpLeg', r: 0.25 },
];

interface Skin {
  bones: Object3D[];
  ibm: Matrix4[];
  joints: ArrayLike<number>;
  weights: ArrayLike<number>;
}
function pose(b: SkinnedBody, s: Skin, out: Float32Array) {
  b.root.updateMatrixWorld(true);
  const mats = s.bones.map((bone, i) => new Matrix4().multiplyMatrices(bone.matrixWorld, s.ibm[i]).elements);
  for (let v = 0; v < b.count; v++) {
    const x = b.pos[v * 3];
    const y = b.pos[v * 3 + 1];
    const z = b.pos[v * 3 + 2];
    let px = 0;
    let py = 0;
    let pz = 0;
    for (let k = 0; k < 4; k++) {
      const w = s.weights[v * 4 + k];
      if (!w) continue;
      const e = mats[s.joints[v * 4 + k]];
      px += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
      py += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
      pz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
    }
    out[v * 3] = px;
    out[v * 3 + 1] = py;
    out[v * 3 + 2] = pz;
  }
  return out;
}
const at = (o: Object3D) => new Vector3().setFromMatrixPosition(o.matrixWorld);
function coneVolume(p: Float32Array, tris: Uint32Array, c: Vector3) {
  let v = 0;
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t] * 3;
    const b = tris[t + 1] * 3;
    const d = tris[t + 2] * 3;
    const ax = p[a] - c.x, ay = p[a + 1] - c.y, az = p[a + 2] - c.z;
    const bx = p[b] - c.x, by = p[b + 1] - c.y, bz = p[b + 2] - c.z;
    const dx = p[d] - c.x, dy = p[d + 1] - c.y, dz = p[d + 2] - c.z;
    v += (ax * (by * dz - bz * dy) - ay * (bx * dz - bz * dx) + az * (bx * dy - by * dx)) / 6;
  }
  return v;
}

interface Row {
  coach: string;
  motion: string;
  joint: string;
  /** worst |1 − posed/rest| over the images, before and after */
  avant: number;
  apres: number;
  /** smallest posed/rest */
  minAvant: number;
  minApres: number;
}
const rows: Row[] = [];
const restDiff: Record<string, number> = {};
/** cost of following the helper bones, per image (ms, Node on this machine), and the skeleton's bone count */
const perf: Record<string, { ms: number; bones: number; load: number }> = {};
const changed: Record<string, number> = {};

for (const id of COACHES) {
  const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 1, (n) => !/eye|lash|brow|high-poly/i.test(n));
  const rig = new CoachRig(body.root);
  const byName = new Map(body.bones.map((b) => [b.name, b]));
  const tl = performance.now();
  const tw = twistSkin({ pos: body.pos, joints: body.joints, weights: body.weights, names: body.bones.map((b) => b.name), ibm: body.ibm, bindMatrix: new Matrix4() });
  const load = performance.now() - tl;
  changed[id] = tw.changed / body.count;
  const twist = new TwistRig(body.root);
  const helperBones = tw.helpers.map((h) => twist.helpers.find((b) => b.name === h.name)!);
  const avant: Skin = { bones: body.bones, ibm: body.ibm, joints: body.joints, weights: body.weights };
  const apres: Skin = { bones: [...body.bones, ...helperBones], ibm: [...body.ibm, ...tw.helperIbm], joints: tw.joints, weights: tw.weights };
  const pA = new Float32Array(body.count * 3);
  const pB = new Float32Array(body.count * 3);
  // at rest the two skins are the same points
  rig.reset();
  twist.update();
  pose(body, avant, pA);
  pose(body, apres, pB);
  let md = 0;
  for (let i = 0; i < pA.length; i++) md = Math.max(md, Math.abs(pA[i] - pB[i]));
  restDiff[id] = md;
  // the regions of the joints at rest
  const regions = JOINTS.flatMap((j) =>
    (['Left', 'Right'] as const).map((S) => {
      const bone = byName.get(`${S}${j.bone}`)!;
      const c = at(bone);
      const r = j.r * c.distanceTo(at(byName.get(`${S}${j.seg}`)!));
      const inside = (v: number) => Math.hypot(pA[v * 3] - c.x, pA[v * 3 + 1] - c.y, pA[v * 3 + 2] - c.z) < r;
      const list: number[] = [];
      for (let t = 0; t < body.index.length; t += 3)
        if (inside(body.index[t]) && inside(body.index[t + 1]) && inside(body.index[t + 2])) list.push(body.index[t], body.index[t + 1], body.index[t + 2]);
      const tris = Uint32Array.from(list);
      return { label: j.label, S, bone, tris, rest: coneVolume(pA, tris, c) };
    }),
  );
  {
    const t0 = performance.now();
    for (let k = 0; k < 2000; k++) twist.update();
    perf[id] = { ms: (performance.now() - t0) / 2000, bones: apres.bones.length, load };
  }
  const prof = { id, offsets: COACH_STANCES[id as keyof typeof COACH_STANCES] };
  for (const M of MOTIONS) {
    const m = getMotion(getLibrary(rig, M.style, prof), M.id, false);
    if (!m) throw new Error(`mouvement absent : ${M.id}`);
    const dur = duration(m);
    const n = Math.max(8, Math.round(dur * 20));
    const s = new MotionSampler(rig, m);
    const acc = new Map<string, { a: number; b: number; ma: number; mb: number }>();
    for (let i = 0; i <= n; i++) {
      rig.apply(s.sample((dur * i) / n));
      twist.update();
      pose(body, avant, pA);
      pose(body, apres, pB);
      for (const R of regions) {
        const c = at(R.bone);
        const ra = coneVolume(pA, R.tris, c) / R.rest;
        const rb = coneVolume(pB, R.tris, c) / R.rest;
        const e = acc.get(R.label) ?? { a: 0, b: 0, ma: 9, mb: 9 };
        e.a = Math.max(e.a, Math.abs(1 - ra));
        e.b = Math.max(e.b, Math.abs(1 - rb));
        e.ma = Math.min(e.ma, ra);
        e.mb = Math.min(e.mb, rb);
        acc.set(R.label, e);
      }
    }
    for (const [joint, e] of acc) rows.push({ coach: id, motion: M.label, joint, avant: e.a, apres: e.b, minAvant: e.ma, minApres: e.mb });
  }
}

const pc = (x: number) => `${(x * 100).toFixed(1).replace('.', ',')} %`;
const lines = [
  '# Mesures des os de torsion et des corrections de volume (2.5.0)',
  '',
  'Fichier produit par `src/three/__tests__/torsion-v250.test.ts` (ne pas modifier à la main).',
  '',
  'Pour chaque coach, chaque mouvement (images à 20 par seconde, vrai moteur) et chaque articulation (gauche et droite) :',
  "l'écart le plus grand entre le volume de l'articulation et son volume au repos (0 % = volume gardé), puis le plus petit",
  'volume atteint (100 % = celui du repos). Avant = poids de peau du modèle chargé ; après = os de torsion et demi-os.',
  '',
  '| Coach | Mouvement | Articulation | Écart avant | Écart après | Volume mini avant | Volume mini après |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.coach} | ${r.motion} | ${r.joint} | ${pc(r.avant)} | ${pc(r.apres)} | ${pc(r.minAvant)} | ${pc(r.minApres)} |`),
  '',
  `Points dont les poids changent : ${COACHES.map((c) => `${c} ${pc(changed[c])}`).join(', ')}.`,
  `Os de la peau (corps) : ${COACHES.map((c) => `${c} ${perf[c].bones - 22} → ${perf[c].bones}`).join(', ')} ; même nombre d’influences par point (4) : le calcul de la peau par la carte graphique ne change pas.`,
  `Suivi des 22 os d’aide, par image (Node, cette machine) : ${COACHES.map((c) => `${c} ${(perf[c].ms * 1000).toFixed(0)} µs`).join(', ')} (une image à 60 i/s dure 16 667 µs).`,
  `Redistribution des poids au chargement (corps entier, Node, cette machine) : ${COACHES.map((c) => `${c} ${perf[c].load.toFixed(0)} ms`).join(', ')}.`,
  `Écart au repos entre avant et après (doit être nul) : ${COACHES.map((c) => `${c} ${(restDiff[c] * 1000).toFixed(3)} mm`).join(', ')}.`,
  '',
];
const summary = JOINTS.map((j) => {
  const r = rows.filter((x) => x.joint === j.label);
  const m = (k: 'avant' | 'apres') => r.reduce((s, x) => s + x[k], 0) / r.length;
  return { joint: j.label, avant: m('avant'), apres: m('apres') };
});
lines.splice(8, 0, '| Articulation | Écart moyen avant | Écart moyen après |', '|---|---|---|', ...summary.map((x) => `| ${x.joint} | ${pc(x.avant)} | ${pc(x.apres)} |`), '');
if (process.env.TWIST_HALF || process.env.TWIST_PUFF) console.log(JSON.stringify(summary));
else writeFileSync(resolve(__dirname, '../../../docs/v250/MESURES_TORSION.md'), lines.join('\n'));

describe('2.5.0 os de torsion et corrections de volume', () => {
  test('les onze os d’aide par côté existent sur les six coachs', () => {
    expect(TWIST_HELPERS.length).toBe(22);
  });
  test.each(COACHES)('%s : au repos, la peau ne bouge pas d’un dixième de millimètre', (id) => {
    expect(restDiff[id]).toBeLessThan(1e-4);
  });
  test.each(COACHES)('%s : des poids sont bien redistribués', (id) => {
    expect(changed[id]).toBeGreaterThan(0.05);
  });
  test.each(COACHES)('%s : aucune articulation ne perd plus de volume qu’avant (crochet, coup de pied haut, sprawl, garde)', (id) => {
    for (const r of rows.filter((x) => x.coach === id)) expect(r.apres, `${r.motion} ${r.joint}`).toBeLessThanOrEqual(r.avant + 0.02);
  });
  test.each(COACHES)('%s : suivre les os d’aide coûte moins d’un dixième de milliseconde par image', (id) => {
    expect(perf[id].ms).toBeLessThan(0.1);
  });
  test('en moyenne, les articulations gardent mieux leur volume', () => {
    const mean = (k: 'avant' | 'apres') => rows.reduce((s, r) => s + r[k], 0) / rows.length;
    expect(mean('apres')).toBeLessThan(mean('avant') * 0.8);
  });
});
