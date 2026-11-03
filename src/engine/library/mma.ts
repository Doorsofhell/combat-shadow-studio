/**
 * MMA solo work: level changes, takedown entries without a partner, sprawl, ground mobility
 * and technical stand-up. These are shadow adaptations: no opponent is represented.
 */
import { Author, add, edit } from '../author';
import type { Motion } from '../motion';
import { Pose, deg, v3 } from '../pose';

/** level change: hips drop, back straight, head up, hands in front ready to grab or frame */
function levelChange(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const low = edit(g, (d) => {
    d.hips.y -= 0.24 * s;
    d.hips.z += 0.02 * s;
    d.pelvis.pitch += deg(22);
    d.pelvis.yaw += deg(8);
    d.chest.pitch += deg(10);
    d.head.pitch += deg(-22);
    d.handL = a.hand('chest', v3(0.12 * s, -0.08 * s, 0.32 * s), v3(0.5, -1, -0.2), 0.1, 0.6);
    d.handR = a.hand('chest', v3(-0.12 * s, -0.06 * s, 0.26 * s), v3(-0.5, -1, -0.2), 0.1, 0.6);
  });
  return {
    id: 'changement-niveau',
    keys: [
      { t: 0, pose: g },
      { t: 0.24, pose: low, ease: 'snap' },
      { t: 0.4, pose: low, ease: 'linear' },
      { t: 0.7, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.6,
    impacts: [],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * Double-leg entry (solo): level change, penetration step with the lead foot, rear knee
 * drops close to the floor, hands reach around imaginary legs, then the coach steps back up.
 */
function shot(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const lead = g.footL.mode === 'ground' ? g.footL.ball : v3(0, 0, 0);
  const rear = g.footR.mode === 'ground' ? g.footR.ball : v3(0, 0, 0);
  const low = edit(g, (d) => {
    d.hips.y -= 0.22 * s;
    d.pelvis.pitch += deg(20);
    d.chest.pitch += deg(10);
    d.head.pitch += deg(-20);
    d.handL = a.hand('chest', v3(0.14 * s, -0.08 * s, 0.3 * s), v3(0.5, -1, -0.2), 0.1, 0.6);
    d.handR = a.hand('chest', v3(-0.14 * s, -0.06 * s, 0.26 * s), v3(-0.5, -1, -0.2), 0.1, 0.6);
  });
  const step = 0.42 * s;
  const pen = edit(low, (d) => {
    d.footL = a.ground(add(lead, { z: step, x: -0.06 * s }), deg(-5), 0);
    d.footR = a.ground(add(rear, { z: step * 0.55, x: 0.04 * s }), deg(-20), deg(70));
    d.hips = v3(0.0, a.m.hipsRest.y * 0.5, rear.z + step * 0.75 + 0.18 * s);
    d.pelvis = { yaw: deg(-12), pitch: deg(18), roll: 0 };
    d.chest = { yaw: deg(-4), pitch: deg(22), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-30), roll: 0 };
    const kneeY = 0.5 * s;
    d.handL = a.hand('world', v3(0.2 * s, kneeY, d.hips.z + 0.42 * s), v3(0.6, -0.4, -0.6), -0.3, 0.7, deg(10));
    d.handR = a.hand('world', v3(-0.18 * s, kneeY + 0.02 * s, d.hips.z + 0.4 * s), v3(-0.6, -0.4, -0.6), -0.3, 0.7, deg(10));
  });
  const drive = edit(pen, (d) => {
    d.hips.z += 0.06 * s;
    d.hips.y += 0.04 * s;
    d.handL.pos = add(d.handL.pos, { z: -0.12 * s, x: -0.06 * s });
    d.handR.pos = add(d.handR.pos, { z: -0.12 * s, x: 0.06 * s });
    d.chest.pitch -= deg(6);
  });
  const recover = edit(low, (d) => {
    d.footR = a.ground(add(rear, { z: 0.03 * s }), (g.footR as { yaw: number }).yaw, deg(40));
  });
  return {
    id: 'entree-lutte',
    keys: [
      { t: 0, pose: g },
      { t: 0.22, pose: low, ease: 'inOut' },
      { t: 0.52, pose: pen, ease: 'snap' },
      { t: 0.72, pose: drive, ease: 'inOut' },
      { t: 1.1, pose: recover, ease: 'inOut' },
      { t: 1.4, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.3,
    impacts: [0.52],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * Single-leg entry (solo): level change, a step toward the opponent's lead leg, head on the outside
 * of that leg, both hands locked together behind an imaginary knee, chest close to the thigh, then the
 * coach comes back up into stance (Evolve MMA, "10 essential wrestling moves": single-leg takedown).
 * The opponent stands in the same stance: his lead leg is on the coach's right.
 */
function singleLeg(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const lead = g.footL.mode === 'ground' ? g.footL.ball : v3(0, 0, 0);
  const rear = g.footR.mode === 'ground' ? g.footR.ball : v3(0, 0, 0);
  const low = edit(g, (d) => {
    d.hips.y -= 0.22 * s;
    d.pelvis.pitch += deg(20);
    d.chest.pitch += deg(10);
    d.head.pitch += deg(-20);
    d.handL = a.hand('chest', v3(0.1 * s, -0.08 * s, 0.3 * s), v3(0.5, -1, -0.2), 0.1, 0.6);
    d.handR = a.hand('chest', v3(-0.14 * s, -0.06 * s, 0.26 * s), v3(-0.5, -1, -0.2), 0.1, 0.6);
  });
  const step = 0.36 * s;
  const leg = -0.16 * s; // x of the imaginary leg
  const pen = edit(low, (d) => {
    d.footL = a.ground(add(lead, { z: step, x: -0.1 * s }), deg(-10), 0);
    d.footR = a.ground(add(rear, { z: step * 0.5, x: 0.02 * s }), deg(-20), deg(70));
    d.hips = v3(-0.04 * s, a.m.hipsRest.y * 0.52, rear.z + step * 0.7 + 0.18 * s);
    d.pelvis = { yaw: deg(-14), pitch: deg(18), roll: 0 };
    // the head goes to the outside of the leg (the coach's right)
    d.chest = { yaw: deg(-6), pitch: deg(24), roll: deg(-8) };
    d.head = { yaw: deg(-10), pitch: deg(-28), roll: deg(-6) };
    const kneeY = 0.48 * s;
    const z = d.hips.z + 0.38 * s;
    // hands joined behind the knee
    d.handL = a.hand('world', v3(leg + 0.05 * s, kneeY, z), v3(0.6, -0.4, -0.6), -0.4, 0.8, deg(10));
    d.handR = a.hand('world', v3(leg - 0.03 * s, kneeY - 0.02 * s, z + 0.02 * s), v3(-0.6, -0.4, -0.6), -0.4, 0.8, deg(10));
  });
  const lift = edit(pen, (d) => {
    // the joined hands pull the knee up against the chest
    d.hips.y += 0.03 * s;
    d.chest.pitch -= deg(6);
    d.handL.pos = add(d.handL.pos, { y: 0.1 * s, z: -0.1 * s });
    d.handR.pos = add(d.handR.pos, { y: 0.1 * s, z: -0.1 * s });
  });
  const recover = edit(low, (d) => {
    d.footR = a.ground(add(rear, { z: 0.03 * s }), (g.footR as { yaw: number }).yaw, deg(40));
  });
  return {
    id: 'single-leg',
    keys: [
      { t: 0, pose: g },
      { t: 0.22, pose: low, ease: 'inOut' },
      { t: 0.5, pose: pen, ease: 'snap' },
      { t: 0.75, pose: lift, ease: 'inOut' },
      { t: 1.12, pose: recover, ease: 'inOut' },
      { t: 1.42, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.32,
    impacts: [0.5],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * Sprawl: hips and legs shoot straight back, hips to the mat, hands forward pressing down on the
 * attacker's head and shoulders (imaginary in solo), then the feet hop back under and back to stance.
 * Sources: Evolve MMA "What is sprawling", Fanatic Wrestling / Ben Askren "Fixing the sprawl"
 * (docs/audit-biomecanique/BIBLIOGRAPHIE.md): hands on head/neck/shoulders, never on the hips; legs
 * straight back; hips to the mat. The legs leave the floor on the way back and on the way in, so the
 * feet do not slide.
 */
function sprawl(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  /** hands on the attacker's head and shoulders (imaginary), pressing down and away */
  const press = (d: Pose, y: number, z: number) => {
    d.handL = a.hand('world', v3(0.17 * s, y, z), v3(0.6, 0.1, -0.8), 1, 0, deg(-70));
    d.handR = a.hand('world', v3(-0.17 * s, y, z), v3(-0.6, 0.1, -0.8), 1, 0, deg(-70));
  };
  const drop = edit(g, (d) => {
    d.hips.y -= 0.3 * s;
    d.hips.z -= 0.05 * s;
    d.pelvis.pitch += deg(40);
    d.chest.pitch += deg(20);
    d.head.pitch += deg(-35);
    press(d, 0.5 * s, 0.42 * s);
  });
  const kick = edit(drop, (d) => {
    press(d, 0.06 * s, 0.4 * s);
    d.hips = v3(0, 0.42 * s, -0.42 * s);
    d.pelvis = { yaw: 0, pitch: deg(72), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(-10), roll: 0 };
    // 1.8.0: the legs shoot back already straight (a leg's length behind the hips), not bent under the body
    const back = d.hips.z - 0.92 * a.L;
    d.footL = a.air(v3(0.26 * s, 0.3 * s, back), deg(10), deg(30), 0, v3(0.3, -1, 0), deg(20));
    d.footR = a.air(v3(-0.26 * s, 0.3 * s, back), deg(-10), deg(30), 0, v3(-0.3, -1, 0), deg(20));
  });
  const flat = edit(kick, (d) => {
    press(d, 0.05 * s, 0.38 * s); // the head is pushed down to the mat: in solo the hands end on the floor and break the fall
    d.hips = v3(0, 0.2 * s, -0.5 * s);
    d.pelvis = { yaw: 0, pitch: deg(84), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(-24), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-45), roll: 0 };
    // 1.8.0 (audit des mouvements; Youssef: « le sprawl garde les tibias levés »): the legs are long and straight
    // behind, on the toes; with the feet at -1.18 m the legs were too long for the gap and the knees bent through
    // the mat (thighs up to 20 cm under the floor, shins pointing up). The feet now sit a leg's length behind the hips.
    const back = d.hips.z - 0.97 * a.L;
    d.footL = a.ground(v3(0.3 * s, 0, back), deg(15), deg(78));
    d.footR = a.ground(v3(-0.3 * s, 0, back), deg(-15), deg(78));
  });
  // the feet leave the floor to come back under the hips (a hop), they never drag on the mat
  const hop = edit(flat, (d) => {
    press(d, 0.05 * s, 0.36 * s); // the hands push off the floor to lift the hips
    d.hips = v3(0, 0.52 * s, -0.3 * s);
    d.pelvis = { yaw: 0, pitch: deg(55), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(5), roll: 0 };
    d.footL = a.air(v3(0.22 * s, 0.26 * s, -0.62 * s), deg(5), deg(40), 0, v3(0.3, -1, 0.3), deg(10));
    d.footR = a.air(v3(-0.22 * s, 0.22 * s, -0.66 * s), deg(-10), deg(35), 0, v3(-0.3, -1, 0.3), deg(10));
  });
  // both feet land in stance, hips low, then the coach stands back up into guard
  const crouch = edit(g, (d) => {
    d.hips.y -= 0.24 * s;
    d.hips.z -= 0.04 * s;
    d.pelvis.pitch += deg(30);
    d.chest.pitch += deg(12);
    d.head.pitch += deg(-25);
  });
  return {
    id: 'sprawl',
    keys: [
      { t: 0, pose: g },
      // gentle easing (half the peak speed of 'inOut') and no stop at the drop: the hands travel
      // from the guard to the floor in one continuous move instead of two bursts (anomaly 22)
      { t: 0.24, pose: drop, ease: 'load' },
      { t: 0.4, pose: kick, ease: 'linear' },
      { t: 0.52, pose: flat, ease: 'out' },
      { t: 0.78, pose: flat, ease: 'linear' },
      // the hips rise in two pushes: flowing through the hop would lower them mid-way and bring the
      // knees through the mat. 1.8.0: the feet come from a leg's length behind, a little more time for it
      { t: 1.12, pose: hop, ease: 'inOut', hold: true },
      { t: 1.28, pose: crouch, ease: 'load' },
      { t: 1.56, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.48,
    impacts: [0.52],
    startState: 'stand',
    endState: 'stand',
  };
}

function takedownDefence(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const p = edit(g, (d) => {
    d.hips.y -= 0.12 * s;
    d.hips.z -= 0.14 * s;
    d.pelvis.pitch += deg(30);
    d.chest.pitch += deg(12);
    d.head.pitch += deg(-20);
    if (d.footL.mode === 'ground') d.footL.ball = add(d.footL.ball, { z: -0.08 * s });
    if (d.footR.mode === 'ground') {
      d.footR.ball = add(d.footR.ball, { z: -0.18 * s });
      d.footR.heel = deg(45);
    }
    const y = a.target('body').y - 0.12 * s;
    // elbows back and close to the body, not flared to the side: the hands frame the opponent's
    // shoulders without the upper arm turning in on itself
    d.handL = a.hand('world', v3(0.16 * s, y, 0.42 * s), v3(0.4, -0.45, -0.8), 1, 0.3, deg(-30));
    d.handR = a.hand('world', v3(-0.16 * s, y, 0.4 * s), v3(-0.4, -0.45, -0.8), 1, 0.3, deg(-30));
  });
  return {
    id: 'defense-lutte',
    keys: [
      { t: 0, pose: g },
      { t: 0.2, pose: p, ease: 'snap' },
      { t: 0.45, pose: p, ease: 'linear' },
      { t: 0.75, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.65,
    impacts: [0.2],
    startState: 'stand',
    endState: 'stand',
  };
}

/** seated base on the floor: left hand posted behind, right foot planted, left leg in front */
export function seated(a: Author): Pose {
  const s = a.s;
  return {
    hips: v3(0.0, 0.13 * s, -0.12 * s),
    pelvis: { yaw: deg(-15), pitch: deg(-40), roll: deg(-6) },
    chest: { yaw: deg(10), pitch: deg(35), roll: deg(4) },
    head: { yaw: 0, pitch: deg(-5), roll: 0 },
    handL: a.hand('world', v3(0.3 * s, 0.045 * s, -0.42 * s), v3(0.4, 0.6, 0.6), 1, 0.1, deg(-70)),
    handR: a.hand('chest', v3(-0.06 * s, 0.1 * s, 0.24 * s), v3(-0.5, -1, 0), 0.1, 1),
    footL: a.air(v3(0.14 * s, 0.1 * s, 0.62 * s), deg(10), deg(20), 0, v3(0.3, 1, 0.3), deg(10)),
    // planted foot in front, knee up (not fallen out to the side: that would twist the hip outward
    // far past its range)
    footR: { ...a.ground(v3(-0.18 * s, 0, 0.32 * s), deg(-8), 0), pole: v3(-0.12, 1, 0.3) },
  };
}

function sitDown(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const sq = edit(g, (d) => {
    d.hips = v3(-0.06 * s, a.m.hipsRest.y * 0.48, -0.16 * s);
    d.pelvis.pitch = deg(10);
    d.chest.pitch = deg(25);
    d.handL = a.hand('world', v3(0.3 * s, 0.25 * s, -0.4 * s), v3(0.4, 0.4, 0.6), 1, 0.2, deg(-50));
    if (d.footL.mode === 'ground') d.footL.heel = deg(10);
  });
  const sit = seated(a);
  return {
    id: 'descente-sol',
    keys: [
      { t: 0, pose: g },
      { t: 0.35, pose: sq, ease: 'inOut' },
      { t: 0.75, pose: sit, ease: 'inOut' },
      { t: 0.9, pose: sit, ease: 'linear' },
    ],
    impacts: [],
    startState: 'stand',
    endState: 'ground',
  };
}

/** hip escape from the seated base: hips slide back on the posted hand and foot, back to base */
function hipEscape(a: Author): Motion {
  const s = a.s;
  const base = seated(a);
  const side = edit(base, (d) => {
    d.pelvis = { yaw: deg(-55), pitch: deg(-55), roll: deg(-30) };
    d.chest = { yaw: deg(25), pitch: deg(30), roll: deg(10) };
    d.hips = v3(0.04 * s, 0.12 * s, -0.08 * s);
    d.handR = a.hand('chest', v3(-0.02 * s, 0.14 * s, 0.26 * s), v3(-0.3, -1, 0), 0.1, 0.8);
    d.footL = a.air(v3(0.1 * s, 0.12 * s, 0.4 * s), deg(10), deg(10), 0, v3(0.3, 1, 0.3), 0);
  });
  const push = edit(side, (d) => {
    d.hips = v3(0.1 * s, 0.13 * s, -0.4 * s);
    d.handL.pos = add(d.handL.pos, { z: -0.25 * s });
    d.footL = a.air(v3(0.2 * s, 0.12 * s, 0.25 * s), deg(10), deg(15), 0, v3(0.3, 1, 0.3), 0);
  });
  const back = edit(base, (d) => {
    d.hips = add(d.hips, { z: -0.28 * s, x: 0.1 * s });
    d.handL.pos = add(d.handL.pos, { z: -0.28 * s, x: 0.1 * s });
    if (d.footR.mode === 'ground') d.footR.ball = add(d.footR.ball, { z: -0.28 * s, x: 0.1 * s });
    if (d.footL.mode === 'air') d.footL.ankle = add(d.footL.ankle, { z: -0.28 * s, x: 0.1 * s });
  });
  return {
    id: 'sortie-hanche',
    keys: [
      { t: 0, pose: base },
      { t: 0.3, pose: side, ease: 'inOut' },
      { t: 0.6, pose: push, ease: 'snap' },
      { t: 1.0, pose: back, ease: 'inOut' },
      { t: 1.3, pose: base, ease: 'inOut' },
    ],
    impacts: [0.6],
    startState: 'ground',
    endState: 'ground',
  };
}

/** technical stand-up: post hand and foot, lift the hips, swing the leg back, land in guard */
function standUp(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const base = seated(a);
  const lift = edit(base, (d) => {
    d.hips = v3(0.08 * s, 0.42 * s, -0.25 * s);
    d.pelvis = { yaw: deg(-35), pitch: deg(-5), roll: deg(-25) };
    d.chest = { yaw: deg(20), pitch: deg(30), roll: deg(10) };
    d.footL = a.air(v3(0.05 * s, 0.12 * s, -0.15 * s), deg(-30), deg(20), 0, v3(0.6, -0.4, 1), 0);
  });
  const swing = edit(lift, (d) => {
    d.hips = v3(0.04 * s, 0.62 * s, -0.3 * s);
    d.pelvis = { yaw: deg(-30), pitch: deg(25), roll: deg(-6) };
    d.chest = { yaw: deg(10), pitch: deg(25), roll: 0 };
    d.footL = a.ground(v3(0.1 * s, 0, -0.62 * s), deg(-40), deg(30));
    d.handL = a.hand('world', v3(0.3 * s, 0.2 * s, -0.42 * s), v3(0.4, 0.4, 0.6), 1, 0.3, deg(-40));
  });
  // land in a guard that is rotated: the rear foot is now the left; rebuild the orthodox guard by a short step
  const rise = edit(g, (d) => {
    d.hips.y -= 0.1 * s;
    d.hips.z -= 0.2 * s;
    d.chest.pitch += deg(10);
  });
  return {
    id: 'releve-technique',
    keys: [
      { t: 0, pose: base },
      { t: 0.35, pose: lift, ease: 'inOut' },
      { t: 0.7, pose: swing, ease: 'inOut' },
      { t: 1.05, pose: rise, ease: 'inOut' },
      { t: 1.35, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.3,
    impacts: [],
    startState: 'ground',
    endState: 'stand',
  };
}

export function mmaMotions(a: Author): Motion[] {
  return [levelChange(a), shot(a), sprawl(a), takedownDefence(a), sitDown(a), hipEscape(a), standUp(a), singleLeg(a)];
}
