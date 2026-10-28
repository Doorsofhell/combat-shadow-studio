import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getIllustration } from '../library';
import { MotionSampler, duration } from '../motion';
import { RENDERS } from '../../domain/encyclopedia/images';

/**
 * 1.3.2 Poses of the encyclopedia illustrations (library/illustrations.ts, Lab `illu=`): every pose named by a
 * recipe exists, and on Kadir and Amara (Ultra-réaliste) no joint goes through the mat and the knees of a kneeling
 * pose really rest on it (a kneeling coach floating above the floor does not look human).
 */
const BODIES = [
  { id: 'Kadir', sex: 'homme', file: 'coaches/mma-kadir/photo.glb' },
  { id: 'Amara', sex: 'femme', file: 'coaches/mma-amara/photo.glb' },
] as const;
const STYLE = { muaythai: 'muaythai', mma: 'mma', bjj: 'bjj', boxe: 'boxing', kickboxing: 'kickboxing', judo: 'judo' } as const;
const BONES = ['Hips', 'Spine2', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase'];

describe('poses des illustrations de l’encyclopédie', () => {
  const recipes = RENDERS.filter((r) => r.illu);

  for (const b of BODIES) {
    const rig = new CoachRig(loadSkeleton(b.sex, b.file));
    for (const r of recipes) {
      test(`${b.id} · ${r.illu} : existe, rien sous le tapis`, () => {
        const m = getIllustration(rig, STYLE[r.d as keyof typeof STYLE], r.illu!);
        expect(m, r.illu).toBeDefined();
        const s = new MotionSampler(rig, m!);
        for (let t = 0; t <= duration(m!) + 1e-6; t += duration(m!) / 20) {
          rig.apply(s.sample(t));
          for (const n of BONES) expect(rig.worldOf(n)!.y, `${n} à t=${t.toFixed(2)}`).toBeGreaterThan(-0.02);
        }
      });
    }
    test(`${b.id} · wai kru : les genoux reposent sur le tapis`, () => {
      const m = getIllustration(rig, 'muaythai', 'illu-wai-kru')!;
      const s = new MotionSampler(rig, m);
      rig.apply(s.sample(0));
      for (const n of ['LeftLeg', 'RightLeg']) expect(rig.worldOf(n)!.y, n).toBeLessThan(0.1);
    });
  }
});
