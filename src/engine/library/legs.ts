/**
 * Kicks, knees, checks. Orthodox; "lead" = left leg, "rear" = right leg.
 *
 * Every kick follows the same biomechanical chain: support foot pivots on its ball (heel turns
 * toward the target for circular kicks), hips rotate, kicking knee chambers, the leg extends or
 * swings through, retracts, and the foot lands back in stance.
 */
import { Vector3 } from 'three';
import { Author, add, edit } from '../author';
import type { Motion } from '../motion';
import { FootPose, Pose, deg, v3 } from '../pose';

type LegSide = 'lead' | 'rear';
const stand = { startState: 'stand' as const, endState: 'stand' as const };

function legKeys(side: LegSide) {
  return side === 'lead'
    ? ({ kick: 'footL', support: 'footR', kickHand: 'handL', guardHand: 'handR', sg: 1 } as const)
    : ({ kick: 'footR', support: 'footL', kickHand: 'handR', guardHand: 'handL', sg: -1 } as const);
}

function supportPivot(f: FootPose, yaw: number, heel: number): FootPose {
  return f.mode === 'ground' ? { ...f, yaw, heel } : f;
}

/**
 * Circular kick (low / middle / high / kick-boxing roundhouse).
 * height: 'thigh' (low kick), 'liver' (middle), 'head' (high).
 * style 'thai': shin contact, swings through and returns; 'kick': instep, re-chambers.
 */
function roundKick(a: Author, side: LegSide, height: 'thigh' | 'liver' | 'head', style: 'thai' | 'kick', id: string): Motion {
  const g = a.guard();
  const s = a.s;
  const k = legKeys(side);
  const turn = side === 'rear' ? 1 : -1; // rear-leg kicks rotate the hips to the left (positive yaw)
  const T = a.target(height, height === 'thigh' ? 0.5 : 0.58);
  const hipTurn = deg(height === 'thigh' ? 70 : height === 'liver' ? 88 : 95);
  const lean = deg(height === 'head' ? 30 : height === 'liver' ? 18 : 8);
  const supYaw = (g[k.support] as { yaw: number }).yaw + turn * deg(height === 'thigh' ? 70 : 95);

  // 1. step/pivot: support foot turns out, hips start to open, kicking foot pushes off
  const load = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw * 0.55 + (g[k.support] as { yaw: number }).yaw * 0.45, deg(18));
    d.pelvis.yaw += turn * hipTurn * 0.25;
    d.hips.x += (side === 'rear' ? 0.06 : -0.03) * s;
    d.hips.z += (side === 'rear' ? 0.02 : 0.0) * s;
    const f = d[k.kick];
    if (f.mode === 'ground') f.heel = deg(35);
  });
  // 2. chamber: knee lifts toward the target line, foot tucked under the thigh
  const chamber = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw * 0.85 + (g[k.support] as { yaw: number }).yaw * 0.15, deg(22));
    d.pelvis.yaw += turn * hipTurn * 0.6;
    d.pelvis.roll += -turn * lean * 0.5;
    d.chest.yaw += -turn * deg(10);
    d.chest.roll += -turn * lean * 0.3;
    d.hips.x += (side === 'rear' ? 0.08 : -0.02) * s;
    d.hips.z += 0.03 * s;
    d.hips.y += 0.01 * s;
  });
  const hipC = a.hipJoint(chamber, side === 'lead' ? 'L' : 'R');
  const kneeH = Math.min(T.y + 0.05 * s, hipC.y - 0.02 * s);
  chamber[k.kick] = a.air(
    v3(hipC.x - turn * 0.1 * s, Math.max(0.25 * s, kneeH - 0.32 * s), hipC.z + 0.12 * s),
    turn * deg(45),
    deg(40),
    0,
    v3(-turn * 0.4, 0.5, 1),
    deg(20),
  );
  // 3. extension / impact
  const hit = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw, deg(26));
    d.pelvis.yaw += turn * hipTurn;
    d.pelvis.roll += -turn * lean;
    d.pelvis.pitch += deg(-6);
    d.chest.yaw += -turn * deg(16);
    d.chest.roll += -turn * lean * 0.4;
    d.chest.pitch += deg(4);
    d.hips.x += (side === 'rear' ? 0.08 : -0.03) * s;
    d.hips.z += 0.04 * s;
    d.hips.y += 0.02 * s;
    // counterbalance: kicking-side arm swings down and back (thai) or stays close (kick)
    if (style === 'thai') {
      d[k.kickHand] = a.hand('world', v3(-turn * 0.26 * s, d.hips.y + 0.12 * s, 0.12 * s), v3(-turn * 0.8, -0.3, -0.4), 0.2, 1);
    }
  });
  const hipH = a.hipJoint(hit, side === 'lead' ? 'L' : 'R');
  // the striking point (shin/instep) sweeps across the target: the ankle ends past it
  const through = v3(T.x + turn * (style === 'thai' ? 0.3 : 0.2) * s, T.y + (height === 'thigh' ? -0.02 : 0.02) * s, T.z);
  hit[k.kick] = a.airFoot(
    hipH,
    through,
    style === 'thai' ? 0.97 : 0.99,
    turn * deg(height === 'head' ? 115 : 100),
    deg(style === 'thai' ? 55 : 70),
    -turn * deg(height === 'thigh' ? 20 : 60),
    v3(turn * 0.9, 0.55, 0.2),
    deg(30),
  );
  // 4. retraction (kick-boxing re-chambers; thai lets the leg swing back down)
  const back = edit(chamber, (d) => {
    d.pelvis.yaw = g.pelvis.yaw + turn * hipTurn * 0.5;
    d.pelvis.roll = g.pelvis.roll - turn * lean * 0.3;
  });
  const land = edit(g, (d) => {
    d.hips.y -= 0.02 * s;
    d.chest.pitch += deg(3);
  });
  const t = style === 'thai' ? [0.12, 0.26, 0.4, 0.62, 0.86] : [0.1, 0.22, 0.34, 0.5, 0.72];
  return {
    id,
    keys: [
      { t: 0, pose: g },
      { t: t[0], pose: load, ease: 'inOut' },
      { t: t[1], pose: chamber, ease: 'load' },
      { t: t[2], pose: hit, ease: 'strike' },
      { t: t[3], pose: back, ease: 'inOut' },
      { t: t[4], pose: land, ease: 'inOut' },
    ],
    chainAt: t[4] - 0.1,
    impacts: [t[2]],
    ...stand,
    balance: true,
  };
}

/** Straight kicks: teep (push with the sole, hips forward) and front kick (snap with the ball of the foot). */
function straightKick(a: Author, side: LegSide, kind: 'teep' | 'front'): Motion {
  const g = a.guard();
  const s = a.s;
  const k = legKeys(side);
  const T = kind === 'teep' ? v3(0, g.hips.y + 0.12 * s, 0.62 * s) : a.target('liver', 0.62);
  const chamber = edit(g, (d) => {
    d.hips.z += (side === 'rear' ? 0.06 : -0.02) * s;
    d.hips.x += (side === 'rear' ? 0.06 : -0.03) * s;
    d.pelvis.yaw += (side === 'rear' ? 1 : 0.4) * deg(20);
    d.pelvis.pitch += deg(-8);
    d.chest.pitch += deg(-4);
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw + deg(side === 'rear' ? 25 : 10), deg(12));
  });
  const hipC = a.hipJoint(chamber, side === 'lead' ? 'L' : 'R');
  chamber[k.kick] = a.air(v3(hipC.x, hipC.y - 0.28 * s, hipC.z + 0.22 * s), 0, deg(-20), 0, v3(0.1 * k.sg, 0.6, 1), 0);
  const hit = edit(chamber, (d) => {
    d.pelvis.pitch = g.pelvis.pitch + deg(kind === 'teep' ? -18 : -10);
    d.chest.pitch = g.chest.pitch + deg(kind === 'teep' ? -14 : -8);
    d.hips.z += (kind === 'teep' ? 0.08 : 0.04) * s;
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw + deg(side === 'rear' ? 35 : 15), deg(kind === 'teep' ? 8 : 18));
  });
  const hipH = a.hipJoint(hit, side === 'lead' ? 'L' : 'R');
  // teep: foot flexed (sole forward); front kick: toes pulled back, ball of the foot forward
  hit[k.kick] = a.airFoot(hipH, add(T, { x: hipH.x * 0.6 }), 0.985, 0, deg(kind === 'teep' ? -45 : -10), 0, v3(0.1 * k.sg, 1, 0.2), kind === 'front' ? deg(30) : 0);
  const land = edit(g, (d) => {
    d.hips.y -= 0.015 * s;
  });
  return {
    id: kind === 'teep' ? `teep-${side === 'lead' ? 'avant' : 'arriere'}` : `front-kick-${side === 'lead' ? 'avant' : 'arriere'}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.18, pose: chamber, ease: 'load' },
      { t: 0.32, pose: hit, ease: 'strike' },
      { t: kind === 'teep' ? 0.4 : 0.36, pose: hit, ease: 'linear' },
      { t: 0.54, pose: chamber, ease: 'inOut' },
      { t: 0.74, pose: land, ease: 'inOut' },
    ],
    chainAt: 0.64,
    impacts: [0.32],
    ...stand,
    balance: true,
  };
}

/** Knee strikes. 'straight': drive the knee forward and up, hips thrust. 'round': knee travels from the side. */
function knee(a: Author, side: LegSide, kind: 'straight' | 'round', clinch: boolean): Motion {
  const g = a.guard();
  const s = a.s;
  const k = legKeys(side);
  const turn = side === 'rear' ? 1 : -1;
  const head = a.target('chin', 0.42);
  // clinch: both hands reach behind an imaginary neck and pull down; else long guard to frame
  const hands = (d: Pose, pull: number) => {
    const y = head.y - 0.02 * s - pull * 0.12 * s;
    const z = head.z - pull * 0.08 * s;
    d.handL = a.hand('world', v3(0.07 * s, y, z), v3(0.6, -0.6, -0.3), clinch ? -0.4 : 0.2, clinch ? 0.55 : 1, clinch ? deg(30) : 0);
    d.handR = a.hand('world', v3(-0.07 * s, y, z - 0.02 * s), v3(-0.6, -0.6, -0.3), clinch ? -0.4 : 0.2, clinch ? 0.55 : 1, clinch ? deg(30) : 0);
  };
  const load = edit(g, (d) => {
    d.hips.z += 0.04 * s;
    d.hips.x += (side === 'rear' ? 0.05 : -0.04) * s;
    d.pelvis.yaw += turn * deg(kind === 'round' ? 25 : 12);
    hands(d, 0);
    const f = d[k.kick];
    if (f.mode === 'ground') f.heel = deg(40);
  });
  const hit = edit(g, (d) => {
    d.hips.z += 0.1 * s;
    d.hips.x += (side === 'rear' ? 0.07 : -0.04) * s;
    d.hips.y += 0.04 * s;
    d.pelvis.pitch += deg(-22);
    d.pelvis.yaw += turn * deg(kind === 'round' ? 55 : 15);
    d.pelvis.roll += -turn * deg(kind === 'round' ? 12 : 4);
    d.chest.pitch += deg(-6);
    d.chest.yaw += -turn * deg(kind === 'round' ? 25 : 8);
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw + turn * deg(kind === 'round' ? 60 : 20), deg(40));
    hands(d, 1);
  });
  // the trunk turns a lot in the round knee: keep both framing hands far enough from their
  // shoulder that the elbow stays within its natural range
  for (const p of [load, hit]) {
    for (const hs of ['L', 'R'] as const) {
      const h = hs === 'L' ? p.handL : p.handR;
      const sh = a.shoulder(p, hs);
      const v = new Vector3(h.pos.x, h.pos.y, h.pos.z).sub(sh);
      const min = (a.m.upperArm + a.m.foreArm) * 0.5;
      if (v.length() < min) {
        v.setLength(min).add(sh);
        h.pos = v3(v.x, v.y, v.z);
      }
    }
  }
  const hipH = a.hipJoint(hit, side === 'lead' ? 'L' : 'R');
  // knee point in front at body height, foot hanging under and behind it (toes pointed down)
  const kneePt = new Vector3(kind === 'round' ? turn * 0.1 * s : hipH.x * 0.3, a.target('body').y + 0.04 * s, hipH.z + a.m.thigh * 0.85);
  const ankle = kneePt.clone().add(new Vector3(0, -a.m.shin * 0.85, -a.m.shin * 0.5));
  hit[k.kick] = a.air(v3(ankle.x, ankle.y, ankle.z), kind === 'round' ? turn * deg(70) : 0, deg(65), kind === 'round' ? -turn * deg(40) : 0, kind === 'round' ? v3(turn * 0.6, 0.4, 1) : v3(0, 0.3, 1), deg(25));
  const land = edit(g, (d) => {
    d.hips.y -= 0.01 * s;
  });
  const guardHands = edit(hit, (d) => {
    d.handL = structuredClone(g.handL);
    d.handR = structuredClone(g.handR);
  });
  return {
    id: `genou-${kind === 'round' ? 'circulaire' : 'direct'}-${side === 'lead' ? 'avant' : 'arriere'}${clinch ? '-clinch' : ''}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.16, pose: load, ease: 'load' },
      { t: 0.34, pose: hit, ease: 'strike' },
      { t: 0.4, pose: hit, ease: 'linear' },
      // hands back in guard first, while the knee is still up: the return never squeezes an elbow
      { t: 0.48, pose: guardHands, ease: 'inOut' },
      { t: 0.68, pose: land, ease: 'inOut' },
    ],
    chainAt: 0.58,
    impacts: [0.34],
    ...stand,
    balance: true,
  };
}

/** Lead-leg check: shin raised and turned out to absorb a low kick, guard high. */
function check(a: Author, side: LegSide): Motion {
  const g = a.guard();
  const s = a.s;
  const k = legKeys(side);
  const up = edit(g, (d) => {
    d.hips.x += (side === 'lead' ? -0.05 : 0.05) * s;
    d.hips.y += 0.02 * s;
    d.pelvis.roll += deg(k.sg * 4);
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw, 0);
  });
  const hip = a.hipJoint(up, side === 'lead' ? 'L' : 'R');
  const kneePt = hip.clone().add(new Vector3(k.sg * 0.12 * s, -0.12 * s, a.m.thigh * 0.85));
  const ankle = kneePt.clone().add(new Vector3(k.sg * 0.04 * s, -a.m.shin * 0.95, -0.02 * s));
  up[k.kick] = a.air(v3(ankle.x, ankle.y, ankle.z), k.sg * deg(30), deg(-10), 0, v3(k.sg * 0.8, 0.2, 1), 0);
  return {
    id: `check-${side === 'lead' ? 'avant' : 'arriere'}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.16, pose: up, ease: 'snap' },
      { t: 0.32, pose: up, ease: 'linear' },
      { t: 0.52, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.44,
    impacts: [0.16],
    ...stand,
    balance: true,
  };
}

export function legMotions(a: Author): Motion[] {
  return [
    roundKick(a, 'rear', 'thigh', 'thai', 'low-kick-arriere'),
    roundKick(a, 'lead', 'thigh', 'thai', 'low-kick-avant'),
    roundKick(a, 'rear', 'liver', 'thai', 'middle-kick-arriere'),
    roundKick(a, 'lead', 'liver', 'thai', 'middle-kick-avant'),
    roundKick(a, 'rear', 'head', 'thai', 'high-kick-arriere'),
    roundKick(a, 'lead', 'head', 'kick', 'high-kick-avant'),
    roundKick(a, 'rear', 'liver', 'kick', 'roundhouse-arriere'),
    roundKick(a, 'lead', 'liver', 'kick', 'roundhouse-avant'),
    straightKick(a, 'lead', 'teep'),
    straightKick(a, 'rear', 'teep'),
    straightKick(a, 'lead', 'front'),
    straightKick(a, 'rear', 'front'),
    knee(a, 'rear', 'straight', false),
    knee(a, 'lead', 'straight', false),
    knee(a, 'rear', 'round', false),
    knee(a, 'lead', 'round', false),
    knee(a, 'rear', 'straight', true),
    knee(a, 'rear', 'round', true),
    check(a, 'lead'),
    check(a, 'rear'),
  ];
}


