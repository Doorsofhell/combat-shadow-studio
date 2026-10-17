import { Box3, Vector3 } from 'three';
import { MotionSampler, duration } from './motion';
import type { CoachRig } from './rig';
import { MotionLibrary, getMotion } from './library';

const POINTS: [bone: string, pad: number][] = [
  ['Head', 0.22],
  ['Neck', 0.08],
  ['LeftShoulder', 0.08],
  ['RightShoulder', 0.08],
  ['LeftForeArm', 0.07],
  ['RightForeArm', 0.07],
  ['LeftHand', 0.11],
  ['RightHand', 0.11],
  ['Hips', 0.16],
  ['LeftLeg', 0.08],
  ['RightLeg', 0.08],
  ['LeftFoot', 0.08],
  ['RightFoot', 0.08],
  ['LeftToeBase', 0.07],
  ['RightToeBase', 0.07],
];

const cache = new WeakMap<CoachRig, Map<string, Box3>>();

/**
 * Space a motion really occupies, in the coach's own frame (origin between the feet at the start,
 * facing +Z): the animation is sampled on this rig and the box of its limbs is kept, with a pad
 * for the volume of the head, fists and feet. The camera frames this box, so a high kick or a
 * sprawl stays in view from its first frame instead of being chased.
 */
export function motionEnvelope(rig: CoachRig, lib: MotionLibrary, motionId: string, southpaw: boolean): Box3 {
  let byRig = cache.get(rig);
  if (!byRig) cache.set(rig, (byRig = new Map()));
  const key = `${motionId}${southpaw ? '@g' : ''}`;
  const hit = byRig.get(key);
  if (hit) return hit.clone();
  const m = getMotion(lib, motionId, southpaw);
  const box = new Box3();
  if (m) {
    const s = new MotionSampler(rig, m);
    const n = 16;
    const p = new Vector3();
    for (let i = 0; i <= n; i++) {
      rig.apply(s.sample((duration(m) * i) / n));
      for (const [bone, pad] of POINTS) {
        const w = rig.worldOf(bone);
        if (!w) continue;
        box.expandByPoint(p.copy(w).addScalar(pad));
        box.expandByPoint(p.copy(w).addScalar(-pad));
      }
    }
    box.min.y = Math.min(0, box.min.y);
  }
  byRig.set(key, box);
  return box.clone();
}

/** union of the envelopes of several motions (a combination, guard included) */
export function sequenceEnvelope(rig: CoachRig, lib: MotionLibrary, motionIds: string[], southpaw: boolean): Box3 {
  const box = motionEnvelope(rig, lib, 'garde', southpaw);
  for (const id of new Set(motionIds)) box.union(motionEnvelope(rig, lib, id, southpaw));
  return box;
}
