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
import { FootPose, Pose, deg, mirrorPose, v3 } from '../pose';

type LegSide = 'lead' | 'rear';
const stand = { startState: 'stand' as const, endState: 'stand' as const };

/** ankle and toes relative to the shin, in degrees (see AnkleJoint): the striking surface of each kick */
function joint(f: FootPose, plantar: number, toes = 0, inversion = 0, rotation = 0): FootPose {
  return f.mode === 'air' ? { ...f, joint: { plantar: deg(plantar), toes: deg(toes), inversion: deg(inversion), rotation: deg(rotation) } } : f;
}

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
  // the hips turn over: at impact the kicking hip faces the target (pelvis about a quarter turn from
  // square, whatever the guard), so the thigh comes up sideways (abduction) and the knee points along
  // the swing, instead of a thigh lifted in front and twisted on itself. The trunk leans away from the
  // kick so a high kick needs no more hip abduction than a trained fighter has (≈ 80–90°).
  const finalYaw = turn * deg(height === 'liver' ? 95 : 100);
  const hipTurn = height === 'thigh' ? deg(70) : turn * (finalYaw - g.pelvis.yaw);
  // (positive roll leans the body to its left: away from a right-leg kick)
  const lean = deg(height === 'head' ? 45 : height === 'liver' ? 25 : 8);
  // the support foot pivots with the hips (heel toward the target), so the support hip does not twist
  const supYaw = (g[k.support] as { yaw: number }).yaw + turn * (height === 'thigh' ? deg(70) : hipTurn * 0.9);

  // 1. step/pivot: support foot turns out, hips start to open, kicking foot pushes off
  const load = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw * 0.28 + (g[k.support] as { yaw: number }).yaw * 0.72, deg(18));
    d.pelvis.yaw += turn * hipTurn * 0.25;
    d.hips.x += (side === 'rear' ? 0.06 : -0.03) * s;
    d.hips.z += (side === 'rear' ? 0.02 : 0.0) * s;
    const f = d[k.kick];
    if (f.mode === 'ground') f.heel = deg(35);
  });
  // 2. chamber: knee lifts toward the target line, foot tucked under the thigh
  const chamber = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw * 0.7 + (g[k.support] as { yaw: number }).yaw * 0.3, deg(22));
    d.pelvis.yaw += turn * hipTurn * 0.6;
    d.pelvis.roll += turn * lean * 0.5;
    d.chest.yaw += -turn * deg(10);
    d.chest.roll += -turn * lean * 0.1;
    d.hips.x += (side === 'rear' ? 0.08 : -0.02) * s;
    d.hips.z += 0.03 * s;
    // the pelvis tilts about the support hip, not about its centre: the support leg keeps its length
    d.hips.y += 0.01 * s + a.m.hipHalf * Math.sin(lean * 0.5);
  });
  const hipC = a.hipJoint(chamber, side === 'lead' ? 'L' : 'R');
  const kneeH = Math.min(T.y + 0.05 * s, hipC.y - 0.02 * s);
  // foot tucked, already pointed: the instep or the shin will strike
  chamber[k.kick] = joint(
    a.air(v3(hipC.x - turn * 0.1 * s, Math.max(0.25 * s, kneeH - 0.32 * s), hipC.z + 0.12 * s), turn * deg(45), deg(40), 0, v3(-turn * 0.4, 0.5, 1), deg(20)),
    35,
  );
  // 3. extension / impact
  const hit = edit(g, (d) => {
    d[k.support] = supportPivot(d[k.support], supYaw, deg(26));
    d.pelvis.yaw += turn * hipTurn;
    d.pelvis.roll += turn * lean;
    d.pelvis.pitch += deg(-6);
    d.chest.yaw += -turn * deg(16);
    // the chest straightens a little over the leaning pelvis: the eyes stay on the target
    d.chest.roll += -turn * lean * 0.2;
    d.chest.pitch += deg(4);
    d.hips.x += (side === 'rear' ? 0.08 : -0.03) * s;
    d.hips.z += 0.04 * s;
    d.hips.y += 0.02 * s + a.m.hipHalf * Math.sin(lean);
    // counterbalance: kicking-side arm swings down and back (thai) or stays close (kick)
    if (style === 'thai') {
      d[k.kickHand] = a.hand('world', v3(-turn * 0.26 * s, d.hips.y + 0.12 * s, 0.12 * s), v3(-turn * 0.8, -0.3, -0.4), 0.2, 1);
    }
  });
  const hipH = a.hipJoint(hit, side === 'lead' ? 'L' : 'R');
  // the striking point (shin/instep) sweeps across the target: the ankle ends past it
  const through = v3(T.x + turn * (style === 'thai' ? 0.3 : 0.2) * s, T.y + (height === 'thigh' ? -0.02 : 0.02) * s, T.z);
  // instep (kick): ankle extended, foot in line with the shin; shin (thai): ankle extended, relaxed
  hit[k.kick] = joint(
    a.airFoot(hipH, through, style === 'thai' ? 0.97 : 0.99, turn * deg(height === 'head' ? 115 : 100), deg(style === 'thai' ? 55 : 70), -turn * deg(height === 'thigh' ? 20 : 60), v3(turn * 0.9, 0.55, 0.2), deg(30)),
    style === 'thai' ? 35 : 45,
    0,
    5,
  );
  // 4. retraction (kick-boxing re-chambers; thai lets the leg swing back down)
  const back = edit(chamber, (d) => {
    // the support foot turns back with the hips
    d[k.support] = supportPivot(d[k.support], supYaw * 0.5 + (g[k.support] as { yaw: number }).yaw * 0.5, deg(18));
    d.pelvis.yaw = g.pelvis.yaw + turn * hipTurn * 0.5;
    d.pelvis.roll = g.pelvis.roll + turn * lean * 0.3;
  });
  const land = edit(g, (d) => {
    d.hips.y -= 0.02 * s;
    d.chest.pitch += deg(3);
  });
  // v0.31 (Youssef 2026-10-22, « aucun pied qui glisse »): measured on the low kick, the toes of the kicking foot
  // skimmed the floor for 18 cm on the way out and 20 cm on the way back. The foot now leaves the floor upward
  // (toes a few centimetres up, above where they stood) before it travels, and comes down from above its place.
  const lift = (from: Pose, up: number, plantar: number) =>
    edit(from, (d) => {
      const f = g[k.kick];
      const an = a.groundAnkle({ ...f, heel: f.mode === 'ground' ? deg(35) : 0 } as FootPose);
      d[k.kick] = { ...joint(a.air(v3(an.x, an.y + up * s, an.z), (f as { yaw: number }).yaw, 0, 0, v3(0, 0.2, 1)), plantar), pinned: true } as FootPose;
    });
  const off = lift(load, 0.06, 35);
  const down = lift(edit(g, (d) => (d.pelvis.yaw += turn * hipTurn * 0.15)), 0.05, 20);
  const t = style === 'thai' ? [0.12, 0.26, 0.4, 0.62, 0.86] : [0.1, 0.22, 0.34, 0.5, 0.72];
  return {
    id,
    keys: [
      { t: 0, pose: g },
      { t: t[0], pose: load, ease: 'inOut' },
      { t: t[0] + 0.04, pose: off, ease: 'linear' },
      { t: t[1], pose: chamber, ease: 'load' },
      { t: t[2], pose: hit, ease: 'strike' },
      { t: t[3], pose: back, ease: 'inOut' },
      { t: t[4] - 0.08, pose: down, ease: 'inOut' },
      { t: t[4], pose: land, ease: 'inOut', settling: true },
      { t: t[4] + 0.12, pose: g, ease: 'inOut' },
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
  // chamber: foot under the knee, ankle already set for the striking surface
  chamber[k.kick] = joint(a.air(v3(hipC.x, hipC.y - 0.28 * s, hipC.z + 0.22 * s), 0, deg(-20), 0, v3(0.1 * k.sg, 0.6, 1), 0), kind === 'teep' ? 0 : 25, kind === 'teep' ? 15 : 35);
  const hit = edit(chamber, (d) => {
    // teep: the hips push (pelvis tucked under), the chest stays back but upright enough: leaning far back on
    // every teep means the leg pushes instead of the hip [S43]
    d.pelvis.pitch = g.pelvis.pitch + deg(kind === 'teep' ? -18 : -10);
    d.chest.pitch = g.chest.pitch + deg(kind === 'teep' ? -5 : -8);
    // the arm on the kicking side comes down for balance and power, the other stays high [S24, S29, S36]
    if (kind === 'teep') d[k.kickHand] = a.hand('world', v3(-k.sg * -0.2 * s, d.hips.y + 0.1 * s, d.hips.z + 0.18 * s), v3(k.sg * 0.8, -0.2, -0.4), 0.1, 1);
    d.hips.z += (kind === 'teep' ? 0.08 : 0.04) * s;
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw + deg(side === 'rear' ? 35 : 15), deg(kind === 'teep' ? 8 : 18));
  });
  const hipH = a.hipJoint(hit, side === 'lead' ? 'L' : 'R');
  // teep: foot flexed (sole forward); front kick: toes pulled back, ball of the foot forward
  // front kick: ankle extended and toes pulled up, the ball of the foot hits; teep: ankle flexed, the
  // sole and heel push (toes up, out of the way)
  hit[k.kick] = joint(a.airFoot(hipH, add(T, { x: hipH.x * 0.6 }), 0.985, 0, deg(kind === 'teep' ? -45 : -10), 0, v3(0.1 * k.sg, 1, 0.2), kind === 'front' ? deg(30) : 0), kind === 'teep' ? -12 : 45, kind === 'teep' ? 25 : 65);
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
    if (!clinch && kind === 'straight') {
      // v0.29: the arm on the kicking side frames in a long guard, the other hand stays at the head [S35]
      // (both arms stretched in front read as a mannequin)
      const kh = side === 'rear' ? 'handR' : 'handL';
      const gh = side === 'rear' ? 'handL' : 'handR';
      d[gh] = structuredClone(g[gh]);
      d[kh] = a.hand('world', v3(-turn * 0.03 * s, y + 0.03 * s, z), v3(-turn * 0.6, -0.6, -0.3), 0.2, 1);
      return;
    }
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
    // on the ball of the support foot (« pousser sur la plante du pied » [S35]) without standing on tiptoe
    d[k.support] = supportPivot(d[k.support], (g[k.support] as { yaw: number }).yaw + turn * deg(kind === 'round' ? 60 : 20), deg(kind === 'round' ? 40 : 25));
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
  // v0.29: the straight knee drives forward like a spear at the stomach, « don't knee upward » [S35] (it rose to
  // the opponent's chest, 34 cm above the hip)
  const kneePt =
    kind === 'round'
      ? new Vector3(turn * 0.1 * s, a.target('body').y + 0.04 * s, hipH.z + a.m.thigh * 0.85)
      : new Vector3(hipH.x * 0.3, a.target('liver').y + 0.02 * s, hipH.z + a.m.thigh * 0.92);
  const ankle = kneePt.clone().add(new Vector3(0, -a.m.shin * 0.85, -a.m.shin * 0.5));
  // knee strike: foot pointed down and back, toes pointed
  hit[k.kick] = joint(a.air(v3(ankle.x, ankle.y, ankle.z), kind === 'round' ? turn * deg(70) : 0, deg(65), kind === 'round' ? -turn * deg(40) : 0, kind === 'round' ? v3(turn * 0.6, 0.4, 1) : v3(0, 0.3, 1), deg(25)), 40, -10);
  const land = edit(g, (d) => {
    d.hips.y -= 0.01 * s;
  });
  const guardHands = edit(hit, (d) => {
    d.handL = structuredClone(g.handL);
    d.handR = structuredClone(g.handR);
  });
  // v0.29: the knee comes back down the way it went up, foot under the knee, before the foot goes back to its
  // place: going straight from the knee up to the stance swung the foot behind the support leg (legs crossed)
  const retract = edit(g, (d) => {
    d.hips.z += 0.04 * s;
    d.hips.y += 0.01 * s;
    d.pelvis.yaw += turn * deg(kind === 'round' ? 20 : 6);
  });
  {
    const hipR = a.hipJoint(retract, side === 'lead' ? 'L' : 'R');
    retract[k.kick] = joint(a.air(v3(hipR.x * 0.8, hipR.y - (a.m.thigh + a.m.shin) * 0.66, hipR.z - 0.08 * s), kind === 'round' ? turn * deg(30) : 0, deg(30), 0, v3(0, 0.3, 1), deg(10)), 30, -5);
  }
  return {
    id: `genou-${kind === 'round' ? 'circulaire' : 'direct'}-${side === 'lead' ? 'avant' : 'arriere'}${clinch ? '-clinch' : ''}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.16, pose: load, ease: 'load' },
      { t: 0.34, pose: hit, ease: 'strike' },
      { t: 0.4, pose: hit, ease: 'linear' },
      // hands back in guard first, while the knee is still up: the return never squeezes an elbow
      { t: 0.48, pose: guardHands, ease: 'inOut' },
      { t: 0.58, pose: retract, ease: 'inOut' },
      { t: 0.72, pose: land, ease: 'inOut' },
    ],
    chainAt: 0.62,
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
  // check: shin turned out, ankle slightly flexed (foot firm, toes up)
  up[k.kick] = joint(a.air(v3(ankle.x, ankle.y, ankle.z), k.sg * deg(30), deg(-10), 0, v3(k.sg * 0.8, 0.2, 1), 0), -5, 10);
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

/** the whole pose moved on the floor (hips, feet, hands placed in world space) */
function shifted(p: Pose, dx: number, dz: number): Pose {
  return edit(p, (d) => {
    d.hips.x += dx;
    d.hips.z += dz;
    for (const f of [d.footL, d.footR]) {
      if (f.mode === 'ground') f.ball = add(f.ball, { x: dx, z: dz });
      else f.ankle = add(f.ankle, { x: dx, z: dz });
    }
    for (const h of [d.handL, d.handR]) if (h.space === 'world') h.pos = add(h.pos, { x: dx, z: dz });
  });
}

/**
 * Switch kick (muay thai): a quick, narrow foot switch (lead foot back, rear foot forward), then the
 * former lead leg kicks the middle as a rear-leg kick of the other stance, and lands forward, back in
 * the starting stance (muaythai.com, "Switch Kick"). Built as the mirrored rear middle kick.
 */
function switchKick(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const gm = mirrorPose(g);
  const kick = roundKick(a, 'rear', 'liver', 'thai', 'x');
  const ball = (f: FootPose) => (f.mode === 'ground' ? f.ball : f.ankle);
  // 1. the lead foot leaves the floor and goes back, close to the rear foot (narrow switch)
  const up = edit(g, (d) => {
    if (d.footL.mode === 'ground') {
      d.footL.ball = v3((ball(g.footL).x + ball(gm.footL).x) / 2, 0.06 * s, (ball(g.footL).z + ball(gm.footL).z) / 2);
      d.footL.heel = deg(20);
    }
    d.hips.z -= 0.04 * s;
  });
  // 2. it lands behind while the rear foot lifts to come forward
  const half = edit(gm, (d) => {
    d.hips.x = (g.hips.x + gm.hips.x) / 2;
    d.hips.z = (g.hips.z + gm.hips.z) / 2 - 0.03 * s;
    d.pelvis = { ...g.pelvis, yaw: (g.pelvis.yaw + gm.pelvis.yaw) / 2 };
    d.chest = { ...g.chest, yaw: (g.chest.yaw + gm.chest.yaw) / 2 };
    d.footR = edit(g, (e) => {
      if (e.footR.mode === 'ground') {
        e.footR.ball = v3((ball(g.footR).x + ball(gm.footR).x) / 2, 0.06 * s, (ball(g.footR).z + ball(gm.footR).z) / 2);
        e.footR.heel = deg(20);
      }
    }).footR;
    d.handL = g.handL;
    d.handR = g.handR;
  });
  // 3. the kick of the other stance, the kicking leg landing forward: stance rebuilt one step ahead
  const keys = kick.keys.map((k) => ({ ...k, pose: mirrorPose(k.pose) }));
  const sup = ball(gm.footR);
  const dx = sup.x - ball(g.footR).x;
  const dz = sup.z - ball(g.footR).z;
  const t0 = 0.22;
  const last = keys[keys.length - 1];
  return {
    id: 'switch-kick',
    keys: [
      { t: 0, pose: g },
      { t: 0.08, pose: up, ease: 'inOut' },
      { t: 0.15, pose: half, ease: 'inOut' },
      { t: t0, pose: gm, ease: 'inOut' },
      ...keys.slice(1, -1).map((k) => ({ ...k, t: k.t + t0 })),
      { ...last, t: last.t + t0 + 0.06, pose: shifted(g, dx, dz) },
    ],
    chainAt: last.t + t0 - 0.04,
    impacts: kick.impacts.map((t) => t + t0),
    travel: { x: dx, z: dz, yaw: 0 },
    ...stand,
    balance: true,
  };
}

/**
 * Long guard (muay thai): the lead arm reaches out, open hand in front of the opponent's face to keep
 * him at a distance and block his view, the rear glove stays at the chin (Evolve MMA, "10 Muay Thai
 * defense techniques").
 */
function longGuard(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const T = a.target('chin', 0.66);
  const p = edit(g, (d) => {
    d.pelvis.yaw += deg(-4);
    d.chest.yaw += deg(-8);
    d.hips.z -= 0.02 * s;
    d.head.pitch += deg(4);
  });
  p.handL = a.hand('world', a.reach(p, 'L', v3(T.x, T.y + 0.02 * s, T.z), 0.9), v3(0.7, -0.5, -0.2), 0.6, 0.15, deg(-25));
  return {
    id: 'garde-longue',
    keys: [
      { t: 0, pose: g },
      { t: 0.22, pose: p, ease: 'inOut' },
      { t: 0.7, pose: p, ease: 'linear' },
      { t: 0.95, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.85,
    impacts: [],
    ...stand,
  };
}

/**
 * Catching a middle kick on the lead side (muay thai, shadow version): the lead arm covers the ribs
 * and absorbs, the rear hand scoops under the imaginary leg and holds it against the body, then the
 * rear foot steps back and the body turns, pulling the leg across (Evolve MMA, "10 Muay Thai defense
 * techniques"). The rear foot comes back to the stance at the end.
 */
function catchKick(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const cover = edit(g, (d) => {
    d.hips.y -= 0.03 * s;
    d.pelvis.yaw += deg(6);
    d.chest.yaw += deg(8);
    d.chest.roll += deg(8);
    d.handL.pos = add(g.handL.pos, { y: -0.2 * s, z: -0.05 * s, x: 0.03 * s });
    d.handL.pole = v3(0.3, -1, 0.05);
  });
  const W = a.hipJoint(g, 'L');
  const scoop = edit(cover, (d) => {
    // rear hand under the leg at waist height, palm up; lead forearm over it
    d.handR = a.hand('world', v3(W.x + 0.02 * s, W.y + 0.06 * s, W.z + 0.24 * s), v3(-0.4, -0.8, -0.3), -0.9, 0.5);
    d.handL = a.hand('world', v3(W.x + 0.06 * s, W.y + 0.2 * s, W.z + 0.2 * s), v3(0.8, -0.3, -0.2), 0.3, 0.6);
  });
  const rear = g.footR.mode === 'ground' ? g.footR.ball : v3(0, 0, 0);
  const stepOut = edit(scoop, (d) => {
    if (d.footR.mode === 'ground') d.footR.ball = add(rear, { z: -0.07 * s, y: 0.05 * s });
    d.hips.z -= 0.04 * s;
  });
  const pull = edit(scoop, (d) => {
    if (d.footR.mode === 'ground') d.footR.ball = add(rear, { z: -0.14 * s });
    d.hips.z -= 0.08 * s;
    d.hips.x -= 0.02 * s;
    d.pelvis.yaw += deg(-16);
    d.chest.yaw += deg(-10);
    d.chest.roll -= deg(6);
    d.handR.pos = add(d.handR.pos, { x: -0.12 * s, z: -0.08 * s });
    d.handL.pos = add(d.handL.pos, { x: -0.12 * s, z: -0.08 * s });
  });
  const stepBack = edit(g, (d) => {
    if (d.footR.mode === 'ground') d.footR.ball = add(rear, { z: -0.07 * s, y: 0.05 * s });
    d.hips.z -= 0.04 * s;
  });
  return {
    id: 'rattrapage-middle',
    keys: [
      { t: 0, pose: g },
      { t: 0.18, pose: cover, ease: 'snap' },
      { t: 0.4, pose: scoop, ease: 'inOut' },
      { t: 0.55, pose: stepOut, ease: 'inOut' },
      { t: 0.7, pose: pull, ease: 'inOut' },
      { t: 0.9, pose: pull, ease: 'linear' },
      { t: 1.12, pose: stepBack, ease: 'inOut' },
      { t: 1.3, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.2,
    impacts: [0.18],
    ...stand,
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
    switchKick(a),
    longGuard(a),
    catchKick(a),
  ];
}


