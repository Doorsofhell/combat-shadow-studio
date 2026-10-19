import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig, KNEE_MAX_FLEX } from '../../engine/rig';
import { getLibrary } from '../../engine/library';
import { MotionSampler, duration } from '../../engine/motion';
import type { StanceStyle } from '../../engine/author';
import { restoreReferencePose, setLegLength } from '../pose';
import { BODY_RANGES } from '../../editor/normalize';

const BONES = ['Hips', 'Spine2', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightLeg', 'RightFoot'];
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai'];

/** what CoachModel does when the leg length changes: back to the reference pose, then a new rig */
function rebuild(root: ReturnType<typeof loadSkeleton>, legLength: number) {
  restoreReferencePose(root);
  setLegLength(root, legLength);
  root.updateMatrixWorld(true);
  return new CoachRig(root);
}

function guard(rig: CoachRig) {
  const motion = getLibrary(rig, 'boxing').values().next().value!;
  rig.apply(new MotionSampler(rig, motion).sample(duration(motion) / 2));
}

describe('posture de référence du squelette', () => {
  test.each(['homme', 'femme'] as const)('%s : reconstruire le squelette pendant une animation ne déforme pas la posture', (c) => {
    const root = loadSkeleton(c);
    const ref = rebuild(root, 1);
    guard(ref);
    // the bug: building the rig on the animated bones made the guard its rest pose
    const wrong = new CoachRig(root);
    expect(wrong.restOf('LeftHand')!.distanceTo(ref.restOf('LeftHand')!)).toBeGreaterThan(0.05);
    // the fix: the reference pose is restored first, whatever the coach was doing
    const again = rebuild(root, 1);
    for (const b of BONES) expect(again.restOf(b)!.distanceTo(ref.restOf(b)!), b).toBeLessThan(1e-6);
    guard(again);
    const third = rebuild(root, 1);
    for (const b of BONES) expect(third.restOf(b)!.distanceTo(ref.restOf(b)!), b).toBeLessThan(1e-6);
  });

  test('la longueur des jambes ne déplace que les genoux et les chevilles, le haut du corps reste identique', () => {
    const root = loadSkeleton('homme');
    const ref = rebuild(root, 1);
    const long = rebuild(root, BODY_RANGES.legLength[1]);
    for (const b of ['Hips', 'Spine2', 'Head', 'LeftArm', 'LeftHand', 'LeftUpLeg']) expect(long.restOf(b)!.distanceTo(ref.restOf(b)!), b).toBeLessThan(1e-6);
    expect(long.restOf('LeftFoot')!.distanceTo(ref.restOf('LeftFoot')!)).toBeGreaterThan(0.01);
  });
});

/** maximal flexion (degrees between the two segments, 0 = straight) of a healthy adult knee and elbow */
const KNEE_MAX = 150;
const ELBOW_MAX = 150;

/** angle between two segments, in degrees (0 = straight) */
const bend = (a: Vector3, b: Vector3, c: Vector3) => (b.clone().sub(a).angleTo(c.clone().sub(b)) * 180) / Math.PI;

/**
 * Leg length at the slider limits must not degrade any move: same knee and elbow angles as with the
 * reference legs (within 8°, or within the anatomical range), ankles above the floor, feet on their targets. The absolute anatomical
 * limits of the animations themselves are checked separately (lot 4: biomechanics), because a few
 * moves already exceed them with the reference skeleton (see docs/NON_REGRESSION.md).
 */
describe('longueur des jambes aux limites du curseur', () => {
  for (const f of BODY_RANGES.legLength) {
    test.each(['homme', 'femme'] as const)(`%s, jambes ×${f} : appuis, genoux et coudes identiques à la référence dans toutes les animations`, (c) => {
      const refRoot = loadSkeleton(c);
      const ref = rebuild(refRoot, 1);
      const root = loadSkeleton(c);
      const rig = rebuild(root, f);
      const m = rig.metrics;
      const angles = (r: CoachRig, side: 'Left' | 'Right') => ({
        knee: bend(r.worldOf(`${side}UpLeg`)!, r.worldOf(`${side}Leg`)!, r.worldOf(`${side}Foot`)!),
        elbow: bend(r.worldOf(`${side}Arm`)!, r.worldOf(`${side}ForeArm`)!, r.worldOf(`${side}Hand`)!),
      });
      for (const style of STYLES) {
        const refLib = getLibrary(ref, style);
        for (const motion of getLibrary(rig, style).values()) {
          const s = new MotionSampler(rig, motion);
          const refMotion = refLib.get(motion.id)!;
          const rs = new MotionSampler(ref, refMotion);
          for (let i = 0; i <= 6; i++) {
            const pose = s.sample((duration(motion) * i) / 6);
            rig.apply(pose);
            ref.apply(rs.sample((duration(refMotion) * i) / 6));
            const at = `${style} ${motion.id} t${i}`;
            for (const side of ['Left', 'Right'] as const) {
              const foot = rig.worldOf(`${side}Foot`)!;
              expect(foot.y, `${at} cheville ${side} sous le sol`).toBeGreaterThan(0.02);
              const a = angles(rig, side);
              const b = angles(ref, side);
              // same angle as the reference, or still within the joint's anatomical range (deep
              // crouches bend shorter legs a little more, which is natural)
              const ok = (x: number, r: number, lim: number) => Math.abs(x - r) < 8 || x <= Math.max(lim, r + 2);
              expect(ok(a.knee, b.knee, KNEE_MAX), `${at} genou ${side} ${a.knee.toFixed(0)}° (référence ${b.knee.toFixed(0)}°)`).toBe(true);
              expect(ok(a.elbow, b.elbow, ELBOW_MAX), `${at} coude ${side} ${a.elbow.toFixed(0)}° (référence ${b.elbow.toFixed(0)}°)`).toBe(true);
              const target = side === 'Left' ? pose.footL.ankle : pose.footR.ankle;
              const hip = rig.worldOf(`${side}UpLeg`)!;
              // a heel lifted by the floor rule (dorsiflexion past the weight-bearing range) moves the ankle on
              // purpose, about the ball of the foot: compare with the lifted ankle (src/engine/rig.ts settlePlanted)
              const aim = rig.heelLift[side === 'Left' ? 'L' : 'R']?.ankle ?? target;
              // closer than the knee allows (deep crouch on a lifted heel): the knee limit holds the foot short on purpose
              const minReach = Math.sqrt(m.thigh ** 2 + m.shin ** 2 + 2 * m.thigh * m.shin * Math.cos(KNEE_MAX_FLEX));
              if (hip.distanceTo(aim) <= (m.thigh + m.shin) * 0.985 && hip.distanceTo(aim) >= minReach * 1.05) expect(foot.distanceTo(aim), `${at} appui ${side}`).toBeLessThan(0.02);
            }
          }
        }
      }
    });
  }
});
