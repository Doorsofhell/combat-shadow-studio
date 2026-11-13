import { describe, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Matrix4, Vector3 } from 'three';
import { readGlb } from '../../test/glbRead';
import { loadSkinnedBody, posedPositions, type SkinnedBody } from '../../test/skin';
import { CoachRig } from '../../engine/rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { getLibrary, getMotion } from '../../engine/library';
import { MotionSampler } from '../../engine/motion';
import { styleOf } from '../../engine/audit';
import { analyseMotion } from '../../engine/study';
import type { DisciplineId } from '../../domain/types';

/**
 * 1.38.0 (Youssef 13/11, « CORRECTION AMARA V1.38.0 »): automatic controls of Amara's finish.
 *
 * A. Neck: the head and the body are two primitives of the dressed model (photo-clean.glb). Where they meet, every
 *    shared point must have the same normal (no lighting line) and the same skin weights (no gap when the head turns).
 * B. Outfits in motion (MMA and kick-boxing): the under-band of the top and the waistband of the short are posed on
 *    the CPU as the app poses them, at five instants of each movement (not only its first and last pose), with the
 *    skin they lie on. Measured: how far a band slides over the skin under it (it must follow it: neither leave it
 *    nor go into it) and how much its own edges stretch (no tear).
 * Results written to docs/v1380/MESURES_TENUES_AMARA.md.
 */
const BODY = 'coaches/mma-amara/photo-clean.glb';

describe('1.38.0 — cou d’Amara : jonction tête / corps', () => {
  const { parts, json } = readGlb(`public/${BODY}`);
  const body = parts.find((p) => p.material.includes('body'))!;
  const head = parts.find((p) => p.material.includes('head'))!;
  // the file stores metres (cleaned body) or centimetres under a 0.01 scale (original Rocketbox): two points are the
  // same place within 0.2 mm, as in tools/generator/rocketbox/neck_seam.py
  const unit = body.positions.some((v) => v.y > 10) ? 100 : 1;
  const tol = 0.0002 * unit;
  const key = (v: Vector3) => `${Math.round(v.x / tol)},${Math.round(v.y / tol)},${Math.round(v.z / tol)}`;
  const onBody = new Map<string, number[]>();
  body.positions.forEach((v, i) => (onBody.get(key(v)) ?? onBody.set(key(v), []).get(key(v))!).push(i));
  const seam: [number, number][] = [];
  head.positions.forEach((v, i) => {
    // the closest of the body points stored at the same place (a texture seam stores a place twice)
    const c = onBody.get(key(v));
    if (!c) return;
    const j = c.reduce((a, b) => (body.positions[b].distanceTo(v) < body.positions[a].distanceTo(v) ? b : a));
    if (body.positions[j].distanceTo(v) < tol) seam.push([i, j]);
  });

  test('la tête et le corps se rejoignent sur une vraie couture (pas de trou, pas de chevauchement)', () => {
    expect(seam.length).toBeGreaterThan(40);
    expect((json as unknown as { asset: { extras?: Record<string, unknown> } }).asset.extras?.css_clean_geometry).toBe('1.38.0');
  });

  test('normales continues à la jonction : pas de ligne de lumière', () => {
    let worst = 0;
    for (const [h, b] of seam) {
      const a = new Vector3().fromArray(head.normals[h]).normalize();
      const c = new Vector3().fromArray(body.normals[b]).normalize();
      // the same place can carry two normals along a texture seam of the body: the closest one counts
      let best = a.angleTo(c);
      for (const o of onBody.get(key(head.positions[h]))!) best = Math.min(best, a.angleTo(new Vector3().fromArray(body.normals[o]).normalize()));
      worst = Math.max(worst, (best * 180) / Math.PI);
    }
    expect(worst).toBeLessThan(3);
  });

  test('mêmes poids de peau des deux côtés : pas de séparation quand la tête tourne', () => {
    let worst = 0;
    for (const [h, b] of seam) {
      const bones = new Set([...head.joints[h], ...body.joints[b]]);
      for (const bone of bones) worst = Math.max(worst, Math.abs(head.weightOf(h, bone) - body.weightOf(b, bone)));
    }
    expect(worst).toBeLessThan(0.02);
  });

  test('même matière de peau pour la tête et le corps', () => {
    const mats = (json.materials ?? []) as unknown as { name?: string; pbrMetallicRoughness?: { baseColorFactor?: number[]; roughnessFactor?: number; metallicFactor?: number } }[];
    const b = mats.find((m) => m.name === body.material)!.pbrMetallicRoughness ?? {};
    const h = mats.find((m) => m.name === head.material)!.pbrMetallicRoughness ?? {};
    expect(h.baseColorFactor ?? [1, 1, 1, 1]).toEqual(b.baseColorFactor ?? [1, 1, 1, 1]);
    expect(h.roughnessFactor ?? 1).toBeCloseTo(b.roughnessFactor ?? 1, 2);
    expect(h.metallicFactor ?? 1).toBeCloseTo(b.metallicFactor ?? 1, 2);
  });
});

// B. the outfits in motion
const MOVES: [label: string, tech: string][] = [
  ['garde', 'garde'],
  ['jab', 'jab'],
  ['cross (direct)', 'direct'],
  ['crochet (rotation du buste)', 'crochet-avant'],
  ['low kick arrière', 'low-kick-arriere'],
  ['low kick avant', 'low-kick-avant'],
  ['middle kick', 'middle-kick-arriere'],
  ['high kick', 'high-kick-arriere'],
  ['changement de niveau (hanches, genoux)', 'changement-niveau'],
];
const INSTANTS = [0.25, 0.5, 0.75, 1, 1.25];
const OUTFITS: [outfit: string, discipline: DisciplineId][] = [['mma', 'mma'], ['kickboxing', 'kickboxing']];

function posedOn(body: SkinnedBody, g: SkinnedBody, out = new Float32Array(g.count * 3)) {
  // the garment's points moved by the BODY's bones (same names), with the garment's own bind matrices: as in the app
  body.root.updateMatrixWorld(true);
  const byName = new Map(body.bones.map((b) => [b.name, b]));
  const mats = g.bones.map((b, i) => new Matrix4().multiplyMatrices(byName.get(b.name)!.matrixWorld, g.ibm[i]).elements);
  for (let v = 0; v < g.count; v++) {
    const x = g.pos[v * 3], y = g.pos[v * 3 + 1], z = g.pos[v * 3 + 2];
    let px = 0, py = 0, pz = 0;
    for (let k = 0; k < 4; k++) {
      const w = g.weights[v * 4 + k];
      if (!w) continue;
      const e = mats[g.joints[v * 4 + k]];
      px += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
      py += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
      pz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
    }
    out.set([px, py, pz], v * 3);
  }
  return out;
}

// limits: the measures of 1.38.0 (docs/v1380/MESURES_TENUES_AMARA.md) with a margin. Under-band: at most 17.6 mm of
// slide (95 %) and 1.10 of stretch (high kick). Waistband: 24.1 mm and 2.05 (the side of the raised leg at a kick:
// the band follows the skin of the hip's crease like the short under it; held by the pelvis alone it did not stretch
// but the short came through it, see fitted_band in outfits.py)
const LIMIT: Record<string, { slide: number; slideMax: number; stretch: number }> = {
  'bande-brassiere': { slide: 0.021, slideMax: 0.027, stretch: 1.2 },
  'ceinture-short': { slide: 0.028, slideMax: 0.037, stretch: 2.3 },
};
const pct = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];

interface Row { outfit: string; band: string; move: string; slide: number; slideMax: number; stretch: number; gapRest: number }
const rows: Row[] = [];

const body = loadSkinnedBody(BODY, 1, (n) => !/eye|lash|brow|hair/i.test(n));
const rig = new CoachRig(body.root);
rig.reset();
const restBody = posedPositions(body).slice();
const prof = COACH_STANCES['mma-amara'] ? { id: 'mma-amara', offsets: COACH_STANCES['mma-amara'] } : undefined;

for (const [outfit, disc] of OUTFITS) {
  for (const prefix of ['bande-brassiere', 'ceinture-short']) {
    const g = loadSkinnedBody(`coaches/mma-amara/tenues/${outfit}.glb`, 1, (n) => n.startsWith(prefix));
    rig.reset();
    const rest = posedOn(body, g).slice();
    // the skin point under each band point (closest at rest)
    const near = new Int32Array(g.count);
    const gap: number[] = [];
    const cand: number[] = [];
    let lo = Infinity, hi = -Infinity;
    for (let v = 0; v < g.count; v++) { lo = Math.min(lo, rest[v * 3 + 1]); hi = Math.max(hi, rest[v * 3 + 1]); }
    for (let i = 0; i < body.count; i++) if (restBody[i * 3 + 1] > lo - 0.04 && restBody[i * 3 + 1] < hi + 0.04) cand.push(i);
    for (let v = 0; v < g.count; v++) {
      let best = Infinity, at = -1;
      for (const i of cand) {
        const d = Math.hypot(rest[v * 3] - restBody[i * 3], rest[v * 3 + 1] - restBody[i * 3 + 1], rest[v * 3 + 2] - restBody[i * 3 + 2]);
        if (d < best) { best = d; at = i; }
      }
      near[v] = at;
      gap.push(best);
    }
    for (const [label, techId] of MOVES) {
      const tech = TECHNIQUE_BY_ID.get(techId);
      const m = getMotion(getLibrary(rig, styleOf(disc), prof), tech?.motion ?? techId, false)!;
      const s = new MotionSampler(rig, m);
      const peak = analyseMotion(rig, m).peak || 0.3;
      let slide = 0, slideMax = 0, stretch = 1;
      for (const k of INSTANTS) {
        rig.apply(s.sample(peak * k));
        const pb = posedPositions(body);
        const pg = posedOn(body, g);
        const sl: number[] = [];
        for (let v = 0; v < g.count; v++) {
          const i = near[v];
          // how far the band point moved relative to the skin point under it
          sl.push(Math.hypot(
            pg[v * 3] - rest[v * 3] - (pb[i * 3] - restBody[i * 3]),
            pg[v * 3 + 1] - rest[v * 3 + 1] - (pb[i * 3 + 1] - restBody[i * 3 + 1]),
            pg[v * 3 + 2] - rest[v * 3 + 2] - (pb[i * 3 + 2] - restBody[i * 3 + 2])));
        }
        const st: number[] = [];
        for (let t = 0; t < g.index.length; t += 3)
          for (let e = 0; e < 3; e++) {
            const a = g.index[t + e], c = g.index[t + ((e + 1) % 3)];
            const lr = Math.hypot(rest[a * 3] - rest[c * 3], rest[a * 3 + 1] - rest[c * 3 + 1], rest[a * 3 + 2] - rest[c * 3 + 2]);
            const lp = Math.hypot(pg[a * 3] - pg[c * 3], pg[a * 3 + 1] - pg[c * 3 + 1], pg[a * 3 + 2] - pg[c * 3 + 2]);
            if (lr > 1e-5) st.push(lp / lr);
          }
        slide = Math.max(slide, pct(sl, 0.95));
        slideMax = Math.max(slideMax, pct(sl, 1));
        stretch = Math.max(stretch, pct(st, 0.995));
      }
      rows.push({ outfit, band: prefix, move: label, slide, slideMax, stretch, gapRest: pct(gap, 0.5) });
    }
  }
}
rig.reset();
writeFileSync(
  resolve(__dirname, '../../../docs/v1380/MESURES_TENUES_AMARA.md'),
  `# Bandes des tenues d'Amara en mouvement (1.38.0)\n\nGénéré par \`src/three/__tests__/amara-finish-v1380.test.ts\` : la bande de brassière et la ceinture du short, posées sur le processeur comme dans l'appli à cinq instants de chaque mouvement (25, 50, 75, 100 et 125 % de l'instant clé), avec la peau qu'elles recouvrent.\n\n- **glissement** : déplacement d'un point de la bande par rapport au point de peau situé dessous au repos (95e centile, puis maximum), en millimètres ;\n- **étirement** : rapport de longueur d'une arête de la bande, posée / repos (99,5e centile).\n\n| tenue | pièce | mouvement | glissement 95 % (mm) | glissement max (mm) | étirement |\n|---|---|---|---|---|---|\n${rows.map((r) => `| ${r.outfit} | ${r.band} | ${r.move} | ${(r.slide * 1000).toFixed(1)} | ${(r.slideMax * 1000).toFixed(1)} | ${r.stretch.toFixed(2)} |`).join('\n')}\n`,
);

describe('1.38.0 — bandes ajustées d’Amara pendant les mouvements (poses intermédiaires)', () => {
  test('au repos, chaque bande est posée sur la peau (à moins de 13 mm, tissu compris)', () => {
    for (const r of rows) {
      expect(r.gapRest, `${r.outfit}/${r.band}`).toBeGreaterThan(0.001);
      expect(r.gapRest, `${r.outfit}/${r.band}`).toBeLessThan(0.013);
    }
  });
  test.each(rows.map((r) => [`${r.outfit} / ${r.band} / ${r.move}`, r] as const))('%s : la bande suit la peau, sans déchirure', (_, r) => {
    const lim = LIMIT[r.band];
    expect(r.slide).toBeLessThan(lim.slide);
    expect(r.slideMax).toBeLessThan(lim.slideMax);
    expect(r.stretch).toBeLessThan(lim.stretch);
  });
});
