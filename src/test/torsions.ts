/**
 * Axial rotations ("torsions") and hinge angles measured on the posed skeleton, for the torsion test
 * and its measurement document (docs/audit-biomecanique/MESURES_TORSIONS.md). Measures only: the
 * reference ranges are in TORSION_LIMITS below, with their sources.
 *
 * Every angle is read from the bones' rotations since the rest pose (CoachRig.turnOf), never from the
 * authored pose. Ground space: +Y up, +Z the coach's front, +X the coach's left.
 *
 * Two families of numbers:
 * - per bone: the bone's rotation relative to its parent since rest, split into swing and twist about
 *   the bone's own axis (rest direction toward its child). This is what the skin sees: a large twist
 *   on one bone wrings the mesh around it.
 * - per joint (anatomical): the rotation the body actually performs, whatever bone carries it:
 *   trunk axial rotation (pelvis → chest), cervical rotation (chest → head), shoulder internal /
 *   external rotation, forearm pronation / supination, wrist flexion and deviation, hip rotation, knee
 *   axial rotation, elbow and knee flexion with hyperextension (bending the wrong way).
 */
import { Matrix4, Quaternion, Vector3 } from 'three';
import type { CoachRig, Side } from '../engine/rig';
import { getLibrary, getMotion } from '../engine/library';
import { MotionSampler, duration } from '../engine/motion';
import { styleOf } from '../engine/audit';
import type { StanceOffsets, StanceStyle } from '../engine/author';
import { TECHNIQUES } from '../domain/techniques';

const D = 180 / Math.PI;
const SIDES: Side[] = ['L', 'R'];
const sn = (s: Side) => (s === 'L' ? 'Left' : 'Right');

/** each measured bone, its parent and the child that gives its axis (null: vertical) */
export const BONES: [bone: string, parent: string, child: string | null][] = [
  ['Spine', 'Hips', 'Spine1'],
  ['Spine1', 'Spine', 'Spine2'],
  ['Spine2', 'Spine1', 'Neck'],
  ['Neck', 'Spine2', 'Head'],
  ['Head', 'Neck', null],
  ...SIDES.flatMap((s): [string, string, string | null][] => [
    [`${sn(s)}Shoulder`, 'Spine2', `${sn(s)}Arm`],
    [`${sn(s)}Arm`, `${sn(s)}Shoulder`, `${sn(s)}ForeArm`],
    [`${sn(s)}ForeArm`, `${sn(s)}Arm`, `${sn(s)}Hand`],
    [`${sn(s)}Hand`, `${sn(s)}ForeArm`, `${sn(s)}HandMiddle1`],
    [`${sn(s)}UpLeg`, 'Hips', `${sn(s)}Leg`],
    [`${sn(s)}Leg`, `${sn(s)}UpLeg`, `${sn(s)}Foot`],
    [`${sn(s)}Foot`, `${sn(s)}Leg`, `${sn(s)}ToeBase`],
  ]),
];

/** twist of q about the unit axis a (signed, radians, in [-π, π]) and the remaining swing angle */
export function swingTwist(q: Quaternion, a: Vector3) {
  const p = q.x * a.x + q.y * a.y + q.z * a.z;
  let twist = 2 * Math.atan2(p, q.w);
  if (twist > Math.PI) twist -= 2 * Math.PI;
  if (twist < -Math.PI) twist += 2 * Math.PI;
  const tw = new Quaternion(a.x * p, a.y * p, a.z * p, q.w);
  if (tw.lengthSq() < 1e-12) tw.set(0, 0, 0, 1);
  tw.normalize();
  const sw = q.clone().multiply(tw.clone().invert());
  const swing = 2 * Math.acos(Math.min(1, Math.abs(sw.w)));
  return { twist, swing, swingQ: sw, twistQ: tw };
}

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

function orthoTo(v: Vector3, axis: Vector3) {
  return v.clone().addScaledVector(axis, -v.dot(axis)).normalize();
}

const signedAngle = (from: Vector3, to: Vector3, axis: Vector3) => Math.atan2(new Vector3().crossVectors(from, to).dot(axis), from.dot(to));

/** rest geometry of one coach, computed once */
interface RestFrames {
  axis: Map<string, Vector3>;
  /** upper arm / thigh: rest direction, joint tip (olecranon, knee cap) */
  arm: Record<Side, { p0: Vector3; u0: Vector3; fore0: Vector3; palm0: Vector3; hand0: Vector3; radial0: Vector3 }>;
  leg: Record<Side, { p0: Vector3; u0: Vector3 }>;
  trunkAxis: Vector3;
  /** rotation that brings the upper arm from rest to hanging, olecranon back (shoulder rotation 0) */
  armNeutral: Record<Side, Quaternion>;
}

const restCache = new WeakMap<CoachRig, RestFrames>();

function restFrames(rig: CoachRig): RestFrames {
  const hit = restCache.get(rig);
  if (hit) return hit;
  const r = (n: string) => rig.restOf(n)!;
  const axis = new Map<string, Vector3>();
  for (const [b, , c] of BONES) axis.set(b, c ? r(c).sub(r(b)).normalize() : new Vector3(0, 1, 0));
  const arm = {} as RestFrames['arm'];
  const leg = {} as RestFrames['leg'];
  const armNeutral = {} as RestFrames['armNeutral'];

  for (const s of SIDES) {
    const n = sn(s);
    const p0 = r(`${n}ForeArm`).sub(r(`${n}Arm`)).normalize();
    const fore0 = r(`${n}Hand`).sub(r(`${n}ForeArm`)).normalize();
    // olecranon: away from the rest bend, as in CoachRig
    const u0 = orthoTo(fore0.clone().negate(), p0);
    // palm normal: across the knuckles and the fingers, on the side the fingers curl toward (as in CoachRig)
    const hand0 = r(`${n}HandMiddle1`).sub(r(`${n}Hand`)).normalize();
    const across = r(`${n}HandPinky1`).sub(r(`${n}HandIndex1`)).normalize();
    const palm0 = new Vector3().crossVectors(r(`${n}HandIndex1`).sub(r(`${n}Hand`)).normalize(), across).normalize();
    const curl = new Vector3();
    for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) {
      const a1 = rig.restOf(`${n}Hand${f}1`);
      const a2 = rig.restOf(`${n}Hand${f}2`);
      const a3 = rig.restOf(`${n}Hand${f}3`);
      if (a1 && a2 && a3) curl.add(a3.clone().sub(a2).normalize().sub(a2.clone().sub(a1).normalize()));
    }
    if (curl.dot(palm0) < 0) palm0.negate();
    // orthonormal hand frame: along the hand, palm normal, toward the thumb
    const palmN = orthoTo(palm0, hand0);
    const radial0 = new Vector3().crossVectors(palmN, hand0);
    if (radial0.dot(across) > 0) radial0.negate();
    arm[s] = { p0, u0, fore0, palm0: palmN, hand0, radial0 };
    // neutral humerus: hanging straight down, olecranon pointing back
    const down = new Vector3(0, -1, 0);
    const back = new Vector3(0, 0, -1);
    armNeutral[s] = frameRot(p0, u0, down, back);

    const t0 = r(`${n}Leg`).sub(r(`${n}UpLeg`)).normalize();
    const toe = r(`${n}ToeBase`).sub(r(`${n}Foot`));
    toe.y = 0;
    leg[s] = { p0: t0, u0: orthoTo(toe.normalize(), t0) };

  }
  const trunkAxis = r('Neck').sub(r('Spine')).normalize();
  const out = { axis, arm, leg, trunkAxis, armNeutral };
  restCache.set(rig, out);
  return out;
}

function frameRot(p0: Vector3, u0: Vector3, p1: Vector3, u1: Vector3) {
  const a = new Matrix4().makeBasis(p0, u0, new Vector3().crossVectors(p0, u0));
  const b = new Matrix4().makeBasis(p1, u1, new Vector3().crossVectors(p1, u1));
  return new Quaternion().setFromRotationMatrix(b.multiply(a.transpose()));
}

/** one instant: every angle in degrees */
export interface TorsionSample {
  /** bone name -> twist about its own axis relative to its parent (signed) and swing */
  bones: Record<string, { twist: number; swing: number }>;
  /** pelvis → chest axial rotation (+ = chest turned to the coach's left) */
  trunk: number;
  /** chest → head axial rotation (+ = to the left) */
  cervical: number;
  side: Record<
    Side,
    {
      /** shoulder: + external rotation, − internal (humerus relative to the chest, from hanging neutral) */
      shoulderRot: number;
      /** shoulder elevation (angle of the humerus from hanging), for context */
      shoulderElev: number;
      /** hip elevation (angle of the thigh from standing, relative to the pelvis), for context */
      hipElev: number;
      /** forearm: + pronation (palm down when the forearm points forward), − supination; 0 = thumb up */
      pronation: number;
      /** twist carried by the forearm bone and by the hand bone (their sum is the skinned pronation) */
      foreTwist: number;
      handTwist: number;
      /** wrist: + flexion (toward the palm), − extension; + radial deviation (thumb side), − ulnar */
      wristFlex: number;
      wristDev: number;
      /** elbow flexion (0 straight, − = hyperextension) and change of carrying angle since rest */
      elbowFlex: number;
      elbowSide: number;
      /** hip: twist of the thigh relative to the pelvis (+ = external rotation) */
      hipRot: number;
      /** knee: flexion (− = hyperextension), shin twist relative to the thigh (+ = external), sideways bend since rest */
      kneeFlex: number;
      kneeRot: number;
      kneeSide: number;
    }
  >;
}

function rel(rig: CoachRig, parent: string, child: string) {
  return rig.turnOf(parent)!.invert().multiply(rig.turnOf(child)!);
}

/** all the angles of the rig as it is posed now */
export function measureTorsions(rig: CoachRig): TorsionSample {
  const R = restFrames(rig);
  const bones: TorsionSample['bones'] = {};
  for (const [b, p] of BONES) {
    const st = swingTwist(rel(rig, p, b), R.axis.get(b)!);
    bones[b] = { twist: st.twist * D, swing: st.swing * D };
  }
  const trunk = swingTwist(rel(rig, 'Hips', 'Spine2'), R.trunkAxis).twist * D;
  const cervical = swingTwist(rel(rig, 'Spine2', 'Head'), new Vector3(0, 1, 0)).twist * D;
  const side = {} as TorsionSample['side'];
  for (const s of SIDES) {
    const n = sn(s);
    const sgn = s === 'L' ? 1 : -1;
    const A = R.arm[s];
    // shoulder rotation: humerus relative to the chest, from the anatomical neutral (arm hanging, elbow
    // bending forward), by swing-twist: the twist about the hanging axis, then the shortest swing to the
    // current direction (ISB "plane of elevation + axial rotation", Wu et al. 2005; Baerlocher & Boulic
    // 2004). It reads as the clinic measures: arm at the side, or raised 90° to the side or to the front.
    // It is undefined when the arm points straight up (see ROTATION_MAX_ELEVATION).
    const hum = rel(rig, 'Spine2', `${n}Arm`).multiply(R.armNeutral[s].clone().invert());
    const sh = swingTwist(hum, new Vector3(0, -1, 0));
    // external rotation turns the front of the arm outward: about −Y for the right arm, +Y for the left
    const shoulderRot = sh.twist * D * -sgn;
    // elbow
    const tArm = rig.turnOf(`${n}Arm`)!;
    const a = rig.worldOf(`${n}ForeArm`)!.sub(rig.worldOf(`${n}Arm`)!).normalize();
    const f = rig.worldOf(`${n}Hand`)!.sub(rig.worldOf(`${n}ForeArm`)!).normalize();
    const u = A.u0.clone().applyQuaternion(tArm);
    const lat = new Vector3().crossVectors(a, u);
    const elbowFlex = Math.atan2(-f.dot(u), f.dot(a)) * D;
    const lat0 = new Vector3().crossVectors(A.p0, A.u0);
    const elbowSide = (Math.asin(clamp1(f.dot(lat.normalize()))) - Math.asin(clamp1(A.fore0.dot(lat0.normalize())))) * D;
    // pronation: palm normal against the elbow's hinge axis, about the forearm. Neutral (0): the palm
    // faces along the hinge axis toward the midline (thumb up when the forearm points forward)
    const hinge = new Vector3().crossVectors(u, a).normalize(); // points to the coach's right for both arms when hanging
    const medial = hinge.clone().multiplyScalar(sgn); // toward the midline
    const palm = A.palm0.clone().applyQuaternion(rig.turnOf(`${n}Hand`)!);
    const pronation = signedAngle(orthoTo(medial, f), orthoTo(palm, f), f) * D * sgn;
    // wrist, in the frame of the distal forearm (forearm turned by the hand bone's own twist)
    const wr = rel(rig, `${n}ForeArm`, `${n}Hand`);
    const wst = swingTwist(wr, A.fore0);
    const sw2 = wst.twistQ.clone().invert().multiply(wst.swingQ).multiply(wst.twistQ);
    const d2 = A.hand0.clone().applyQuaternion(sw2);
    const wristFlex = Math.atan2(d2.dot(A.palm0), d2.dot(A.hand0)) * D;
    const wristDev = Math.atan2(d2.dot(A.radial0), d2.dot(A.hand0)) * D;
    // legs
    const L = R.leg[s];
    // hip rotation: same decomposition from standing (the clinic's two positions, lying and sitting, are
    // reached by a single swing, so they read as the clinic measures)
    const hip = swingTwist(rel(rig, 'Hips', `${n}UpLeg`), L.p0);
    // external rotation turns the knee cap outward: about −Y (down axis reversed) for the left leg
    const hipRot = hip.twist * D * -sgn;
    const th = rig.worldOf(`${n}Leg`)!.sub(rig.worldOf(`${n}UpLeg`)!).normalize();
    const sh2 = rig.worldOf(`${n}Foot`)!.sub(rig.worldOf(`${n}Leg`)!).normalize();
    const k = L.u0.clone().applyQuaternion(rig.turnOf(`${n}UpLeg`)!);
    const kneeFlex = Math.atan2(-sh2.dot(k), sh2.dot(th)) * D;
    const klat = new Vector3().crossVectors(th, k);
    const r0 = rig.restOf(`${n}Foot`)!.sub(rig.restOf(`${n}Leg`)!).normalize();
    const klat0 = new Vector3().crossVectors(L.p0, L.u0);
    const kneeSide = (Math.asin(clamp1(sh2.dot(klat.normalize()))) - Math.asin(clamp1(r0.dot(klat0.normalize())))) * D;
    const knee = swingTwist(rel(rig, `${n}UpLeg`, `${n}Leg`), R.axis.get(`${n}Leg`)!);
    const kneeRot = knee.twist * D * -sgn;
    side[s] = {
      shoulderRot,
      shoulderElev: sh.swing * D,
      hipElev: hip.swing * D,
      pronation,
      foreTwist: bones[`${n}ForeArm`].twist,
      handTwist: bones[`${n}Hand`].twist,
      wristFlex,
      wristDev,
      elbowFlex,
      elbowSide,
      hipRot,
      kneeFlex,
      kneeRot,
      kneeSide,
    };
  }
  return { bones, trunk, cervical, side };
}

// ------------------------------------------------------------------ reference ranges

/**
 * Human ranges of motion used as references, degrees. Values are the usual clinical norms for a
 * healthy adult; see MESURES_TORSIONS.md for the sources and how sure they are.
 */
export const TORSION_LIMITS = {
  /** thoracolumbar axial rotation, pelvis held (AAOS: 0–45° each side) */
  trunk: 45,
  /** lumbar spine alone (White & Panjabi: about 2° per level, ≈ 10° for L1–S1, each side) */
  lumbar: 10,
  /** cervical rotation (AAOS: 0–80° each side) */
  cervical: 80,
  /** shoulder rotation (AAOS: internal 70°, external 90°) */
  shoulderInt: 70,
  shoulderExt: 90,
  /** forearm (AAOS: pronation 80°, supination 80°; Norkin & White report up to 80–90°) */
  pronation: 85,
  supination: 85,
  /** wrist (AAOS: flexion 80°, extension 70°, radial deviation 20°, ulnar 30°) */
  wristFlex: 80,
  wristExt: 70,
  wristRadial: 20,
  wristUlnar: 30,
  /** elbow and knee: hyperextension past straight (elbow up to 5–10° in healthy adults, knee ≈ 5°) */
  elbowHyper: 10,
  kneeHyper: 5,
  /** hip rotation (AAOS: internal 45°, external 45°; Kapandji: 30–40° internal, 60° external) */
  hipInt: 45,
  hipExt: 45,
  /**
   * knee axial rotation: none when straight (screw-home), up to 30° internal / 40° external at 90°
   * of flexion (Kapandji). Allowed: 5° + share of the flexed range, linear up to 90° of flexion.
   */
  kneeRotAt90: 30,
  kneeRotStraight: 5,
} as const;

/** beyond this elevation (degrees from hanging / standing) the axial rotation of the arm or thigh is not measured */
export const ROTATION_MAX_ELEVATION = 135;

export const kneeRotLimit = (flex: number) => TORSION_LIMITS.kneeRotStraight + (TORSION_LIMITS.kneeRotAt90 - TORSION_LIMITS.kneeRotStraight) * Math.min(1, Math.max(0, flex / 90));

// ------------------------------------------------------------------ sampling the library

export interface TorsionRun {
  coach: string;
  technique: string;
  motion: string;
  style: StanceStyle;
  southpaw: boolean;
  profile: boolean;
  frames: number;
}

/** worst value of one measure: degrees, where it happened */
export interface Worst {
  value: number;
  run: TorsionRun;
  t: number;
  side?: Side;
}

export type MeasureKey =
  | 'trunk'
  | 'lumbar'
  | 'cervical'
  | 'shoulderInt'
  | 'shoulderExt'
  | 'pronation'
  | 'supination'
  | 'wristFlex'
  | 'wristExt'
  | 'wristRadial'
  | 'wristUlnar'
  | 'elbowHyper'
  | 'kneeHyper'
  | 'hipInt'
  | 'hipExt'
  | 'kneeRot'
  | 'handTwist'
  | 'hipElev';

/**
 * Excess over the reference for each measure at one instant (0 inside the range, >0 degrees past it),
 * and the raw values. kneeRot is judged against kneeRotLimit(flexion); handTwist (the share of the
 * pronation carried by the hand bone alone, the skin's "candy wrapper") has no anatomical limit and
 * is reported only.
 */
export function readings(m: TorsionSample) {
  const out: { key: MeasureKey; side?: Side; value: number; limit: number }[] = [];
  const L = TORSION_LIMITS;
  out.push({ key: 'trunk', value: Math.abs(m.trunk), limit: L.trunk });
  out.push({ key: 'lumbar', value: Math.abs(m.bones.Spine.twist), limit: L.lumbar });
  out.push({ key: 'cervical', value: Math.abs(m.cervical), limit: L.cervical });
  for (const s of SIDES) {
    const a = m.side[s];
    // the rotation of a limb pointing almost straight up (overhead arm, side split) is not defined
    const shOk = a.shoulderElev <= ROTATION_MAX_ELEVATION;
    const hipOk = a.hipElev <= ROTATION_MAX_ELEVATION;
    out.push({ key: 'shoulderInt', side: s, value: shOk ? -a.shoulderRot : 0, limit: L.shoulderInt });
    out.push({ key: 'shoulderExt', side: s, value: shOk ? a.shoulderRot : 0, limit: L.shoulderExt });
    out.push({ key: 'hipElev', side: s, value: a.hipElev, limit: Infinity });
    out.push({ key: 'pronation', side: s, value: a.pronation, limit: L.pronation });
    out.push({ key: 'supination', side: s, value: -a.pronation, limit: L.supination });
    out.push({ key: 'wristFlex', side: s, value: a.wristFlex, limit: L.wristFlex });
    out.push({ key: 'wristExt', side: s, value: -a.wristFlex, limit: L.wristExt });
    out.push({ key: 'wristRadial', side: s, value: a.wristDev, limit: L.wristRadial });
    out.push({ key: 'wristUlnar', side: s, value: -a.wristDev, limit: L.wristUlnar });
    out.push({ key: 'elbowHyper', side: s, value: -a.elbowFlex, limit: L.elbowHyper });
    out.push({ key: 'kneeHyper', side: s, value: -a.kneeFlex, limit: L.kneeHyper });
    out.push({ key: 'hipInt', side: s, value: hipOk ? -a.hipRot : 0, limit: L.hipInt });
    out.push({ key: 'hipExt', side: s, value: hipOk ? a.hipRot : 0, limit: L.hipExt });
    out.push({ key: 'kneeRot', side: s, value: Math.abs(a.kneeRot), limit: kneeRotLimit(a.kneeFlex) });
    out.push({ key: 'handTwist', side: s, value: Math.abs(a.handTwist), limit: Infinity });
  }
  return out;
}

export interface TorsionReport {
  runs: number;
  frames: number;
  /** worst raw value of each measure */
  worst: Record<MeasureKey, Worst>;
  /** worst excess (value − limit) of each measure, over all runs */
  excess: Record<MeasureKey, Worst>;
  /** per bone: largest |twist| and swing */
  bones: Record<string, { twist: Worst; swing: Worst }>;
  /** every (run, measure, side) past its limit: worst excess of each */
  over: { run: TorsionRun; key: MeasureKey; side?: Side; value: number; limit: number; t: number }[];
}

export interface Champion {
  id: string;
  rig: CoachRig;
  offsets?: StanceOffsets;
}

/**
 * Every non-partner technique, in every stance style of its disciplines, orthodox and southpaw, with
 * the discipline guard and (when the coach has one) the coach's own guard, sampled at `fps`.
 */
export function measureLibrary(champions: Champion[], fps = 60): TorsionReport {
  const worst = {} as TorsionReport['worst'];
  const excess = {} as TorsionReport['excess'];
  const bones: TorsionReport['bones'] = {};
  const over: TorsionReport['over'] = [];
  let runs = 0;
  let frames = 0;
  for (const c of champions) {
    const profiles = [undefined, ...(c.offsets ? [{ id: c.id, offsets: c.offsets }] : [])];
    for (const t of TECHNIQUES) {
      if (t.mode === 'partenaire') continue;
      const styles = [...new Set(t.disciplines.map(styleOf))];
      for (const style of styles)
        for (const profile of profiles)
          for (const southpaw of [false, true]) {
            const m = getMotion(getLibrary(c.rig, style, profile), t.motion, southpaw);
            if (!m) continue;
            const dur = duration(m);
            const n = Math.max(1, Math.round(dur * fps));
            const run: TorsionRun = { coach: c.id, technique: t.id, motion: t.motion, style, southpaw, profile: !!profile, frames: n + 1 };
            runs++;
            const s = new MotionSampler(c.rig, m);
            const runOver = new Map<string, TorsionReport['over'][number]>();
            for (let i = 0; i <= n; i++) {
              const time = (dur * i) / n;
              c.rig.apply(s.sample(time));
              const ms = measureTorsions(c.rig);
              frames++;
              for (const [b, v] of Object.entries(ms.bones)) {
                const e = (bones[b] ??= { twist: { value: -1, run, t: 0 }, swing: { value: -1, run, t: 0 } });
                if (Math.abs(v.twist) > e.twist.value) e.twist = { value: Math.abs(v.twist), run, t: time };
                if (v.swing > e.swing.value) e.swing = { value: v.swing, run, t: time };
              }
              for (const r of readings(ms)) {
                const w = worst[r.key];
                if (!w || r.value > w.value) worst[r.key] = { value: r.value, run, t: time, side: r.side };
                const ex = r.value - r.limit;
                const e = excess[r.key];
                if (!e || ex > e.value) excess[r.key] = { value: ex, run, t: time, side: r.side };
                if (ex > 0) {
                  const k = `${r.key}:${r.side ?? ''}`;
                  const prev = runOver.get(k);
                  if (!prev || ex > prev.value - prev.limit) runOver.set(k, { run, key: r.key, side: r.side, value: r.value, limit: r.limit, t: time });
                }
              }
            }
            over.push(...runOver.values());
          }
    }
  }
  return { runs, frames, worst, excess, bones, over };
}

// ------------------------------------------------------------------ summary (stored before/after)

export interface MeasureSummary {
  /** reference limit, degrees (null: depends on the knee flexion, or reported only) */
  limit: number | null;
  /** worst raw value and where */
  worst: number;
  where: string;
  /** worst excess past the limit (<= 0: always inside) */
  excess: number;
  /** techniques past the limit, worst excess of each, largest first */
  techniques: { technique: string; excess: number }[];
}

export interface TorsionSummary {
  runs: number;
  frames: number;
  measures: Record<MeasureKey, MeasureSummary>;
  bones: Record<string, { twist: number; twistWhere: string; swing: number }>;
}

const r1 = (x: number) => Math.round(x * 10) / 10;

export const describeWorst = (w: Worst) =>
  `${w.run.coach} ${w.run.technique} (${w.run.style}${w.run.southpaw ? ', gaucher' : ''}${w.run.profile ? ', garde du coach' : ''}) t=${w.t.toFixed(2)} s${w.side ? ` côté ${w.side}` : ''}`;

/** compact, JSON-friendly digest of a report (what MESURES_TORSIONS.md shows) */
export function summarize(r: TorsionReport): TorsionSummary {
  const measures = {} as TorsionSummary['measures'];
  const limits = TORSION_LIMITS as unknown as Partial<Record<MeasureKey, number>>;
  for (const key of Object.keys(r.worst) as MeasureKey[]) {
    const w = r.worst[key];
    const byTech = new Map<string, number>();
    for (const o of r.over) if (o.key === key) byTech.set(o.run.technique, Math.max(byTech.get(o.run.technique) ?? 0, o.value - o.limit));
    const ex = r.excess[key].value;
    measures[key] = {
      limit: limits[key] ?? null,
      worst: r1(w.value),
      where: describeWorst(w),
      excess: Number.isFinite(ex) ? r1(ex) : -999,
      techniques: [...byTech].sort((a, b) => b[1] - a[1]).map(([technique, excess]) => ({ technique, excess: r1(excess) })),
    };
  }
  const bones: TorsionSummary['bones'] = {};
  for (const [b, v] of Object.entries(r.bones)) bones[b] = { twist: r1(v.twist.value), twistWhere: describeWorst(v.twist), swing: r1(v.swing.value) };
  return { runs: r.runs, frames: r.frames, measures, bones };
}
