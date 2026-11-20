import { Vector3 } from 'three';
import { posedPositions, type SkinnedBody } from './skin';

/**
 * 1.41.0 (lot 3, Youssef 2026-11-14): a limb that goes through the body (a hand in the chest, a forearm in the head,
 * a knee through the other leg). Read on the coach's own skin, posed on the CPU like the floor contact (skin.ts).
 *
 * Each body volume (trunk, head, each thigh and shin) is a « core » around its bones: along the bones, slice by
 * slice and sector by sector around them (a chest is flatter than it is wide), its radius is a low percentile
 * (CORE_PERCENTILE) of the distance of the volume's own skin at rest, less CORE_MARGIN, so the core lies inside the
 * flesh everywhere (under the front of a flat chest, inside a thin knee). It has no round end:
 * a point beyond the first or last bone is outside it. A vertex of another limb deeper than the core's surface is
 * inside the body. Touching the skin (a glove at the chin, an elbow against the ribs, the knees together) does not
 * reach the core: only real crossings are counted, by their depth under the core's surface.
 */
export interface Core {
  name: string;
  /** bones of the axis, in order; '+' after a name extends the axis past that bone by EXTEND */
  axis: string[];
  /** radius of each sector of each slice of each segment (m) */
  radii: number[][][];
}

export interface Intrusion {
  limb: string;
  core: string;
  /** depth under the core's surface (m) */
  depth: number;
}

const SLICES = 6;
const SECTORS = 8;
/** share of the volume's own skin, in each slice and sector, that lies closer to the bones than the core's surface */
export const CORE_PERCENTILE = 0.2;
/** and the core's surface is this much deeper still (m) */
export const CORE_MARGIN = 0.01;
/** the head goes on above its bone (the top of the skull) */
const EXTEND = 0.16;

const LIMBS: Record<string, RegExp> = {
  'main gauche': /^LeftHand/,
  'main droite': /^RightHand/,
  'avant-bras gauche': /^LeftForeArm$/,
  'avant-bras droit': /^RightForeArm$/,
  'jambe gauche': /^Left(UpLeg|Leg|Foot)$/,
  'jambe droite': /^Right(UpLeg|Leg|Foot)$/,
  // the top of the thigh joins the trunk: only the shin and the foot are checked against it
  'tibia et pied gauches': /^Left(Leg|Foot)$/,
  'tibia et pied droits': /^Right(Leg|Foot)$/,
};

/** which cores each limb is checked against (a limb is never checked against its own volume) */
const AGAINST: Record<string, string[]> = {
  'main gauche': ['tronc', 'tête', 'cuisse gauche', 'cuisse droite'],
  'main droite': ['tronc', 'tête', 'cuisse gauche', 'cuisse droite'],
  'avant-bras gauche': ['tronc', 'tête'],
  'avant-bras droit': ['tronc', 'tête'],
  'jambe gauche': ['cuisse droite', 'tibia droit'],
  'jambe droite': ['cuisse gauche', 'tibia gauche'],
  'tibia et pied gauches': ['tronc'],
  'tibia et pied droits': ['tronc'],
};

const CORE_DEF: { name: string; axis: string[]; parts: RegExp }[] = [
  { name: 'tronc', axis: ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck'], parts: /^(Hips|Spine|Spine1|Spine2|Neck)$/ },
  { name: 'tête', axis: ['Neck', 'Head', 'Head+'], parts: /^(Neck|Head|Face_)/ },
  { name: 'cuisse gauche', axis: ['LeftUpLeg', 'LeftLeg'], parts: /^LeftUpLeg$/ },
  { name: 'cuisse droite', axis: ['RightUpLeg', 'RightLeg'], parts: /^RightUpLeg$/ },
  { name: 'tibia gauche', axis: ['LeftLeg', 'LeftFoot'], parts: /^LeftLeg$/ },
  { name: 'tibia droit', axis: ['RightLeg', 'RightFoot'], parts: /^RightLeg$/ },
];

const clean = (n: string) => n.replace(/^mixamorig/, '');

interface Axis {
  pts: Vector3[];
  /** for each segment, a direction across it that turns with its first bone (the zero of the sectors) */
  ref: Vector3[];
}

function axisOf(body: SkinnedBody, names: string[]): Axis {
  const bone = (n: string) => {
    const b = body.bones.find((x) => clean(x.name) === n.replace(/\+$/, ''));
    if (!b) throw new Error(`bone ${n}`);
    return b;
  };
  const pts = names.map((n, i) => {
    const at = bone(n).getWorldPosition(new Vector3());
    if (!n.endsWith('+')) return at;
    return at.clone().add(at.clone().sub(bone(names[i - 2] ?? names[0]).getWorldPosition(new Vector3())).normalize().multiplyScalar(EXTEND));
  });
  const ref = names.slice(0, -1).map((n) => {
    const e = bone(n).matrixWorld.elements;
    // the bone's own z axis (forward or across the limb on these skeletons), turned with the bone
    const z = new Vector3(e[8], e[9], e[10]).normalize();
    return z;
  });
  return { pts, ref };
}

/** nearest point of the axis: segment, slice, sector and distance; null beyond both ends */
function locate(p: Vector3, axis: Axis): { seg: number; slice: number; sector: number; dist: number } | null {
  let best: { seg: number; slice: number; sector: number; dist: number } | null = null;
  const ab = new Vector3();
  const ap = new Vector3();
  const u = new Vector3();
  const w = new Vector3();
  for (let i = 0; i + 1 < axis.pts.length; i++) {
    ab.subVectors(axis.pts[i + 1], axis.pts[i]);
    ap.subVectors(p, axis.pts[i]);
    const t = ap.dot(ab) / Math.max(1e-9, ab.lengthSq());
    if (t < 0 || t > 1) continue;
    const off = ap.sub(ab.clone().multiplyScalar(t));
    const dist = off.length();
    if (best && dist >= best.dist) continue;
    const n = ab.normalize();
    u.copy(axis.ref[i]).addScaledVector(n, -axis.ref[i].dot(n)).normalize();
    w.crossVectors(n, u);
    const angle = Math.atan2(off.dot(w), off.dot(u));
    const sector = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * SECTORS) % SECTORS;
    best = { seg: i, slice: Math.min(SLICES - 1, Math.floor(t * SLICES)), sector, dist };
  }
  return best;
}

/** cores of a body, measured at rest (call before posing it) */
export function measureCores(body: SkinnedBody): Core[] {
  body.root.updateMatrixWorld(true);
  const pos = posedPositions(body);
  const v = new Vector3();
  return CORE_DEF.map((c) => {
    const axis = axisOf(body, c.axis);
    const d: number[][][][] = axis.pts.slice(1).map(() => Array.from({ length: SLICES }, () => Array.from({ length: SECTORS }, () => [])));
    for (let i = 0; i < body.count; i++) {
      if (!c.parts.test(clean(body.part[i]))) continue;
      const at = locate(v.fromArray(pos, i * 3), axis);
      if (at) d[at.seg][at.slice][at.sector].push(at.dist);
    }
    // a sector with too little skin of its own (the neck seen from the trunk, a joint) has no core
    const radii = d.map((seg) =>
      seg.map((slice) =>
        slice.map((s) => {
          s.sort((a, b) => a - b);
          return s.length >= 4 ? Math.max(0, s[Math.floor(s.length * CORE_PERCENTILE)] - CORE_MARGIN) : 0;
        }),
      ),
    );
    return { name: c.name, axis: c.axis, radii };
  });
}

/** deepest intrusion of each (limb, core) pair in the current pose (after rig.apply), deeper than `min` (m) */
export function intrusions(body: SkinnedBody, cores: Core[], min = 0): Intrusion[] {
  const pos = posedPositions(body);
  const axes = new Map(cores.map((c) => [c.name, { c, axis: axisOf(body, c.axis) }]));
  const out = new Map<string, Intrusion>();
  const v = new Vector3();
  for (let i = 0; i < body.count; i++) {
    const part = clean(body.part[i]);
    for (const [limb, re] of Object.entries(LIMBS)) {
      if (!re.test(part)) continue;
      v.fromArray(pos, i * 3);
      for (const name of AGAINST[limb]) {
        const a = axes.get(name)!;
        const at = locate(v, a.axis);
        if (!at) continue;
        const depth = a.c.radii[at.seg][at.slice][at.sector] - at.dist;
        if (depth <= min) continue;
        const key = `${limb}|${name}`;
        if ((out.get(key)?.depth ?? -1) < depth) out.set(key, { limb, core: name, depth });
      }
    }
  }
  return [...out.values()];
}
