/**
 * BJJ and judo solo work. Only what is really done alone: ground mobility (bridge, guard retention,
 * change of base) and judo postures, displacements, kuzushi and uchikomi entries without a partner.
 * Throws, passes, pins and submissions need a partner: they are described in fiches, never animated
 * here as solo drills.
 */
import { Author, edit } from '../author';
import type { Motion } from '../motion';
import { Pose, deg, v3 } from '../pose';
import { seated as mmaSeated } from './mma';

/** seated base of the MMA library (its planted knee points up, which blends smoothly into lying positions) */
const seated = (a: Author) => mmaSeated(a);

/** foot flat on the floor with the knee pointing up (lying on the back) */
const flat = (ball: Pose['hips'], yaw: number, side: 1 | -1, heel = 0) => ({ mode: 'ground' as const, ball, yaw, heel, pole: v3(side * 0.25, 1, 0.2) });

/** lying on the back, knees bent, feet flat, chin tucked, hands framing above the chest */
export function supine(a: Author): Pose {
  const s = a.s;
  return {
    hips: v3(0, 0.11 * s, -0.3 * s),
    pelvis: { yaw: 0, pitch: deg(-88), roll: 0 },
    chest: { yaw: 0, pitch: deg(4), roll: 0 },
    head: { yaw: 0, pitch: deg(30), roll: 0 },
    handL: a.hand('world', v3(0.14 * s, 0.32 * s, -0.55 * s), v3(0.8, 0, -0.5), 0.2, 0.5),
    handR: a.hand('world', v3(-0.14 * s, 0.32 * s, -0.55 * s), v3(-0.8, 0, -0.5), 0.2, 0.5),
    footL: flat(v3(0.17 * s, 0, 0.12 * s), deg(-8), 1),
    footR: flat(v3(-0.17 * s, 0, 0.12 * s), deg(8), -1),
  };
}

/** from the seated base to the back (controlled: hand posted, chin tucked) */
const lieBack = (a: Author) => {
  const s = a.s;
  return edit(seated(a), (d) => {
    d.hips = v3(0, 0.11 * s, -0.22 * s);
    d.pelvis = { yaw: 0, pitch: deg(-65), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(10), roll: 0 };
    d.head.pitch = deg(25);
    d.footL = flat(v3(0.17 * s, 0, 0.36 * s), deg(-8), 1);
    d.footR = flat(v3(-0.17 * s, 0, 0.36 * s), deg(8), -1);
  });
};

/** bridge (upa): feet close to the hips, hips drive up and over one shoulder, then come back down */
function bridge(a: Author): Motion {
  const s = a.s;
  const base = seated(a);
  const back = supine(a);
  const up = edit(back, (d) => {
    d.hips = v3(0.04 * s, 0.36 * s, -0.36 * s);
    d.pelvis = { yaw: deg(-12), pitch: deg(-112), roll: deg(-22) };
    d.chest = { yaw: deg(10), pitch: deg(12), roll: deg(-8) };
    d.head = { yaw: deg(-20), pitch: deg(10), roll: 0 };
    d.handL = a.hand('world', v3(-0.05 * s, 0.42 * s, -0.75 * s), v3(0.6, 0, -0.6), 0.2, 0.6);
    d.handR = a.hand('world', v3(-0.25 * s, 0.3 * s, -0.7 * s), v3(-0.8, 0, -0.4), 0.2, 0.6);
  });
  return {
    id: 'pont',
    keys: [
      { t: 0, pose: base },
      { t: 0.45, pose: lieBack(a), ease: 'inOut' },
      { t: 0.8, pose: back, ease: 'inOut' },
      { t: 1.05, pose: up, ease: 'snap' },
      { t: 1.35, pose: up, ease: 'linear' },
      { t: 1.75, pose: back, ease: 'inOut' },
      { t: 2.2, pose: lieBack(a), ease: 'inOut' },
      { t: 2.6, pose: base, ease: 'inOut' },
    ],
    impacts: [1.05],
    startState: 'ground',
    endState: 'ground',
  };
}

/**
 * guard retention, solo: on the back, legs up as frames; the hips turn to face an imaginary
 * partner moving around (left, then right), knees stay between him and the chest.
 */
function guardRetention(a: Author): Motion {
  const s = a.s;
  const base = seated(a);
  const legsUp = edit(supine(a), (d) => {
    d.hips = v3(0, 0.12 * s, -0.32 * s);
    d.pelvis = { yaw: 0, pitch: deg(-100), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(14), roll: 0 };
    d.footL = a.air(v3(0.2 * s, 0.42 * s, 0.05 * s), deg(-10), deg(-60), 0, v3(0.3, 1, 0.4), 0);
    d.footR = a.air(v3(-0.2 * s, 0.42 * s, 0.05 * s), deg(10), deg(-60), 0, v3(-0.3, 1, 0.4), 0);
  });
  const turn = (sign: 1 | -1) =>
    edit(legsUp, (d) => {
      d.hips = v3(-sign * 0.08 * s, 0.12 * s, -0.34 * s);
      d.pelvis = { yaw: sign * deg(35), pitch: deg(-100), roll: sign * deg(25) };
      d.chest = { yaw: -sign * deg(10), pitch: deg(12), roll: 0 };
      d.footL = a.air(v3(0.2 * s + sign * 0.14 * s, 0.4 * s, -0.04 * s), sign * deg(20), deg(-50), 0, v3(0.3, 1, 0.4), 0);
      d.footR = a.air(v3(-0.2 * s + sign * 0.14 * s, 0.36 * s, -0.02 * s), sign * deg(20), deg(-50), 0, v3(-0.3, 1, 0.4), 0);
    });
  return {
    id: 'retention-garde',
    keys: [
      { t: 0, pose: base },
      { t: 0.45, pose: lieBack(a), ease: 'inOut' },
      { t: 0.85, pose: legsUp, ease: 'inOut' },
      { t: 1.25, pose: turn(1), ease: 'inOut' },
      { t: 1.65, pose: legsUp, ease: 'inOut' },
      { t: 2.05, pose: turn(-1), ease: 'inOut' },
      { t: 2.45, pose: legsUp, ease: 'inOut' },
      { t: 2.85, pose: lieBack(a), ease: 'inOut' },
      { t: 3.25, pose: base, ease: 'inOut' },
    ],
    impacts: [],
    startState: 'ground',
    endState: 'ground',
  };
}

/** change of base: from the seated base to all fours (hands and knees, hips high), then back */
function baseSwitch(a: Author): Motion {
  const s = a.s;
  const base = seated(a);
  const turn = edit(base, (d) => {
    d.hips = v3(0.05 * s, 0.25 * s, -0.15 * s);
    d.pelvis = { yaw: deg(-50), pitch: deg(10), roll: deg(-15) };
    d.chest = { yaw: deg(-5), pitch: deg(20), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-10), roll: 0 };
    d.handR = a.hand('world', v3(0.05 * s, 0.045 * s, 0.1 * s), v3(-0.4, 0.6, 0.6), 1, 0.1, deg(-70));
    // the planted foot turns with the hips (on a fixed foot the right hip would twist inward past its range)
    if (d.footR.mode === 'ground') d.footR.yaw += deg(-20);
  });
  const fours = {
    hips: v3(0, 0.5 * s, -0.25 * s),
    pelvis: { yaw: 0, pitch: deg(70), roll: 0 },
    chest: { yaw: 0, pitch: deg(15), roll: 0 },
    head: { yaw: 0, pitch: deg(-40), roll: 0 },
    handL: a.hand('world', v3(0.2 * s, 0.045 * s, 0.32 * s), v3(0.7, 0.2, -0.6), 1, 0, deg(-75)),
    handR: a.hand('world', v3(-0.2 * s, 0.045 * s, 0.32 * s), v3(-0.7, 0.2, -0.6), 1, 0, deg(-75)),
    footL: a.ground(v3(0.16 * s, 0, -0.62 * s), deg(10), deg(60)),
    footR: a.ground(v3(-0.16 * s, 0, -0.62 * s), deg(-10), deg(60)),
  } satisfies Pose;
  return {
    id: 'changement-base',
    keys: [
      { t: 0, pose: base },
      { t: 0.4, pose: turn, ease: 'inOut' },
      { t: 0.8, pose: fours, ease: 'inOut' },
      { t: 1.2, pose: fours, ease: 'linear' },
      { t: 1.6, pose: turn, ease: 'inOut' },
      { t: 2.0, pose: base, ease: 'inOut' },
    ],
    impacts: [],
    startState: 'ground',
    endState: 'ground',
  };
}

// ------------------------------------------------------------------ judo (standing, solo)

/** tai-sabaki: the body turns about the lead foot, the rear foot sweeps a half-circle, then back */
function taiSabaki(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const lead = g.footL.mode === 'ground' ? g.footL.ball : v3(0.16 * s, 0, 0.09 * s);
  // the whole stance turns about the lead foot: the rear foot goes back first (quarter turn), then
  // ends in front, on the same side of the body, without the feet ever crossing
  const yawL = g.footL.mode === 'ground' ? g.footL.yaw : 0;
  const yawR = g.footR.mode === 'ground' ? g.footR.yaw : 0;
  const half = edit(g, (d) => {
    d.hips = v3(lead.x + 0.08 * s, d.hips.y - 0.04 * s, lead.z - 0.12 * s);
    d.pelvis.yaw += deg(-90);
    d.footL = a.ground(lead, yawL + deg(-90), 0);
    d.footR = a.ground(v3(lead.x + 0.16 * s, 0, lead.z - 0.32 * s), yawR + deg(-90), deg(10));
  });
  const turned = edit(g, (d) => {
    d.hips = v3(lead.x + 0.16 * s, d.hips.y - 0.06 * s, lead.z + 0.08 * s);
    d.pelvis.yaw += deg(-180);
    d.footL = a.ground(lead, yawL + deg(-180), 0);
    d.footR = a.ground(v3(lead.x + 0.32 * s, 0, lead.z + 0.16 * s), yawR + deg(-180), 0);
  });
  return {
    id: 'tai-sabaki',
    keys: [
      { t: 0, pose: g },
      { t: 0.35, pose: half, ease: 'inOut' },
      { t: 0.7, pose: turned, ease: 'inOut' },
      { t: 1.0, pose: turned, ease: 'linear' },
      { t: 1.35, pose: half, ease: 'inOut' },
      { t: 1.7, pose: g, ease: 'inOut' },
    ],
    impacts: [0.7],
    startState: 'stand',
    endState: 'stand',
  };
}

/** kuzushi, solo: a step back with the rear foot while the lead hand pulls to the hip and the rear hand lifts */
function kuzushi(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const pull = edit(g, (d) => {
    d.hips.z -= 0.12 * s;
    d.hips.y -= 0.03 * s;
    d.pelvis.yaw += deg(-15);
    d.chest.pitch -= deg(4);
    if (d.footR.mode === 'ground') d.footR.ball = { ...d.footR.ball, z: d.footR.ball.z - 0.18 * s };
    d.handL = a.hand('world', v3(0.2 * s, a.m.hipsRest.y + 0.05 * s, -0.02 * s), v3(0.8, -0.6, -0.2), 0.3, 0.8);
    d.handR = a.hand('world', v3(-0.06 * s, a.m.hipsRest.y + 0.36 * s, 0.34 * s), v3(-0.8, -0.4, -0.2), 0.6, 0.8);
  });
  return {
    id: 'kuzushi',
    keys: [
      { t: 0, pose: g },
      { t: 0.35, pose: pull, ease: 'snap' },
      { t: 0.6, pose: pull, ease: 'linear' },
      { t: 1.0, pose: g, ease: 'inOut' },
    ],
    impacts: [0.35],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * uchikomi (solo) for seoi-nage: step in with the right foot, pivot on it, the left foot comes
 * beside it, back turned to an imaginary partner, knees bent so the hips go below his belt, hands
 * pulling forward. Only the entry: there is nobody to throw.
 */
function uchikomiSeoi(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const step = edit(g, (d) => {
    d.hips = v3(-0.02 * s, d.hips.y - 0.05 * s, 0.12 * s);
    // right seoi-nage: the right hip leads the turn (turning the other way would cross the legs)
    d.pelvis.yaw += deg(80);
    d.footR = a.ground(v3(0.02 * s, 0, 0.3 * s), deg(105), 0);
    // the left foot pivots on its ball with the hips (a planted foot would twist the left hip inward
    // far past its range)
    if (d.footL.mode === 'ground') d.footL = a.ground(d.footL.ball, d.footL.yaw + deg(45), deg(20));
  });
  const fit = edit(g, (d) => {
    d.hips = v3(-0.04 * s, a.m.hipsRest.y - 0.2 * s, 0.32 * s);
    d.pelvis = { yaw: deg(180), pitch: deg(18), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(22), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-6), roll: 0 };
    // back turned (facing -z): the right foot is now on the +x side, feet parallel, inside
    d.footR = a.ground(v3(0.1 * s, 0, 0.34 * s), deg(180), 0);
    d.footL = a.ground(v3(-0.18 * s, 0, 0.3 * s), deg(180), 0);
    // hands pulled down and forward (the partner's sleeve and lapel), elbow under the armpit
    const y = a.m.hipsRest.y + 0.12 * s;
    // (back turned: the coach's front is −z, so an elbow pointing forward is −z here) left elbow down
    // and out, pulling the sleeve; right elbow down and forward, under the partner's armpit
    d.handL = a.hand('world', v3(-0.08 * s, y, 0.0), v3(-0.4, -1, 0), 0.3, 0.85);
    d.handR = a.hand('world', v3(0.1 * s, y + 0.04 * s, -0.04 * s), v3(0.1, -0.7, -0.7), 0.6, 0.85);
  });
  return {
    id: 'uchikomi-seoi',
    keys: [
      { t: 0, pose: g },
      { t: 0.3, pose: step, ease: 'inOut' },
      { t: 0.6, pose: fit, ease: 'snap' },
      { t: 0.85, pose: fit, ease: 'linear' },
      { t: 1.15, pose: step, ease: 'inOut' },
      { t: 1.5, pose: g, ease: 'inOut' },
    ],
    impacts: [0.6],
    startState: 'stand',
    endState: 'stand',
  };
}

export function grapplingMotions(a: Author): Motion[] {
  return [bridge(a), guardRetention(a), baseSwitch(a), taiSabaki(a), kuzushi(a), uchikomiSeoi(a)];
}
