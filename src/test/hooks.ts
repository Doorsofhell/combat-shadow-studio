/**
 * v0.42 (Youssef, 2026-10-23, « Correction biomécanique des crochets 3D »): measures of the striking arm and of
 * the body during a hook, read on the posed skeleton (never on the authored pose), frame by frame. Used by the
 * hook test and by the before/after report (docs/v042-crochets/).
 *
 * Ground space: +Y up, +Z the coach's front, +X the coach's left. The chest frame is the rest axes turned by
 * the rotation of Spine2 since rest.
 */
import { Quaternion, Vector3 } from 'three';
import type { CoachRig, Side } from '../engine/rig';
import { MotionSampler, duration, type Motion } from '../engine/motion';
import { measureTorsions } from './torsions';

const D = 180 / Math.PI;
const sn = (s: Side) => (s === 'L' ? 'Left' : 'Right');

export interface HookFrame {
  t: number;
  /** striking arm (anatomical, see torsions.ts) */
  elbowFlex: number;
  pronation: number;
  shoulderRot: number;
  shoulderElev: number;
  wristFlex: number;
  wristDev: number;
  handTwist: number;
  /** elbow relative to the shoulder in the chest frame, metres: up (+), out to the side of the arm (+), forward (+) */
  elbowUp: number;
  elbowOut: number;
  elbowFwd: number;
  /** fist (middle knuckle) in ground space */
  fist: [number, number, number];
  /** unit normal of the arm's bend plane (shoulder, elbow, wrist), ground space */
  plane: [number, number, number];
  /** trunk axial rotation (pelvis → chest) and pelvis yaw in ground space, degrees */
  trunk: number;
  pelvisYaw: number;
  chestYaw: number;
  headYaw: number;
  /** balls of the feet (ToeBase) in ground space */
  ballL: [number, number, number];
  ballR: [number, number, number];
  /** guard hand (other side) relative to the chin, metres */
  guardGap: number;
}

const yawOf = (q: Quaternion) => {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(f.x, f.z) * D;
};

export function sampleHook(rig: CoachRig, m: Motion, side: Side, fps = 120): HookFrame[] {
  const s = new MotionSampler(rig, m);
  const dur = duration(m);
  const n = Math.max(1, Math.round(dur * fps));
  const out: HookFrame[] = [];
  const N = sn(side);
  const O = sn(side === 'L' ? 'R' : 'L');
  const sgOut = side === 'L' ? 1 : -1;
  for (let i = 0; i <= n; i++) {
    const t = (dur * i) / n;
    rig.apply(s.sample(t));
    const tq = measureTorsions(rig);
    const a = tq.side[side];
    const sh = rig.worldOf(`${N}Arm`)!;
    const el = rig.worldOf(`${N}ForeArm`)!;
    const wr = rig.worldOf(`${N}Hand`)!;
    const fist = rig.worldOf(`${N}HandMiddle1`) ?? wr;
    const chest = rig.turnOf('Spine2')!;
    const inv = chest.clone().invert();
    const rel = el.clone().sub(sh).applyQuaternion(inv);
    const plane = new Vector3().crossVectors(el.clone().sub(sh), wr.clone().sub(el)).normalize();
    const head = rig.worldOf('Head')!;
    const oh = rig.worldOf(`${O}Hand`)!;
    out.push({
      t,
      elbowFlex: a.elbowFlex,
      pronation: a.pronation,
      shoulderRot: a.shoulderRot,
      shoulderElev: a.shoulderElev,
      wristFlex: a.wristFlex,
      wristDev: a.wristDev,
      handTwist: a.handTwist,
      elbowUp: rel.y,
      elbowOut: rel.x * sgOut,
      elbowFwd: rel.z,
      fist: [fist.x, fist.y, fist.z],
      plane: [plane.x, plane.y, plane.z],
      trunk: tq.trunk,
      pelvisYaw: yawOf(rig.turnOf('Hips')!),
      chestYaw: yawOf(chest),
      headYaw: yawOf(rig.turnOf('Head')!),
      ballL: rig.worldOf('LeftToeBase')!.toArray() as [number, number, number],
      ballR: rig.worldOf('RightToeBase')!.toArray() as [number, number, number],
      guardGap: oh.distanceTo(head),
    });
  }
  return out;
}

const v = (a: [number, number, number]) => new Vector3(...a);

/** summary of one run: the quantities the acceptance criteria talk about */
export function hookSummary(f: HookFrame[], impact: number) {
  const dt = f[1].t - f[0].t;
  const iImp = f.reduce((b, x, i) => (Math.abs(x.t - impact) < Math.abs(f[b].t - impact) ? i : b), 0);
  // bend plane: largest turn between two frames (a flip of the elbow reads as a jump), when the arm is bent enough to define it
  let planeJump = 0;
  for (let i = 1; i < f.length; i++) {
    if (f[i].elbowFlex < 25 || f[i - 1].elbowFlex < 25) continue;
    const c = Math.max(-1, Math.min(1, v(f[i].plane).dot(v(f[i - 1].plane))));
    planeJump = Math.max(planeJump, (Math.acos(c) * D) / (dt * 120));
  }
  // pronation speed (degrees per 1/120 s)
  let pronJump = 0;
  for (let i = 1; i < f.length; i++) pronJump = Math.max(pronJump, Math.abs(f[i].pronation - f[i - 1].pronation) / (dt * 120));
  // fist path: speed and turning of the velocity (a straight segment has none)
  const vel = f.slice(1).map((x, i) => v(x.fist).sub(v(f[i].fist)).divideScalar(dt));
  const speed = vel.map((x) => x.length());
  // fastest moment of the fist before the impact
  const peak = speed.indexOf(Math.max(...speed.slice(0, iImp)));
  // between the start of the strike (fist leaves the guard) and the impact: arc length / chord, and the turning of the horizontal velocity
  // from the guard (the first frame) to the impact: a wind-up or a loop lengthens the path
  const i0 = 0;
  let arc = 0;
  for (let i = i0 + 1; i <= iImp; i++) arc += v(f[i].fist).distanceTo(v(f[i - 1].fist));
  const chord = v(f[iImp].fist).distanceTo(v(f[i0].fist));
  const hv = (x: Vector3) => Math.atan2(x.x, x.z) * D;
  let turn = 0;
  for (let i = i0 + 1; i < iImp; i++) {
    if (speed[i] < 0.3 || speed[i - 1] < 0.3) continue;
    let d = hv(vel[i]) - hv(vel[i - 1]);
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    turn += d;
  }
  // body timing: peak angular speed of pelvis, chest, arm (fist)
  const peakOf = (g: (x: HookFrame) => number) => {
    let b = 0, bi = 0;
    for (let i = 1; i < f.length && f[i].t <= impact + 0.02; i++) {
      const w = Math.abs(g(f[i]) - g(f[i - 1]));
      if (w > b) (b = w), (bi = i);
    }
    return f[bi].t;
  };
  // ball of each foot: drift on the ground (only while it stays on the ground: height < 4 cm)
  const drift = (k: 'ballL' | 'ballR') => {
    const g = f.filter((x) => x[k][1] < 0.04);
    if (!g.length) return 0;
    const o = v(g[0][k]);
    return Math.max(...g.map((x) => Math.hypot(x[k][0] - o.x, x[k][2] - o.z)));
  };
  const hit = f[iImp];
  const max = (g: (x: HookFrame) => number) => Math.max(...f.map(g));
  const min = (g: (x: HookFrame) => number) => Math.min(...f.map(g));
  return {
    impact: { elbowFlex: hit.elbowFlex, elbowUp: hit.elbowUp, elbowOut: hit.elbowOut, elbowFwd: hit.elbowFwd, pronation: hit.pronation, wristFlex: hit.wristFlex, wristDev: hit.wristDev, trunk: hit.trunk, shoulderRot: hit.shoulderRot },
    elbowFlexMin: min((x) => x.elbowFlex),
    elbowBehindMax: -min((x) => x.elbowFwd),
    elbowOutMax: max((x) => x.elbowOut),
    pronRange: [min((x) => x.pronation), max((x) => x.pronation)],
    wristMax: max((x) => Math.hypot(x.wristFlex, x.wristDev)),
    shoulderIntMax: -min((x) => x.shoulderRot),
    shoulderExtMax: max((x) => x.shoulderRot),
    handTwistMax: max((x) => Math.abs(x.handTwist)),
    planeJump,
    pronJump,
    path: { arcOverChord: chord > 0 ? arc / chord : 1, turn, peakSpeed: speed[peak], peakAt: f[peak + 1].t },
    timing: { pelvis: peakOf((x) => x.pelvisYaw), chest: peakOf((x) => x.chestYaw) },
    drift: { L: drift('ballL'), R: drift('ballR') },
    guardGapMax: max((x) => x.guardGap),
  };
}
