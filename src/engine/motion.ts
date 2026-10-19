/**
 * Keyframed motions built on the pose model, and their sampling.
 */
import { Quaternion, Vector3 } from 'three';
import { Pose, ResolvedFoot, ResolvedHand, ResolvedPose, mirrorPose, quatFromRot, toVec } from './pose';
import type { CoachRig } from './rig';

export type Ease = 'linear' | 'inOut' | 'out' | 'in' | 'snap' | 'strike' | 'load';
export type BodyState = 'stand' | 'ground';

export interface Key {
  /** seconds from the start of the motion, at speed 1 */
  t: number;
  pose: Pose;
  /** easing of the segment that ENDS at this key */
  ease?: Ease;
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

interface CachedKey {
  t: number;
  ease?: Ease;
  pose: Pose;
  hips: Vector3;
  pelvis: Quaternion;
  chest: Quaternion;
  footL: ResolvedFoot;
  footR: ResolvedFoot;
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** Samples a motion for one rig. Feet and trunk rotations are resolved once per key. */
export class MotionSampler {
  private keys: CachedKey[];
  private hipOffset: Record<'L' | 'R', Vector3>;
  readonly duration: number;

  constructor(private rig: CoachRig, readonly motion: Motion) {
    this.keys = motion.keys.map((k) => ({
      t: k.t,
      ease: k.ease,
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
  }

  sample(t: number): ResolvedPose {
    const ks = this.keys;
    if (t <= ks[0].t) return this.at(ks[0], ks[0], 0);
    for (let i = 1; i < ks.length; i++) {
      if (t <= ks[i].t) {
        const a = ks[i - 1];
        const b = ks[i];
        const u = ease(b.ease, (t - a.t) / Math.max(1e-6, b.t - a.t));
        return this.at(a, b, u);
      }
    }
    const last = ks[ks.length - 1];
    return this.at(last, last, 0);
  }

  private at(a: CachedKey, b: CachedKey, u: number): ResolvedPose {
    const hips = a.hips.clone().lerp(b.hips, u);
    const pelvis = a.pelvis.clone().slerp(b.pelvis, u);
    const chest = a.chest.clone().slerp(b.chest, u);
    const foot = (side: 'footL' | 'footR'): ResolvedFoot => {
      if (u === 0) return a[side];
      const pa = a.pose[side];
      const pb = b.pose[side];
      if (pa.mode === 'ground' && pb.mode === 'ground') {
        // planted foot: interpolate ball position, rotation and heel lift, then resolve, so the ball
        // stays exactly in place while the foot pivots (a linear blend of ankle positions would slide)
        const pole = pa.pole && pb.pole ? { x: lerp(pa.pole.x, pb.pole.x, u), y: lerp(pa.pole.y, pb.pole.y, u), z: lerp(pa.pole.z, pb.pole.z, u) } : undefined;
        return this.rig.resolveFoot(
          {
            mode: 'ground',
            ball: { x: lerp(pa.ball.x, pb.ball.x, u), y: lerp(pa.ball.y, pb.ball.y, u), z: lerp(pa.ball.z, pb.ball.z, u) },
            yaw: lerp(pa.yaw, pb.yaw, u),
            heel: lerp(pa.heel, pb.heel, u),
            pole,
          },
          side === 'footL' ? 'L' : 'R',
        );
      }
      const fa = a[side];
      const fb = b[side];
      return {
        ankle: fa.ankle.clone().lerp(fb.ankle, u),
        rot: fa.rot.clone().slerp(fb.rot, u),
        toeFlat: lerp(fa.toeFlat, fb.toeFlat, u),
        heel: lerp(fa.heel, fb.heel, u),
        pole: fa.pole.clone().lerp(fb.pole, u).normalize(),
        point: lerp(fa.point, fb.point, u),
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
        pos: ha.pos.lerp(hb.pos, u),
        pole: ha.pole.lerp(hb.pole, u).normalize(),
        pron: lerp(ha.pron, hb.pron, u),
        fist: lerp(ha.fist, hb.fist, u),
        wrist: lerp(ha.wrist, hb.wrist, u),
      };
    };
    return {
      hips,
      pelvis,
      chest,
      head: {
        yaw: lerp(a.pose.head.yaw, b.pose.head.yaw, u),
        pitch: lerp(a.pose.head.pitch, b.pose.head.pitch, u),
        roll: lerp(a.pose.head.roll, b.pose.head.roll, u),
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

/** fraction of the full leg length a planted leg may reach */
const MAX_SUPPORT_EXTENSION = 0.975;
