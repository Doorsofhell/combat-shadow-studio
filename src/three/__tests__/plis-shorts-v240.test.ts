import { describe, expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Matrix4 } from 'three';
import { loadSkinnedBody, type SkinnedBody } from '../../test/skin';
import { CoachRig } from '../../engine/rig';
import { coachProfile } from '../../domain/coaches/motion';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { getLibrary, getMotion } from '../../engine/library';
import { MotionSampler } from '../../engine/motion';
import { styleOf } from '../../engine/audit';
import { analyseMotion } from '../../engine/study';
import type { DisciplineId } from '../../domain/types';

/**
 * 2.4.0 prototype 2 (Youssef 25/11, « juste correction amélioration tenue, pas de refonte ») : plis retournés des shorts.
 *
 * Constat vérifié : au coup de pied et au genou, 2 à 4 % des triangles des shorts se retournent (le tissu passe à
 * travers lui-même : taches sombres, « trous », tissu froissé à l'aine). Mesure : un triangle est retourné quand sa
 * normale posée est opposée à sa normale de repos tournée par la peau de son premier point. Pire des instants 50, 100
 * et 125 % du coup. Correction : tools/generator/rocketbox/short_poids.py (poids lissés sur hanches et cuisses) sur les
 * shorts d'Amara, Victor (sauf MMA), Kanya et Naël (sauf MMA). Résultats : docs/v240/MESURES_PLIS_SHORTS.md.
 * Limites : 4,5 % pour tous (avant : 3,9 % au pire), 3 % pour les shorts traités (au genou : 3,2 à 3,7 % avant).
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
const TREATED = (coach: string, outfit: string) =>
  ['mma-amara', 'kanya'].includes(coach) || (['nael', 'victor'].includes(coach) && outfit !== 'mma');
const OUTFITS: [string, DisciplineId][] = [['boxe', 'boxe'], ['kickboxing', 'kickboxing'], ['muaythai', 'muaythai'], ['mma', 'mma']];
const MOVES: [string, string][] = [['high kick', 'high-kick-arriere'], ['genou', 'genou-direct-arriere'], ['low kick', 'low-kick-arriere']];
const bodyFile = (c: string) => `coaches/${c}/${c === 'mma-amara' ? 'photo-clean' : 'photo'}.glb`;
function posedOn(body: SkinnedBody, g: SkinnedBody) {
  body.root.updateMatrixWorld(true);
  const byName = new Map(body.bones.map((b) => [b.name, b]));
  const mats = g.bones.map((b, i) => new Matrix4().multiplyMatrices(byName.get(b.name)!.matrixWorld, g.ibm[i]).elements);
  const out = new Float32Array(g.count * 3);
  const rot = (v: number, x: number, y: number, z: number, t: boolean) => {
    let px = 0, py = 0, pz = 0;
    for (let k = 0; k < 4; k++) {
      const w = g.weights[v * 4 + k]; if (!w) continue; const e = mats[g.joints[v * 4 + k]];
      px += w * (e[0] * x + e[4] * y + e[8] * z + (t ? e[12] : 0)); py += w * (e[1] * x + e[5] * y + e[9] * z + (t ? e[13] : 0)); pz += w * (e[2] * x + e[6] * y + e[10] * z + (t ? e[14] : 0));
    }
    return [px, py, pz];
  };
  for (let v = 0; v < g.count; v++) out.set(rot(v, g.pos[v * 3], g.pos[v * 3 + 1], g.pos[v * 3 + 2], true), v * 3);
  return { out, rot };
}
const cross = (P: ArrayLike<number>, a: number, b: number, c: number) => {
  const e1 = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]];
  const e2 = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
  return [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
};
const rows: string[] = [];
describe('2.4.0 — plis retournés des shorts', () => {
  for (const coach of COACHES) test(coach, () => {
    const body = loadSkinnedBody(bodyFile(coach), 1, (n) => !/eye|lash|brow|hair|teeth|tongue/i.test(n));
    const rig = new CoachRig(body.root);
    const prof = coachProfile(coach);
    for (const [outfit, disc] of OUTFITS) {
      const g = loadSkinnedBody(`coaches/${coach}/tenues/${outfit}.glb`, 1, (n) => n.startsWith('short-'));
      const cells: string[] = [];
      for (const [label, techId] of MOVES) {
        rig.reset();
        const tech = TECHNIQUE_BY_ID.get(techId);
        const m = getMotion(getLibrary(rig, styleOf(disc), prof), tech?.motion ?? techId, false)!;
        const s = new MotionSampler(rig, m);
        const peak = analyseMotion(rig, m).peak || 0.3;
        let worst = 0;
        for (const k of [0.5, 1, 1.25]) {
          rig.apply(s.sample(peak * k));
          const { out, rot } = posedOn(body, g);
          let flip = 0, n = 0;
          for (let t = 0; t < g.index.length; t += 3) {
            const [a, b, c] = [g.index[t], g.index[t + 1], g.index[t + 2]];
            const nr = cross(g.pos, a, b, c); const l = Math.hypot(...nr); if (l < 1e-10) continue;
            const ne = rot(a, nr[0], nr[1], nr[2], false);
            const np = cross(out, a, b, c);
            n++; if (ne[0] * np[0] + ne[1] * np[1] + ne[2] * np[2] < 0) flip++;
          }
          worst = Math.max(worst, flip / n);
        }
        cells.push((worst * 100).toFixed(2));
        expect(worst, `${coach} ${outfit} ${label}`).toBeLessThan(TREATED(coach, outfit) ? 0.03 : 0.045);
      }
      rows.push(`| ${coach} | ${outfit} | ${cells.join(' | ')} |`);
      rig.reset();
    }
  }, 300000);
  test('rapport écrit', () => {
    mkdirSync(resolve(__dirname, '../../../docs/v240'), { recursive: true });
    writeFileSync(
      resolve(__dirname, '../../../docs/v240/MESURES_PLIS_SHORTS.md'),
      `# Shorts des coachs : triangles retournés en mouvement (2.4.0)\n\nGénéré par \`src/three/__tests__/plis-shorts-v240.test.ts\`. Part des triangles du short dont la normale posée est opposée à la normale de repos tournée par la peau (pire des instants 50, 100 et 125 % du coup).\n\n| coach | tenue | high kick % | genou % | low kick % |\n|---|---|---|---|---|\n${rows.join('\n')}\n`,
    );
  });
});
