/**
 * Ankle angles over every motion of the library (both coaches, the four styles), for the ankle-range
 * test and its measurement document. The angles are read on the posed skeleton
 * (src/engine/joints.ts), never taken from the authored pose.
 */
import type { CoachRig } from '../engine/rig';
import { getLibrary, getMotion } from '../engine/library';
import { MotionSampler, duration } from '../engine/motion';
import { ankleAngles } from '../engine/joints';
import type { StanceStyle } from '../engine/author';

export const ANKLE_STYLES = ['boxing', 'kickboxing', 'mma', 'muaythai'] as const;

/** worst values of one motion, degrees; planted = foot flat on the floor, air = foot off the floor */
export interface AnkleWorst {
  motion: string;
  style: string;
  planted: { dorsi: number; plantar: number; inversion: number; eversion: number; rotation: number };
  air: { dorsi: number; plantar: number; inversion: number; eversion: number; rotation: number; toeExt: number; toeFlex: number };
  airFrames: number;
}

const blank = () => ({ dorsi: 0, plantar: 0, inversion: 0, eversion: 0, rotation: 0 });

export function measureAnkles(rig: CoachRig, steps = 48): AnkleWorst[] {
  const out: AnkleWorst[] = [];
  for (const style of ANKLE_STYLES) {
    const lib = getLibrary(rig, style as StanceStyle);
    for (const id of lib.keys()) {
      if (id.includes('@')) continue;
      const m = getMotion(lib, id, false)!;
      const s = new MotionSampler(rig, m);
      const w: AnkleWorst = { motion: id, style, planted: blank(), air: { ...blank(), toeExt: 0, toeFlex: 0 }, airFrames: 0 };
      for (let i = 0; i <= steps; i++) {
        const pose = s.sample((duration(m) * i) / steps);
        rig.apply(pose);
        for (const side of ['L', 'R'] as const) {
          const foot = side === 'L' ? pose.footL : pose.footR;
          const a = ankleAngles(rig, side)!;
          const planted = foot.toeFlat >= 0.99;
          const air = foot.toeFlat <= 0.01;
          if (!planted && !air) continue; // touching down or taking off: blended on purpose
          const t = planted ? w.planted : w.air;
          t.dorsi = Math.max(t.dorsi, -a.plantar);
          t.plantar = Math.max(t.plantar, a.plantar);
          t.inversion = Math.max(t.inversion, a.inversion);
          t.eversion = Math.max(t.eversion, -a.inversion);
          t.rotation = Math.max(t.rotation, Math.abs(a.external));
          if (air) {
            w.airFrames++;
            w.air.toeExt = Math.max(w.air.toeExt, a.toeExtension);
            w.air.toeFlex = Math.max(w.air.toeFlex, -a.toeExtension);
          }
        }
      }
      out.push(w);
    }
  }
  return out;
}
