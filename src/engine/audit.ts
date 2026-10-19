/**
 * Engine audit measurements (docs/audit-biomecanique/MOTEUR.md): balance, floor contact, trunk twist
 * and transitions, measured on the real coach skeleton. These are measurements, not verdicts: a
 * striking or stepping move is dynamic and may legitimately carry the centre of mass outside the feet
 * for an instant; the numbers say where to look.
 */
import { Quaternion, Vector3 } from 'three';
import { CoachRig } from './rig';
import { centreOfMass } from './balance';

export { centreOfMass };
import { getLibrary, getMotion } from './library';
import { MotionSampler, duration } from './motion';
import { ComboPlayer } from './player';
import type { ResolvedPose } from './pose';
import type { StanceStyle } from './author';
import type { DisciplineId, Technique } from '../domain/types';
import type { Exercise } from '../domain/types';
import { TECHNIQUE_BY_ID } from '../domain/techniques';

type P2 = [number, number];

/** the sole of a foot on the floor, as four points (heel under the ankle to just past the ball) */
function sole(rig: CoachRig, side: 'Left' | 'Right'): P2[] | null {
  const toe = rig.worldOf(`${side}ToeBase`)!;
  if (toe.y > rig.metrics.ballRestY + 0.02) return null; // the ball of this foot is off the floor
  const ankle = rig.worldOf(`${side}Foot`)!;
  const dir = new Vector3(toe.x - ankle.x, 0, toe.z - ankle.z).normalize();
  const side2 = new Vector3(-dir.z, 0, dir.x).multiplyScalar(0.045);
  const heel = new Vector3(ankle.x, 0, ankle.z).addScaledVector(dir, -0.05);
  const tip = new Vector3(toe.x, 0, toe.z).addScaledVector(dir, 0.05);
  return [heel.clone().add(side2), tip.clone().add(side2), tip.clone().sub(side2), heel.clone().sub(side2)].map((v) => [v.x, v.z] as P2);
}

function hull(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** distance from a point to a convex polygon, 0 inside */
function outside(pt: P2, poly: P2[]): number {
  let inside = true;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    if (ex * (pt[1] - a[1]) - ez * (pt[0] - a[0]) < 0) inside = false;
    const t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * ex + (pt[1] - a[1]) * ez) / (ex * ex + ez * ez || 1)));
    best = Math.min(best, Math.hypot(pt[0] - a[0] - t * ex, pt[1] - a[1] - t * ez));
  }
  return inside ? 0 : best;
}

export interface BalanceSample {
  /** centre of mass outside the parts of the body on the floor, metres (0 inside) */
  out: number;
  /** feet with the ball on the floor */
  feet: number;
  /** body parts on the floor, feet included */
  contacts: number;
}

/**
 * other body parts that bear weight when they touch the floor (hands in a sprawl, knees, back on the
 * mat): joint centre within this height of the floor, metres (joint centres sit inside the body)
 */
const CONTACTS: [string, number][] = [
  ['LeftHand', 0.07],
  ['RightHand', 0.07],
  ['LeftForeArm', 0.08],
  ['RightForeArm', 0.08],
  ['LeftLeg', 0.1],
  ['RightLeg', 0.1],
  ['Hips', 0.16],
  ['Spine2', 0.16],
  ['LeftArm', 0.12],
  ['RightArm', 0.12],
  ['Head', 0.14],
];

export function balanceAt(rig: CoachRig): BalanceSample {
  const soles = [sole(rig, 'Left'), sole(rig, 'Right')].filter((s): s is P2[] => !!s);
  const extra: P2[] = [];
  for (const [b, h] of CONTACTS) {
    const p = rig.worldOf(b)!;
    if (p.y < h) extra.push([p.x - 0.03, p.z - 0.03], [p.x + 0.03, p.z - 0.03], [p.x + 0.03, p.z + 0.03], [p.x - 0.03, p.z + 0.03]);
  }
  const com = centreOfMass(rig);
  const pts = [...soles.flat(), ...extra];
  if (!pts.length) return { out: NaN, feet: 0, contacts: 0 };
  return { out: outside([com.x, com.z], hull(pts)), feet: soles.length, contacts: soles.length + extra.length / 4 };
}

/** twist of the chest relative to the pelvis (p.chest is already relative) around the pelvis's vertical axis (swing-twist), radians */
export function trunkTwist(p: ResolvedPose): number {
  const rel = p.chest;
  const tw = new Quaternion(0, rel.y, 0, rel.w).normalize();
  const a = 2 * Math.atan2(tw.y, tw.w);
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export interface TechniqueAudit {
  id: string;
  name: string;
  category: string;
  /** largest distance of the centre of mass outside the feet, cm */
  comOutMax: number;
  /** share of the motion with the centre of mass outside the feet */
  comOutShare: number;
  /** time on one foot, s */
  singleSupport: number;
  /** time with no foot on the floor (jumps, ground work), s */
  noSupport: number;
  /** lowest joint centre above the floor, cm (a joint centre sits a few cm inside the body: under about 1.5 cm the skin goes through the floor) */
  floorMin: number;
  floorBone: string;
  /** largest twist of the chest relative to the pelvis, degrees */
  twistMax: number;
  /** largest slide of a foot whose ball stays on the floor, cm per 1/60 s */
  slideMax: number;
}

/** horizontal move of each toe that is on the floor at both instants, metres (largest of the two feet) */
function groundedSlide(rig: CoachRig, a: Vector3[], b: Vector3[]) {
  let m = 0;
  b.forEach((t, i) => {
    const was = a[i];
    if (t.y > rig.metrics.ballRestY + 0.004 || was.y > rig.metrics.ballRestY + 0.004) return;
    m = Math.max(m, Math.hypot(t.x - was.x, t.z - was.z));
  });
  return m;
}

const FLOOR_BONES = [
  'LeftToeBase',
  'RightToeBase',
  'LeftFoot',
  'RightFoot',
  'LeftLeg',
  'RightLeg',
  'LeftHand',
  'RightHand',
  'LeftForeArm',
  'RightForeArm',
  'Hips',
  'Spine2',
  'Head',
  'LeftArm',
  'RightArm',
];

export function styleOf(d: DisciplineId): StanceStyle {
  return d === 'boxe' ? 'boxing' : d === 'kickboxing' ? 'kickboxing' : d === 'muaythai' ? 'muaythai' : d === 'mma' ? 'mma' : d === 'bjj' ? 'bjj' : 'judo';
}

export function auditTechnique(rig: CoachRig, t: Technique): TechniqueAudit | null {
  const m = getMotion(getLibrary(rig, styleOf(t.disciplines[0])), t.motion, false);
  if (!m) return null;
  const s = new MotionSampler(rig, m);
  const dur = duration(m);
  const N = 60;
  let comOutMax = 0;
  let outCount = 0;
  let single = 0;
  let none = 0;
  let floorMin = Infinity;
  let floorBone = '';
  let twistMax = 0;
  let slideMax = 0;
  let prevToes: Vector3[] | null = null;
  for (let i = 0; i <= N; i++) {
    const p = s.sample((dur * i) / N);
    rig.apply(p);
    const b = balanceAt(rig);
    if (b.contacts === 0) none++;
    else {
      if (b.feet === 1 && b.contacts === 1) single++;
      if (b.out > 0.005) outCount++;
      comOutMax = Math.max(comOutMax, b.out);
    }
    for (const bone of FLOOR_BONES) {
      const y = rig.worldOf(bone)!.y;
      if (y < floorMin) {
        floorMin = y;
        floorBone = bone;
      }
    }
    twistMax = Math.max(twistMax, Math.abs(trunkTwist(p)));
    const toes = ['LeftToeBase', 'RightToeBase'].map((bn) => rig.worldOf(bn)!.clone());
    if (prevToes) slideMax = Math.max(slideMax, groundedSlide(rig, prevToes, toes));
    prevToes = toes;
  }
  const step = dur / N;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    comOutMax: comOutMax * 100,
    comOutShare: outCount / (N + 1),
    singleSupport: single * step,
    noSupport: none * step,
    floorMin: floorMin * 100,
    floorBone,
    twistMax: (twistMax * 180) / Math.PI,
    slideMax: (slideMax * 100 * N) / (dur * 60),
  };
}

export interface TransitionAudit {
  exercise: string;
  discipline: DisciplineId;
  sequence: string[];
  /** largest move of the hips or a hand between two frames at 60 images/s, cm */
  jumpMax: number;
  /** largest slide of a foot that stays on the floor, between two frames, cm */
  slideMax: number;
  /** total sliding of feet on the floor over the sequence, cm */
  slideTotal: number;
}

/** plays an exercise sequence twice with the app's player and measures continuity and foot sliding */
export function auditTransitions(rig: CoachRig, e: Exercise): TransitionAudit {
  const lib = getLibrary(rig, styleOf(e.discipline));
  const p = new ComboPlayer(rig, lib, false);
  const steps = e.sequence.filter((id) => TECHNIQUE_BY_ID.has(id)).map((id) => ({ techniqueId: id, motionId: TECHNIQUE_BY_ID.get(id)!.motion }));
  p.setSequence(steps, e.rest);
  p.play();
  let prev: ResolvedPose | null = null;
  let prevToes: Vector3[] | null = null;
  let jumpMax = 0;
  let slideMax = 0;
  let slideTotal = 0;
  const total = Math.min(30, 2 * steps.length * 1.2 + 2 * e.rest + 1);
  for (let f = 0; f < total * 60; f++) {
    const pose = p.update(1 / 60);
    rig.apply(pose);
    const toes = ['LeftToeBase', 'RightToeBase'].map((b) => rig.worldOf(b)!.clone());
    if (prev) jumpMax = Math.max(jumpMax, pose.hips.distanceTo(prev.hips), pose.handL.pos.distanceTo(prev.handL.pos), pose.handR.pos.distanceTo(prev.handR.pos));
    if (prevToes) {
      const d = groundedSlide(rig, prevToes, toes);
      slideMax = Math.max(slideMax, d);
      slideTotal += d;
    }
    prev = pose;
    prevToes = toes;
  }
  return { exercise: e.id, discipline: e.discipline, sequence: e.sequence, jumpMax: jumpMax * 100, slideMax: slideMax * 100, slideTotal: slideTotal * 100 };
}
