/**
 * Authoring toolkit: stances per discipline and helpers that build poses from body metrics,
 * so the same technique description fits both coaches (different heights and limb lengths).
 */
import { Quaternion, Vector3 } from 'three';
import { FootPose, HandPose, Pose, V3, deg, quatFromRot, rot, v3 } from './pose';
import type { Metrics, Side } from './rig';

export type StanceStyle = 'boxing' | 'kickboxing' | 'mma' | 'muaythai';

export interface ChestFrameFn {
  (hips: Vector3, pelvis: Quaternion, chest: Quaternion): { origin: Vector3; q: Quaternion };
}

export const clone = (p: Pose): Pose => structuredClone(p);

export class Author {
  /** scale: 1 for a 1.80 m coach */
  readonly s: number;
  readonly L: number;

  constructor(
    readonly m: Metrics,
    readonly chestFrame: ChestFrameFn,
    readonly style: StanceStyle,
  ) {
    this.s = m.height / 1.8;
    this.L = m.thigh + m.shin;
  }

  // ------------------------------------------------------------------ stances
  /** Orthodox guard (left side forward). Southpaw is obtained by mirroring. */
  guard(): Pose {
    const { s, m } = this;
    const st = STANCES[this.style];
    const hipsY = m.hipsRest.y - st.knee * s;
    const p: Pose = {
      hips: v3(st.hipsX * s, hipsY, st.hipsZ * s),
      pelvis: rot(st.pelvisYaw, st.pelvisPitch, 0),
      chest: rot(st.chestYaw, st.chestPitch, 0),
      head: rot(0, st.chin, 0),
      handL: { space: 'chest', pos: v3(0, 0, 0), pole: v3(0.35, -1, -0.1), pron: st.leadPron, fist: st.fist },
      handR: { space: 'chest', pos: v3(0, 0, 0), pole: v3(-0.35, -1, -0.15), pron: st.rearPron, fist: st.fist },
      footL: { mode: 'ground', ball: v3(st.leadFoot[0] * s, 0, st.leadFoot[1] * s), yaw: st.leadYaw, heel: st.leadHeel },
      footR: { mode: 'ground', ball: v3(st.rearFoot[0] * s, 0, st.rearFoot[1] * s), yaw: st.rearYaw, heel: st.rearHeel },
    };
    // hands are described relative to the shoulder centre, in stance (ground) axes, then stored
    // in chest space so they follow the trunk during techniques
    const sc = this.frame(p).origin;
    const at = (o: [number, number, number]) => v3(sc.x + o[0] * s, sc.y + o[1] * s, sc.z + o[2] * s);
    p.handL.pos = this.toChest(p, at(st.leadHand));
    p.handR.pos = this.toChest(p, at(st.rearHand));
    p.handL.pole = this.dirToChest(p, v3(0.45, -1, -0.15));
    p.handR.pole = this.dirToChest(p, v3(-0.45, -1, -0.2));
    return p;
  }

  dirToChest(p: Pose, d: V3): V3 {
    const r = new Vector3(d.x, d.y, d.z).applyQuaternion(this.frame(p).q.clone().invert());
    return v3(r.x, r.y, r.z);
  }

  // ------------------------------------------------------------------ geometry helpers
  frame(p: Pose) {
    return this.chestFrame(
      new Vector3(p.hips.x, p.hips.y, p.hips.z),
      quatFromRot(p.pelvis),
      quatFromRot(p.chest),
    );
  }

  shoulder(p: Pose, side: Side) {
    const f = this.frame(p);
    const x = side === 'L' ? this.m.shoulderHalf : -this.m.shoulderHalf;
    return new Vector3(x, 0, 0).applyQuaternion(f.q).add(f.origin);
  }

  /** world point along shoulder->target at a fraction of the arm length (straight punches) */
  reach(p: Pose, side: Side, target: V3, ext = 0.97): V3 {
    const sh = this.shoulder(p, side);
    const d = new Vector3(target.x, target.y, target.z).sub(sh).normalize();
    const r = sh.addScaledVector(d, (this.m.upperArm + this.m.foreArm) * ext);
    return v3(r.x, r.y, r.z);
  }

  /** chest-space position -> ground space, for a given pose */
  toWorld(p: Pose, local: V3): V3 {
    const f = this.frame(p);
    const r = new Vector3(local.x, local.y, local.z).applyQuaternion(f.q).add(f.origin);
    return v3(r.x, r.y, r.z);
  }

  /** ground-space position -> chest space, for a given pose */
  toChest(p: Pose, world: V3): V3 {
    const f = this.frame(p);
    const r = new Vector3(world.x, world.y, world.z).sub(f.origin).applyQuaternion(f.q.clone().invert());
    return v3(r.x, r.y, r.z);
  }

  /**
   * Target points on an imaginary opponent of the same size, also in stance, centred on x = 0.
   * Heights are taken from the guard so they follow the crouch of each discipline.
   */
  target(kind: 'chin' | 'body' | 'liver' | 'thigh' | 'head' | 'chest', dist = 0.62) {
    const { s } = this;
    const g = this.guardCache ?? (this.guardCache = this.guard());
    const sc = this.frame(g).origin.y;
    const y = {
      head: sc + 0.17 * s,
      chin: sc + 0.08 * s,
      chest: sc - 0.1 * s,
      body: sc - 0.24 * s,
      liver: sc - 0.3 * s,
      thigh: g.hips.y - 0.28 * s,
    }[kind];
    return v3(0, y, dist * s);
  }

  private guardCache?: Pose;

  ground(ball: V3, yaw: number, heel = 0): FootPose {
    return { mode: 'ground', ball, yaw, heel };
  }

  /** Air foot whose ankle is placed so that the leg is extended toward a point (kicks). */
  airFoot(hipJoint: Vector3, toward: V3, ext: number, yaw: number, pitch: number, roll: number, pole: V3, point = 0): FootPose {
    const d = new Vector3(toward.x, toward.y, toward.z).sub(hipJoint).normalize();
    const a = hipJoint.clone().addScaledVector(d, this.L * ext);
    return { mode: 'air', ankle: v3(a.x, a.y, a.z), yaw, pitch, roll, pole, point };
  }

  air(ankle: V3, yaw: number, pitch: number, roll: number, pole: V3, point = 0): FootPose {
    return { mode: 'air', ankle, yaw, pitch, roll, pole, point };
  }

  hipJoint(p: Pose, side: Side) {
    const x = side === 'L' ? this.m.hipHalf : -this.m.hipHalf;
    return new Vector3(x, -0.04 * this.s, 0).applyQuaternion(quatFromRot(p.pelvis)).add(new Vector3(p.hips.x, p.hips.y, p.hips.z));
  }

  hand(space: 'chest' | 'world', pos: V3, pole: V3, pron: number, fist = 1, wrist = 0): HandPose {
    return { space, pos, pole, pron, fist, wrist };
  }
}

/** Mutating helper used when writing techniques: copy a pose then edit it. */
export function edit(p: Pose, f: (d: Pose) => void): Pose {
  const d = clone(p);
  f(d);
  return d;
}

export const add = (a: V3, b: Partial<V3>): V3 => ({ x: a.x + (b.x ?? 0), y: a.y + (b.y ?? 0), z: a.z + (b.z ?? 0) });

interface StanceDef {
  knee: number;
  hipsX: number;
  hipsZ: number;
  pelvisYaw: number;
  pelvisPitch: number;
  chestYaw: number;
  chestPitch: number;
  chin: number;
  leadHand: [number, number, number];
  rearHand: [number, number, number];
  leadPron: number;
  rearPron: number;
  fist: number;
  leadFoot: [number, number];
  rearFoot: [number, number];
  leadYaw: number;
  rearYaw: number;
  leadHeel: number;
  rearHeel: number;
}

/**
 * Discipline stances (orthodox). Boxing: bladed, rear heel up, chin tucked.
 * Kick-boxing: a little squarer to free the legs. MMA: lower, wider, hands forward and open to
 * fight off takedowns. Muay-thai: tall and square, weight on the rear leg, lead heel light,
 * long guard.
 */
export const STANCES: Record<StanceStyle, StanceDef> = {
  boxing: {
    knee: 0.07, hipsX: -0.035, hipsZ: -0.02, pelvisYaw: deg(-38), pelvisPitch: deg(6), chestYaw: deg(-6), chestPitch: deg(10),
    chin: deg(4), leadHand: [0.08, 0.05, 0.31], rearHand: [-0.07, 0.07, 0.17], leadPron: 0.3, rearPron: 0.15, fist: 1,
    leadFoot: [0.12, 0.25], rearFoot: [-0.2, -0.24], leadYaw: deg(-18), rearYaw: deg(-48), leadHeel: 0, rearHeel: deg(22),
  },
  kickboxing: {
    knee: 0.06, hipsX: -0.03, hipsZ: -0.02, pelvisYaw: deg(-30), pelvisPitch: deg(5), chestYaw: deg(-6), chestPitch: deg(8),
    chin: deg(4), leadHand: [0.08, 0.05, 0.3], rearHand: [-0.07, 0.07, 0.18], leadPron: 0.25, rearPron: 0.1, fist: 1,
    leadFoot: [0.13, 0.24], rearFoot: [-0.2, -0.23], leadYaw: deg(-12), rearYaw: deg(-42), leadHeel: 0, rearHeel: deg(18),
  },
  mma: {
    knee: 0.12, hipsX: -0.03, hipsZ: -0.03, pelvisYaw: deg(-26), pelvisPitch: deg(14), chestYaw: deg(-4), chestPitch: deg(12),
    chin: deg(3), leadHand: [0.09, 0.0, 0.38], rearHand: [-0.07, 0.04, 0.24], leadPron: 0.1, rearPron: 0.05, fist: 0.75,
    leadFoot: [0.15, 0.25], rearFoot: [-0.22, -0.24], leadYaw: deg(-10), rearYaw: deg(-38), leadHeel: 0, rearHeel: deg(16),
  },
  muaythai: {
    knee: 0.035, hipsX: -0.02, hipsZ: -0.07, pelvisYaw: deg(-16), pelvisPitch: deg(-2), chestYaw: deg(-4), chestPitch: deg(2),
    chin: deg(5), leadHand: [0.1, 0.1, 0.33], rearHand: [-0.09, 0.1, 0.26], leadPron: -0.1, rearPron: -0.1, fist: 1,
    leadFoot: [0.13, 0.2], rearFoot: [-0.17, -0.22], leadYaw: deg(-6), rearYaw: deg(-30), leadHeel: deg(12), rearHeel: deg(8),
  },
};
