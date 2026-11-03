import { describe, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Vector3 } from 'three';
import { loadSkinnedBody, posedPositions, type SkinnedBody } from '../../test/skin';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';
import { styleOf } from '../audit';
import { analyseMotion } from '../study';

/**
 * 1.10 (Youssef 2026-11-03, « anatomie crédible pendant les mouvements, conservation des volumes aux articulations »):
 * the skin of the four coaches posed on the CPU as the app poses it (src/test/skin.ts), at the key instant of the
 * poses that bend the joints most, and measured around each joint:
 * - crease: how much sharper the surface folds than at rest (angle between the normals of two triangles sharing an
 *   edge, posed minus rest, 99th percentile, degrees): a sharp fold is a pinch or a break, as the gash at Kadir's
 *   posterior armpit in guard (1.9);
 * - collapse: the smallest area ratio of a triangle posed / rest (a lost volume, a joint pinched to nothing);
 * - stretch: the largest edge length ratio (a skin pulled like rubber).
 * Results written to docs/v1100/MESURES_DEFORMATIONS.md. Limits: a few known extremes of the old skin weights are
 * allowed, every coach must stay under them, and the 1.10 corrections must not raise any.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'axel', 'kaila'] as const;
const POSES: [string, string, number][] = [
  ['garde', 'garde', 0],
  ['jab', 'jab', 1],
  ['crochet', 'crochet-avant', 1],
  ['high kick', 'high-kick-avant', 1],
  ['squat (changement de niveau)', 'changement-niveau', 1],
  ['bras levés (blocage haut)', 'blocage-haut', 1],
  ['sol (rétention de garde)', 'retention-garde', 1],
];
const REGIONS: Record<string, { bones: string[]; radius: number }> = {
  'aisselles, omoplates': { bones: ['LeftArm', 'RightArm'], radius: 0.13 },
  coudes: { bones: ['LeftForeArm', 'RightForeArm'], radius: 0.07 },
  'aine, bassin': { bones: ['LeftUpLeg', 'RightUpLeg'], radius: 0.11 },
  genoux: { bones: ['LeftLeg', 'RightLeg'], radius: 0.08 },
};

interface Metric {
  crease: number;
  collapse: number;
  stretch: number;
}

function measure(b: SkinnedBody, rest: Float32Array, posed: Float32Array, inRegion: Uint8Array): Metric {
  const I = b.index;
  const tn = (P: Float32Array, t: number) => {
    const a = new Vector3().fromArray(P, I[t] * 3);
    const e1 = new Vector3().fromArray(P, I[t + 1] * 3).sub(a);
    const e2 = new Vector3().fromArray(P, I[t + 2] * 3).sub(a);
    const n = e1.cross(e2);
    return n;
  };
  const edges = new Map<string, number[]>();
  const areas: number[] = [];
  let stretch = 1;
  for (let t = 0; t < I.length; t += 3) {
    if (!inRegion[I[t]] || !inRegion[I[t + 1]] || !inRegion[I[t + 2]]) continue;
    const r = tn(rest, t);
    const p = tn(posed, t);
    if (r.length() < 1e-10) continue;
    areas.push(p.length() / r.length());
    for (let k = 0; k < 3; k++) {
      const a = I[t + k];
      const c = I[t + ((k + 1) % 3)];
      const key = a < c ? `${a},${c}` : `${c},${a}`;
      (edges.get(key) ?? edges.set(key, []).get(key)!).push(t);
      const lr = new Vector3().fromArray(rest, a * 3).distanceTo(new Vector3().fromArray(rest, c * 3));
      const lp = new Vector3().fromArray(posed, a * 3).distanceTo(new Vector3().fromArray(posed, c * 3));
      if (lr > 1e-6) stretch = Math.max(stretch, lp / lr);
    }
  }
  const creases: number[] = [];
  for (const tris of edges.values()) {
    if (tris.length !== 2) continue;
    const ang = (P: Float32Array) => tn(P, tris[0]).angleTo(tn(P, tris[1]));
    creases.push(((ang(posed) - ang(rest)) * 180) / Math.PI);
  }
  creases.sort((x, y) => x - y);
  areas.sort((x, y) => x - y);
  return {
    crease: creases.length ? creases[Math.floor(creases.length * 0.99)] : 0,
    collapse: areas.length ? areas[Math.floor(areas.length * 0.002)] : 1,
    stretch,
  };
}

const rows: string[] = [];
const all: Record<string, Record<string, Record<string, Metric>>> = {};
for (const id of COACHES) {
  const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 1, (n) => !/eye|lash|brow|high-poly|hair|short01|ponytail/i.test(n));
  const rig = new CoachRig(body.root);
  rig.reset();
  const rest = posedPositions(body).slice();
  const joint = (n: string) => body.bones.find((x) => x.name === n)!.getWorldPosition(new Vector3());
  const masks = Object.fromEntries(
    Object.entries(REGIONS).map(([r, { bones, radius }]) => {
      const js = bones.map(joint);
      const m = new Uint8Array(body.count);
      // radius in the body's own units (the Rocketbox bodies are in centimetres under a 0.01 scale: read the height)
      const unit = joint('Head').y > 10 ? 100 : 1;
      for (let v = 0; v < body.count; v++) {
        const q = new Vector3().fromArray(rest, v * 3);
        if (js.some((j) => j.distanceTo(q) < radius * unit)) m[v] = 1;
      }
      return [r, m];
    }),
  );
  const prof = COACH_STANCES[id] ? { id, offsets: COACH_STANCES[id] } : undefined;
  all[id] = {};
  for (const [label, techId, at] of POSES) {
    const tech = TECHNIQUE_BY_ID.get(techId);
    const style = styleOf(tech?.disciplines[0] ?? 'boxe');
    const m = getMotion(getLibrary(rig, style, prof), tech?.motion ?? techId, false)!;
    const s = new MotionSampler(rig, m);
    rig.apply(s.sample(at ? analyseMotion(rig, m).peak * at : 0));
    const posed = posedPositions(body);
    all[id][label] = {};
    for (const r of Object.keys(REGIONS)) all[id][label][r] = measure(body, rest, posed, masks[r]);
  }
}
for (const [label] of POSES)
  for (const r of Object.keys(REGIONS))
    rows.push(`| ${label} | ${r} | ${COACHES.map((c) => { const x = all[c][label][r]; return `${x.crease.toFixed(0)}° · ${x.collapse.toFixed(2)} · ${x.stretch.toFixed(2)}`; }).join(' | ')} |`);
writeFileSync(
  resolve(__dirname, '../../../docs/v1100/MESURES_DEFORMATIONS.md'),
  `# Déformations de la peau aux articulations (1.10)\n\nGénéré par \`src/engine/__tests__/deformation-v1100.test.ts\` (peau des quatre coachs posée sur le processeur comme dans l'appli, à l'instant clé de chaque pose).\nChaque case : **pli** (accentuation du pli par rapport au repos, 99e centile, degrés) · **écrasement** (plus petit rapport d'aire d'un triangle, 0,2e centile) · **étirement** (plus grand rapport de longueur d'une arête).\n\n| pose | zone | ${COACHES.join(' | ')} |\n|---|---|${COACHES.map(() => '---').join('|')}|\n${rows.join('\n')}\n`,
);

describe('déformations aux articulations (peau des quatre coachs)', () => {
  for (const id of COACHES)
    test(id, () => {
      for (const [label] of POSES)
        for (const r of Object.keys(REGIONS)) {
          const x = all[id][label][r];
          const where = `${id} ${label} ${r}`;
          expect(x.crease, `${where} pli`).toBeLessThan(LIMITS.crease);
          expect(x.collapse, `${where} écrasement`).toBeGreaterThan(LIMITS.collapse);
          expect(x.stretch, `${where} étirement`).toBeLessThan(LIMITS.stretch);
        }
    });
});

const LIMITS = { crease: 90, collapse: 0.05, stretch: 4 };
