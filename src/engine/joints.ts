/**
 * Joint angles measured on the posed skeleton, from the bones' rotations since the rest pose (the
 * coach standing, feet flat and forward: anatomical zero). Measures only; the ranges are in
 * src/engine/limits.ts.
 *
 * Ground space: +Y up, +Z the coach's front, +X the coach's left. At rest the shin is vertical and the
 * foot points forward, so the foot's rotation relative to the shin reads directly as ankle angles.
 */
import { Vector3 } from 'three';
import { ankleAngles as jointAngles } from './limits';
import type { CoachRig, Side } from './rig';

export interface AnkleAngles {
  /** + plantar flexion (toes down), − dorsiflexion (toes up), degrees */
  plantar: number;
  /** + inversion (sole turned toward the midline), − eversion, degrees */
  inversion: number;
  /** + external rotation of the foot relative to the shin (toes out), − internal, degrees */
  external: number;
  /** + toes bent up relative to the foot (extension at the ball), − curled down, degrees */
  toeExtension: number;
}

const DEG = 180 / Math.PI;
const sideName = (s: Side) => (s === 'L' ? 'Left' : 'Right');

/** rotation of `child` relative to `parent`, both measured since rest, in the rest frame of the parent */
function relative(rig: CoachRig, parent: string, child: string) {
  const p = rig.turnOf(parent);
  const c = rig.turnOf(child);
  if (!p || !c) return null;
  return p.invert().multiply(c);
}

export function ankleAngles(rig: CoachRig, side: Side): AnkleAngles | null {
  const sn = sideName(side);
  const R = relative(rig, `${sn}Leg`, `${sn}Foot`);
  if (!R) return null;
  const a = jointAngles(R, side);
  const T = relative(rig, `${sn}Foot`, `${sn}ToeBase`);
  let toeExtension = 0;
  if (T) {
    const t = new Vector3(0, 0, 1).applyQuaternion(T);
    toeExtension = Math.atan2(t.y, t.z);
  }
  return { plantar: a.plantar * DEG, inversion: a.inversion * DEG, external: a.rotation * DEG, toeExtension: toeExtension * DEG };
}
