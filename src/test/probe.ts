import { Object3D, Vector3 } from 'three';
import type { CoachRig } from '../engine/rig';
import type { MotionSampler } from '../engine/motion';

/** joint read-outs of a pose on a skeleton (biomechanics checks of the techniques, v0.29) */
export function probe(scene: Object3D, rig: CoachRig, sampler: MotionSampler, t: number) {
  rig.apply(sampler.sample(t));
  scene.updateMatrixWorld(true);
  const P = (n: string) => scene.getObjectByName(n)!.getWorldPosition(new Vector3());
  const ang = (a: Vector3, b: Vector3) => (a.angleTo(b) * 180) / Math.PI;
  const arm = (s: 'Left' | 'Right') => {
    const sh = P(`${s}Arm`), el = P(`${s}ForeArm`), wr = P(`${s}Hand`), kn = P(`${s}HandMiddle1`);
    const up = el.clone().sub(sh), fo = wr.clone().sub(el), ha = kn.clone().sub(wr);
    return {
      elbowFlex: 180 - ang(up.clone().negate(), fo), // 0 = straight
      wristBend: ang(fo, ha), // 0 = hand in line with the forearm
      forearmPitch: (Math.asin(fo.clone().normalize().y) * 180) / Math.PI, // 0 = horizontal
      elbowAboveShoulder: el.y - sh.y,
      hand: wr,
      elbow: el,
      shoulder: sh,
    };
  };
  const leg = (s: 'Left' | 'Right') => {
    const hp = P(`${s}UpLeg`), kn = P(`${s}Leg`), an = P(`${s}Foot`), ba = P(`${s}ToeBase`);
    const th = kn.clone().sub(hp), sh = an.clone().sub(kn), ft = ba.clone().sub(an);
    return {
      ankle: an,
      ball: ba,
      knee: kn,
      kneeFlex: 180 - ang(th.clone().negate(), sh),
      // 90 = foot at right angle to the shin, more = toes pointed
      footShin: ang(sh, ft),
      kneeAboveHip: kn.y - hp.y,
    };
  };
  const foot = leg;
  const hips = P('Hips');
  const neck = P('Neck');
  const trunk = neck.clone().sub(hips);
  return {
    L: arm('Left'),
    R: arm('Right'),
    fL: foot('Left'),
    fR: foot('Right'),
    hips,
    // trunk lean: + forward (toward +z, the opponent), − backward (degrees)
    lean: (Math.atan2(trunk.z, trunk.y) * 180) / Math.PI,
    head: P('Head'),
  };
}
