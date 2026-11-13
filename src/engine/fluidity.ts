/**
 * Fluidity measures of a motion: where the body stops for no reason at a key pose, and how abruptly
 * velocities change there. Measures only (see docs/audit-biomecanique/MESURES_FLUIDITE.md).
 */
import { Vector3 } from 'three';
import { Motion, MotionSampler } from './motion';
import type { ResolvedPose } from './pose';
import type { CoachRig } from './rig';

export interface FluidityMeasure {
  id: string;
  /** interior key poses */
  keys: number;
  /** body points that stop at a key although they go on in the same direction (hands, hips, feet) */
  stops: number;
  /** largest change of velocity of a body point across one key pose, m/s */
  kinkMax: number;
  /** highest speed of a hand or a foot, m/s */
  limbPeak: number;
  /** speed of the fastest hand or foot over the 1/60 s before each impact, m/s (smoothing must not slow the blows) */
  impactSpeeds: number[];
}

const POINTS: ((p: ResolvedPose) => Vector3)[] = [(p) => p.hips, (p) => p.handL.pos, (p) => p.handR.pos, (p) => p.footL.ankle, (p) => p.footR.ankle];
const EPS = 1 / 240;

/** flow: measure with the flow through the key poses (false: the former key-to-key easing) */
export function measureFluidity(rig: CoachRig, m: Motion, flow = true): FluidityMeasure {
  const s = new MotionSampler(rig, m, flow);
  const at = (t: number) => POINTS.map((f) => f(s.sample(Math.min(s.duration, Math.max(0, t)))).clone());
  const vel = (t0: number, t1: number) => {
    const a = at(t0);
    const b = at(t1);
    return a.map((p, i) => b[i].clone().sub(p).divideScalar(t1 - t0));
  };
  let stops = 0;
  let kinkMax = 0;
  const ks = m.keys;
  for (let i = 1; i < ks.length - 1; i++) {
    const tk = ks[i].t;
    const vIn = vel(ks[i - 1].t, tk);
    const vOut = vel(tk, ks[i + 1].t);
    const before = vel(tk - EPS, tk);
    const after = vel(tk, tk + EPS);
    const here = vel(tk - EPS, tk + EPS);
    for (let j = 0; j < POINTS.length; j++) {
      kinkMax = Math.max(kinkMax, after[j].distanceTo(before[j]));
      const a = vIn[j].length();
      const b = vOut[j].length();
      if (a < 0.3 || b < 0.3 || vIn[j].dot(vOut[j]) < 0.5 * a * b) continue;
      if (here[j].length() < 0.25 * Math.min(a, b)) stops++;
    }
  }
  let limbPeak = 0;
  for (let t = 0; t + EPS <= s.duration; t += EPS) limbPeak = Math.max(limbPeak, ...vel(t, t + EPS).slice(1).map((v) => v.length()));
  const impactSpeeds = m.impacts.map((t) => Math.max(...vel(t - 1 / 60, t).slice(1).map((v) => v.length())));
  return { id: m.id, keys: Math.max(0, ks.length - 2), stops, kinkMax, limbPeak, impactSpeeds };
}
