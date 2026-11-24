import { Bone, BufferAttribute, BufferGeometry, Matrix4, Quaternion, Skeleton, Vector3, type Object3D, type SkinnedMesh } from 'three';
import { REST_SKIN } from '../engine';

/**
 * 2.5.0 (Youssef, 2026-11-20 « os de torsion et corrections de volume, tout de suite sur les six coachs »):
 * helper bones of the skin, added when a coach is loaded, so the joints keep their volume in the big motions.
 *
 * Before: the Rocketbox skeleton (bones renamed Mixamo) has no twist bone and no corrective. With linear skinning,
 *  - the forearm turned as one block (55 % of the pronation already at the elbow, src/engine/rig.ts) and the wrist
 *    jumped the rest: the elbow and the wrist pinched like a sweet wrapper;
 *  - the arm and the thigh turned whole about their line, up to the shoulder and the groin;
 *  - in a bend, the points of the crease (elbow, knee, hip, armpit) took the average of two bones and sank
 *    toward the joint: the elbow and the knee thinned, the hip and the shoulder collapsed.
 *
 * Now:
 *  - twist bones (children of the arm, the forearm, the thigh) spread the turn along the limb: the forearm goes from
 *    0 at the elbow to the hand's whole turn at the wrist; the arm and the thigh turn less near the trunk;
 *  - one « half » bone per joint (shoulder, elbow, hip, knee) follows half of the bend: the points of the crease
 *    turn about the joint instead of sinking toward it, with a light swelling (JOINT_PUFF) as a muscle does;
 *  - the skin weights are redistributed to these bones at load time, on the body and on the garments (same rule).
 *
 * What does not change: the main bones, their names and their rotations (the motion engine, the limits and every
 * animation read and drive exactly the same skeleton), the positions, normals, textures and the GLB files. The
 * helper bones are driven after each image from the main bones only (TwistRig.update), never the other way round.
 * The motion measures (CoachRig.readOutline) keep reading the original weights (REST_SKIN).
 */

export const TWIST = {
  /** share of the arm's own turn taken back near the shoulder (t = 0) and in the middle of the arm (t = 0.5) */
  arm: [0.6, 0.3] as const,
  /** same for the thigh, near the groin and in the middle */
  thigh: [0.6, 0.3] as const,
  /** share of the crease given to the half bone (0: off, 1: the whole crease) */
  half: 0.9,
  /** swelling of a bent joint, per radian of bend (0.05: +7.9 % at 90°); measured (docs/v250/MESURES_TORSION.md): more swells past the rest volume */
  puff: 0.05,
};

type SideName = 'Left' | 'Right';
const SIDES: SideName[] = ['Left', 'Right'];

/** the bone that measures and owns a helper: its parent for a twist bone, the joint's own bone for a half bone */
interface HelperDef {
  name: string;
  /** the bone it hangs from (a half bone: the joint's parent, one of the names separated by |) */
  parent: string;
  kind: 'twist' | 'half';
  /** twist: the bone giving the limb's line (child of parent); half: the joint bone it copies half of */
  child: string;
  /** half: the bone giving the child's own line (its child) */
  grandchild?: string;
  /** twist: place along the limb, 0 at the parent's joint, 1 at the child's */
  t?: number;
  /** the main bone whose skin share it takes (for the motion measures: owner of the points it carries) */
  owner: string;
}

function helperDefs(): HelperDef[] {
  const out: HelperDef[] = [];
  for (const S of SIDES) {
    out.push(
      { name: `${S}ArmTwist0`, parent: `${S}Arm`, kind: 'twist', child: `${S}ForeArm`, t: 0, owner: `${S}Arm` },
      { name: `${S}ArmTwist1`, parent: `${S}Arm`, kind: 'twist', child: `${S}ForeArm`, t: 0.5, owner: `${S}Arm` },
      { name: `${S}ForeArmTwist0`, parent: `${S}ForeArm`, kind: 'twist', child: `${S}Hand`, t: 0, owner: `${S}ForeArm` },
      { name: `${S}ForeArmTwist1`, parent: `${S}ForeArm`, kind: 'twist', child: `${S}Hand`, t: 0.5, owner: `${S}ForeArm` },
      { name: `${S}ForeArmTwist2`, parent: `${S}ForeArm`, kind: 'twist', child: `${S}Hand`, t: 1, owner: `${S}ForeArm` },
      { name: `${S}UpLegTwist0`, parent: `${S}UpLeg`, kind: 'twist', child: `${S}Leg`, t: 0, owner: `${S}UpLeg` },
      { name: `${S}UpLegTwist1`, parent: `${S}UpLeg`, kind: 'twist', child: `${S}Leg`, t: 0.5, owner: `${S}UpLeg` },
      { name: `${S}ShoulderHalf`, parent: `${S}Shoulder`, kind: 'half', child: `${S}Arm`, grandchild: `${S}ForeArm`, owner: `${S}Arm` },
      { name: `${S}ElbowHalf`, parent: `${S}Arm`, kind: 'half', child: `${S}ForeArm`, grandchild: `${S}Hand`, owner: `${S}ForeArm` },
      { name: `${S}HipHalf`, parent: 'Hips|Spine', kind: 'half', child: `${S}UpLeg`, grandchild: `${S}Leg`, owner: `${S}UpLeg` },
      { name: `${S}KneeHalf`, parent: `${S}UpLeg`, kind: 'half', child: `${S}Leg`, grandchild: `${S}Foot`, owner: `${S}Leg` },
    );
  }
  return out;
}
export const TWIST_HELPERS: readonly HelperDef[] = helperDefs();
export const TWIST_HELPER_NAMES = new Set(TWIST_HELPERS.map((h) => h.name));

const norm = (n: string) => n.replace(/^mixamorig[:]?/i, '').replace(/:/g, '');

/** the main bone a helper's points belong to, for the motion measures (identity for a main bone) */
export function ownerOf(name: string): string {
  const h = TWIST_HELPERS.find((d) => d.name === name);
  return h ? h.owner : name;
}

// ---------------------------------------------------------------------------------------------------------------
// skin weights (pure: arrays in, arrays out; used at load time and by the Node measures of the tests)

export interface SkinInput {
  /** vertex positions in the mesh's own space, 3 per vertex */
  pos: ArrayLike<number>;
  /** 4 joints and 4 weights per vertex, indices into names/ibm */
  joints: ArrayLike<number>;
  weights: ArrayLike<number>;
  /** the skin's bone names (main bones; any prefix is ignored) and their inverse bind matrices */
  names: string[];
  ibm: Matrix4[];
  bindMatrix: Matrix4;
}

export interface SkinOutput {
  joints: Uint16Array;
  weights: Float32Array;
  /** the helpers appended after the original joints (index = names.length + k), with their inverse bind matrices */
  helpers: HelperDef[];
  helperIbm: Matrix4[];
  /** points whose weights changed */
  changed: number;
}

/** where a helper sits at rest, in its parent's space, read from the inverse bind matrices of the skin */
function helperRest(d: HelperDef, ibmOf: (n: string) => Matrix4 | undefined): { pos: Vector3; q: Quaternion; ibm: Matrix4 } | null {
  const C = ibmOf(d.child);
  if (!C) return null;
  if (d.kind === 'half') return { pos: new Vector3(), q: new Quaternion(), ibm: C.clone() };
  const P = ibmOf(d.parent);
  if (!P) return null;
  // child in parent space = P · C⁻¹ (bind world of the child seen from the parent's bind frame)
  const local = P.clone().multiply(C.clone().invert());
  const pos = new Vector3();
  const q = new Quaternion();
  local.decompose(pos, q, new Vector3());
  const at = pos.clone().multiplyScalar(d.t ?? 0);
  return { pos: at, q: new Quaternion(), ibm: new Matrix4().makeTranslation(-at.x, -at.y, -at.z).multiply(P) };
}

export function twistSkin(input: SkinInput): SkinOutput {
  const names = input.names.map(norm);
  const index = new Map(names.map((n, i) => [n, i]));
  const ibmOf = (n: string) => {
    const i = index.get(n);
    return i === undefined ? undefined : input.ibm[i];
  };
  const helpers: HelperDef[] = [];
  const helperIbm: Matrix4[] = [];
  const rest = new Map<string, { pos: Vector3; ibm: Matrix4 }>();
  for (const d of TWIST_HELPERS) {
    const r = helperRest(d, ibmOf);
    if (!r) continue;
    helpers.push(d);
    helperIbm.push(r.ibm);
    rest.set(d.name, r);
  }
  const all = [...names, ...helpers.map((h) => h.name)];
  const hIndex = new Map(all.map((n, i) => [n, i]));
  const n = input.weights.length / 4;
  const joints = new Uint16Array(n * 4);
  const weights = new Float32Array(n * 4);
  const v = new Vector3();
  const loc = new Vector3();
  // per limb: t of a point along the parent bone (0 at its joint, 1 at the child's)
  const limbs = SIDES.flatMap((S) =>
    (
      [
        [`${S}Arm`, `${S}ForeArm`, [`${S}ArmTwist0`, `${S}ArmTwist1`, `${S}Arm`]],
        [`${S}ForeArm`, `${S}Hand`, [`${S}ForeArmTwist0`, `${S}ForeArmTwist1`, `${S}ForeArmTwist2`]],
        [`${S}UpLeg`, `${S}Leg`, [`${S}UpLegTwist0`, `${S}UpLegTwist1`, `${S}UpLeg`]],
      ] as const
    )
      .filter(([p, c, nodes]) => index.has(p) && index.has(c) && nodes.every((x) => hIndex.has(x)))
      .map(([p, c, nodes]) => {
        const P = ibmOf(p)!;
        const len = P.clone().multiply(ibmOf(c)!.clone().invert());
        const axis = new Vector3().setFromMatrixPosition(len);
        return { bone: index.get(p)!, P, axis, len2: Math.max(1e-9, axis.lengthSq()), nodes: nodes.map((x) => hIndex.get(x)!) };
      }),
  );
  const groups = (list: string[]) => new Set(list.map((x) => hIndex.get(x)).filter((x): x is number => x !== undefined));
  const pairs = SIDES.flatMap((S) =>
    [
      [`${S}ShoulderHalf`, [`${S}Shoulder`], [`${S}Arm`, `${S}ArmTwist0`, `${S}ArmTwist1`]],
      [`${S}ElbowHalf`, [`${S}Arm`, `${S}ArmTwist0`, `${S}ArmTwist1`], [`${S}ForeArm`, `${S}ForeArmTwist0`, `${S}ForeArmTwist1`, `${S}ForeArmTwist2`]],
      [`${S}HipHalf`, ['Hips', 'Spine'], [`${S}UpLeg`, `${S}UpLegTwist0`, `${S}UpLegTwist1`]],
      [`${S}KneeHalf`, [`${S}UpLeg`, `${S}UpLegTwist0`, `${S}UpLegTwist1`], [`${S}Leg`]],
    ]
      .filter(([h]) => hIndex.has(h as string) && rest.has(h as string))
      .map(([h, a, f]) => ({ h: hIndex.get(h as string)!, a: groups(a as string[]), f: groups(f as string[]) })),
  );
  let changed = 0;
  // per joint: the limb whose turn it spreads (-1: none), and whether it takes part in any crease
  const limbOf = new Int16Array(all.length).fill(-1);
  limbs.forEach((L, k) => (limbOf[L.bone] = k));
  const relevant = new Uint8Array(all.length);
  for (const L of limbs) relevant[L.bone] = 1;
  for (const pr of pairs) for (const j of [...pr.a, ...pr.f]) relevant[j] = 1;
  // a few influences per point at most (4 loaded, + 2 per spread limb, + 1 per crease): small scratch lists
  const js = new Int32Array(24);
  const ws = new Float64Array(24);
  let m = 0;
  const add = (j: number, x: number) => {
    for (let k = 0; k < m; k++)
      if (js[k] === j) {
        ws[k] += x;
        return;
      }
    js[m] = j;
    ws[m++] = x;
  };
  for (let i = 0; i < n; i++) {
    let touch = false;
    for (let k = 0; k < 4; k++) {
      joints[i * 4 + k] = input.joints[i * 4 + k];
      weights[i * 4 + k] = input.weights[i * 4 + k];
      if (input.weights[i * 4 + k] > 0 && relevant[input.joints[i * 4 + k]]) touch = true;
    }
    // most points (head, trunk, hands, feet) keep their weights as loaded
    if (!touch) continue;
    m = 0;
    for (let k = 0; k < 4; k++) if (input.weights[i * 4 + k] > 0) add(input.joints[i * 4 + k], input.weights[i * 4 + k]);
    v.set(input.pos[i * 3], input.pos[i * 3 + 1], input.pos[i * 3 + 2]).applyMatrix4(input.bindMatrix);
    // 1. the turn spread along the limb: the parent's weight shared between the nodes t = 0, 0.5, 1 (hat functions)
    for (let k = 0, m0 = m; k < m0; k++) {
      const li = limbOf[js[k]];
      if (li < 0 || ws[k] <= 0) continue;
      const L = limbs[li];
      const wb = ws[k];
      ws[k] = 0;
      loc.copy(v).applyMatrix4(L.P);
      const t = Math.min(1, Math.max(0, loc.dot(L.axis) / L.len2));
      const h0 = Math.max(0, 1 - 2 * t);
      const h1 = 1 - Math.abs(2 * t - 1);
      const h2 = Math.max(0, 2 * t - 1);
      if (h0 > 0) add(L.nodes[0], wb * h0);
      if (h1 > 0) add(L.nodes[1], wb * h1);
      if (h2 > 0) add(L.nodes[2], wb * h2);
    }
    // 2. the crease of each joint: what is shared between the two sides goes partly to the half bone
    for (const pr of pairs) {
      let A = 0;
      let F = 0;
      for (let k = 0; k < m; k++) {
        if (pr.a.has(js[k])) A += ws[k];
        else if (pr.f.has(js[k])) F += ws[k];
      }
      if (A <= 0 || F <= 0) continue;
      const h = TWIST.half * 2 * Math.min(A, F);
      const keep = 1 - h / (A + F);
      for (let k = 0; k < m; k++) if (pr.a.has(js[k]) || pr.f.has(js[k])) ws[k] *= keep;
      add(pr.h, h);
    }
    // 3. four influences at most (the strongest), summing to one
    let sum = 0;
    for (let slot = 0; slot < 4; slot++) {
      let best = -1;
      for (let k = 0; k < m; k++) if (ws[k] > 1e-5 && (best < 0 || ws[k] > ws[best])) best = k;
      if (best < 0) {
        joints[i * 4 + slot] = 0;
        weights[i * 4 + slot] = 0;
        continue;
      }
      joints[i * 4 + slot] = js[best];
      weights[i * 4 + slot] = ws[best];
      sum += ws[best];
      ws[best] = -1;
    }
    let diff = false;
    for (let k = 0; k < 4; k++) {
      weights[i * 4 + k] /= sum || 1;
      if (joints[i * 4 + k] !== input.joints[i * 4 + k] || Math.abs(weights[i * 4 + k] - input.weights[i * 4 + k]) > 1e-4) diff = true;
    }
    if (diff) changed++;
  }
  return { joints, weights, helpers, helperIbm, changed };
}

// ---------------------------------------------------------------------------------------------------------------
// the helper bones in the scene, driven after each image

const tmpQ = new Quaternion();
const tmpQ2 = new Quaternion();
const IDENT = new Quaternion();

/** the turn of q about axis (unit), in radians, and its swing (q = swing · twist) */
export function splitSwingTwist(q: Quaternion, axis: Vector3, swingOut: Quaternion): number {
  const d = q.x * axis.x + q.y * axis.y + q.z * axis.z;
  const tw = new Quaternion(axis.x * d, axis.y * d, axis.z * d, q.w);
  if (tw.lengthSq() < 1e-12) tw.set(0, 0, 0, 1);
  else tw.normalize();
  swingOut.copy(q).multiply(tw.clone().invert());
  let a = 2 * Math.atan2(Math.hypot(tw.x, tw.y, tw.z) * Math.sign(d || 1), tw.w);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

interface Driven {
  def: HelperDef;
  bone: Bone;
  parent: Bone;
  child: Bone;
  grandchild?: Bone;
  /** rest local of the parent / child (cssRef of src/three/pose.ts) and the limb's line in their own space */
  parentRestQ: Quaternion;
  childRestQ: Quaternion;
  childRestPos: Vector3;
  axisParent: Vector3;
  axisChild?: Vector3;
}

export class TwistRig {
  readonly helpers: Bone[] = [];
  private driven: Driven[] = [];
  private byName = new Map<string, Bone>();
  private widened = new Map<Skeleton, Skeleton>();

  /** root: the coach's scene at its reference pose (restoreReferencePose already done) */
  constructor(root: Object3D) {
    const bones = new Map<string, Bone>();
    root.traverse((o) => {
      if ((o as Bone).isBone && !o.userData.cssTwist) bones.set(norm(o.name), o as Bone);
    });
    const restQ = (b: Bone) => ((b.userData.cssRef?.q as Quaternion | undefined) ?? b.quaternion).clone();
    const restP = (b: Bone) => ((b.userData.cssBase as Vector3 | undefined) ?? (b.userData.cssRef?.p as Vector3 | undefined) ?? b.position).clone();
    for (const def of TWIST_HELPERS) {
      const child = bones.get(def.child);
      // a half bone hangs from the joint's own parent (the thigh's is Spine on the Rocketbox skeleton, Hips elsewhere)
      const parent = def.kind === 'half' ? ((child?.parent as Bone | null)?.isBone ? (child!.parent as Bone) : undefined) : bones.get(def.parent);
      const grandchild = def.grandchild ? bones.get(def.grandchild) : undefined;
      if (!parent || !child || child.parent !== parent || (def.kind === 'half' && !def.parent.split('|').includes(norm(parent.name))) || (def.grandchild && (!grandchild || grandchild.parent !== child))) continue;
      const b = new Bone();
      b.name = def.name;
      b.userData.cssTwist = def.owner;
      parent.add(b);
      const childRestPos = restP(child);
      const d: Driven = {
        def,
        bone: b,
        parent,
        child,
        grandchild,
        parentRestQ: restQ(parent),
        childRestQ: restQ(child),
        childRestPos,
        axisParent: childRestPos.clone().normalize(),
        axisChild: grandchild ? restP(grandchild).normalize() : undefined,
      };
      this.driven.push(d);
      this.helpers.push(b);
      this.byName.set(def.name, b);
    }
    this.update();
  }

  get ready() {
    return this.driven.length === TWIST_HELPERS.length;
  }

  /** after the motion engine's pose of the image: every helper from the main bones only */
  update() {
    const tw = new Map<string, number>();
    const twistOf = (b: Bone, restQ: Quaternion, axis: Vector3) => {
      const key = b.name;
      let a = tw.get(key);
      if (a === undefined) {
        // the bone's own turn about its line since rest, in its rest frame
        tmpQ.copy(restQ).invert().multiply(b.quaternion);
        a = splitSwingTwist(tmpQ, axis, tmpQ2);
        tw.set(key, a);
      }
      return a;
    };
    for (const d of this.driven) {
      const { def, bone } = d;
      if (def.kind === 'half') {
        // half of the child's bend (its swing since rest; its own turn stays on its twist bones)
        tmpQ.copy(d.childRestQ).invert().multiply(d.child.quaternion);
        splitSwingTwist(tmpQ, d.axisChild!, tmpQ2);
        const bend = 2 * Math.acos(Math.min(1, Math.abs(tmpQ2.w)));
        bone.quaternion.copy(d.childRestQ).multiply(tmpQ.copy(IDENT).slerp(tmpQ2, 0.5));
        bone.position.copy(d.child.position);
        bone.scale.setScalar(1 + TWIST.puff * bend);
        continue;
      }
      const own = twistOf(d.parent, d.parentRestQ, d.axisParent);
      let angle = 0;
      const t = def.t ?? 0;
      if (def.parent.endsWith('ForeArm')) {
        // forearm: from no turn at the elbow (t = 0) to the hand's whole turn at the wrist (t = 1)
        // hand's turn about the forearm's line, in the forearm's space
        tmpQ.copy(d.child.quaternion).multiply(tmpQ2.copy(d.childRestQ).invert());
        const hand = splitSwingTwist(tmpQ, d.axisParent, new Quaternion());
        angle = t * (own + hand) - own;
      } else {
        const share = def.parent.endsWith('Arm') ? TWIST.arm : TWIST.thigh;
        angle = t === 0 ? -share[0] * own : t === 0.5 ? -share[1] * own : 0;
      }
      bone.quaternion.setFromAxisAngle(d.axisParent, angle);
      bone.position.copy(d.child.position).multiplyScalar(t);
    }
  }

  /** binds a skinned mesh (body or garment) of this scene to the helpers: weights redistributed, skeleton widened */
  bind(mesh: SkinnedMesh): number {
    const g = mesh.geometry;
    if (g.userData.cssTwisted || !mesh.skeleton) return 0;
    const si = g.getAttribute('skinIndex');
    const sw = g.getAttribute('skinWeight');
    const pos = g.getAttribute('position');
    if (!si || !sw || !pos) return 0;
    const skel = mesh.skeleton;
    const out = twistSkin({
      pos: (pos as BufferAttribute).isBufferAttribute && pos.itemSize === 3 && !pos.normalized ? (pos as BufferAttribute).array : Float32Array.from({ length: pos.count * 3 }, (_, i) => pos.getComponent(Math.floor(i / 3), i % 3)),
      joints: flat(si),
      weights: flat(sw),
      names: skel.bones.map((b) => b.name),
      ibm: skel.boneInverses,
      bindMatrix: mesh.bindMatrix,
    });
    if (!out.changed) return 0;
    const bones = out.helpers.map((h) => this.byName.get(h.name));
    if (bones.some((b) => !b)) return 0;
    REST_SKIN.set(g, { index: si, weight: sw });
    g.setAttribute('skinIndex', new BufferAttribute(out.joints, 4));
    g.setAttribute('skinWeight', new BufferAttribute(out.weights, 4));
    g.userData.cssTwisted = true;
    // the meshes that shared a skeleton (body, head, eyes of one model) share the widened one too
    let wide = this.widened.get(skel);
    if (!wide) {
      wide = new Skeleton([...skel.bones, ...(bones as Bone[])], [...skel.boneInverses, ...out.helperIbm]);
      this.widened.set(skel, wide);
    }
    mesh.bind(wide, mesh.bindMatrix);
    return out.changed;
  }
}

/** the 4 components of every point, as one flat array (attributes may be interleaved or normalized) */
function flat(a: BufferAttribute | import('three').InterleavedBufferAttribute): ArrayLike<number> {
  if ((a as BufferAttribute).isBufferAttribute && !a.normalized && a.itemSize === 4) return (a as BufferAttribute).array;
  const out = new Float32Array(a.count * 4);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < 4; k++) out[i * 4 + k] = a.getComponent(i, k);
  return out;
}

/** ?torsion=0 in the address (Lab, comparisons): the coach as before 2.5.0, without the helper bones */
export function torsionOn(): boolean {
  try {
    const h = typeof location === 'undefined' ? '' : `${location.search}&${location.hash}`;
    return !/[?&#]torsion=0\b/.test(h);
  } catch {
    return true;
  }
}

const rigs = new WeakMap<Object3D, TwistRig>();
/** the coach's twist rig, made once per scene copy (bound to its body there), or null when off */
export function twistRigOf(scene: Object3D): TwistRig | null {
  return rigs.get(scene) ?? null;
}
export function setTwistRig(scene: Object3D, rig: TwistRig) {
  rigs.set(scene, rig);
}

/** a copy of the geometry the mesh may change (the loaded one stays shared with the model cache) */
export function ownGeometry(mesh: SkinnedMesh, loaded: BufferGeometry, owned?: BufferGeometry[]) {
  if (mesh.geometry !== loaded) return;
  mesh.geometry = loaded.clone();
  owned?.push(mesh.geometry);
}
