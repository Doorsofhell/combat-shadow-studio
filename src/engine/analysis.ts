/**
 * Analysis of a motion for the "Décomposer" mode and the technique phases: key positions, end of the preparation,
 * working limb, pivots and hip turn. Shared by study.ts and phases.ts (kept apart so that they do not import each
 * other: 2.10.2).
 */
import { Quaternion, Vector3 } from 'three';
import { Motion, MotionSampler, duration } from './motion';
import type { ResolvedPose } from './pose';
import type { CoachRig } from './rig';

export type Effector = 'handL' | 'handR' | 'footL' | 'footR';

export interface StudyAnalysis {
  /** motion times (speed 1) of the key positions */
  keys: number[];
  /** end of the preparation */
  prep: number;
  /** key position: impact, or the moment of largest displacement */
  peak: number;
  /** limb that does the work */
  effector: Effector;
  /** feet that stay on the floor and turn more than 10° between start and key position */
  pivots: { side: 'L' | 'R'; from: number; to: number }[];
  /** pelvis rotation between start and key position, radians */
  hipTurn: number;
}

const effPos = (p: ResolvedPose, e: Effector) => (e === 'handL' ? p.handL.pos : e === 'handR' ? p.handR.pos : e === 'footL' ? p.footL.ankle : p.footR.ankle);
const yawOf = (q: Quaternion) => {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(f.x, f.z);
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function analyseMotion(rig: CoachRig, m: Motion): StudyAnalysis {
  const s = new MotionSampler(rig, m);
  const dur = duration(m);
  const start = s.sample(0);
  const keys = m.keys.map((k) => k.t);
  // limb that moves the most
  let effector: Effector = 'handL';
  let best = -1;
  let peakByMotion = dur / 2;
  for (const e of ['handL', 'handR', 'footL', 'footR'] as Effector[]) {
    for (let i = 1; i <= 24; i++) {
      const t = (dur * i) / 24;
      const d = effPos(s.sample(t), e).distanceTo(effPos(start, e));
      if (d > best) {
        best = d;
        effector = e;
        peakByMotion = t;
      }
    }
  }
  const peak = m.impacts.length ? m.impacts[0] : (keys.reduce((a, k) => (Math.abs(k - peakByMotion) < Math.abs(a - peakByMotion) ? k : a), keys[0]) || peakByMotion);
  const before = keys.filter((k) => k > 0.02 && k < peak - 0.02);
  const prep = before.length ? before[before.length - 1] : peak * 0.45;
  const atPeak = s.sample(peak);
  const pivots: StudyAnalysis['pivots'] = [];
  for (const side of ['L', 'R'] as const) {
    const a = side === 'L' ? start.footL : start.footR;
    const b = side === 'L' ? atPeak.footL : atPeak.footR;
    const planted = a.ankle.y < 0.2 && b.ankle.y < 0.2;
    const from = yawOf(a.rot);
    const to = yawOf(b.rot);
    if (planted && Math.abs(wrap(to - from)) > (10 * Math.PI) / 180) pivots.push({ side, from, to });
  }
  return { keys, prep, peak, effector, pivots, hipTurn: wrap(yawOf(atPeak.pelvis) - yawOf(start.pelvis)) };
}
