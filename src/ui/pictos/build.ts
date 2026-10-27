import type { CoachRig } from '../../engine';
import type { Effector } from '../../engine';
import { analyseMotion } from '../../engine';
import { MotionSampler } from '../../engine';
import { getLibrary, getMotion } from '../../engine';
import type { Technique } from '../../domain/types';
import { STYLE_OF } from '../../three/CoachStage';

/**
 * v0.38 « Bibliothèque universelle de pictogrammes » (Youssef, 2026-10-22): one neutral pictogram per technique,
 * drawn from the technique's own animation, never from a coach's face, outfit or body. The skeleton is sampled at the
 * key position measured by `analyseMotion` (impact, or the largest displacement), and the joints are projected on a
 * 48 × 48 side view (the coach faces right, a little turned towards the viewer). The posture shown is therefore the
 * one the app animates: nothing is drawn by hand or invented.
 */
export const PICTO_JOINTS = [
  'Head',
  'Neck',
  'Hips',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
] as const;

export interface PictoData {
  /** [x, y] per PICTO_JOINTS entry, in the 48 × 48 box (y down) */
  p: [number, number][];
  /** depth per joint: larger = further from the viewer (drawn lighter) */
  z: number[];
  /** the limb that works (drawn in red); none for a guard, which is a position */
  e: Effector | null;
}

const SIZE = 48;
const GROUND = 44.5;
const TURN = 0.38; // a little of the coach's left side is seen, so both arms are readable

export function buildPicto(rig: CoachRig, t: Technique): PictoData | null {
  const m = getMotion(getLibrary(rig, STYLE_OF[t.disciplines[0]]), t.motion, false);
  if (!m) return null;
  const a = analyseMotion(rig, m);
  rig.apply(new MotionSampler(rig, m).sample(a.peak));
  const w = PICTO_JOINTS.map((n) => {
    const v = rig.worldOf(n);
    if (!v) throw new Error(`os ${n} absent`);
    return v;
  });
  // side view: forward (+z) to the right, up (+y) to the top, some of +x for depth
  const raw = w.map((v) => [v.z + TURN * v.x, v.y, v.x - TURN * v.z] as const);
  const xs = raw.map((r) => r[0]);
  const ys = raw.map((r) => r[1]);
  const minY = Math.min(0, ...ys);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - minY;
  // standing height ≈ 1.8 m → 40 px; wider or taller poses (kicks, falls) are scaled down to fit
  const k = Math.min(40 / 1.8, (SIZE - 6) / Math.max(spanX, 1e-3), (GROUND - 3) / Math.max(spanY, 1e-3));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  return {
    p: raw.map(([x, y]) => [r1(SIZE / 2 + (x - cx) * k), r1(GROUND - (y - minY) * k)]),
    z: raw.map((r) => r1(r[2] * 10)),
    e: t.category === 'garde' ? null : a.effector,
  };
}
