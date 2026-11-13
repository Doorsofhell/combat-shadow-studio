/**
 * Balance on one foot. A kick, a knee or a check is held on one leg for about half a second: the
 * centre of mass has to be over the supporting foot, otherwise the body would fall. Key poses of
 * motions flagged `balance` are corrected here, measured on the real skeleton: the hips move
 * horizontally until the centre of mass is above the middle of the supporting sole, and the key just
 * before the foot leaves the floor already carries half of that shift (weight transferred first).
 */
import { Vector3 } from 'three';
import type { CoachRig } from './rig';
import type { Motion } from './motion';
import type { Pose } from './pose';

/**
 * Segment mass fractions, adult male, de Leva P. (1996) "Adjustments to Zatsiorsky-Seluyanov's segment
 * inertia parameters", J. Biomech. 29(9):1223-1230, table 4. Simplification of ours: the centre of
 * each segment is taken at the middle of its two joints (de Leva gives the exact ratio per segment).
 */
const SEGMENTS: [string, string, number][] = [
  ['Head', 'HeadTop_End', 0.0694],
  ['Hips', 'Neck', 0.4346],
  ['LeftArm', 'LeftForeArm', 0.0271],
  ['RightArm', 'RightForeArm', 0.0271],
  ['LeftForeArm', 'LeftHand', 0.0162],
  ['RightForeArm', 'RightHand', 0.0162],
  ['LeftHand', 'LeftHandMiddle1', 0.0061],
  ['RightHand', 'RightHandMiddle1', 0.0061],
  ['LeftUpLeg', 'LeftLeg', 0.1416],
  ['RightUpLeg', 'RightLeg', 0.1416],
  ['LeftLeg', 'LeftFoot', 0.0433],
  ['RightLeg', 'RightFoot', 0.0433],
  ['LeftFoot', 'LeftToeBase', 0.0137],
  ['RightFoot', 'RightToeBase', 0.0137],
];

export function centreOfMass(rig: CoachRig): Vector3 {
  const c = new Vector3();
  let m = 0;
  for (const [a, b, w] of SEGMENTS) {
    const pa = rig.worldOf(a);
    const pb = rig.worldOf(b) ?? pa;
    if (!pa || !pb) continue;
    c.addScaledVector(pa.clone().add(pb).multiplyScalar(0.5), w);
    m += w;
  }
  return c.multiplyScalar(1 / m);
}

/** middle of the sole of a foot (between ankle and ball), on the floor */
function soleCentre(rig: CoachRig, side: 'Left' | 'Right') {
  const a = rig.worldOf(`${side}Foot`)!;
  const t = rig.worldOf(`${side}ToeBase`)!;
  return new Vector3((a.x + t.x) / 2, 0, (a.z + t.z) / 2);
}

/** moves the hips, the foot in the air and hands placed in world space together: the body keeps its shape */
function move(p: Pose, d: Vector3) {
  p.hips.x += d.x;
  p.hips.y += d.y;
  p.hips.z += d.z;
  for (const f of [p.footL, p.footR]) {
    if (f.mode !== 'air' || f.pinned) continue;
    f.ankle.x += d.x;
    f.ankle.y += d.y;
    f.ankle.z += d.z;
  }
  for (const h of [p.handL, p.handR]) {
    if (h.space !== 'world') continue;
    h.pos.x += d.x;
    h.pos.y += d.y;
    h.pos.z += d.z;
  }
}

/**
 * hips shift that puts the centre of mass over the supporting foot: horizontal, plus a small drop when
 * the supporting leg would otherwise have to stretch beyond its length (short legs), so the planted
 * foot never moves
 */
function shiftFor(rig: CoachRig, p: Pose, support: 'Left' | 'Right') {
  const q = structuredClone(p);
  const total = new Vector3();
  rig.apply(rig.resolve(q));
  const planted = rig.worldOf(`${support}Foot`)!.clone();
  for (let i = 0; i < 6; i++) {
    const d = soleCentre(rig, support).sub(centreOfMass(rig)).setY(0);
    move(q, d);
    total.add(d);
    rig.apply(rig.resolve(q));
    const miss = rig.worldOf(`${support}Foot`)!.distanceTo(planted);
    if (miss > 0.0005) {
      move(q, new Vector3(0, -miss, 0));
      total.y -= miss;
      rig.apply(rig.resolve(q));
    }
    if (d.length() < 0.002 && miss <= 0.0005) break;
  }
  return total;
}

export function balanceKeys(rig: CoachRig, m: Motion) {
  const air = (p: Pose) => (p.footL.mode === 'air' ? 'Right' : p.footR.mode === 'air' ? 'Left' : null);
  const shifts = m.keys.map((k) => {
    const support = air(k.pose);
    return support ? shiftFor(rig, k.pose, support) : null;
  });
  m.keys.forEach((k, i) => {
    let d = shifts[i];
    // the key before the foot leaves the floor: weight already half transferred
    if (!d && shifts[i + 1] && i > 0) d = shifts[i + 1]!.clone().multiplyScalar(0.5);
    // a foot that has just landed: the weight comes back over both feet after the touchdown, not before
    if (!d && k.settling && shifts[i - 1]) d = shifts[i - 1]!.clone().multiplyScalar(0.5);
    if (!d) return;
    // v0.32: the foot coming down just above its place (pinned, before a landing): the weight already starts
    // back toward it, so the hips do not cross the whole way in the few hundredths of a second of the touchdown
    // (measured: 3.9 m/s of hip speed at the end of every round kick)
    // and the foot that has just left the floor (pinned just above its place): the weight is still on its way
    // to the support, which it reaches with the chamber (a whole half shift in the take-off moved the hips at
    // 5 to 8 m/s)
    const f = k.pose.footL.mode === 'air' ? k.pose.footL : k.pose.footR;
    if (f.mode === 'air' && f.pinned && (m.keys[i + 1]?.settling || (i > 0 && !shifts[i - 1]))) d = d.clone().multiplyScalar(0.75);
    k.pose = structuredClone(k.pose);
    move(k.pose, d);
  });
  rig.reset();
}
