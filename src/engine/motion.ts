/**
 * Keyframed motions built on the pose model, and their sampling.
 */
import { Quaternion, Vector3 } from 'three';
import { Pose, ResolvedFoot, ResolvedHand, ResolvedPose, blendJoint, mirrorPose, quatFromRot, toVec } from './pose';
import type { CoachRig } from './rig';

export type Ease = 'linear' | 'inOut' | 'out' | 'in' | 'snap' | 'strike' | 'load';
export type BodyState = 'stand' | 'ground';

export interface Key {
  /** seconds from the start of the motion, at speed 1 */
  t: number;
  pose: Pose;
  /** easing of the segment that ENDS at this key */
  ease?: Ease;
  /** the body stops at this key instead of flowing through it (see MotionSampler) */
  hold?: boolean;
}

export interface Motion {
  id: string;
  keys: Key[];
  /** seconds at which the next motion may start blending in (defaults to the last key) */
  chainAt?: number;
  /** times of contact with the imaginary target, for sounds and counting */
  impacts: number[];
  /** change of stance origin at the end of the motion (steps, pivots) */
  travel?: { x: number; z: number; yaw: number };
  startState: BodyState;
  endState: BodyState;
  /** held on one foot (kicks, knees, checks): key poses are balanced over the supporting foot (see balance.ts) */
  balance?: boolean;
}

export const duration = (m: Motion) => m.keys[m.keys.length - 1].t;
export const chainPoint = (m: Motion) => m.chainAt ?? duration(m);

/**
 * Phase of a motion at time t, for highlighting the key point that applies: preparation up to about
 * half-way to the first impact (or to mid-motion without impact), execution up to shortly after
 * it, then return to guard.
 */
export function motionPhase(m: Motion, t: number): 'preparation' | 'execution' | 'retour' {
  const d = duration(m);
  const peak = m.impacts[0] ?? d * 0.5;
  return t < peak * 0.5 ? 'preparation' : t <= peak + (d - peak) * 0.2 ? 'execution' : 'retour';
}

export function ease(e: Ease | undefined, u: number) {
  switch (e) {
    case 'linear':
      return u;
    case 'out':
      return 1 - (1 - u) * (1 - u) * (1 - u);
    case 'in':
      return u * u * u;
    case 'snap': // explosive start, soft arrival
      return 1 - Math.pow(1 - u, 4);
    case 'load': // loading before a blow: gentle, half the peak speed of 'inOut'
      return (1 - Math.cos(Math.PI * u)) / 2;
    case 'strike': // a blow: starts from rest, speeds up, peaks at 2/3 and still travels when it lands
      return u * u * (2 - u);
    default:
      return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }
}

export function mirrorMotion(m: Motion): Motion {
  return {
    ...m,
    keys: m.keys.map((k) => ({ ...k, pose: mirrorPose(k.pose) })),
    travel: m.travel ? { x: -m.travel.x, z: m.travel.z, yaw: -m.travel.yaw } : undefined,
  };
}

/** slope of an ease at the start and at the end of its segment: 0 when the motion is at rest there */
function easeSlopes(e: Ease | undefined): [number, number] {
  switch (e) {
    case 'linear':
      return [1, 1];
    case 'out':
      return [3, 0];
    case 'in':
      return [0, 3];
    case 'snap':
      return [4, 0];
    case 'strike':
      return [0, 1];
    default: // 'inOut', 'load'
      return [0, 0];
  }
}

/**
 * Velocities kept through a key pose (per second), so that a body part that goes on in the same
 * direction does not stop at every key like a robot. Zero where the key is a turning point.
 */
interface KeyFlow {
  hips: Vector3;
  pelvis: Vector3;
  chest: Vector3;
  head: Vector3;
  handL: Vector3;
  handR: Vector3;
  footL: Vector3;
  footR: Vector3;
  /** planted foot pivoting on its ball: (yaw, heel lift, 0) per second, and the ball's own velocity */
  pivotL: Vector3;
  pivotR: Vector3;
  ballL: Vector3;
  ballR: Vector3;
}

interface CachedKey {
  t: number;
  ease?: Ease;
  hold?: boolean;
  pose: Pose;
  hips: Vector3;
  pelvis: Quaternion;
  chest: Quaternion;
  footL: ResolvedFoot;
  footR: ResolvedFoot;
  flow?: KeyFlow;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/**
 * Monotone cubic tangent at a key (Fritsch and Butland): zero when the key is a turning point,
 * otherwise a weighted harmonic mean of the neighbouring slopes, never steeper than the gentler one,
 * so the curve never overshoots a key pose.
 */
function monotone(p0: number, p1: number, p2: number, h0: number, h1: number) {
  const d0 = (p1 - p0) / h0;
  const d1 = (p2 - p1) / h1;
  if (d0 * d1 <= 0) return 0;
  const m = (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  const lim = Math.min(Math.abs(d0), Math.abs(d1));
  return Math.max(-lim, Math.min(lim, m));
}

const monoVec = (a: Vector3, b: Vector3, c: Vector3, h0: number, h1: number) => new Vector3(monotone(a.x, b.x, c.x, h0, h1), monotone(a.y, b.y, c.y, h0, h1), monotone(a.z, b.z, c.z, h0, h1));

/** rotation from q0 to q1 as a rotation vector (axis times angle), in ground space */
function rotationVector(q0: Quaternion, q1: Quaternion) {
  const d = q1.clone().multiply(q0.clone().invert());
  if (d.w < 0) d.set(-d.x, -d.y, -d.z, -d.w);
  const s = Math.sqrt(1 - Math.min(1, d.w * d.w));
  const angle = 2 * Math.acos(Math.min(1, d.w));
  return s < 1e-6 ? new Vector3() : new Vector3(d.x, d.y, d.z).multiplyScalar(angle / s);
}

const ZERO = new Vector3();
const _q = new Quaternion();
const _v = new Vector3();

/** adds the flow of both ends of a segment to a value (cubic Hermite terms, zero at the keys) */
function flowOffset(fa: Vector3 | undefined, fb: Vector3 | undefined, h: number, s: number, out: Vector3) {
  const h10 = s * (1 - s) * (1 - s);
  const h11 = s * s * (s - 1);
  out.set(0, 0, 0);
  if (fa) out.addScaledVector(fa, h * h10);
  if (fb) out.addScaledVector(fb, h * h11);
  return out;
}

/** Samples a motion for one rig. Feet and trunk rotations are resolved once per key. */
export class MotionSampler {
  private keys: CachedKey[];
  private hipOffset: Record<'L' | 'R', Vector3>;
  readonly duration: number;

  /**
   * flow: keep velocities through the key poses (off only to measure the difference);
   * chain: body parts in sequence instead of all at once (off only to measure the difference)
   */
  constructor(
    private rig: CoachRig,
    readonly motion: Motion,
    flow = true,
    private chain = true,
  ) {
    this.keys = motion.keys.map((k) => ({
      t: k.t,
      ease: k.ease,
      hold: k.hold,
      pose: k.pose,
      hips: toVec(k.pose.hips),
      pelvis: quatFromRot(k.pose.pelvis),
      chest: quatFromRot(k.pose.chest),
      footL: rig.resolveFoot(k.pose.footL, 'L'),
      footR: rig.resolveFoot(k.pose.footR, 'R'),
    }));
    this.duration = duration(motion);
    const hipsRest = rig.metrics.hipsRest;
    this.hipOffset = {
      L: (rig.restOf('LeftUpLeg') ?? hipsRest).clone().sub(hipsRest),
      R: (rig.restOf('RightUpLeg') ?? hipsRest).clone().sub(hipsRest),
    };
    if (flow) this.computeFlow();
    this.findAirborne();
  }

  /**
   * Velocities through the inner keys where both eases come to rest (the segment before arrives
   * with a zero slope, the one after leaves with a zero slope): the eases still shape the segments,
   * the flow only removes the stop at the key. Keys that end a blow or start an explosive move keep
   * their own timing, and so do keys marked `hold`.
   */
  private computeFlow() {
    const ks = this.keys;
    const res = ks.map((k) => this.at(k, k, 0));
    const head = (p: Pose) => new Vector3(p.head.yaw, p.head.pitch, p.head.roll);
    for (let i = 1; i < ks.length - 1; i++) {
      const [a, k, b] = [ks[i - 1], ks[i], ks[i + 1]];
      const h0 = k.t - a.t;
      const h1 = b.t - k.t;
      if (k.hold || h0 < 1e-3 || h1 < 1e-3 || easeSlopes(k.ease)[1] !== 0 || easeSlopes(b.ease)[0] !== 0) continue;
      const [ra, rk, rb] = [res[i - 1], res[i], res[i + 1]];
      const rot = (q0: Quaternion, q1: Quaternion, q2: Quaternion) => monoVec(new Vector3(), rotationVector(q0, q1), rotationVector(q0, q1).add(rotationVector(q1, q2)), h0, h1);
      // hands in the chest frame: the trunk already carries its own flow to them
      const local = (r: ResolvedPose, side: 'handL' | 'handR') => {
        const f = this.rig.chestFrame(r.hips, r.pelvis, r.chest);
        return r[side].pos.clone().sub(f.origin).applyQuaternion(f.q.clone().invert());
      };
      const hand = (side: 'handL' | 'handR') => (k.pose[side].space === 'world' ? ZERO.clone() : monoVec(local(ra, side), local(rk, side), local(rb, side), h0, h1));
      // a foot keeps its flow only in the air, away from a take-off or a landing: near the floor the
      // flow would make the toes graze the mat
      const foot = (side: 'footL' | 'footR') => ([a, k, b].some((x) => x.pose[side].mode === 'ground') ? ZERO.clone() : monoVec(ra[side].ankle, rk[side].ankle, rb[side].ankle, h0, h1));
      // a foot planted on all three keys keeps turning on its ball (and lifting its heel) through the
      // key instead of stopping there
      const planted = (side: 'footL' | 'footR') => [a, k, b].every((x) => x.pose[side].mode === 'ground');
      const pv = (x: CachedKey, side: 'footL' | 'footR') => {
        const f = x.pose[side] as Extract<Pose['footL'], { mode: 'ground' }>;
        return new Vector3(f.yaw, f.heel, 0);
      };
      const ball = (x: CachedKey, side: 'footL' | 'footR') => toVec((x.pose[side] as Extract<Pose['footL'], { mode: 'ground' }>).ball);
      const pivot = (side: 'footL' | 'footR') => (planted(side) ? monoVec(pv(a, side), pv(k, side), pv(b, side), h0, h1) : ZERO.clone());
      const ballFlow = (side: 'footL' | 'footR') => (planted(side) ? monoVec(ball(a, side), ball(k, side), ball(b, side), h0, h1) : ZERO.clone());
      k.flow = {
        pivotL: pivot('footL'),
        pivotR: pivot('footR'),
        ballL: ballFlow('footL'),
        ballR: ballFlow('footR'),
        hips: monoVec(a.hips, k.hips, b.hips, h0, h1),
        pelvis: rot(a.pelvis, k.pelvis, b.pelvis),
        chest: rot(a.chest, k.chest, b.chest),
        head: monoVec(head(a.pose), head(k.pose), head(b.pose), h0, h1),
        handL: hand('handL'),
        handR: hand('handR'),
        footL: foot('footL'),
        footR: foot('footR'),
      };
    }
  }

  /**
   * Pose at time t. The body moves as a chain, not as a block (v0.29, Youssef 2026-10-21: « il y a rien
   * de naturel »): the feet and the pelvis are a little ahead of the written timing, the trunk and the arms
   * keep it exactly (same path, impacts stay on time) and the head follows a little behind. So a blow
   * starts in the hips and the trunk follows them (they no longer turn as a block), and the head settles
   * last. The shift fades in and out at both ends of the motion, so chained motions still meet at the
   * same pose.
   */
  sample(t: number): ResolvedPose {
    if (!this.chain) return this.atTime(t);
    const w = this.chainWeight(t);
    if (w <= 0) return this.atTime(t);
    // the hips reach the pose of a blow at the latest when it lands, and leave it only after
    const lead = this.motion.impacts.reduce((l, ti) => Math.min(l, Math.abs(t - ti)), CHAIN_LEGS * w);
    const legs = this.atTime(t + lead);
    const body = this.atTime(t);
    const head = this.atTime(t - CHAIN_HEAD * w).head;
    // the pelvis turns ahead, by a few degrees at most so that the spine stays in its range; the hips
    // stay where they are written (the shoulders and the arms keep their path)
    const turn = 2 * Math.acos(Math.min(1, Math.abs(body.pelvis.dot(legs.pelvis))));
    let feet = legs;
    let pelvis = legs.pelvis;
    if (turn > CHAIN_MAX_TURN) {
      // a big fast turn (a judo entry): a shorter lead, the feet with it so the hips stay in their range
      feet = this.atTime(t + (lead * CHAIN_MAX_TURN) / turn);
      pelvis = feet.pelvis;
    }
    const hips = body.hips.clone();
    hips.y -= this.supportDrop(hips, pelvis, feet.footL, feet.footR);
    // the chest is written relative to the pelvis: keep it where the written pose puts it in space, the
    // spine takes the difference (the hips turn first, the shoulders follow)
    const chest = pelvis.clone().invert().multiply(body.pelvis).multiply(body.chest);
    return { ...body, hips, pelvis, chest, head, footL: feet.footL, footR: feet.footR };
  }

  /**
   * How much of the chain shift applies at time t: full while both feet are on the floor, fading to
   * none near the start and the end of the motion and around any moment with a foot in the air (the
   * kicking leg hangs from the pelvis and keeps its written timing) or with the body on the ground.
   */
  private chainWeight(t: number) {
    if (this.motion.balance || this.motion.startState === 'ground' || this.motion.endState === 'ground') return 0;
    let d = Math.min(t, this.duration - t);
    for (const [a, b] of this.airborne) d = Math.min(d, t < a ? a - t : t > b ? t - b : 0);
    return smooth(d / CHAIN_FADE);
  }

  /** time spans with a foot off the floor (see chainWeight) */
  private airborne: [number, number][] = [];

  private findAirborne() {
    const ks = this.keys;
    for (let i = 1; i < ks.length; i++) {
      const up = (['footL', 'footR'] as const).some((f) => ks[i - 1].pose[f].mode !== 'ground' || ks[i].pose[f].mode !== 'ground');
      if (up) this.airborne.push([ks[i - 1].t - CHAIN_LEGS, ks[i].t]);
    }
  }

  /** the written pose at time t */
  private atTime(t: number): ResolvedPose {
    const ks = this.keys;
    if (t <= ks[0].t) return this.at(ks[0], ks[0], 0);
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i].t) {
        const a = ks[i - 1];
        const b = ks[i];
        const s = (t - a.t) / Math.max(1e-6, b.t - a.t);
        return this.at(a, b, ease(b.ease, s), s);
      }
    }
    const last = ks[ks.length - 1];
    return this.at(last, last, 0);
  }

  /** u: eased progress of the segment a→b; s: raw progress, for the flow through the keys */
  private at(a: CachedKey, b: CachedKey, u: number, s = 0): ResolvedPose {
    const h = b.t - a.t;
    const flowing = s > 0 && s < 1 && (a.flow || b.flow);
    const off = (key: keyof KeyFlow) => (flowing ? flowOffset(a.flow?.[key], b.flow?.[key], h, s, _v) : _v.set(0, 0, 0));
    const hips = a.hips.clone().lerp(b.hips, u).add(off('hips'));
    const pelvis = a.pelvis.clone().slerp(b.pelvis, u);
    const chest = a.chest.clone().slerp(b.chest, u);
    if (flowing) {
      for (const [q, key] of [
        [pelvis, 'pelvis'],
        [chest, 'chest'],
      ] as const) {
        const r = off(key);
        const angle = r.length();
        if (angle > 1e-9) q.premultiply(_q.setFromAxisAngle(r.divideScalar(angle), angle));
      }
    }
    const foot = (side: 'footL' | 'footR'): ResolvedFoot => {
      if (u === 0) return a[side];
      const pa = a.pose[side];
      const pb = b.pose[side];
      if (pa.mode === 'ground' && pb.mode === 'ground') {
        // planted foot: interpolate ball position, rotation and heel lift, then resolve, so the ball
        // stays exactly in place while the foot pivots (a linear blend of ankle positions would slide)
        // knee direction: blended from both keys as resolved (a key without one has the default, knee
        // over the toes), so a knee written on one key only turns smoothly instead of jumping there
        const pr = pa.pole || pb.pole ? a[side].pole.clone().lerp(b[side].pole, u) : null;
        const pole = pr ? { x: pr.x, y: pr.y, z: pr.z } : undefined;
        const pv = off(side === 'footL' ? 'pivotL' : 'pivotR').clone();
        const bv = off(side === 'footL' ? 'ballL' : 'ballR');
        return this.rig.resolveFoot(
          {
            mode: 'ground',
            ball: { x: lerp(pa.ball.x, pb.ball.x, u) + bv.x, y: lerp(pa.ball.y, pb.ball.y, u) + bv.y, z: lerp(pa.ball.z, pb.ball.z, u) + bv.z },
            yaw: lerp(pa.yaw, pb.yaw, u) + pv.x,
            heel: Math.max(0, lerp(pa.heel, pb.heel, u) + pv.y),
            pole,
          },
          side === 'footL' ? 'L' : 'R',
        );
      }
      const fa = a[side];
      const fb = b[side];
      return {
        ankle: fa.ankle.clone().lerp(fb.ankle, u).add(off(side)),
        rot: fa.rot.clone().slerp(fb.rot, u),
        toeFlat: lerp(fa.toeFlat, fb.toeFlat, u),
        heel: lerp(fa.heel, fb.heel, u),
        pole: fa.pole.clone().lerp(fb.pole, u).normalize(),
        point: lerp(fa.point, fb.point, u),
        joint: blendJoint(fa.joint, fb.joint, u),
        jointW: lerp(fa.jointW, fb.jointW, u),
      };
    };
    const footL = foot('footL');
    const footR = foot('footR');
    hips.y -= this.supportDrop(hips, pelvis, footL, footR);
    const frame = this.rig.chestFrame(hips, pelvis, chest);
    const hand = (side: 'handL' | 'handR'): ResolvedHand => {
      const ha = this.rig.resolveHand(a.pose[side], frame);
      if (u === 0) return ha;
      const hb = this.rig.resolveHand(b.pose[side], frame);
      return {
        pos: ha.pos.lerp(hb.pos, u).add(off(side).applyQuaternion(frame.q)),
        pole: ha.pole.lerp(hb.pole, u).normalize(),
        pron: lerp(ha.pron, hb.pron, u),
        fist: lerp(ha.fist, hb.fist, u),
        wrist: lerp(ha.wrist, hb.wrist, u),
      };
    };
    const hd = off('head');
    return {
      hips,
      pelvis,
      chest,
      head: {
        yaw: lerp(a.pose.head.yaw, b.pose.head.yaw, u) + hd.x,
        pitch: lerp(a.pose.head.pitch, b.pose.head.pitch, u) + hd.y,
        roll: lerp(a.pose.head.roll, b.pose.head.roll, u) + hd.z,
      },
      handL: hand('handL'),
      handR: hand('handR'),
      footL,
      footR,
    };
  }

  /**
   * How much the hips must come down so that every planted foot stays reachable with a slightly bent
   * knee (a locked or over-stretched support leg would lift the foot off the floor).
   */
  private supportDrop(hips: Vector3, pelvis: Quaternion, footL: ResolvedFoot, footR: ResolvedFoot) {
    const m = this.rig.metrics;
    const R = (m.thigh + m.shin) * MAX_SUPPORT_EXTENSION;
    let drop = 0;
    for (const [f, side] of [
      [footL, 'L'],
      [footR, 'R'],
    ] as const) {
      if (f.toeFlat < 0.99) continue;
      const hj = this.hipOffset[side].clone().applyQuaternion(pelvis).add(hips);
      const dx = hj.x - f.ankle.x;
      const dz = hj.z - f.ankle.z;
      const h2 = R * R - dx * dx - dz * dz;
      if (h2 <= 0) continue;
      const need = hj.y - f.ankle.y - Math.sqrt(h2);
      if (need > drop) drop = need;
    }
    return drop;
  }
}

/** seconds the legs and hips are ahead of the trunk and the arms, and the head behind */
const CHAIN_LEGS = 0.05;
const CHAIN_HEAD = 0.035;
/** largest angle the pelvis turns ahead of the shoulders (radians) */
const CHAIN_MAX_TURN = (10 * Math.PI) / 180;
/** seconds over which the shift grows at the start of a motion and fades at its end */
const CHAIN_FADE = 0.15;
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** fraction of the full leg length a planted leg may reach */
const MAX_SUPPORT_EXTENSION = 0.975;
