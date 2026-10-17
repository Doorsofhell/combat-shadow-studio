/**
 * Coach rig: reads the rest skeleton of a Mixamo-compatible humanoid, resolves authored poses
 * to ground space and drives the bones with analytic two-bone IK (arms and legs), spine
 * distribution, head look-at, clavicle protraction and finger curl.
 */
import { Bone, Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import {
  FootPose,
  HandPose,
  Pose,
  ResolvedFoot,
  ResolvedHand,
  ResolvedPose,
  quatFromRot,
  toVec,
} from './pose';

export type Side = 'L' | 'R';
const SIDES: Side[] = ['L', 'R'];
const sideName = (s: Side) => (s === 'L' ? 'Left' : 'Right');

const UP = new Vector3(0, 1, 0);

/** Lengths and rest landmarks of a coach, in metres, ground space. */
export interface Metrics {
  height: number;
  hipsRest: Vector3;
  spineBaseRest: Vector3;
  shoulderCenterRest: Vector3;
  hipHalf: number;
  shoulderHalf: number;
  thigh: number;
  shin: number;
  upperArm: number;
  foreArm: number;
  eyeY: number;
  ballRestY: number;
  /** ankle position relative to the ball joint, foot pointing +Z */
  ankleFromBall: Vector3;
  /** rest yaw of each foot */
  footYaw: Record<Side, number>;
}

interface BoneRest {
  bone: Bone;
  worldQ: Quaternion;
  worldPos: Vector3;
  localQ: Quaternion;
  localPos: Vector3;
}

interface Limb {
  upper: BoneRest;
  lower: BoneRest;
  end: BoneRest;
  lenA: number;
  lenB: number;
  /** rest primary directions and "joint tip" directions (elbow / knee cap) */
  p0Upper: Vector3;
  p0Lower: Vector3;
  u0Upper: Vector3;
  u0Lower: Vector3;
}

const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export function findBone(root: Object3D, name: string): Bone | undefined {
  const target = name.replace(/[:.]/g, '').toLowerCase();
  let found: Bone | undefined;
  root.traverse((o) => {
    if (!found && (o as Bone).isBone && o.name.replace(/[:.]/g, '').toLowerCase() === target) found = o as Bone;
  });
  return found;
}

const tmpM = new Matrix4();
const tmpV = new Vector3();
const tmpV2 = new Vector3();
const tmpQ = new Quaternion();
const tmpQ2 = new Quaternion();

function worldQuat(o: Object3D, out: Quaternion) {
  o.matrixWorld.decompose(tmpV, out, tmpV2);
  return out;
}

/** Rotation that maps the orthonormal frame (p0, u0) onto (p1, u1). */
function frameRotation(p0: Vector3, u0: Vector3, p1: Vector3, u1: Vector3, out: Quaternion) {
  const a = new Matrix4().makeBasis(p0, u0, new Vector3().crossVectors(p0, u0));
  const b = new Matrix4().makeBasis(p1, u1, new Vector3().crossVectors(p1, u1));
  tmpM.copy(a).transpose(); // inverse of an orthonormal basis
  return out.setFromRotationMatrix(b.multiply(tmpM));
}

function orthoTo(v: Vector3, axis: Vector3, fallback: Vector3) {
  const r = v.clone().addScaledVector(axis, -v.dot(axis));
  if (r.lengthSq() < 1e-8) r.copy(fallback).addScaledVector(axis, -fallback.dot(axis));
  return r.normalize();
}

/** largest flexion of a healthy adult elbow and knee (radians, angle between the two segments) */
export const ELBOW_MAX_FLEX = (150 * Math.PI) / 180;
export const KNEE_MAX_FLEX = (155 * Math.PI) / 180;

export class CoachRig {
  readonly metrics: Metrics;
  private bones = new Map<string, BoneRest>();
  private arms!: Record<Side, Limb>;
  private legs!: Record<Side, Limb>;
  private spine: BoneRest[] = [];
  private fingerAxes = new Map<BoneRest, { axis: Vector3; weight: number }>();
  private twistOffset: Record<Side, number> = { L: 0, R: 0 };

  constructor(readonly root: Object3D) {
    root.updateMatrixWorld(true);
    const rootInv = new Matrix4().copy(root.matrixWorld).invert();
    const rootQInv = worldQuat(root, new Quaternion()).invert();
    root.traverse((o) => {
      if (!(o as Bone).isBone) return;
      const b = o as Bone;
      const wp = new Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(rootInv);
      const wq = rootQInv.clone().multiply(worldQuat(b, new Quaternion()));
      const key = b.name.replace(/^mixamorig[:]?/i, '');
      this.bones.set(key, { bone: b, worldQ: wq, worldPos: wp, localQ: b.quaternion.clone(), localPos: b.position.clone() });
    });
    const need = (n: string) => {
      const r = this.bones.get(n);
      if (!r) throw new Error(`Os manquant dans le modèle 3D : ${n}`);
      return r;
    };
    this.spine = ['Spine', 'Spine1', 'Spine2'].map(need);
    const limb = (u: string, l: string, e: string, tipFallback: Vector3): Limb => {
      const upper = need(u);
      const lower = need(l);
      const end = need(e);
      const p0Upper = lower.worldPos.clone().sub(upper.worldPos).normalize();
      const p0Lower = end.worldPos.clone().sub(lower.worldPos).normalize();
      // joint tip directions (olecranon / knee cap), in the hinge plane, away from the bend
      const u0Upper = orthoTo(p0Lower.clone().negate(), p0Upper, tipFallback);
      const u0Lower = orthoTo(p0Upper.clone(), p0Lower, tipFallback);
      return {
        upper, lower, end,
        lenA: upper.worldPos.distanceTo(lower.worldPos),
        lenB: lower.worldPos.distanceTo(end.worldPos),
        p0Upper, p0Lower, u0Upper, u0Lower,
      };
    };
    this.arms = {
      L: limb('LeftArm', 'LeftForeArm', 'LeftHand', new Vector3(0, 0, -1)),
      R: limb('RightArm', 'RightForeArm', 'RightHand', new Vector3(0, 0, -1)),
    };
    this.legs = {
      L: limb('LeftUpLeg', 'LeftLeg', 'LeftFoot', new Vector3(0, 0, 1)),
      R: limb('RightUpLeg', 'RightLeg', 'RightFoot', new Vector3(0, 0, 1)),
    };

    // finger flexion axes, expressed in each bone's own rest frame
    for (const s of SIDES) {
      const hand = need(`${sideName(s)}Hand`);
      const idx = this.bones.get(`${sideName(s)}HandIndex1`);
      const pky = this.bones.get(`${sideName(s)}HandPinky1`);
      if (!idx || !pky) continue;
      const across = pky.worldPos.clone().sub(idx.worldPos).normalize();
      const fingerDir = idx.worldPos.clone().sub(hand.worldPos).normalize();
      // palm normal: perpendicular to fingers and to the knuckle line, oriented toward the body midline
      const palm = new Vector3().crossVectors(fingerDir, across).normalize();
      // the palm is on the side the resting fingers curl toward
      const curl = new Vector3();
      for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) {
        const a1 = this.bones.get(`${sideName(s)}Hand${f}1`)?.worldPos;
        const a2 = this.bones.get(`${sideName(s)}Hand${f}2`)?.worldPos;
        const a3 = this.bones.get(`${sideName(s)}Hand${f}3`)?.worldPos;
        if (a1 && a2 && a3) curl.add(a3.clone().sub(a2).normalize().sub(a2.clone().sub(a1).normalize()));
      }
      if (curl.dot(palm) < 0) palm.negate();
      // calibrate the forearm twist so that pron = 0 gives a vertical fist (palm facing the midline)
      const arm = this.arms[s];
      const neutral = new Vector3().crossVectors(arm.p0Lower, arm.u0Lower).multiplyScalar(s === 'L' ? -1 : 1);
      const pp = orthoTo(palm.clone(), arm.p0Lower, neutral);
      const ang = Math.atan2(new Vector3().crossVectors(pp, neutral).dot(arm.p0Lower), pp.dot(neutral));
      this.twistOffset[s] = ang;
      for (const f of FINGERS) {
        for (let i = 1; i <= 3; i++) {
          const fb = this.bones.get(`${sideName(s)}Hand${f}${i}`);
          if (!fb) continue;
          const child = this.bones.get(`${sideName(s)}Hand${f}${i + 1}`);
          const dir = child
            ? child.worldPos.clone().sub(fb.worldPos).normalize()
            : fb.worldPos.clone().sub(this.bones.get(`${sideName(s)}Hand${f}${i - 1}`)?.worldPos ?? hand.worldPos).normalize();
          let axisW: Vector3;
          let weight: number;
          if (f === 'Thumb') {
            axisW = new Vector3().crossVectors(dir, palm.clone().add(across.clone().multiplyScalar(0.6)).normalize()).normalize();
            weight = i === 1 ? 0.35 : 0.8;
          } else {
            axisW = new Vector3().crossVectors(dir, palm).normalize();
            weight = i === 1 ? 1.45 : i === 2 ? 1.65 : 1.0;
          }
          const axisLocal = axisW.applyQuaternion(fb.worldQ.clone().invert());
          this.fingerAxes.set(fb, { axis: axisLocal, weight });
        }
      }
    }
    this.metrics = this.computeMetrics();
  }

  private computeMetrics(): Metrics {
    const b = (n: string) => this.bones.get(n)!;
    const hips = b('Hips').worldPos.clone();
    const shL = b('LeftArm').worldPos;
    const shR = b('RightArm').worldPos;
    const head = b('Head');
    const footL = b('LeftFoot').worldPos;
    const ballL = b('LeftToeBase').worldPos;
    const ballR = b('RightToeBase').worldPos;
    const footR = b('RightFoot').worldPos;
    const yawOf = (from: Vector3, to: Vector3) => Math.atan2(to.x - from.x, to.z - from.z);
    const yawL = yawOf(footL, ballL);
    const ankleFromBall = footL.clone().sub(ballL).applyAxisAngle(UP, -yawL);
    let top = 0;
    this.root.traverse((o) => {
      const m = o as { isMesh?: boolean; geometry?: { boundingBox: { max: Vector3 } | null; computeBoundingBox(): void } };
      if (m.isMesh && m.geometry) {
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        top = Math.max(top, m.geometry.boundingBox!.max.y);
      }
    });
    const headTop = head.worldPos.y + 0.2 * (head.worldPos.y - hips.y) / 0.6;
    return {
      height: top > 1 ? top : headTop,
      hipsRest: hips,
      spineBaseRest: b('Spine').worldPos.clone(),
      shoulderCenterRest: shL.clone().add(shR).multiplyScalar(0.5),
      hipHalf: Math.abs(b('LeftUpLeg').worldPos.x - b('RightUpLeg').worldPos.x) / 2,
      shoulderHalf: Math.abs(shL.x - shR.x) / 2,
      thigh: this.legs.L.lenA,
      shin: this.legs.L.lenB,
      upperArm: this.arms.L.lenA,
      foreArm: this.arms.L.lenB,
      eyeY: head.worldPos.y - 0.01,
      ballRestY: (ballL.y + ballR.y) / 2,
      ankleFromBall,
      footYaw: { L: yawL, R: yawOf(footR, ballR) },
    };
  }

  // ---------------------------------------------------------------- pose resolution
  /** Orientation and origin of the chest frame for given trunk rotations (shared by authoring and solving). */
  chestFrame(hips: Vector3, pelvis: Quaternion, chest: Quaternion) {
    const m = this.metrics;
    const q = pelvis.clone().multiply(chest);
    const origin = hips
      .clone()
      .add(m.spineBaseRest.clone().sub(m.hipsRest).applyQuaternion(pelvis))
      .add(m.shoulderCenterRest.clone().sub(m.spineBaseRest).applyQuaternion(q));
    return { origin, q };
  }

  resolveFoot(f: FootPose, side: Side): ResolvedFoot {
    const m = this.metrics;
    const sgn = side === 'L' ? 1 : -1;
    const unsplay = new Quaternion().setFromAxisAngle(UP, -m.footYaw[side]);
    if (f.mode === 'ground') {
      const qYaw = new Quaternion().setFromAxisAngle(UP, f.yaw);
      const lateral = new Vector3(1, 0, 0).applyQuaternion(qYaw);
      const qHeel = new Quaternion().setFromAxisAngle(lateral, f.heel);
      const qFoot = qHeel.clone().multiply(qYaw);
      const ball = new Vector3(f.ball.x, f.ball.y + m.ballRestY, f.ball.z);
      const ankle = ball.clone().add(m.ankleFromBall.clone().applyQuaternion(qFoot));
      const pole = f.pole ? toVec(f.pole).normalize() : new Vector3(0.4 * sgn, 0, 1).applyQuaternion(qYaw).normalize();
      return { ankle, rot: qFoot.multiply(unsplay), toeFlat: 1, heel: f.heel, pole, point: 0 };
    }
    const q = quatFromRot({ yaw: f.yaw, pitch: f.pitch, roll: f.roll });
    return {
      ankle: toVec(f.ankle),
      rot: q.multiply(unsplay),
      toeFlat: 0,
      heel: 0,
      pole: toVec(f.pole).normalize(),
      point: f.point ?? 0,
    };
  }

  resolveHand(h: HandPose, frame: { origin: Vector3; q: Quaternion }): ResolvedHand {
    const pos = toVec(h.pos);
    const pole = toVec(h.pole).normalize();
    if (h.space === 'chest') {
      pos.applyQuaternion(frame.q).add(frame.origin);
      pole.applyQuaternion(frame.q);
    }
    return { pos, pole, pron: h.pron, fist: h.fist, wrist: h.wrist ?? 0 };
  }

  resolve(p: Pose): ResolvedPose {
    const hips = toVec(p.hips);
    const pelvis = quatFromRot(p.pelvis);
    const chest = quatFromRot(p.chest);
    const frame = this.chestFrame(hips, pelvis, chest);
    return {
      hips,
      pelvis,
      chest,
      head: p.head,
      handL: this.resolveHand(p.handL, frame),
      handR: this.resolveHand(p.handR, frame),
      footL: this.resolveFoot(p.footL, 'L'),
      footR: this.resolveFoot(p.footR, 'R'),
    };
  }

  // ---------------------------------------------------------------- solver
  private setWorldQ(r: BoneRest, q: Quaternion) {
    const parent = r.bone.parent!;
    parent.updateWorldMatrix(true, false);
    const pq = worldQuat(parent, tmpQ2);
    const rootQ = worldQuat(this.root, new Quaternion());
    // q is in ground (root) space -> world -> parent local
    const world = rootQ.multiply(q);
    r.bone.quaternion.copy(pq.invert().multiply(world));
    r.bone.updateMatrixWorld(true);
  }

  private bonePos(r: BoneRest, out = new Vector3()) {
    r.bone.updateWorldMatrix(true, false);
    out.setFromMatrixPosition(r.bone.matrixWorld);
    return out.applyMatrix4(tmpM.copy(this.root.matrixWorld).invert());
  }

  reset() {
    for (const r of this.bones.values()) {
      r.bone.quaternion.copy(r.localQ);
      r.bone.position.copy(r.localPos);
    }
    this.root.updateMatrixWorld(true);
  }

  apply(p: ResolvedPose) {
    const hipsR = this.bones.get('Hips')!;
    // hips position: the root bone's parent is the armature node
    const parent = hipsR.bone.parent!;
    parent.updateWorldMatrix(true, false);
    const toParent = new Matrix4().copy(parent.matrixWorld).invert().multiply(this.root.matrixWorld);
    hipsR.bone.position.copy(p.hips).applyMatrix4(toParent);
    this.setWorldQ(hipsR, p.pelvis.clone().multiply(hipsR.worldQ));

    // spine: cumulative share of the chest rotation
    const shares = [0.3, 0.65, 1.0];
    const ident = new Quaternion();
    this.spine.forEach((r, i) => {
      const part = ident.clone().slerp(p.chest, shares[i]);
      this.setWorldQ(r, p.pelvis.clone().multiply(part).multiply(r.worldQ));
    });
    const trunk = p.pelvis.clone().multiply(p.chest);

    // head and neck: look toward the opponent (+Z of the stance), then authored offsets
    const trunkYaw = yawOfQuat(trunk);
    const look = quatFromRot({ yaw: 0, pitch: 0.05, roll: 0 });
    const lookYaw = clamp(-trunkYaw, -1.1, 1.1);
    const lookQ = trunk.clone().premultiply(new Quaternion().setFromAxisAngle(UP, lookYaw));
    // remove trunk pitch/roll partially so the eyes stay level
    const level = new Quaternion().setFromAxisAngle(UP, yawOfQuat(lookQ)).multiply(look);
    const headQ = lookQ.clone().slerp(level, 0.75).multiply(quatFromRot(p.head));
    const neck = this.bones.get('Neck');
    const head = this.bones.get('Head');
    if (neck) this.setWorldQ(neck, trunk.clone().slerp(headQ, 0.45).multiply(neck.worldQ));
    if (head) this.setWorldQ(head, headQ.clone().multiply(head.worldQ));

    for (const s of SIDES) this.solveArm(s, s === 'L' ? p.handL : p.handR, trunk);
    for (const s of SIDES) this.solveLeg(s, s === 'L' ? p.footL : p.footR);
  }

  private solveTwoBone(limb: Limb, target: Vector3, pole: Vector3, maxFlex: number) {
    const S = this.bonePos(limb.upper);
    const a = limb.lenA;
    const b = limb.lenB;
    const toT = target.clone().sub(S);
    // joint limit: the elbow or knee never folds beyond maxFlex (angle between the two segments),
    // whatever the target; a target too close is held at the nearest reachable distance
    const minDist = Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(maxFlex));
    const dist = clamp(toT.length(), Math.max(Math.abs(a - b) + 1e-3, minDist), a + b - 1e-4);
    const dir = toT.lengthSq() > 1e-10 ? toT.normalize() : new Vector3(0, -1, 0);
    const poleOrth = orthoTo(pole.clone(), dir, new Vector3(0, 0, -1));
    const cosA = clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    const E = S.clone().addScaledVector(dir, a * cosA).addScaledVector(poleOrth, a * sinA);
    const T = S.clone().addScaledVector(dir, dist);
    const p1Upper = E.clone().sub(S).normalize();
    const p1Lower = T.clone().sub(E).normalize();
    // same definition as at rest; when the limb is almost straight the hinge plane comes from the pole
    const straightness = clamp(1 - new Vector3().crossVectors(p1Upper, p1Lower).length() / 0.17, 0, 1);
    const u1Upper = orthoTo(p1Lower.clone().negate(), p1Upper, poleOrth).lerp(orthoTo(poleOrth.clone(), p1Upper, poleOrth), straightness).normalize();
    const u1Lower = orthoTo(p1Upper.clone(), p1Lower, poleOrth).lerp(orthoTo(poleOrth.clone(), p1Lower, poleOrth), straightness).normalize();
    const qUpper = frameRotation(limb.p0Upper, limb.u0Upper, p1Upper, u1Upper, new Quaternion());
    const qLower = frameRotation(limb.p0Lower, limb.u0Lower, p1Lower, u1Lower, new Quaternion());
    return { qUpper, qLower, p1Lower, E, T };
  }

  private solveArm(s: Side, h: ResolvedHand, trunk: Quaternion) {
    const limb = this.arms[s];
    const sh = this.bones.get(`${sideName(s)}Shoulder`);
    if (sh) {
      // clavicle: protract and shrug when the hand travels forward and up (shoulder covers the chin)
      const local = h.pos.clone().sub(this.bonePos(sh)).applyQuaternion(trunk.clone().invert());
      const fwd = clamp((local.z - 0.25) / 0.35, 0, 1);
      const up = clamp((local.y - 0.05) / 0.3, 0, 1);
      const sgn = s === 'L' ? 1 : -1;
      const prot = new Quaternion().setFromAxisAngle(UP, -sgn * 0.16 * fwd);
      const shrug = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), sgn * (0.06 * fwd + 0.08 * up));
      this.setWorldQ(sh, trunk.clone().multiply(prot).multiply(shrug).multiply(sh.worldQ));
    }
    const { qUpper, qLower, p1Lower } = this.solveTwoBone(limb, h.pos, h.pole, ELBOW_MAX_FLEX);
    const sgn = s === 'L' ? 1 : -1;
    const pronAngle = (h.pron - 0.35) * (Math.PI / 2) * sgn + this.twistOffset[s];
    const twistFore = new Quaternion().setFromAxisAngle(p1Lower, pronAngle * 0.55);
    const twistHand = new Quaternion().setFromAxisAngle(p1Lower, pronAngle);
    this.setWorldQ(limb.upper, qUpper.clone().multiply(limb.upper.worldQ));
    this.setWorldQ(limb.lower, twistFore.multiply(qLower).multiply(limb.lower.worldQ));
    const handQ = twistHand.multiply(qLower).multiply(limb.end.worldQ);
    if (h.wrist) {
      const axis = new Vector3(1, 0, 0).applyQuaternion(handQ);
      handQ.premultiply(new Quaternion().setFromAxisAngle(axis, h.wrist));
    }
    this.setWorldQ(limb.end, handQ);
    // fingers
    for (const f of FINGERS) {
      for (let i = 1; i <= 3; i++) {
        const fb = this.bones.get(`${sideName(s)}Hand${f}${i}`);
        if (!fb) continue;
        const ax = this.fingerAxes.get(fb);
        if (!ax) continue;
        const relax = f === 'Thumb' ? 0.1 : 0.18;
        const ang = (relax + (1 - relax) * h.fist) * ax.weight;
        fb.bone.quaternion.copy(fb.localQ).multiply(tmpQ.setFromAxisAngle(ax.axis, ang));
      }
    }
  }

  private solveLeg(s: Side, f: ResolvedFoot) {
    const limb = this.legs[s];
    const { qUpper, qLower } = this.solveTwoBone(limb, f.ankle, f.pole, KNEE_MAX_FLEX);
    this.setWorldQ(limb.upper, qUpper.multiply(limb.upper.worldQ));
    this.setWorldQ(limb.lower, qLower.multiply(limb.lower.worldQ));
    const footQ = f.rot.clone();
    if (f.point) {
      const lateral = new Vector3(1, 0, 0).applyQuaternion(f.rot);
      footQ.premultiply(new Quaternion().setFromAxisAngle(lateral, f.point));
    }
    this.setWorldQ(limb.end, footQ.multiply(limb.end.worldQ));
    const toe = this.bones.get(`${sideName(s)}ToeBase`);
    if (toe) {
      // planted: toes stay flat while the heel lifts (counter-rotation about the ball)
      const lateral = new Vector3(1, 0, 0).applyQuaternion(f.rot);
      const flat = new Quaternion().setFromAxisAngle(lateral, -f.heel * f.toeFlat);
      const toeQ = flat.multiply(f.rot.clone()).multiply(toe.worldQ);
      if (f.point && f.toeFlat < 1) toeQ.premultiply(new Quaternion().setFromAxisAngle(lateral, f.point * 0.4));
      this.setWorldQ(toe, toeQ);
    }
  }

  /** Ground-space positions of a few bones, for tests and debugging. */
  worldOf(name: string) {
    const r = this.bones.get(name);
    return r ? this.bonePos(r) : undefined;
  }

  restOf(name: string) {
    return this.bones.get(name)?.worldPos.clone();
  }
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function yawOfQuat(q: Quaternion) {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(f.x, f.z);
}
