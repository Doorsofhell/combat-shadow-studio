/**
 * Ranges of motion used by the rig, from the usual clinical values for a healthy adult (American
 * Academy of Orthopaedic Surgeons, reported by Norkin & White, "Measurement of Joint Motion"):
 * ankle dorsiflexion 20°, plantar flexion 50°, foot inversion 35°, eversion 15°, extension of the
 * toes at the ball of the foot 70°, flexion 40°.
 *
 * Axes checked on both coach models (src/engine/joints.ts and its tests): at rest the shin is vertical
 * and the foot points forward, so the foot's rotation relative to the shin, read in the rest frame as
 * yaw (rotation), pitch (plantar flexion) and roll (inversion), gives the anatomical angles directly.
 *
 * The rotation of the foot about the shin is not an ankle movement of its own (the tibia turns at
 * the knee); a small allowance covers the play of the ankle and subtalar joints.
 */
import { Euler, Quaternion } from 'three';
import type { AnkleJoint } from './pose';
import type { Side } from './rig';

const D = Math.PI / 180;

export const ANKLE_LIMIT = {
  plantar: { min: -20 * D, max: 50 * D },
  inversion: { min: -15 * D, max: 35 * D },
  rotation: { min: -15 * D, max: 15 * D },
};

/**
 * A planted foot carries the body: the ankle bends up further under load (weight-bearing lunge,
 * about 40° in healthy adults) before the heel has to lift.
 */
export const PLANTED_LIMIT = {
  dorsi: 40 * D,
  inversion: 35 * D,
  eversion: 15 * D,
  rotation: 15 * D,
};

export const TOE_LIMIT = { ext: 70 * D, flex: 40 * D };

/** soft stop: unchanged well inside the range, then eases into the limit without a hard corner */
export function softLimit(v: number, min: number, max: number, knee = 8 * D) {
  if (v > max - knee) return max - knee + knee * Math.tanh((v - (max - knee)) / knee);
  if (v < min + knee) return min + knee - knee * Math.tanh((min + knee - v) / knee);
  return v;
}

const _e = new Euler();

/** foot rotation relative to the shin, in the rest frame, for anatomical angles */
export function ankleQuat(j: Required<AnkleJoint> | AnkleJoint, side: Side, out = new Quaternion()) {
  const sgn = side === 'L' ? 1 : -1;
  return out.setFromEuler(_e.set(j.plantar, sgn * j.rotation, -sgn * j.inversion, 'YXZ'));
}

/** anatomical angles of a foot rotation relative to the shin */
export function ankleAngles(rel: Quaternion, side: Side): AnkleJoint {
  const sgn = side === 'L' ? 1 : -1;
  _e.setFromQuaternion(rel, 'YXZ');
  return { plantar: _e.x, rotation: sgn * _e.y, inversion: -sgn * _e.z };
}

/** the same foot rotation, brought back inside the ankle's range */
export function limitAnkle(rel: Quaternion, side: Side) {
  const a = ankleAngles(rel, side);
  return ankleQuat(
    {
      plantar: softLimit(a.plantar, ANKLE_LIMIT.plantar.min, ANKLE_LIMIT.plantar.max),
      inversion: softLimit(a.inversion, ANKLE_LIMIT.inversion.min, ANKLE_LIMIT.inversion.max),
      rotation: softLimit(a.rotation, ANKLE_LIMIT.rotation.min, ANKLE_LIMIT.rotation.max),
    },
    side,
  );
}
