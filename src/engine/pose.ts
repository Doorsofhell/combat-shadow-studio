/**
 * Pose model used by every technique.
 *
 * Ground space: the coach stands on the plane y = 0 and faces +Z; +X is the coach's LEFT side.
 * Angles are radians. Yaw turns the body to the left when positive (seen from above, +Z toward +X),
 * pitch leans forward when positive, roll leans to the coach's left (+X) when positive.
 *
 * Hands are positioned either in "chest" space (they follow the trunk: guards, returns) or in
 * "world" (ground) space (targets on an imaginary opponent, hands posted on the floor).
 * Feet are either planted ("ground": ball of the foot fixed, heel may lift = pivot without sliding)
 * or in the air ("air": ankle position + foot orientation), for kicks, knees and steps.
 */
import { Quaternion, Vector3 } from 'three';

export interface V3 {
  x: number;
  y: number;
  z: number;
}

export interface Rot {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface HandPose {
  space: 'chest' | 'world';
  pos: V3;
  /** direction the elbow points to, in the same space as pos */
  pole: V3;
  /** 0 = vertical fist (thumb up), 1 = palm down, -1 = palm up */
  pron: number;
  /** 0 = open hand, 1 = closed fist */
  fist: number;
  /** wrist flexion, radians (positive bends the hand toward the palm) */
  wrist?: number;
}

/**
 * Ankle and toe angles relative to the shin (radians), the way a coach describes a kick: plantar
 * flexion (+ toes down), inversion (+ sole toward the midline), rotation (+ toes out) and toe
 * extension (+ toes pulled up, ball of the foot forward). Same values for both sides.
 */
export interface AnkleJoint {
  plantar: number;
  inversion: number;
  rotation: number;
  toes?: number;
}

export type FootPose =
  | { mode: 'ground'; ball: V3; yaw: number; heel: number; pole?: V3 }
  /** joint: the foot is set relative to the shin (anatomical angles) instead of yaw/pitch/roll in ground space */
  | { mode: 'air'; ankle: V3; yaw: number; pitch: number; roll: number; pole: V3; point?: number; joint?: AnkleJoint };

export interface Pose {
  hips: V3;
  pelvis: Rot;
  /** trunk rotation relative to the pelvis, spread over the three spine bones */
  chest: Rot;
  /** head rotation relative to a "look at the opponent" orientation */
  head: Rot;
  handL: HandPose;
  handR: HandPose;
  footL: FootPose;
  footR: FootPose;
}

/** Fully resolved pose: everything in ground space, ready for the IK solver or for blending. */
export interface ResolvedHand {
  pos: Vector3;
  pole: Vector3;
  pron: number;
  fist: number;
  wrist: number;
}

export interface ResolvedFoot {
  ankle: Vector3;
  /** rotation applied to the rest orientation of the foot */
  rot: Quaternion;
  /** how much the toes stay flat on the floor (1 planted, 0 follow the foot) */
  toeFlat: number;
  /** heel lift angle (only meaningful when toeFlat > 0) */
  heel: number;
  pole: Vector3;
  point: number;
  /** anatomical ankle angles and how much they decide the foot (0: yaw/pitch/roll in ground space, 1: the joint) */
  joint: Required<AnkleJoint>;
  jointW: number;
}

export const NEUTRAL_JOINT: Required<AnkleJoint> = { plantar: 0, inversion: 0, rotation: 0, toes: 0 };

export function blendJoint(a: Required<AnkleJoint>, b: Required<AnkleJoint>, t: number): Required<AnkleJoint> {
  return {
    plantar: a.plantar + (b.plantar - a.plantar) * t,
    inversion: a.inversion + (b.inversion - a.inversion) * t,
    rotation: a.rotation + (b.rotation - a.rotation) * t,
    toes: a.toes + (b.toes - a.toes) * t,
  };
}

export interface ResolvedPose {
  hips: Vector3;
  pelvis: Quaternion;
  chest: Quaternion;
  head: Rot;
  handL: ResolvedHand;
  handR: ResolvedHand;
  footL: ResolvedFoot;
  footR: ResolvedFoot;
}

export const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
export const rot = (yaw = 0, pitch = 0, roll = 0): Rot => ({ yaw, pitch, roll });
export const deg = (d: number) => (d * Math.PI) / 180;

const AX_X = new Vector3(1, 0, 0);
const AX_Y = new Vector3(0, 1, 0);
const AX_Z = new Vector3(0, 0, 1);

export function quatFromRot(r: Rot, out = new Quaternion()): Quaternion {
  const qy = new Quaternion().setFromAxisAngle(AX_Y, r.yaw);
  const qx = new Quaternion().setFromAxisAngle(AX_X, r.pitch);
  const qz = new Quaternion().setFromAxisAngle(AX_Z, -r.roll);
  return out.copy(qy).multiply(qx).multiply(qz);
}

export const toVec = (p: V3) => new Vector3(p.x, p.y, p.z);

// ------------------------------------------------------------------ mirroring (southpaw)
const mv = (p: V3): V3 => ({ x: -p.x, y: p.y, z: p.z });
const mr = (r: Rot): Rot => ({ yaw: -r.yaw, pitch: r.pitch, roll: -r.roll });
const mh = (h: HandPose): HandPose => ({ ...h, pos: mv(h.pos), pole: mv(h.pole) });
const mf = (f: FootPose): FootPose =>
  f.mode === 'ground' ? { ...f, ball: mv(f.ball), yaw: -f.yaw, pole: f.pole ? mv(f.pole) : undefined } : { ...f, ankle: mv(f.ankle), yaw: -f.yaw, roll: -f.roll, pole: mv(f.pole) };

/** Mirror a pose left/right: an orthodox technique becomes its southpaw version. */
export function mirrorPose(p: Pose): Pose {
  return {
    hips: mv(p.hips),
    pelvis: mr(p.pelvis),
    chest: mr(p.chest),
    head: mr(p.head),
    handL: mh(p.handR),
    handR: mh(p.handL),
    footL: mf(p.footR),
    footR: mf(p.footL),
  };
}

// ------------------------------------------------------------------ blending of resolved poses
const tmpQ = new Quaternion();

function blendHand(a: ResolvedHand, b: ResolvedHand, t: number): ResolvedHand {
  return {
    pos: a.pos.clone().lerp(b.pos, t),
    pole: a.pole.clone().lerp(b.pole, t).normalize(),
    pron: a.pron + (b.pron - a.pron) * t,
    fist: a.fist + (b.fist - a.fist) * t,
    wrist: a.wrist + (b.wrist - a.wrist) * t,
  };
}

function blendFoot(a: ResolvedFoot, b: ResolvedFoot, t: number): ResolvedFoot {
  return {
    ankle: a.ankle.clone().lerp(b.ankle, t),
    rot: a.rot.clone().slerp(b.rot, t),
    toeFlat: a.toeFlat + (b.toeFlat - a.toeFlat) * t,
    heel: a.heel + (b.heel - a.heel) * t,
    pole: a.pole.clone().lerp(b.pole, t).normalize(),
    point: a.point + (b.point - a.point) * t,
    joint: blendJoint(a.joint, b.joint, t),
    jointW: a.jointW + (b.jointW - a.jointW) * t,
  };
}

export function blendResolved(a: ResolvedPose, b: ResolvedPose, t: number): ResolvedPose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    hips: a.hips.clone().lerp(b.hips, t),
    pelvis: tmpQ.copy(a.pelvis).slerp(b.pelvis, t).clone(),
    chest: a.chest.clone().slerp(b.chest, t),
    head: {
      yaw: a.head.yaw + (b.head.yaw - a.head.yaw) * t,
      pitch: a.head.pitch + (b.head.pitch - a.head.pitch) * t,
      roll: a.head.roll + (b.head.roll - a.head.roll) * t,
    },
    handL: blendHand(a.handL, b.handL, t),
    handR: blendHand(a.handR, b.handR, t),
    footL: blendFoot(a.footL, b.footL, t),
    footR: blendFoot(a.footR, b.footR, t),
  };
}

/** Move a resolved pose by a ground transform (the coach's stance origin after steps/pivots). */
export function transformResolved(p: ResolvedPose, offset: { x: number; z: number; yaw: number }): ResolvedPose {
  if (offset.x === 0 && offset.z === 0 && offset.yaw === 0) return p;
  const q = new Quaternion().setFromAxisAngle(AX_Y, offset.yaw);
  const t = new Vector3(offset.x, 0, offset.z);
  const pt = (v: Vector3) => v.clone().applyQuaternion(q).add(t);
  const dir = (v: Vector3) => v.clone().applyQuaternion(q);
  const hand = (h: ResolvedHand): ResolvedHand => ({ ...h, pos: pt(h.pos), pole: dir(h.pole) });
  const foot = (f: ResolvedFoot): ResolvedFoot => ({
    ...f,
    ankle: pt(f.ankle),
    rot: q.clone().multiply(f.rot),
    pole: dir(f.pole),
  });
  return {
    ...p,
    hips: pt(p.hips),
    pelvis: q.clone().multiply(p.pelvis),
    handL: hand(p.handL),
    handR: hand(p.handR),
    footL: foot(p.footL),
    footR: foot(p.footR),
  };
}
