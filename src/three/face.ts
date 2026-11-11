import { Bone, Mesh, Object3D, Quaternion, Vector3 } from 'three';

/**
 * 1.9 (Youssef, 2026-10-29: « l'expression des visages est trop statique, fait quelque chose »): a living face for
 * the Ultra-réaliste coaches, driven by the facial bones of the model (Rocketbox names: Face_LEyeBlinkTop,
 * Face_LInnerEyebrow, Face_MJaw, LeftEye…; Axel and Kaila get the same bones from the MakeHuman face rig in
 * tools/generator/makehuman/build_photo.py).
 *
 * - blinks: every 2 to 6 s (a double blink now and then), and at the moment of a strike's peak effort;
 * - eyes: small saccades around the line of sight, a fighter looks ahead at the opponent;
 * - effort: when the hands or feet move fast (a strike), the brows come down and together, the eyes narrow,
 *   the jaw sets with a short exhale; it eases off as the limb comes back.
 *
 * The body animation never reads these bones: the technique shown is unchanged. Movements are given in metres
 * and degrees in the frame of the head at rest, so the same values suit every model. Seeded random: the same
 * coach blinks the same way from one run to the next.
 *
 * 1.16 (Youssef 04/11 14:16 « applique ta proposition »): the Rocketbox coaches now carry 25 of the avatars' own
 * facial expressions as morph targets (ARKit names, tools/generator/rocketbox/morph_{extract,apply}): when the model
 * has them, the lids, brows, cheeks, nose and mouth move with them (whole surfaces, a centimetre for a blink)
 * instead of the few facial bones; the eyes still turn with their bones.
 */

type Side = 'L' | 'R';
export interface FaceOptions {
  still?: boolean;
  effort?: number;
  blink?: number;
  /** imposed expression weights (Lab ?expr=), ARKit names without their number: { JawOpen: 1 } */
  expr?: Record<string, number>;
}

/** the expressions used, by ARKit name (the model's targets are named AK_nn_<name>) */
export const FACE_EXPRESSIONS = [
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight', 'EyeBlinkLeft',
  'EyeBlinkRight', 'EyeSquintLeft', 'EyeSquintRight', 'EyeWideLeft', 'EyeWideRight', 'JawOpen', 'MouthClose',
  'MouthFrownLeft', 'MouthFrownRight', 'MouthFunnel', 'MouthPressLeft', 'MouthPressRight', 'MouthSmileLeft',
  'MouthSmileRight', 'MouthStretchLeft', 'MouthStretchRight', 'NoseSneerLeft', 'NoseSneerRight',
] as const;
export type FaceExpression = (typeof FACE_EXPRESSIONS)[number];

/**
 * the face for a given blink (0..1), effort (0..1) and exhale (0..1): weights of the expressions. Effort: brows
 * down and together, eyes narrowed, cheeks raised, nose wrinkled a little, lips pressed (the jaw sets). Exhale: the
 * short breath of the strike, lips rounded and parted. Kept moderate: a set face, not a grimace.
 */
/**
 * 1.20 (Youssef, 05/11 13:42: « les expressions du visage sont toujours trop figées »): between two strikes the face
 * had nothing but blinks and glances. The life of a face at rest, all slow (seconds) and small:
 * - focus: the look of a fighter reading the opponent, brows lowered a little, eyes narrowed;
 * - brow: the inner brows lift now and then;
 * - mouth: lips pressed (determination) or a faint, uneven smile; side: which corner leads (-1 left .. 1 right);
 * - breath: the breathing cycle (0 out .. 1 in): the nostrils open and the lips part a little on the way in.
 */
export interface FaceIdle {
  focus: number;
  brow: number;
  press: number;
  smile: number;
  side: number;
  breath: number;
}

/** 1.33 strength of the face at rest and of the strike's effort, relative to 1.20 (also used by the bone faces) */
export const FACE_GAIN = { rest: 2.5, effort: 2 } as const;
export function expressionWeights(blink: number, effort: number, exhale: number, idle?: FaceIdle): Partial<Record<FaceExpression, number>> {
  const e = effort;
  const i = idle ?? { focus: 0, brow: 0, press: 0, smile: 0, side: 0, breath: 0 };
  // the face at rest gives way to the strike's effort
  const rest = 1 - e;
  const f = i.focus * rest;
  // 1.33 (Youssef 11/11: « le visage de Kadir n'est pas du tout expressif »): the avatars' own expressions are small
  // (a full smile moves the mouth corner 4 mm), so the face at rest is now about 2.5 times stronger and the strike's
  // effort twice as strong as in 1.20; every weight stays within 0..1 (FaceAnimator clamps them)
  const R = FACE_GAIN.rest;
  const E = FACE_GAIN.effort;
  const lid = Math.max(blink, 0.2 * E * e + 0.12 * R * f);
  const press = 0.5 * E * e * (1 - exhale) + 0.3 * R * i.press * rest;
  const smile = 0.28 * R * i.smile * rest * (1 - i.press);
  const sl = smile * (1 - 0.35 * Math.max(0, i.side));
  const sr = smile * (1 + 0.35 * Math.min(0, i.side));
  const nose = 0.35 * E * e + 0.12 * i.breath * rest;
  const brow = 0.9 * E * e + 0.3 * R * f;
  const squint = 0.9 * E * e + 0.3 * R * f;
  const w: Partial<Record<FaceExpression, number>> = {
    EyeBlinkLeft: lid, EyeBlinkRight: lid,
    EyeSquintLeft: squint, EyeSquintRight: squint,
    CheekSquintLeft: 0.55 * E * e + 0.6 * sl, CheekSquintRight: 0.55 * E * e + 0.6 * sr,
    BrowDownLeft: brow, BrowDownRight: brow,
    BrowInnerUp: 0.35 * R * i.brow * rest,
    NoseSneerLeft: nose, NoseSneerRight: nose,
    MouthPressLeft: press, MouthPressRight: press,
    MouthSmileLeft: sl, MouthSmileRight: sr,
    MouthStretchLeft: 0.3 * E * e, MouthStretchRight: 0.3 * E * e,
    // the exhale of the strike: lips rounded and the jaw open (a sharp breath out, « tss »), well visible since 1.33
    MouthFunnel: 1.0 * exhale,
    JawOpen: 0.55 * exhale + 0.05 * i.breath * rest,
  };
  for (const k of Object.keys(w) as FaceExpression[]) w[k] = Math.min(1, w[k]!);
  return w;
}
interface Lid {
  bone: Bone;
  p: Vector3;
  q: Quaternion;
  /** translation that closes the lid fully, in the parent's space (lid bones on the lid surface: Rocketbox) */
  close: Vector3;
  /** rotation axis in the bone's own space and full-close angle (lid bones at the eye centre: MakeHuman) */
  axis: Vector3 | null;
  angle: number;
}
interface Mover {
  bone: Bone;
  p: Vector3;
  q: Quaternion;
  /** displacement per unit of effort, in the parent's space */
  d: Vector3;
  /** 1.21 the face at rest on the bone faces (Axel, Kaila): which feature, its side (1 left, -1 right), and for a
   * mouth corner the displacement of a smile */
  kind?: 'inner' | 'outer' | 'mid' | 'corner';
  side?: number;
  smile?: Vector3;
}

const MM = 0.001;
const UP = new Vector3(0, 1, 0);
const FWD = new Vector3(0, 0, 1);
const tmpQ = new Quaternion();
const tmpQ2 = new Quaternion();
const tmpV = new Vector3();

function find(root: Object3D, name: string): Bone | null {
  let hit: Bone | null = null;
  root.traverse((o) => {
    if (!hit && (o as Bone).isBone && o.name.replace(/^mixamorig[:]?/i, '') === name) hit = o as Bone;
  });
  return hit;
}

/** rest pose of a bone (pose.ts keeps it in userData.cssRef) */
function rest(b: Bone): { p: Vector3; q: Quaternion } {
  const ref = b.userData.cssRef as { p: Vector3; q: Quaternion } | undefined;
  return ref ? { p: ref.p.clone(), q: ref.q.clone() } : { p: b.position.clone(), q: b.quaternion.clone() };
}

/** a world displacement (metres) seen in the parent space of bone b, at rest */
function toParent(b: Bone, world: Vector3): Vector3 {
  const parent = b.parent!;
  const a = parent.worldToLocal(b.getWorldPosition(new Vector3()));
  const c = parent.worldToLocal(b.getWorldPosition(new Vector3()).add(world));
  return c.sub(a);
}

/** a world axis seen in the bone's own space, at rest */
function toBone(b: Bone, axis: Vector3): Vector3 {
  return axis.clone().applyQuaternion(b.getWorldQuaternion(new Quaternion()).invert()).normalize();
}

/**
 * a primitive whose drawn points never move with the expressions (the body, the eyeballs: glTF gives every primitive
 * of a mesh the same targets) loses them: three.js would keep a texture of points × expressions for it in graphics
 * memory (6 MB for the body) for nothing. Returns true when the targets were dropped.
 */
export function dropStillMorphs(m: Mesh): boolean {
  const g = m.geometry;
  const targets = g.morphAttributes.position;
  if (!targets?.length) return false;
  const idx = g.index;
  const n = idx ? idx.count : g.attributes.position.count;
  for (const t of targets)
    for (let i = 0; i < n; i++) {
      const v = idx ? idx.getX(i) : i;
      if (Math.abs(t.getX(v)) + Math.abs(t.getY(v)) + Math.abs(t.getZ(v)) > 1e-6) return false;
    }
  // a clone of the geometry: the loaded model's own geometry may be shared with another primitive
  const c = g.clone();
  c.morphAttributes = {};
  m.geometry = c;
  m.updateMorphTargets();
  m.morphTargetInfluences = undefined;
  m.morphTargetDictionary = undefined;
  return true;
}

/** mulberry32: small seeded generator */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class FaceAnimator {
  /** false when the model has no facial bones (the generated models): update() does nothing */
  readonly active: boolean;
  private lids: { top: Lid; bottom: Lid }[] = [];
  private eyes: { bone: Bone; q: Quaternion; yaw: Vector3; pitch: Vector3 }[] = [];
  private movers: Mover[] = [];
  private jaw: { bone: Bone; q: Quaternion; axis: Vector3 } | null = null;
  private ends: Object3D[] = [];
  /** meshes with the expressions, and the index of each expression in their morphTargetInfluences */
  private morphs: { mesh: Mesh; idx: Partial<Record<FaceExpression, number>> }[] = [];
  private exhale = 0;
  private last: Vector3[] = [];
  private rand: () => number;
  private t = 0;
  private nextBlink = 1.5;
  private blinkAt = -1;
  private effort = 0;
  /** 1.20 the face at rest (FaceIdle): current values, targets, time of the next change, breathing phase */
  private idle: FaceIdle = { focus: 0, brow: 0, press: 0, smile: 0, side: 0, breath: 0 };
  private idleTo: FaceIdle = { focus: 0.5, brow: 0, press: 0.3, smile: 0, side: 0, breath: 0 };
  private idleNext = 0;
  private breathPhase = -Math.PI / 2;
  private peak = 0;
  private gaze = { yaw: 0, pitch: 0, toYaw: 0, toPitch: 0, next: 0.8 };
  /** 1.23 the head's own small life (axes in the bone's space); what was applied last frame, to take it off again
   * when the body pose of the frame did not rewrite the head (paused motion) */
  private head: { bone: Bone; yaw: Vector3; pitch: Vector3; roll: Vector3; out: Quaternion; d: Quaternion; follow: number; followP: number } | null = null;
  private headPhase = [0, 0, 0];
  /** grows from 0 over the first second: the head starts from the pose, never with a jump */
  private headAmp = 0;
  /** 1.23 the shoulders rise on the breath in (clavicle bones, axis in the bone's space, side sign) */
  private shoulders: { bone: Bone; axis: Vector3; side: number; out: Quaternion; d: Quaternion }[] = [];
  /** the body's breath (Breath: -1 out .. 1 in), when the coach has one; the face's own cycle otherwise */
  private bodyBreath: number | null = null;

  /** the model must be in its rest pose (restoreReferencePose) and its world matrices up to date */
  constructor(root: Object3D, seed = 1) {
    this.rand = rng(seed);
    root.updateMatrixWorld(true);
    const lat = new Vector3(1, 0, 0);
    const le = find(root, 'LeftEye');
    const re = find(root, 'RightEye');
    if (le && re) lat.copy(le.getWorldPosition(new Vector3())).sub(re.getWorldPosition(new Vector3())).normalize();
    for (const s of ['L', 'R'] as Side[]) {
      const eye = s === 'L' ? le : re;
      const top = find(root, `Face_${s}EyeBlinkTop`);
      const bot = find(root, `Face_${s}EyeBlinkBottom`);
      if (eye) {
        const r = rest(eye);
        this.eyes.push({ bone: eye, q: r.q, yaw: toBone(eye, UP), pitch: toBone(eye, lat) });
      }
      if (top && bot && eye) {
        const ec = eye.getWorldPosition(new Vector3());
        const tp = top.getWorldPosition(new Vector3());
        const bp = bot.getWorldPosition(new Vector3());
        const lid = (b: Bone, other: Vector3, here: Vector3, k: number, ang: number): Lid => {
          const r = rest(b);
          // a lid bone at the centre of the eye turns the lid around the eyeball; otherwise it slides
          const atCentre = here.distanceTo(ec) < 0.006;
          return {
            bone: b,
            p: r.p,
            q: r.q,
            close: atCentre ? new Vector3() : toParent(b, other.clone().sub(here).multiplyScalar(k)),
            axis: atCentre ? toBone(b, lat) : null,
            angle: ang,
          };
        };
        // the upper lid does most of the travel, the lower one rises a little
        this.lids.push({ top: lid(top, bp, tp, 0.8, (40 * Math.PI) / 180), bottom: lid(bot, tp, bp, 0.2, (-12 * Math.PI) / 180) });
      }
      // effort: inner brow down and toward the nose, outer brow down a little, mouth corners pulled back
      const inner = find(root, `Face_${s}InnerEyebrow`);
      const outer = find(root, `Face_${s}OuterEyebrow`);
      const corner = find(root, `Face_${s}MouthCorner`);
      const sign = s === 'L' ? 1 : -1;
      if (inner) this.movers.push({ bone: inner, ...rest(inner), d: toParent(inner, UP.clone().multiplyScalar(-6 * MM).addScaledVector(lat, -3 * MM * sign)), kind: 'inner', side: sign });
      if (outer) this.movers.push({ bone: outer, ...rest(outer), d: toParent(outer, UP.clone().multiplyScalar(-4 * MM)), kind: 'outer', side: sign });
      if (corner)
        this.movers.push({
          bone: corner,
          ...rest(corner),
          d: toParent(corner, lat.clone().multiplyScalar(2.5 * MM * sign).addScaledVector(FWD, -1.5 * MM)),
          kind: 'corner',
          side: sign,
          // a smile lifts the corner and draws it out and back
          smile: toParent(corner, UP.clone().multiplyScalar(2 * MM).addScaledVector(lat, 1.5 * MM * sign).addScaledVector(FWD, -1 * MM)),
        });
    }
    const headBone = find(root, 'Head');
    if (headBone) {
      const fwd = new Vector3().crossVectors(lat, UP).normalize();
      this.head = { bone: headBone, yaw: toBone(headBone, UP), pitch: toBone(headBone, lat), roll: toBone(headBone, fwd), out: new Quaternion(), d: new Quaternion(), follow: 0, followP: 0 };
      this.headPhase = [this.rand() * 6.28, this.rand() * 6.28, this.rand() * 6.28];
      for (const [n, side] of [['LeftShoulder', 1], ['RightShoulder', -1]] as const) {
        const b = find(root, n);
        const sideOf = b ? Math.sign(b.getWorldPosition(new Vector3()).sub(headBone.getWorldPosition(new Vector3())).dot(lat)) || side : side;
        if (b) this.shoulders.push({ bone: b, axis: toBone(b, fwd), side: sideOf, out: new Quaternion(), d: new Quaternion() });
      }
    }
    const mid = find(root, 'Face_MMiddleEyebrow');
    if (mid) this.movers.push({ bone: mid, ...rest(mid), d: toParent(mid, UP.clone().multiplyScalar(-4 * MM)), kind: 'mid' });
    const jaw = find(root, 'Face_MJaw');
    if (jaw) this.jaw = { bone: jaw, q: rest(jaw).q, axis: toBone(jaw, lat) };
    for (const n of ['LeftHand', 'RightHand', 'LeftFoot', 'RightFoot']) {
      const b = find(root, n);
      if (b) this.ends.push(b);
    }
    this.last = this.ends.map((b) => b.getWorldPosition(new Vector3()));
    root.traverse((o) => {
      const m = o as Mesh;
      const dict = m.isMesh ? m.morphTargetDictionary : undefined;
      if (!dict || !m.morphTargetInfluences) return;
      const idx: Partial<Record<FaceExpression, number>> = {};
      for (const [k, i] of Object.entries(dict)) {
        const name = k.replace(/^AK_\d+_/, '') as FaceExpression;
        if ((FACE_EXPRESSIONS as readonly string[]).includes(name)) idx[name] = i;
      }
      if (idx.EyeBlinkLeft !== undefined) this.morphs.push({ mesh: m, idx });
    });
    // the expressions replace the lid, brow, mouth and jaw bones (both at once would close the eyes twice)
    if (this.morphs.length) {
      this.lids = [];
      this.movers = [];
      this.jaw = null;
    }
    this.active = this.lids.length > 0 || this.eyes.length > 0 || this.morphs.length > 0;
  }

  /**
   * after the body pose of the frame. still: no blink nor saccade (fixed images: Lab, portraits, illustrations);
   * effort / blink: imposed values (Lab ?effort= &blink=), the measured ones otherwise
   */
  update(dt: number, opts: FaceOptions = {}) {
    const still = !!opts.still;
    if (!this.active || dt <= 0) return;
    this.t += dt;
    // effort from the speed of the fastest hand or foot (a punch reaches 6 to 10 m/s, a step 1 to 2)
    let v = 0;
    this.ends.forEach((b, i) => {
      const p = b.getWorldPosition(tmpV);
      v = Math.max(v, p.distanceTo(this.last[i]) / dt);
      this.last[i].copy(p);
    });
    const target = Math.min(1, Math.max(0, (v - 1.3) / 3.2));
    // quick onset, slower release: the face sets as the strike leaves and relaxes after it
    this.effort += (target - this.effort) * Math.min(1, dt / (target > this.effort ? 0.05 : 0.35));
    if (opts.effort !== undefined) this.effort = opts.effort;
    if (this.effort > 0.75 && this.peak < 0.75 && !still && this.blinkAt < 0 && this.rand() < 0.5) this.blinkAt = this.t;
    this.peak = this.effort;

    // blinks: 0.07 s closing, 0.12 s opening
    if (!still && this.blinkAt < 0 && this.t >= this.nextBlink) {
      this.blinkAt = this.t;
      this.nextBlink = this.t + 2 + this.rand() * 4 + (this.rand() < 0.15 ? -1.7 : 0);
    }
    let blink = 0;
    if (this.blinkAt >= 0) {
      const u = this.t - this.blinkAt;
      blink = u < 0.07 ? u / 0.07 : u < 0.19 ? 1 - (u - 0.07) / 0.12 : 0;
      if (u >= 0.19) this.blinkAt = -1;
    }
    if (still) blink = 0;
    if (opts.blink !== undefined) blink = opts.blink;
    // 1.20 the face at rest: a new mood every 2 to 5 s, reached over about a second; breathing 15 a minute,
    // faster after effort (1.21: also on the faces driven by bones, Axel and Kaila)
    if (!still) {
      const I = this.idleTo;
      if (this.t >= this.idleNext) {
        const r = this.rand();
        I.focus = 0.35 + 0.65 * this.rand();
        I.brow = this.rand() < 0.3 ? 0.4 + 0.6 * this.rand() : 0;
        // pressed lips most of the time, a faint smile now and then, otherwise relaxed
        I.press = r < 0.45 ? 0.5 + 0.5 * this.rand() : 0;
        I.smile = r > 0.8 ? 0.5 + 0.5 * this.rand() : 0;
        I.side = this.rand() * 2 - 1;
        this.idleNext = this.t + 2 + this.rand() * 3;
      }
      const k = Math.min(1, dt / 0.9);
      for (const key of ['focus', 'brow', 'press', 'smile', 'side'] as const) this.idle[key] += (I[key] - this.idle[key]) * k;
      this.breathPhase += dt * 2 * Math.PI * (0.25 + 0.2 * this.effort);
      // 1.23 the face breathes with the chest (the same cycle, the nostrils and lips open on the way in)
      this.idle.breath = this.bodyBreath !== null ? Math.max(0, Math.min(1, 0.5 + 0.5 * this.bodyBreath)) : 0.5 + 0.5 * Math.sin(this.breathPhase);
    }
    const rest = 1 - this.effort;
    const idle = still ? null : this.idle;
    const squint = 0.45 * this.effort + (idle ? 0.24 * idle.focus * rest : 0);
    const close = Math.max(blink, squint);
    for (const { top, bottom } of this.lids) {
      for (const [lid, k] of [
        [top, close],
        [bottom, Math.max(blink, squint * 1.4)],
      ] as const) {
        lid.bone.position.copy(lid.p).addScaledVector(lid.close, k);
        lid.bone.quaternion.copy(lid.q);
        if (lid.axis) lid.bone.quaternion.multiply(tmpQ.setFromAxisAngle(lid.axis, lid.angle * k));
      }
    }

    // gaze: a new fixation point every 0.6 to 2.4 s, a few degrees around straight ahead; quick saccade
    const g = this.gaze;
    if (!still && this.t >= g.next) {
      // 1.23 now and then a real glance aside (up to 12°), held a little longer; the head follows it in part
      const away = this.rand() < 0.18;
      g.toYaw = (this.rand() - 0.5) * (away ? 0.42 : 0.14);
      g.toPitch = (this.rand() - 0.5) * (away ? 0.12 : 0.07);
      g.next = this.t + (away ? 0.9 + this.rand() * 0.9 : 0.6 + this.rand() * 1.8);
    }
    if (still) g.toYaw = g.toPitch = 0;
    const s = Math.min(1, dt / 0.04);
    g.yaw += (g.toYaw - g.yaw) * s;
    g.pitch += (g.toPitch - g.pitch) * s;
    for (const e of this.eyes) {
      e.bone.quaternion.copy(e.q).multiply(tmpQ.setFromAxisAngle(e.yaw, g.yaw)).multiply(tmpQ.setFromAxisAngle(e.pitch, g.pitch + 0.03 * close));
    }

    this.moveHead(dt, still, rest);

    for (const m of this.movers) {
      // 1.33 stronger, as the expressions above (the bone faces of Axel and Kaila: effort ×1.6, rest ×2)
      let k = 1.6 * this.effort;
      m.bone.position.copy(m.p);
      if (idle) {
        // at rest, the same features as the expressions of the other coaches, smaller: brows a little lowered by
        // focus, the inner brows lifted now and then, the mouth corners in a faint uneven smile
        if (m.kind === 'inner') k += FACE_GAIN.rest * 0.8 * (0.3 * idle.focus - 0.6 * idle.brow) * rest;
        else if (m.kind === 'outer' || m.kind === 'mid') k += FACE_GAIN.rest * 0.8 * 0.3 * idle.focus * rest;
        else if (m.kind === 'corner' && m.smile) {
          const lead = 1 + 0.35 * idle.side * (m.side ?? 0);
          m.bone.position.addScaledVector(m.smile, FACE_GAIN.rest * 0.8 * 0.5 * idle.smile * (1 - idle.press) * rest * lead);
          k += FACE_GAIN.rest * 0.8 * 0.25 * idle.press * rest;
        }
      }
      m.bone.position.addScaledVector(m.d, k);
      m.bone.quaternion.copy(m.q);
    }
    // the jaw sets and opens a crack on the exhale of the strike (2.5° at full effort); 1.21 at rest it follows the
    // breathing (up to 0.8°)
    if (this.jaw) {
      const a = 4 * this.effort + (idle ? 0.8 * idle.breath * rest : 0);
      this.jaw.bone.quaternion.copy(this.jaw.q).multiply(tmpQ.setFromAxisAngle(this.jaw.axis, (a * Math.PI) / 180));
    }
    if (this.morphs.length) {
      // the exhale follows the effort with a short delay and lasts a little longer (breath out as the strike lands)
      const ex = still ? 0 : this.effort;
      this.exhale += (ex - this.exhale) * Math.min(1, dt / (ex > this.exhale ? 0.09 : 0.25));
      const w = opts.expr ?? expressionWeights(blink, this.effort, this.exhale, still ? undefined : this.idle);
      for (const { mesh, idx } of this.morphs) {
        const inf = mesh.morphTargetInfluences!;
        inf.fill(0);
        for (const [k, v] of Object.entries(w)) {
          const i = idx[k as FaceExpression];
          if (i !== undefined) inf[i] = Math.max(0, Math.min(1, v ?? 0));
        }
      }
    }
  }

  /**
   * 1.23 (Youssef 05/11 20:03: « les visages sont trop figés… sans trop de développement »): the motion engine
   * holds the head exactly on the opponent, so between strikes the face was a mask on a still head. A slow drift of
   * the head (three sines, up to 2.7° of turn, 1.6° of nod, 1° of tilt) and a share of each glance; it gives way to
   * the strike's effort and is nil on still images
   */
  private moveHead(dt: number, still: boolean, rest: number) {
    const h = this.head;
    if (!h) return;
    const q = h.bone.quaternion;
    // the engine rewrote the head this frame unless it still holds what was left last frame
    const same = Math.abs(q.x - h.out.x) + Math.abs(q.y - h.out.y) + Math.abs(q.z - h.out.z) + Math.abs(q.w - h.out.w) < 1e-6;
    if (same) q.multiply(tmpQ.copy(h.d).invert());
    if (still) {
      h.d.identity();
      h.out.copy(q);
      for (const sh of this.shoulders) {
        const sq = sh.bone.quaternion;
        if (Math.abs(sq.x - sh.out.x) + Math.abs(sq.y - sh.out.y) + Math.abs(sq.z - sh.out.z) + Math.abs(sq.w - sh.out.w) < 1e-6) sq.multiply(tmpQ.copy(sh.d).invert());
        sh.d.identity();
        sh.out.copy(sq);
      }
      return;
    }
    const t = this.t;
    const [a, b, c] = this.headPhase;
    const deg = Math.PI / 180;
    // the head turns after the eyes, slowly (a glance of 12° brings it round 3.6° in about a second)
    h.follow += (this.gaze.yaw - h.follow) * Math.min(1, dt / 0.8);
    h.followP += (this.gaze.pitch - h.followP) * Math.min(1, dt / 0.8);
    this.headAmp += (1 - this.headAmp) * Math.min(1, dt / 1.2);
    const amp = rest * rest * this.headAmp * this.headAmp;
    const yaw = amp * (deg * 1.8 * Math.sin(0.37 * t + a) + deg * 0.9 * Math.sin(0.91 * t + b) + 0.3 * h.follow);
    const pitch = amp * (deg * 1.1 * Math.sin(0.29 * t + b) + deg * 0.5 * Math.sin(0.77 * t + c) + 0.25 * h.followP);
    const roll = amp * deg * (0.7 * Math.sin(0.23 * t + c) + 0.3 * Math.sin(0.61 * t + a));
    h.d
      .setFromAxisAngle(h.yaw, yaw)
      .multiply(tmpQ.setFromAxisAngle(h.pitch, pitch))
      .multiply(tmpQ2.setFromAxisAngle(h.roll, roll));
    q.multiply(h.d);
    h.out.copy(q);
    // 1.23 (Youssef 20:04: « respiration aussi, c'est très important dans les disciplines traitées »): the shoulders
    // rise a little on the breath in (up to 1.6°, more when the coach is out of breath after strikes)
    const inhale = this.bodyBreath ?? Math.sin(this.breathPhase);
    for (const sh of this.shoulders) {
      const sq = sh.bone.quaternion;
      const same2 = Math.abs(sq.x - sh.out.x) + Math.abs(sq.y - sh.out.y) + Math.abs(sq.z - sh.out.z) + Math.abs(sq.w - sh.out.w) < 1e-6;
      if (same2) sq.multiply(tmpQ.copy(sh.d).invert());
      const lift = deg * (1.1 + 0.5 * this.effort) * Math.max(0, inhale) * (1 - 0.7 * this.effort);
      sh.d.setFromAxisAngle(sh.axis, lift * sh.side);
      sq.multiply(sh.d);
      sh.out.copy(sq);
    }
  }

  /** 1.23 the body's breath of this frame (Breath.amount.x: -1 breathed out .. 1 breathed in) */
  setBreath(v: number | null) {
    this.bodyBreath = v;
  }

  /** for the tests: current blink and effort */
  get state() {
    return { effort: this.effort, blinking: this.blinkAt >= 0, expressions: this.morphs.length > 0 };
  }
}
