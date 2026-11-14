import { describe, expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Matrix4 } from 'three';
import { readGlb, type SkinnedPart } from '../../test/glbRead';
import { loadSkinnedBody, posedPositions, type SkinnedBody } from '../../test/skin';
import { CoachRig } from '../../engine/rig';
import { coachProfile } from '../../domain/coaches/motion';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { getLibrary, getMotion } from '../../engine/library';
import { MotionSampler } from '../../engine/motion';
import { styleOf } from '../../engine/audit';
import { analyseMotion } from '../../engine/study';
import type { DisciplineId } from '../../domain/types';
import { hiddenKeys } from '../outfit';

/**
 * 1.44.2 (Youssef 14/11, « Correction des shorts 3D — Entrejambe et réalisme textile »): automatic controls of every
 * short of every coach (boxing, kick-boxing, muay-thai and MMA outfits).
 *
 * Origin of the defect (verified): the two inner thighs of the bind pose touch from the crotch down to about mid-thigh
 * (0.5 to 0.8 mm apart). The generator welded the points closer than 0.5 mm, so a hem cut there (Victor's Thai shorts
 * of 1.44.1, hem at mid-thigh) had its left and right points joined: 38 faces held by both legs, a strip of cloth that
 * stretched between the thighs as soon as they parted. Fixed in tools/generator/rocketbox/outfits.py (never weld
 * points held by opposite legs).
 *
 * Static controls, on the file: 1. no triangle held by both legs, 3. no hole, no inverted face, 5. clean texture
 * coordinates, 6. the skin under the short hidden (the underwear painted on the original body never shows).
 * In motion, posed on the CPU as the app poses it (guard, high kick, knee, level change, low kick):
 * 1. no stretched triangle at the crotch, 2. the cloth stays outside the legs, 4. no excessive stretch at a kick.
 * Results written to docs/v1442/MESURES_SHORTS.md.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor'];
const OUTFITS: [outfit: string, discipline: DisciplineId][] = [
  ['boxe', 'boxe'],
  ['kickboxing', 'kickboxing'],
  ['muaythai', 'muaythai'],
  ['mma', 'mma'],
];
const MOVES: [label: string, tech: string][] = [
  ['garde', 'garde'],
  ['high kick', 'high-kick-arriere'],
  ['genou', 'genou-direct-arriere'],
  ['changement de niveau', 'changement-niveau'],
  ['low kick', 'low-kick-arriere'],
];
const INSTANTS = [0.5, 1, 1.25];
const bodyFile = (c: string) => `coaches/${c}/${c === 'mma-amara' ? 'photo-clean' : 'photo'}.glb`;
const isShort = (n: string) => n.startsWith('short-');

const LEFT = ['LeftUpLeg', 'LeftLeg'];
const RIGHT = ['RightUpLeg', 'RightLeg'];
function legSide(p: SkinnedPart, i: number): 'L' | 'R' | 'C' {
  const l = LEFT.reduce((a, b) => a + p.weightOf(i, b), 0);
  const r = RIGHT.reduce((a, b) => a + p.weightOf(i, b), 0);
  return l >= 0.5 ? 'L' : r >= 0.5 ? 'R' : 'C';
}
const pct = (a: number[], p: number) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0);

interface StaticRow { coach: string; outfit: string; part: string; tris: number; bothLegs: number; open: number; inverted: number; badUv: number; skinShown: number }
interface MoveRow { coach: string; outfit: string; move: string; stretch: number; longest: number; inside: number }
const staticRows: StaticRow[] = [];
const moveRows: MoveRow[] = [];

/** a uniform grid for nearest-point searches */
function grid(pts: ArrayLike<number>, ids: number[], cell = 0.02) {
  const g = new Map<string, number[]>();
  const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (const i of ids) {
    const k = key(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
    (g.get(k) ?? g.set(k, []).get(k)!).push(i);
  }
  return (x: number, y: number, z: number, r = 1): [number, number] => {
    let best = Infinity, at = -1;
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
    for (let a = -r; a <= r; a++)
      for (let b = -r; b <= r; b++)
        for (let c = -r; c <= r; c++)
          for (const i of g.get(`${cx + a},${cy + b},${cz + c}`) ?? []) {
            const d = Math.hypot(pts[i * 3] - x, pts[i * 3 + 1] - y, pts[i * 3 + 2] - z);
            if (d < best) { best = d; at = i; }
          }
    return [at, best];
  };
}

function posedOn(body: SkinnedBody, g: SkinnedBody, out = new Float32Array(g.count * 3)) {
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
    out[v * 3] = px; out[v * 3 + 1] = py; out[v * 3 + 2] = pz;
  }
  return out;
}

/** the blended 3x3 of a body point (its skin's own rotation and scale), applied to a vector */
function bodyTurn(body: SkinnedBody, i: number, v: [number, number, number], mats: number[][]): [number, number, number] {
  let x = 0, y = 0, z = 0;
  for (let k = 0; k < 4; k++) {
    const w = body.weights[i * 4 + k];
    if (!w) continue;
    const e = mats[body.joints[i * 4 + k]];
    x += w * (e[0] * v[0] + e[4] * v[1] + e[8] * v[2]);
    y += w * (e[1] * v[0] + e[5] * v[1] + e[9] * v[2]);
    z += w * (e[2] * v[0] + e[6] * v[1] + e[10] * v[2]);
  }
  return [x, y, z];
}

for (const coach of COACHES) {
  const bodyGlb = readGlb(`public/${bodyFile(coach)}`);
  const bodyPart = bodyGlb.parts.find((p) => /body/i.test(p.material))!;
  const unit = bodyPart.positions.some((v) => v.y > 10) ? 100 : 1;

  describe(`1.44.2 — shorts de ${coach} : fichier`, () => {
    test.each(OUTFITS.map(([o]) => o))('%s : pas de pont entre les jambes, ni trou, ni face inversée, peau couverte', (outfit) => {
      const g = readGlb(`public/coaches/${coach}/tenues/${outfit}.glb`);
      const shorts = g.parts.filter((p) => isShort(p.name));
      expect(shorts.length, 'short').toBeGreaterThan(0);
      const carrier = (g.json as unknown as { nodes: { extras?: Record<string, unknown> }[] }).nodes.find((n) => n.extras?.hideBody);
      // 2. the textile folds of 1.44.2 (tools/generator/rocketbox/short_folds.mjs) are on every short but Kadir's (his
      // outfits change only with Youssef's agreement)
      const folds = (g.json as unknown as { asset: { extras?: Record<string, unknown> } }).asset.extras?.cssShortFolds;
      if (coach !== 'mma-kadir') expect(folds, 'plis textiles').toBe('1.44.2');
      const keys = hiddenKeys(carrier!.extras!.hideBody as string);
      const scale = Number(carrier!.extras!.hideScale ?? 1000);
      // 3a. holes: edges used by a single triangle, over all the pieces of one short (one piece per material) with
      // their points welded by place (a texture seam or a colour line splits a point in two)
      const openOf = new Map<string, number>();
      for (const name of new Set(shorts.map((p) => p.name))) {
        const edges = new Map<string, number>();
        for (const p of shorts.filter((q) => q.name === name)) {
          const u = p.positions.some((v) => v.y > 10) ? 100 : 1;
          const pk = (i: number) => { const v = p.positions[i]; return `${Math.round((v.x / u) * 1e4)},${Math.round((v.y / u) * 1e4)},${Math.round((v.z / u) * 1e4)}`; };
          for (let t = 0; t < p.index.length; t += 3)
            for (let e = 0; e < 3; e++) {
              const a = pk(p.index[t + e]), b = pk(p.index[t + ((e + 1) % 3)]);
              if (a === b) continue;
              const k = a < b ? `${a}|${b}` : `${b}|${a}`;
              edges.set(k, (edges.get(k) ?? 0) + 1);
            }
        }
        openOf.set(name, [...edges.values()].filter((n) => n === 1).length);
      }
      const biggest = Math.max(...shorts.map((p) => p.index.length));
      for (const p of shorts) {
        const main = p.index.length === biggest;
        const u = p.positions.some((v) => v.y > 10) ? 100 : 1;
        const tris = p.index.length / 3;
        // 1. triangles held by the left leg AND the right leg (the membrane)
        let both = 0;
        for (let t = 0; t < p.index.length; t += 3) {
          const s = new Set([0, 1, 2].map((k) => legSide(p, p.index[t + k])));
          if (s.has('L') && s.has('R')) both++;
        }
        const open = main ? openOf.get(p.name)! : 0;
        // 3b. inverted faces: the winding's normal against the normals stored at its corners
        let inverted = 0;
        let badUv = 0;
        for (let t = 0; t < p.index.length; t += 3) {
          const [a, b, c] = [0, 1, 2].map((k) => p.index[t + k]);
          const e1 = p.positions[b].clone().sub(p.positions[a]);
          const e2 = p.positions[c].clone().sub(p.positions[a]);
          const n = e1.cross(e2);
          if (n.lengthSq() < 1e-14) continue;
          const sn = [a, b, c].reduce((s, i) => [s[0] + p.normals[i][0], s[1] + p.normals[i][1], s[2] + p.normals[i][2]], [0, 0, 0]);
          if (n.x * sn[0] + n.y * sn[1] + n.z * sn[2] < 0) inverted++;
          // 5. texture coordinates: present, finite, and not a collapsed triangle
          const uv = [a, b, c].map((i) => p.uvs[i]);
          if (uv.some((q) => !q || !Number.isFinite(q[0]) || !Number.isFinite(q[1]))) { badUv++; continue; }
          const area = Math.abs((uv[1][0] - uv[0][0]) * (uv[2][1] - uv[0][1]) - (uv[2][0] - uv[0][0]) * (uv[1][1] - uv[0][1]));
          if (area < 1e-12) badUv++;
        }
        // 6. the skin under the short is hidden: body points within 6 mm of the cloth, above its lowest hem + 3 cm
        let minY = Infinity;
        for (const v of p.positions) minY = Math.min(minY, v.y / u);
        const sp = new Float32Array(p.positions.length * 3);
        p.positions.forEach((v, i) => sp.set([v.x / u, v.y / u, v.z / u], i * 3));
        const near = grid(sp, p.positions.map((_, i) => i), 0.01);
        let under = 0, shown = 0;
        bodyPart.positions.forEach((v) => {
          const x = v.x / unit, y = v.y / unit, z = v.z / unit;
          if (y < minY + 0.03) return;
          const [, d] = near(x, y, z);
          if (d > 0.006) return;
          under++;
          if (!keys.has(`${Math.round(v.x * scale)},${Math.round(v.y * scale)},${Math.round(v.z * scale)}`)) shown++;
        });
        const row = { coach, outfit, part: p.name, tris, bothLegs: both, open, inverted, badUv, skinShown: under ? shown / under : 0 };
        staticRows.push(row);
        expect(both, `${p.name} : triangles tenus par les deux jambes`).toBe(0);
        expect(open, `${p.name} : arêtes ouvertes (trous)`).toBeLessThanOrEqual(OPEN_LIMIT[coach] ?? 0);
        expect(inverted / tris, `${p.name} : faces inversées`).toBeLessThan(0.01);
        expect(badUv / tris, `${p.name} : coordonnées de texture`).toBeLessThan(0.01);
        if (main) expect(row.skinShown, `${p.name} : peau dessinée sous le short`).toBeLessThan(0.06);
      }
    });
  });

  describe(`1.44.2 — shorts de ${coach} : en mouvement`, () => {
    const body = loadSkinnedBody(bodyFile(coach), 1, (n) => !/eye|lash|brow|hair|teeth|tongue/i.test(n));
    const rig = new CoachRig(body.root);
    rig.reset();
    const restBody = posedPositions(body).slice();
    const prof = coachProfile(coach);

    test.each(OUTFITS)('%s : entrejambe sans membrane, tissu hors des jambes, étirement limité', (outfit, disc) => {
      const g = loadSkinnedBody(`coaches/${coach}/tenues/${outfit}.glb`, 1, isShort);
      rig.reset();
      const rest = posedOn(body, g).slice();
      let lo = Infinity, hi = -Infinity;
      for (let v = 0; v < g.count; v++) { lo = Math.min(lo, rest[v * 3 + 1]); hi = Math.max(hi, rest[v * 3 + 1]); }
      const cand: number[] = [];
      for (let i = 0; i < body.count; i++) if (restBody[i * 3 + 1] > lo - 0.05 && restBody[i * 3 + 1] < hi + 0.05) cand.push(i);
      const find = grid(restBody, cand, 0.02);
      // the skin point under each cloth point at rest, and the cloth's offset from it
      const near = new Int32Array(g.count);
      const off: [number, number, number][] = [];
      for (let v = 0; v < g.count; v++) {
        const [i] = find(rest[v * 3], rest[v * 3 + 1], rest[v * 3 + 2], 2);
        near[v] = i;
        off.push([rest[v * 3] - restBody[i * 3], rest[v * 3 + 1] - restBody[i * 3 + 1], rest[v * 3 + 2] - restBody[i * 3 + 2]]);
      }
      // the crotch: the cloth between the thighs, from 12 cm under the top of the pelvis bone down to the hems
      const hipY = body.bones.find((b) => b.name === 'Hips')!.getWorldPosition(body.root.position.clone()).y;
      for (const [label, techId] of MOVES) {
        const tech = TECHNIQUE_BY_ID.get(techId);
        const m = getMotion(getLibrary(rig, styleOf(disc), prof), tech?.motion ?? techId, false);
        if (!m) continue;
        const s = new MotionSampler(rig, m);
        const peak = analyseMotion(rig, m).peak || 0.3;
        let stretch = 1, longest = 0, inside = 0;
        for (const k of INSTANTS) {
          rig.apply(s.sample(peak * k));
          const pb = posedPositions(body);
          const pg = posedOn(body, g);
          body.root.updateMatrixWorld(true);
          const mats = body.bones.map((b, i) => new Matrix4().multiplyMatrices(b.matrixWorld, body.ibm[i]).elements);
          const st: number[] = [];
          for (let t = 0; t < g.index.length; t += 3)
            for (let e = 0; e < 3; e++) {
              const a = g.index[t + e], c = g.index[t + ((e + 1) % 3)];
              const lr = Math.hypot(rest[a * 3] - rest[c * 3], rest[a * 3 + 1] - rest[c * 3 + 1], rest[a * 3 + 2] - rest[c * 3 + 2]);
              const lp = Math.hypot(pg[a * 3] - pg[c * 3], pg[a * 3 + 1] - pg[c * 3 + 1], pg[a * 3 + 2] - pg[c * 3 + 2]);
              if (lr > 1e-5) st.push(lp / lr);
              // the longest edge of the crotch (a membrane between the thighs grows to tens of centimetres)
              const midY = (rest[a * 3 + 1] + rest[c * 3 + 1]) / 2;
              if (Math.abs(rest[a * 3] + rest[c * 3]) / 2 < 0.06 && midY < hipY - 0.06) longest = Math.max(longest, lp);
            }
          stretch = Math.max(stretch, pct(st, 0.995));
          // 2. a cloth point gone into the leg: its offset from the skin point under it, turned with that skin,
          // reversed by more than 5 mm
          let n = 0;
          for (let v = 0; v < g.count; v++) {
            const i = near[v];
            const o = bodyTurn(body, i, off[v], mats);
            const len = Math.hypot(o[0], o[1], o[2]);
            if (len < 0.002) continue;
            const d = ((pg[v * 3] - pb[i * 3]) * o[0] + (pg[v * 3 + 1] - pb[i * 3 + 1]) * o[1] + (pg[v * 3 + 2] - pb[i * 3 + 2]) * o[2]) / len;
            if (d < -0.005) n++;
          }
          inside = Math.max(inside, n / g.count);
        }
        moveRows.push({ coach, outfit, move: label, stretch, longest, inside });
        expect(longest, `${label} : plus longue arête de l’entrejambe`).toBeLessThan(LONGEST_LIMIT);
        expect(stretch, `${label} : étirement`).toBeLessThan(STRETCH_LIMIT[label] ?? 2);
        expect(inside, `${label} : tissu dans la jambe`).toBeLessThan(INSIDE_LIMIT);
      }
      rig.reset();
    });
  });
}

// limits: measured on 1.44.2 (docs/v1442/MESURES_SHORTS.md) with a margin
// Kadir (2) and Naël (4): two tiny slits measured on their shorts before 1.44.2 (files unchanged in this version: Kadir is
// only regenerated with Youssef’s agreement)
const OPEN_LIMIT: Record<string, number> = { "mma-kadir": 2, nael: 4 };
const LONGEST_LIMIT = 0.145;
const STRETCH_LIMIT: Record<string, number> = { garde: 2.8, 'high kick': 6, genou: 3.8, 'changement de niveau': 3.8, 'low kick': 3.2 };
const INSIDE_LIMIT = 0.04;

describe('1.44.2 — mesures', () => {
  test('rapport écrit', () => {
    mkdirSync(resolve(__dirname, '../../../docs/v1442'), { recursive: true });
    const mm = (x: number) => (x * 1000).toFixed(1);
    writeFileSync(
      resolve(__dirname, '../../../docs/v1442/MESURES_SHORTS.md'),
      `# Shorts des coachs : contrôles automatiques (1.44.2)\n\nGénéré par \`src/three/__tests__/shorts-v1442.test.ts\`.\n\n## Fichiers\n\n- **deux jambes** : triangles tenus à la fois par la jambe gauche et la jambe droite (la membrane) ;\n- **arêtes ouvertes** : arêtes d'un seul triangle (trous) ;\n- **inversées** : faces dont l'ordre des sommets contredit les normales ;\n- **UV** : triangles sans coordonnées de texture valides ;\n- **peau dessinée** : part des points de peau à moins de 6 mm du tissu qui restent dessinés (le sous-vêtement peint du corps d'origine).\n\n| coach | tenue | pièce | triangles | deux jambes | arêtes ouvertes | inversées | UV | peau dessinée |\n|---|---|---|---|---|---|---|---|---|\n${staticRows.map((r) => `| ${r.coach} | ${r.outfit} | ${r.part} | ${r.tris} | ${r.bothLegs} | ${r.open} | ${r.inverted} | ${r.badUv} | ${(r.skinShown * 100).toFixed(1)} % |`).join('\n')}\n\n## En mouvement (50, 100 et 125 % de l'instant clé)\n\n- **étirement** : rapport posé / repos des arêtes du short (99,5e centile) ;\n- **arête la plus longue de l'entrejambe** : en millimètres (une membrane entre les cuisses dépasse 10 cm) ;\n- **dans la jambe** : part des points du tissu passés à plus de 5 mm sous la peau qu'ils couvrent.\n\n| coach | tenue | mouvement | étirement | arête la plus longue (mm) | dans la jambe |\n|---|---|---|---|---|---|\n${moveRows.map((r) => `| ${r.coach} | ${r.outfit} | ${r.move} | ${r.stretch.toFixed(2)} | ${mm(r.longest)} | ${(r.inside * 100).toFixed(1)} % |`).join('\n')}\n`,
    );
    expect(staticRows.length).toBeGreaterThan(0);
  });
});
