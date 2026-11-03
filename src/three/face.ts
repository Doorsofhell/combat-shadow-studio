import { Bone, Object3D, Quaternion, Vector3 } from 'three';

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
 */

type Side = 'L' | 'R';
export interface FaceOptions {
  still?: boolean;
  effort?: number;
  blink?: number;
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
}

const MM = 0.001;
const UP = new Vector3(0, 1, 0);
const FWD = new Vector3(0, 0, 1);
const tmpQ = new Quaternion();
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
  private last: Vector3[] = [];
  private rand: () => number;
  private t = 0;
  private nextBlink = 1.5;
  private blinkAt = -1;
  private effort = 0;
  private peak = 0;
  private gaze = { yaw: 0, pitch: 0, toYaw: 0, toPitch: 0, next: 0.8 };

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
      if (inner) this.movers.push({ bone: inner, ...rest(inner), d: toParent(inner, UP.clone().multiplyScalar(-6 * MM).addScaledVector(lat, -3 * MM * sign)) });
      if (outer) this.movers.push({ bone: outer, ...rest(outer), d: toParent(outer, UP.clone().multiplyScalar(-4 * MM)) });
      if (corner) this.movers.push({ bone: corner, ...rest(corner), d: toParent(corner, lat.clone().multiplyScalar(2.5 * MM * sign).addScaledVector(FWD, -1.5 * MM)) });
    }
    const mid = find(root, 'Face_MMiddleEyebrow');
    if (mid) this.movers.push({ bone: mid, ...rest(mid), d: toParent(mid, UP.clone().multiplyScalar(-4 * MM)) });
    const jaw = find(root, 'Face_MJaw');
    if (jaw) this.jaw = { bone: jaw, q: rest(jaw).q, axis: toBone(jaw, lat) };
    for (const n of ['LeftHand', 'RightHand', 'LeftFoot', 'RightFoot']) {
      const b = find(root, n);
      if (b) this.ends.push(b);
    }
    this.last = this.ends.map((b) => b.getWorldPosition(new Vector3()));
    this.active = this.lids.length > 0 || this.eyes.length > 0;
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
    const target = Math.min(1, Math.max(0, (v - 1.6) / 3.5));
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
    const squint = 0.45 * this.effort;
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
      g.toYaw = (this.rand() - 0.5) * 0.14;
      g.toPitch = (this.rand() - 0.5) * 0.07;
      g.next = this.t + 0.6 + this.rand() * 1.8;
    }
    if (still) g.toYaw = g.toPitch = 0;
    const s = Math.min(1, dt / 0.04);
    g.yaw += (g.toYaw - g.yaw) * s;
    g.pitch += (g.toPitch - g.pitch) * s;
    for (const e of this.eyes) {
      e.bone.quaternion.copy(e.q).multiply(tmpQ.setFromAxisAngle(e.yaw, g.yaw)).multiply(tmpQ.setFromAxisAngle(e.pitch, g.pitch + 0.03 * close));
    }

    for (const m of this.movers) {
      m.bone.position.copy(m.p).addScaledVector(m.d, this.effort);
      m.bone.quaternion.copy(m.q);
    }
    // the jaw sets and opens a crack on the exhale of the strike (2.5° at full effort)
    if (this.jaw) this.jaw.bone.quaternion.copy(this.jaw.q).multiply(tmpQ.setFromAxisAngle(this.jaw.axis, (2.5 * Math.PI * this.effort) / 180));
  }

  /** for the tests: current blink and effort */
  get state() {
    return { effort: this.effort, blinking: this.blinkAt >= 0 };
  }
}
