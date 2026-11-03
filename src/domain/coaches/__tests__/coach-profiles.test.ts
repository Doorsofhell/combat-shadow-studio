import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../../test/skeleton';
import { CoachRig } from '../../../engine/rig';
import { measureAnkles, type AnkleWorst } from '../../../test/ankles';
import { getLibrary } from '../../../engine/library';
import { centreOfMass } from '../../../engine/balance';
import { MotionSampler } from '../../../engine/motion';
import { PLANTED_LIMIT } from '../../../engine/limits';
import { COACH_STANCES, coachProfile } from '../motion';
import { COACH_LOOKS } from '../looks';

/**
 * Each coach's own guard must not degrade a technique. On the coach's own skeleton, for every motion
 * of its discipline:
 * - the foot never twists, rolls or flexes more than with the discipline guard (2° margin): those are
 *   the defects a guard must not introduce;
 * - a lower or higher guard changes the ankle flexion (that is its purpose), which stays within the
 *   weight-bearing range of src/engine/limits.ts (+4°, as in ankle-range.test.ts);
 * and the guard keeps the centre of mass between the feet.
 */
const D = 180 / Math.PI;
const STYLE: Record<string, 'mma'> = { 'mma-kadir': 'mma', 'mma-amara': 'mma', axel: 'mma', kaila: 'mma' };
const fields = ['dorsi', 'plantar', 'inversion', 'eversion', 'rotation'] as const;

describe('gardes propres aux coachs', () => {
  for (const id of Object.keys(COACH_STANCES)) {
    const rig = new CoachRig(loadSkeleton(COACH_LOOKS[id].sex, `coaches/${id}/model.glb`));
    const style = STYLE[id];

    test(`${id} : aucune cheville plus tordue qu’avec la garde de la discipline`, () => {
      const base = measureAnkles(rig, 32, [style]);
      const own = measureAnkles(rig, 32, [style], coachProfile(id));
      const by = new Map(base.map((w) => [w.motion, w] as [string, AnkleWorst]));
      const bad: string[] = [];
      for (const w of own) {
        const b = by.get(w.motion)!;
        for (const f of fields) {
          const flexion = f === 'dorsi' || f === 'plantar';
          if (!flexion && w.planted[f] > b.planted[f] + 2) bad.push(`${w.motion} à plat ${f} ${b.planted[f].toFixed(1)} → ${w.planted[f].toFixed(1)}`);
          if (!flexion && w.airFrames && w.air[f] > b.air[f] + 2) bad.push(`${w.motion} en l’air ${f} ${b.air[f].toFixed(1)} → ${w.air[f].toFixed(1)}`);
        }
        if (w.planted.dorsi > Math.max(PLANTED_LIMIT.dorsi * D + 4, b.planted.dorsi)) bad.push(`${w.motion} à plat dorsiflexion ${w.planted.dorsi.toFixed(1)}`);
        if (w.airFrames && w.air.plantar > b.air.plantar + 2) bad.push(`${w.motion} en l’air flexion plantaire ${b.air.plantar.toFixed(1)} → ${w.air.plantar.toFixed(1)}`);
      }
      expect(bad, bad.join('\n')).toEqual([]);
    });

    test(`${id} : en garde, le centre de gravité reste entre les deux pieds`, () => {
      const lib = getLibrary(rig, style, coachProfile(id));
      const g = lib.get('garde')!;
      rig.apply(new MotionSampler(rig, g).sample(0));
      const c = centreOfMass(rig);
      const l = rig.worldOf('LeftFoot')!;
      const r = rig.worldOf('RightFoot')!;
      // projection of the centre of mass on the line between the ankles, as a fraction of the way
      const ax = r.x - l.x;
      const az = r.z - l.z;
      const t = ((c.x - l.x) * ax + (c.z - l.z) * az) / (ax * ax + az * az);
      expect(t, `${id}: ${t.toFixed(2)}`).toBeGreaterThan(0.2);
      expect(t, `${id}: ${t.toFixed(2)}`).toBeLessThan(0.8);
    });
  }
});
