import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getDuo } from '../library';
import { MotionSampler } from '../motion';
import { RENDERS } from '../../domain/encyclopedia/images';
import type { Place } from '../library/illustrations';

/**
 * 1.4.1 Scenes with two coaches of the encyclopedia (illustrations.ts, duoScenes; Lab `duo=`): every scene named by
 * a recipe exists, on Amara (A) and Kadir (B) no joint goes through the mat, and the two bodies are really together
 * without being one inside the other (their pelvises neither apart nor merged).
 */
const STYLE = { boxe: 'boxing', bjj: 'bjj', judo: 'judo' } as const;
const BONES = ['Hips', 'Spine2', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot'];
const toScene = (p: Place, v: Vector3) => new Vector3(p.x + v.x * Math.cos(p.yaw) + v.z * Math.sin(p.yaw), v.y, p.z - v.x * Math.sin(p.yaw) + v.z * Math.cos(p.yaw));

describe('scènes à deux de l’encyclopédie', () => {
  const ra = new CoachRig(loadSkeleton('femme', 'coaches/mma-amara/photo.glb'));
  const rb = new CoachRig(loadSkeleton('homme', 'coaches/mma-kadir/photo.glb'));
  for (const r of RENDERS.filter((x) => x.duo)) {
    test(`${r.id} · ${r.duo} : existe, rien sous le tapis, les deux corps ensemble`, () => {
      const d = getDuo(ra, rb, STYLE[r.d as keyof typeof STYLE], r.duo!);
      expect(d, r.duo).toBeDefined();
      const at = (rig: CoachRig, m: typeof d.a, place: Place) => {
        rig.apply(new MotionSampler(rig, m).sample(1));
        for (const n of BONES) expect(rig.worldOf(n)!.y, `${m.id} ${n}`).toBeGreaterThan(-0.03);
        return toScene(place, rig.worldOf('Hips')!);
      };
      const ha = at(ra, d!.a, d!.placeA);
      const hb = at(rb, d!.b, d!.placeB);
      const gap = ha.distanceTo(hb);
      expect(gap, 'bassins confondus').toBeGreaterThan(0.12);
      expect(gap, 'trop loin pour être ensemble').toBeLessThan(1.6);
    });
  }
});
