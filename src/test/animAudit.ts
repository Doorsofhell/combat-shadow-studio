/**
 * v2.3.0 (Lot 2, « Biomécanique et animations de combat AAA », Youssef 2026-11-19): measures of the animations as the
 * coach's real skeleton performs them (rig.apply, bone world positions), for every coach, discipline and technique.
 *
 * Measures only. Every threshold that turns a number into an anomaly is written in anim-aaa-v230.test.ts and scales
 * with the coach (height, arm or leg length), never one number for every body.
 *
 * Families of measures:
 * - kinetic chain of the blows: time of the peak angular speed of the pelvis (hip line), of the shoulders (shoulder
 *   line) and of the peak speed of the striking hand or foot: a powerful blow goes from the hips to the fist
 *   (proximal-to-distal sequencing);
 * - impact: speed of the striking end at the impact, and how long it stays frozen around it;
 * - planted feet: horizontal slide of the ball of a foot on the floor, and how far it sinks under it;
 * - continuity: largest jump of a joint between two images, largest change of speed between two images (a
 *   discontinuity of speed reads as a jolt), normalised by the coach's height;
 * - joints: elbow and knee straight beyond the anatomical range (hyperextension);
 * - balance: centre of mass outside the supports on one foot (kicks).
 */
import { Vector3 } from 'three';
import type { CoachRig } from '../engine/rig';
import { getLibrary, getMotion } from '../engine/library';
import { MotionSampler, duration, chainPoint, type Motion } from '../engine/motion';
import { ComboPlayer } from '../engine/player';
import { balanceAt, styleOf } from '../engine/audit';
import type { StanceOffsets } from '../engine/author';
import type { DisciplineId } from '../domain/types';

export const FPS = 120;
const DT = 1 / FPS;

export interface CoachUnderTest {
  id: string;
  rig: CoachRig;
  offsets?: StanceOffsets;
}

const JOINTS = ['Hips', 'Spine2', 'Head', 'LeftHand', 'RightHand', 'LeftForeArm', 'RightForeArm', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase', 'LeftLeg', 'RightLeg'] as const;

interface Frame {
  t: number;
  p: Record<string, Vector3>;
  /** yaw of the hip line and of the shoulder line (radians, unwrapped later) */
  hipYaw: number;
  shoulderYaw: number;
  elbow: [number, number];
  knee: [number, number];
  /** where the elbows and knees point about the shoulder → wrist and hip → ankle lines (unit vectors) */
  swivel: Vector3[];
  comOut: number;
  feet: number;
}

const lineYaw = (l: Vector3, r: Vector3) => Math.atan2(l.z - r.z, l.x - r.x);

/** interior angle at b of a-b-c, degrees (180 = straight) */
function inner(a: Vector3, b: Vector3, c: Vector3) {
  const u = a.clone().sub(b);
  const v = c.clone().sub(b);
  return (u.angleTo(v) * 180) / Math.PI;
}

function frameOf(rig: CoachRig, t: number, balance: boolean): Frame {
  const p: Record<string, Vector3> = {};
  for (const j of JOINTS) p[j] = rig.worldOf(j)!.clone();
  const W = (n: string) => rig.worldOf(n)!.clone();
  const [lu, ru, la, ra] = [W('LeftUpLeg'), W('RightUpLeg'), W('LeftArm'), W('RightArm')];
  const elbow: [number, number] = [inner(la, W('LeftForeArm'), W('LeftHand')), inner(ra, W('RightForeArm'), W('RightHand'))];
  const knee: [number, number] = [inner(lu, W('LeftLeg'), W('LeftFoot')), inner(ru, W('RightLeg'), W('RightFoot'))];
  const sw = (root: Vector3, mid: Vector3, end: Vector3) => {
    const ax = end.clone().sub(root).normalize();
    const v = mid.clone().sub(root);
    return v.addScaledVector(ax, -v.dot(ax)).normalize();
  };
  const swivel = [sw(la, W('LeftForeArm'), W('LeftHand')), sw(ra, W('RightForeArm'), W('RightHand')), sw(lu, W('LeftLeg'), W('LeftFoot')), sw(ru, W('RightLeg'), W('RightFoot'))];
  let comOut = 0;
  let feet = 2;
  if (balance) {
    const b = balanceAt(rig);
    comOut = Number.isNaN(b.out) ? 0 : b.out;
    feet = b.feet;
  }
  return { t, p, hipYaw: lineYaw(lu, ru), shoulderYaw: lineYaw(la, ra), elbow, knee, swivel, comOut, feet };
}

function unwrap(a: number[]) {
  const out = [a[0]];
  for (let i = 1; i < a.length; i++) {
    let d = a[i] - a[i - 1];
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    out.push(out[i - 1] + d);
  }
  return out;
}

export type Family = 'direct' | 'crochet' | 'uppercut' | 'coude' | 'pied-circulaire' | 'pied-droit' | 'pied-lateral' | 'genou' | 'defense' | 'deplacement' | 'sol' | 'projection' | 'autre';

export function familyOf(id: string): Family {
  if (/^(jab|direct|overhand|superman|back-fist|spinning-back-fist)/.test(id)) return 'direct';
  if (/^crochet/.test(id)) return 'crochet';
  if (/^uppercut/.test(id)) return 'uppercut';
  if (/coude/.test(id)) return 'coude';
  if (/^(rattrapage|check|blocage|parade|esquive|roll|shoulder-roll|retrait)/.test(id)) return 'defense';
  if (/(low-kick|middle|high-kick|round|circulaire-|switch-kick|calf|kick-tournant|spinning-hook|question)/.test(id) && !/genou/.test(id)) return 'pied-circulaire';
  if (/(teep|front-kick|push-kick)/.test(id)) return 'pied-droit';
  if (/(side-kick|chasse|lateral|back-kick|oblique)/.test(id)) return 'pied-lateral';
  if (/genou/.test(id)) return 'genou';
  if (/(esquive|rotation|blocage|parade|check|retrait|bloc|couverture|rattrapage|roll|bob|slip|pull|catch)/.test(id)) return 'defense';
  if (/(pas-|pivot|shuffle|sautill|step|garde|neutre|cercle|switch-stance|changement-garde)/.test(id)) return 'deplacement';
  return 'autre';
}

export interface MotionMeasure {
  coach: string;
  style: string;
  motion: string;
  family: Family;
  duration: number;
  /** time of peak angular speed (s): hip line, shoulder line; striking end peak speed time; impact time */
  chain?: { hip: number; shoulder: number; end: number; impact: number; endName: string; hipPeak: number; shoulderPeak: number };
  /** speed of the striking end just before the impact (m/s) and its peak over the motion */
  impactSpeed?: number;
  endPeak?: number;
  /** seconds the striking end stays within 1 % of the height around the impact (frozen fist) */
  freeze?: number;
  /** recovery: seconds from impact until the striking end is back within 4 % of the height of its start */
  recovery?: number;
  /** largest slide of a planted ball of the foot, cm per image at 60 i/s */
  slide: number;
  /** deepest point of the ball or the ankle under the floor, cm (positive = under) */
  sink: number;
  /** largest jump of a joint between two images at 60 i/s, % of the height */
  jump: number;
  /**
   * fastest turn of an elbow or a knee about its limb's own line (shoulder → wrist, hip → ankle), degrees per image at
   * 60 i/s, and which: a knee or elbow that whips across while the hand or foot hardly moves (a flip of the IK)
   */
  swivel: number;
  swivelJoint: string;
  swivelT: number;
  /** largest change of a joint's speed between two images at 120 i/s, in heights per second (velocity discontinuity) */
  dv: number;
  dvJoint: string;
  dvT: number;
  /** straightest elbow and knee (interior angle, degrees) */
  elbowMax: number;
  kneeMax: number;
  /** centre of mass outside the supports while on one foot, cm (balance motions) */
  comOut: number;
}

const STRIKE_END: Partial<Record<Family, 'hand' | 'foot' | 'knee' | 'elbow'>> = {
  direct: 'hand',
  crochet: 'hand',
  uppercut: 'hand',
  coude: 'elbow',
  'pied-circulaire': 'foot',
  'pied-droit': 'foot',
  'pied-lateral': 'foot',
  genou: 'knee',
};

const END_BONE = { hand: 'Hand', foot: 'Foot', knee: 'Leg', elbow: 'ForeArm' } as const;

/** samples a motion on the rig at FPS images per second */
export function sampleMotion(rig: CoachRig, m: Motion, opts: { flow?: boolean; chain?: boolean } = {}): Frame[] {
  const s = new MotionSampler(rig, m, opts.flow ?? true, opts.chain ?? true);
  const d = duration(m);
  const out: Frame[] = [];
  for (let t = 0; t <= d + 1e-9; t += DT) {
    rig.apply(s.sample(Math.min(t, d)));
    out.push(frameOf(rig, t, !!m.balance));
  }
  return out;
}

export function measureFrames(c: CoachUnderTest, style: string, m: Motion, frames: Frame[]): MotionMeasure {
  const rig = c.rig;
  const H = rig.metrics.height;
  const fam = familyOf(m.id);
  const ballY = rig.metrics.ballRestY;
  let slide = 0;
  let sink = 0;
  let jump = 0;
  let dv = 0;
  let dvJoint = '';
  let dvT = 0;
  let elbowMax = 0;
  let kneeMax = 0;
  let comOut = 0;
  let swivel = 0;
  let swivelJoint = '';
  let swivelT = 0;
  const SW = ['coude G', 'coude D', 'genou G', 'genou D'];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    elbowMax = Math.max(elbowMax, ...f.elbow);
    kneeMax = Math.max(kneeMax, ...f.knee);
    if (f.feet === 1) comOut = Math.max(comOut, f.comOut);
    for (const b of ['LeftToeBase', 'RightToeBase']) sink = Math.max(sink, (ballY - 0.012 - f.p[b].y) * 100);
    if (i >= 2) {
      const g = frames[i - 2];
      for (const b of ['LeftToeBase', 'RightToeBase']) {
        if (f.p[b].y > ballY + 0.004 || g.p[b].y > ballY + 0.004) continue;
        slide = Math.max(slide, Math.hypot(f.p[b].x - g.p[b].x, f.p[b].z - g.p[b].z) * 100);
      }
      for (const j of JOINTS) jump = Math.max(jump, (f.p[j].distanceTo(g.p[j]) / H) * 100);
      for (let k = 0; k < 4; k++) {
        // undefined on a straight limb: only when the joint is bent by 20° or more on both images
        const bent = (fr: Frame) => (k < 2 ? fr.elbow[k] : fr.knee[k - 2]) < 160;
        if (!bent(f) || !bent(g)) continue;
        const a = (f.swivel[k].angleTo(g.swivel[k]) * 180) / Math.PI;
        if (a > swivel) [swivel, swivelJoint, swivelT] = [a, SW[k], f.t];
      }
    }
    if (i >= 2) {
      const [a, b] = [frames[i - 2], frames[i - 1]];
      for (const j of JOINTS) {
        const v1 = b.p[j].clone().sub(a.p[j]).divideScalar(DT);
        const v2 = f.p[j].clone().sub(b.p[j]).divideScalar(DT);
        const d = v2.distanceTo(v1) / H;
        if (d > dv) {
          dv = d;
          dvJoint = j;
          dvT = b.t;
        }
      }
    }
  }
  const res: MotionMeasure = { coach: c.id, style, motion: m.id, family: fam, duration: duration(m), slide, sink: Math.max(0, sink), jump, swivel, swivelJoint, swivelT, dv, dvJoint, dvT, elbowMax, kneeMax, comOut: comOut * 100 };

  const endKind = STRIKE_END[fam];
  const impact = m.impacts[0];
  if (endKind && impact !== undefined) {
    // striking side, from the technique's name (orthodox: « avant » = left, « arriere », direct, overhand = right)
    const ii = Math.min(frames.length - 1, Math.round(impact / DT));
    const name = `${/arriere|^direct|^overhand/.test(m.id) ? 'Right' : 'Left'}${END_BONE[endKind]}`;
    const speed = (i: number) => (i <= 0 ? 0 : frames[i].p[name].distanceTo(frames[i - 1].p[name]) / DT);
    const hip = unwrap(frames.map((f) => f.hipYaw));
    const sh = unwrap(frames.map((f) => f.shoulderYaw));
    const ang = (a: number[], i: number) => (i <= 0 ? 0 : Math.abs(a[i] - a[i - 1]) / DT);
    let [ih, is, ie] = [1, 1, 1];
    // peaks searched from the start up to the impact (the return also turns the hips back)
    for (let i = 1; i <= ii; i++) {
      if (ang(hip, i) > ang(hip, ih)) ih = i;
      if (ang(sh, i) > ang(sh, is)) is = i;
      if (speed(i) > speed(ie)) ie = i;
    }
    res.chain = { hip: frames[ih].t, shoulder: frames[is].t, end: frames[ie].t, impact, endName: name, hipPeak: (ang(hip, ih) * 180) / Math.PI, shoulderPeak: (ang(sh, is) * 180) / Math.PI };
    res.impactSpeed = speed(ii);
    let peak = 0;
    for (let i = 1; i < frames.length; i++) peak = Math.max(peak, speed(i));
    res.endPeak = peak;
    const at = frames[ii].p[name];
    let a = ii;
    let b = ii;
    while (a > 0 && frames[a - 1].p[name].distanceTo(at) < 0.01 * H) a--;
    while (b < frames.length - 1 && frames[b + 1].p[name].distanceTo(at) < 0.01 * H) b++;
    res.freeze = (b - a) * DT;
    const start = frames[0].p[name];
    let r = ii;
    while (r < frames.length - 1 && frames[r].p[name].distanceTo(start) > 0.04 * H) r++;
    res.recovery = (r - ii) * DT;
  }
  return res;
}

export function measureMotion(c: CoachUnderTest, style: string, m: Motion): MotionMeasure {
  return measureFrames(c, style, m, sampleMotion(c.rig, m));
}

export const STYLES = ['boxing', 'kickboxing', 'muaythai', 'mma', 'bjj', 'judo'] as const;

/** every motion a discipline uses (techniques of the catalogue), measured once per coach and style */
export function measureCoach(c: CoachUnderTest, pairs: { discipline: DisciplineId; motion: string }[]): MotionMeasure[] {
  const out: MotionMeasure[] = [];
  for (const { discipline, motion } of pairs) {
    const style = styleOf(discipline);
    const lib = getLibrary(c.rig, style, c.offsets ? { id: c.id, offsets: c.offsets } : undefined);
    const m = getMotion(lib, motion, false);
    if (!m) continue;
    out.push(measureMotion(c, style, m));
  }
  return out;
}

export interface ComboMeasure {
  coach: string;
  style: string;
  sequence: string[];
  /** largest change of a joint's speed between two images (heights per second), and where */
  dv: number;
  dvJoint: string;
  /** largest planted-foot slide, cm per image at 60 i/s */
  slide: number;
  /** seconds between the impact of a blow and the impact of the next (chained) */
  gaps: number[];
}

/** plays a sequence with the app's player and measures the transitions between the moves */
export function measureCombo(c: CoachUnderTest, style: Parameters<typeof getLibrary>[1], seq: string[]): ComboMeasure {
  const rig = c.rig;
  const H = rig.metrics.height;
  const lib = getLibrary(rig, style, c.offsets ? { id: c.id, offsets: c.offsets } : undefined);
  const impacts: number[] = [];
  let clock = 0;
  const p = new ComboPlayer(rig, lib, false, { onImpact: () => impacts.push(clock) });
  p.setSequence(
    seq.map((id) => ({ techniqueId: id, motionId: id })),
    0,
  );
  p.play();
  const total = seq.reduce((s, id) => s + chainPoint(getMotion(lib, id, false) ?? { keys: [{ t: 0.6 }], impacts: [] } as unknown as Motion), 0) + 1.2;
  const pts: Vector3[][] = [];
  const toes: Vector3[][] = [];
  for (let f = 0; f * DT < total; f++) {
    clock = f * DT;
    rig.apply(p.update(DT));
    pts.push(JOINTS.map((j) => rig.worldOf(j)!.clone()));
    toes.push(['LeftToeBase', 'RightToeBase'].map((j) => rig.worldOf(j)!.clone()));
  }
  let dv = 0;
  let dvJoint = '';
  for (let i = 2; i < pts.length; i++) {
    for (let j = 0; j < JOINTS.length; j++) {
      const v1 = pts[i - 1][j].clone().sub(pts[i - 2][j]);
      const v2 = pts[i][j].clone().sub(pts[i - 1][j]);
      const d = v2.distanceTo(v1) / DT / H;
      if (d > dv) {
        dv = d;
        dvJoint = JOINTS[j];
      }
    }
  }
  let slide = 0;
  const ballY = rig.metrics.ballRestY;
  for (let i = 2; i < toes.length; i++) {
    for (let k = 0; k < 2; k++) {
      const [a, b] = [toes[i - 2][k], toes[i][k]];
      if (a.y > ballY + 0.004 || b.y > ballY + 0.004) continue;
      slide = Math.max(slide, Math.hypot(a.x - b.x, a.z - b.z) * 100);
    }
  }
  const gaps = impacts.slice(1).map((t, i) => t - impacts[i]);
  return { coach: c.id, style, sequence: seq, dv, dvJoint, slide, gaps };
}

/** idle guard over a few seconds: amplitude and repetition of the hips' bounce */
export function measureIdle(c: CoachUnderTest, style: Parameters<typeof getLibrary>[1], seconds = 8) {
  const rig = c.rig;
  const lib = getLibrary(rig, style, c.offsets ? { id: c.id, offsets: c.offsets } : undefined);
  const p = new ComboPlayer(rig, lib, false);
  p.play();
  const ys: number[] = [];
  const hx: number[] = [];
  for (let f = 0; f * DT < seconds; f++) {
    const pose = p.update(DT);
    ys.push(pose.hips.y);
    hx.push(pose.hips.x);
  }
  const amp = (a: number[]) => (Math.max(...a) - Math.min(...a)) * 100;
  // repetition: best correlation of the vertical bounce with itself shifted by 0.6 to 1.2 s (1 = a loop that repeats
  // identically, whatever its period)
  const mean = ys.reduce((s, y) => s + y, 0) / ys.length;
  let periodic = 0;
  for (let lag = Math.round(0.6 / DT); lag <= Math.round(1.2 / DT); lag++) {
    let num = 0;
    let da = 0;
    let db = 0;
    for (let i = 0; i + lag < ys.length; i++) {
      num += (ys[i] - mean) * (ys[i + lag] - mean);
      da += (ys[i] - mean) ** 2;
      db += (ys[i + lag] - mean) ** 2;
    }
    if (da > 0 && db > 0) periodic = Math.max(periodic, num / Math.sqrt(da * db));
  }
  return { coach: c.id, style, bounce: amp(ys), sway: amp(hx), periodic };
}
