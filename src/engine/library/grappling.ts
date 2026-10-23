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

/**
 * foot flat on the floor with the knee pointing up (lying on the back). The toes turn slightly out
 * (+yaw left, −yaw right, like the seated base): turned in, the shin twisted against the foot past
 * the planted range and the knee flipped by about 40° between two frames (pont, rétention de garde).
 */
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
    footL: flat(v3(0.17 * s, 0, 0.12 * s), deg(8), 1),
    footR: flat(v3(-0.17 * s, 0, 0.12 * s), deg(-8), -1),
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
    d.footL = flat(v3(0.17 * s, 0, 0.36 * s), deg(8), 1);
    d.footR = flat(v3(-0.17 * s, 0, 0.36 * s), deg(-8), -1);
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

/** from the seated base, the hips turning toward the floor on the posted hands (on the way to all fours) */
function turnToFours(a: Author): Pose {
  const s = a.s;
  return edit(seated(a), (d) => {
    d.hips = v3(0.05 * s, 0.25 * s, -0.15 * s);
    d.pelvis = { yaw: deg(-50), pitch: deg(10), roll: deg(-15) };
    d.chest = { yaw: deg(-5), pitch: deg(20), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-10), roll: 0 };
    d.handR = a.hand('world', v3(0.05 * s, 0.045 * s, 0.1 * s), v3(-0.4, 0.6, 0.6), 1, 0.1, deg(-70));
    // the planted foot turns with the hips (on a fixed foot the right hip would twist inward past its range)
    if (d.footR.mode === 'ground') d.footR.yaw += deg(-20);
  });
}

/** all fours: hands under the shoulders, knees and toes on the mat, hips high, back flat */
function allFours(a: Author): Pose {
  const s = a.s;
  return {
    hips: v3(0, 0.5 * s, -0.25 * s),
    pelvis: { yaw: 0, pitch: deg(70), roll: 0 },
    chest: { yaw: 0, pitch: deg(15), roll: 0 },
    head: { yaw: 0, pitch: deg(-40), roll: 0 },
    handL: a.hand('world', v3(0.2 * s, 0.045 * s, 0.32 * s), v3(0.7, 0.2, -0.6), 1, 0, deg(-75)),
    handR: a.hand('world', v3(-0.2 * s, 0.045 * s, 0.32 * s), v3(-0.7, 0.2, -0.6), 1, 0, deg(-75)),
    footL: a.ground(v3(0.16 * s, 0, -0.62 * s), deg(10), deg(60)),
    footR: a.ground(v3(-0.16 * s, 0, -0.62 * s), deg(-10), deg(60)),
  } satisfies Pose;
}

/** change of base: from the seated base to all fours (hands and knees, hips high), then back */
function baseSwitch(a: Author): Motion {
  const base = seated(a);
  const turn = turnToFours(a);
  const fours = allFours(a);
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


// ------------------------------------------------------------------ judo: v0.28 additions (solo)

const ballOf = (f: Pose['footL']) => (f.mode === 'ground' ? f.ball : f.ankle);
const yawOfFoot = (f: Pose['footL']) => f.yaw;

/**
 * ayumi-ashi: walking steps, the feet pass each other (IJF/Kodokan glossary). The rear foot passes the
 * lead foot and lands ahead, then the other foot passes in turn: one cycle, the same stance a step ahead.
 * The feet stay at their own width, so they pass side by side and never cross.
 */
function ayumiAshi(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const d = 0.3 * s;
  const L0 = ballOf(g.footL);
  const R0 = ballOf(g.footR);
  const lift = 0.035 * s;
  const rMid = edit(g, (p) => {
    p.hips.z += d * 0.3;
    p.hips.x -= 0.02 * s;
    p.pelvis.yaw += deg(6);
    p.footR = a.ground(v3(R0.x, lift, (R0.z + L0.z) / 2 + d * 0.15), yawOfFoot(g.footR), deg(12));
    if (p.footL.mode === 'ground') p.footL.heel = deg(6);
  });
  const rLand = edit(g, (p) => {
    p.hips.z += d * 0.55;
    p.pelvis.yaw += deg(14);
    p.footR = a.ground(v3(R0.x, 0, R0.z + d), yawOfFoot(g.footR), 0);
    if (p.footL.mode === 'ground') p.footL.heel = deg(14);
  });
  const lMid = edit(g, (p) => {
    p.hips.z += d * 0.75;
    p.hips.x += 0.02 * s;
    p.pelvis.yaw += deg(6);
    p.footR = a.ground(v3(R0.x, 0, R0.z + d), yawOfFoot(g.footR), deg(6));
    p.footL = a.ground(v3(L0.x, lift, (L0.z + R0.z) / 2 + d * 0.85), yawOfFoot(g.footL), deg(12));
  });
  const end = edit(g, (p) => {
    p.hips.z += d;
    p.footR = a.ground(v3(R0.x, 0, R0.z + d), yawOfFoot(g.footR), 0);
    p.footL = a.ground(v3(L0.x, 0, L0.z + d), yawOfFoot(g.footL), 0);
  });
  return {
    id: 'ayumi-ashi',
    keys: [
      { t: 0, pose: g },
      { t: 0.22, pose: rMid, ease: 'inOut' },
      { t: 0.42, pose: rLand, ease: 'linear' },
      { t: 0.64, pose: lMid, ease: 'linear' },
      { t: 0.86, pose: end, ease: 'inOut' },
    ],
    chainAt: 0.8,
    impacts: [],
    travel: { x: 0, z: d, yaw: 0 },
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * kumi-kata (taking the grips, solo): open hands look for the grips, the lead hand closes on the
 * sleeve at elbow height (hikite), the rear hand on the lapel at chest height (tsurite), a short pull
 * of the sleeve hand, then back to shizen-tai. The feet do not move.
 */
function kumikata(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const shY = a.shoulder(g, 'R').y;
  const elbowY = a.m.hipsRest.y + 0.1 * s;
  const seek = edit(g, (p) => {
    p.hips.z += 0.02 * s;
    p.chest.pitch += deg(3);
    p.handL = a.hand('world', v3(0.16 * s, elbowY + 0.1 * s, 0.36 * s), v3(0.7, -1, -0.2), 0.2, 0.15);
    p.handR = a.hand('world', v3(-0.06 * s, shY - 0.1 * s, 0.34 * s), v3(-0.7, -1, -0.2), 0.3, 0.15);
  });
  const grip = edit(g, (p) => {
    p.hips.z += 0.04 * s;
    p.chest.pitch += deg(4);
    p.handL = a.hand('world', v3(0.14 * s, elbowY, 0.46 * s), v3(0.7, -1, -0.2), 0.35, 0.95);
    p.handR = a.hand('world', v3(-0.03 * s, shY - 0.14 * s, 0.42 * s), v3(-0.7, -1, -0.15), 0.55, 0.95);
  });
  const pull = edit(grip, (p) => {
    p.hips.z -= 0.03 * s;
    p.pelvis.yaw += deg(-6);
    p.chest.yaw += deg(-4);
    p.handL = a.hand('world', v3(0.18 * s, elbowY - 0.02 * s, 0.3 * s), v3(0.8, -1, -0.3), 0.3, 0.95);
    p.handR = a.hand('world', v3(-0.03 * s, shY - 0.1 * s, 0.4 * s), v3(-0.7, -1, -0.15), 0.55, 0.95);
  });
  return {
    id: 'kumikata',
    keys: [
      { t: 0, pose: g },
      { t: 0.35, pose: seek, ease: 'inOut' },
      { t: 0.6, pose: grip, ease: 'snap' },
      { t: 0.9, pose: pull, ease: 'inOut' },
      { t: 1.15, pose: grip, ease: 'inOut' },
      { t: 1.55, pose: g, ease: 'inOut' },
    ],
    chainAt: 1.45,
    impacts: [0.6],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * Judo-only entries start from shizen-tai in every style. Outside judo they exist only so every motion
 * is available everywhere: they are built from the plain judo stance there, without the coach's own
 * guard offsets (those belong to the coach's discipline).
 */
const judoAuthor = (a: Author) => (a.style === 'judo' ? a : new Author(a.m, a.chestFrame, 'judo'));

/** a planted foot lifted a little on its ball while it travels (a step, never a slide) */
const lifted = (a: Author, ball: Pose['hips'], yaw: number, heel: number, y = 0.04) => a.ground(v3(ball.x, y * a.s, ball.z), yaw, heel);

/**
 * o-goshi uchikomi (solo): the same turning entry as seoi-nage (right foot in, pivot, left foot beside
 * it, back to the partner), the hips lower and deeper than his belt, the right arm around his waist,
 * the left hand pulling the sleeve forward. Only the entry (tsukuri): nobody is thrown.
 */
function uchikomiOgoshi(author: Author): Motion {
  const a = judoAuthor(author);
  const g = a.guard();
  const s = a.s;
  const step = edit(g, (d) => {
    d.hips = v3(-0.02 * s, d.hips.y - 0.05 * s, 0.12 * s);
    d.pelvis.yaw += deg(80);
    d.footR = a.ground(v3(0.02 * s, 0, 0.3 * s), deg(105), 0);
    if (d.footL.mode === 'ground') d.footL = a.ground(d.footL.ball, d.footL.yaw + deg(45), deg(20));
  });
  const fit = edit(g, (d) => {
    // the hips go a little further across than for seoi-nage: the right hip passes the partner's centre
    d.hips = v3(0.03 * s, a.m.hipsRest.y - 0.22 * s, 0.33 * s);
    d.pelvis = { yaw: deg(180), pitch: deg(16), roll: 0 };
    d.chest = { yaw: deg(-6), pitch: deg(18), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-6), roll: 0 };
    d.footR = a.ground(v3(0.12 * s, 0, 0.34 * s), deg(180), 0);
    d.footL = a.ground(v3(-0.16 * s, 0, 0.3 * s), deg(180), 0);
    const y = a.m.hipsRest.y + 0.08 * s;
    // left hand pulls the sleeve forward and down; right arm around the partner's waist, the hand on
    // his back at belt height (behind the coach, who now faces -z)
    d.handL = a.hand('world', v3(-0.1 * s, y + 0.06 * s, -0.02 * s), v3(-0.4, -1, 0), 0.3, 0.85);
    d.handR = a.hand('world', v3(0.08 * s, a.m.hipsRest.y - 0.02 * s, 0.56 * s), v3(1, -0.4, 0.2), -0.2, 0.7);
  });
  return {
    id: 'uchikomi-o-goshi',
    keys: [
      { t: 0, pose: g },
      { t: 0.3, pose: step, ease: 'inOut' },
      { t: 0.62, pose: fit, ease: 'snap' },
      { t: 0.88, pose: fit, ease: 'linear' },
      { t: 1.18, pose: step, ease: 'inOut' },
      { t: 1.52, pose: g, ease: 'inOut' },
    ],
    impacts: [0.62],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * o-soto-gari uchikomi (solo): the left foot steps beside the partner's right foot, the chest comes
 * forward, the right leg swings past his leg then reaps back while the upper body leans forward and
 * the hands pull (sleeve to the hip) and push (lapel). Then back to shizen-tai.
 */
function uchikomiOsoto(author: Author): Motion {
  const a = judoAuthor(author);
  const g = a.guard();
  const s = a.s;
  const L0 = ballOf(g.footL);
  const R0 = ballOf(g.footR);
  const Lf = v3(L0.x + 0.06 * s, 0, L0.z + 0.24 * s);
  const shY = a.shoulder(g, 'R').y;
  const pullHands = (d: Pose, k: number) => {
    d.handL = a.hand('world', v3(0.22 * s, a.m.hipsRest.y + 0.08 * s, d.hips.z + 0.05 * s), v3(0.8, -1, -0.3), 0.3, 0.9);
    d.handR = a.hand('world', v3(0.0, shY - 0.1 * s - k * 0.04 * s, d.hips.z + 0.42 * s), v3(-0.7, -1, -0.1), 0.5, 0.9);
  };
  const stepIn = edit(g, (d) => {
    d.hips = v3(Lf.x - 0.04 * s, d.hips.y - 0.03 * s, Lf.z - 0.08 * s);
    d.pelvis.yaw += deg(-12);
    d.footL = a.ground(Lf, yawOfFoot(g.footL) - deg(8), 0);
    if (d.footR.mode === 'ground') d.footR.heel = deg(30);
    pullHands(d, 0);
  });
  const swing = edit(stepIn, (d) => {
    d.hips = v3(Lf.x - 0.02 * s, d.hips.y + 0.01 * s, Lf.z - 0.04 * s);
    d.chest.pitch += deg(6);
    d.footR = a.air(v3(R0.x + 0.1 * s, 0.3 * s, Lf.z + 0.3 * s), deg(-10), deg(30), 0, v3(-0.1, 0.4, 1), deg(20));
  });
  const reap = edit(stepIn, (d) => {
    d.hips = v3(Lf.x - 0.02 * s, d.hips.y + 0.01 * s, Lf.z);
    d.pelvis.pitch += deg(22);
    d.chest.pitch += deg(16);
    d.head.pitch += deg(-14);
    d.footR = a.air(v3(R0.x + 0.06 * s, 0.42 * s, Lf.z - 0.42 * s), deg(-10), deg(40), 0, v3(-0.1, -0.6, -1), deg(30));
    pullHands(d, 1);
  });
  const down = edit(stepIn, (d) => {
    d.footR = lifted(a, v3(R0.x + 0.04 * s, 0, Lf.z - 0.3 * s), yawOfFoot(g.footR), deg(20));
  });
  const back = edit(g, (d) => {
    d.hips.z += 0.08 * s;
    d.footL = lifted(a, v3((Lf.x + L0.x) / 2, 0, (Lf.z + L0.z) / 2), yawOfFoot(g.footL), deg(15));
  });
  return {
    id: 'uchikomi-o-soto-gari',
    keys: [
      { t: 0, pose: g },
      { t: 0.32, pose: stepIn, ease: 'inOut' },
      { t: 0.58, pose: swing, ease: 'inOut' },
      { t: 0.86, pose: reap, ease: 'snap' },
      { t: 1.08, pose: reap, ease: 'linear' },
      { t: 1.38, pose: down, ease: 'inOut' },
      { t: 1.66, pose: back, ease: 'inOut' },
      { t: 1.9, pose: g, ease: 'inOut' },
    ],
    impacts: [0.86],
    startState: 'stand',
    endState: 'stand',
    balance: true,
  };
}

/**
 * o-uchi-gari uchikomi (solo): the right foot steps deep between the partner's feet, the left foot
 * follows behind it, then the right leg hooks his left leg from the inside and reaps it in an arc
 * toward the coach's right, low along the mat; the hands push him back. Then back to shizen-tai.
 */
function uchikomiOuchi(author: Author): Motion {
  const a = judoAuthor(author);
  const g = a.guard();
  const s = a.s;
  const L0 = ballOf(g.footL);
  const R0 = ballOf(g.footR);
  const Rin = v3(-0.03 * s, 0, 0.3 * s);
  const Lin = v3(0.15 * s, 0, 0.1 * s);
  const shY = a.shoulder(g, 'R').y;
  const push = (d: Pose) => {
    d.handL = a.hand('world', v3(0.16 * s, shY - 0.2 * s, d.hips.z + 0.44 * s), v3(0.7, -1, -0.2), 0.4, 0.9);
    d.handR = a.hand('world', v3(-0.08 * s, shY - 0.12 * s, d.hips.z + 0.42 * s), v3(-0.7, -1, -0.2), 0.5, 0.9);
  };
  const stepIn = edit(g, (d) => {
    d.hips = v3(0.02 * s, d.hips.y - 0.05 * s, 0.14 * s);
    d.pelvis.yaw += deg(8);
    d.chest.pitch += deg(6);
    d.footR = a.ground(Rin, yawOfFoot(g.footR) + deg(10), 0);
    if (d.footL.mode === 'ground') d.footL.heel = deg(25);
    push(d);
  });
  const follow = edit(stepIn, (d) => {
    d.hips = v3(0.04 * s, d.hips.y, 0.18 * s);
    d.footL = a.ground(Lin, yawOfFoot(g.footL) - deg(10), deg(10));
  });
  const hook = edit(follow, (d) => {
    d.hips = v3(0.08 * s, d.hips.y + 0.01 * s, 0.2 * s);
    d.chest.pitch += deg(4);
    d.footR = a.air(v3(-0.12 * s, 0.1 * s, 0.5 * s), deg(10), deg(25), 0, v3(-0.3, 0.3, 1), deg(15));
    push(d);
  });
  const reap = edit(hook, (d) => {
    d.pelvis.yaw += deg(-14);
    d.chest.pitch += deg(4);
    d.footR = a.air(v3(-0.34 * s, 0.08 * s, 0.3 * s), deg(-30), deg(25), 0, v3(-1, 0.3, 0.4), deg(15));
  });
  const land = edit(follow, (d) => {
    d.footR = lifted(a, v3(-0.2 * s, 0, 0.12 * s), yawOfFoot(g.footR), deg(15));
  });
  const backR = edit(g, (d) => {
    d.hips.z += 0.08 * s;
    d.footL = a.ground(Lin, yawOfFoot(g.footL), 0);
    d.footR = lifted(a, v3((R0.x - 0.2 * s) / 2, 0, (R0.z + 0.12 * s) / 2), yawOfFoot(g.footR), deg(15));
  });
  const backL = edit(g, (d) => {
    d.hips.z += 0.03 * s;
    d.footL = lifted(a, v3((Lin.x + L0.x) / 2, 0, (Lin.z + L0.z) / 2), yawOfFoot(g.footL), deg(10));
  });
  return {
    id: 'uchikomi-o-uchi-gari',
    keys: [
      { t: 0, pose: g },
      { t: 0.3, pose: stepIn, ease: 'inOut' },
      { t: 0.52, pose: follow, ease: 'inOut' },
      { t: 0.76, pose: hook, ease: 'inOut' },
      { t: 1.0, pose: reap, ease: 'snap' },
      { t: 1.2, pose: reap, ease: 'linear' },
      { t: 1.46, pose: land, ease: 'inOut' },
      { t: 1.7, pose: backR, ease: 'inOut' },
      { t: 1.92, pose: backL, ease: 'inOut' },
      { t: 2.12, pose: g, ease: 'inOut' },
    ],
    impacts: [1.0],
    startState: 'stand',
    endState: 'stand',
    balance: true,
  };
}

/**
 * ko-uchi-gari uchikomi (solo): a short step of the left foot, the weight on it, and the sole of the
 * right foot sweeps low along the mat to the partner's right heel, from the inside; the hands push
 * him back and down. Then back to shizen-tai.
 */
function uchikomiKouchi(author: Author): Motion {
  const a = judoAuthor(author);
  const g = a.guard();
  const s = a.s;
  const L0 = ballOf(g.footL);
  const R0 = ballOf(g.footR);
  const Lf = v3(L0.x - 0.02 * s, 0, L0.z + 0.12 * s);
  const shY = a.shoulder(g, 'R').y;
  const push = (d: Pose) => {
    d.handL = a.hand('world', v3(0.16 * s, shY - 0.22 * s, d.hips.z + 0.42 * s), v3(0.7, -1, -0.2), 0.4, 0.9);
    d.handR = a.hand('world', v3(-0.06 * s, shY - 0.14 * s, d.hips.z + 0.42 * s), v3(-0.7, -1, -0.2), 0.5, 0.9);
  };
  const stepIn = edit(g, (d) => {
    d.hips = v3(0.06 * s, d.hips.y - 0.04 * s, 0.1 * s);
    d.chest.pitch += deg(5);
    d.footL = a.ground(Lf, yawOfFoot(g.footL), 0);
    if (d.footR.mode === 'ground') d.footR.heel = deg(25);
    push(d);
  });
  const sweep0 = edit(stepIn, (d) => {
    d.hips = v3(0.1 * s, d.hips.y, 0.14 * s);
    d.footR = a.air(v3(0.0, 0.06 * s, 0.26 * s), deg(30), deg(10), deg(15), v3(-0.2, 0.3, 1), 0);
  });
  const sweep = edit(sweep0, (d) => {
    d.chest.pitch += deg(4);
    d.footR = a.air(v3(0.08 * s, 0.05 * s, 0.46 * s), deg(40), deg(5), deg(20), v3(-0.1, 0.3, 1), 0);
  });
  const land = edit(stepIn, (d) => {
    d.footR = lifted(a, v3((R0.x + 0.0) / 2, 0, (R0.z + 0.26 * s) / 2), yawOfFoot(g.footR), deg(15));
  });
  const back = edit(g, (d) => {
    d.hips.z += 0.04 * s;
    d.footL = lifted(a, v3((Lf.x + L0.x) / 2, 0, (Lf.z + L0.z) / 2), yawOfFoot(g.footL), deg(10));
  });
  return {
    id: 'uchikomi-ko-uchi-gari',
    keys: [
      { t: 0, pose: g },
      { t: 0.28, pose: stepIn, ease: 'inOut' },
      { t: 0.5, pose: sweep0, ease: 'inOut' },
      { t: 0.72, pose: sweep, ease: 'snap' },
      { t: 0.9, pose: sweep, ease: 'linear' },
      { t: 1.16, pose: land, ease: 'inOut' },
      { t: 1.38, pose: back, ease: 'inOut' },
      { t: 1.6, pose: g, ease: 'inOut' },
    ],
    impacts: [0.72],
    startState: 'stand',
    endState: 'stand',
    balance: true,
  };
}

// ------------------------------------------------------------------ ukemi on the mat (solo, low)

/**
 * The stance these falls start from: shizen-tai, the judo posture, in every style (BJJ uses the same
 * upright start for its seated breakfalls), with the coach's own small offsets.
 */
const fallGuard = (a: Author) => (a.style === 'judo' ? a : new Author(a.m, a.chestFrame, 'judo', a.profile)).guard();

/** deep squat from the stance, arms forward for balance (the first stage before sitting down) */
function squat(a: Author, g: Pose): Pose {
  const s = a.s;
  return edit(g, (d) => {
    d.hips = v3(0, 0.4 * s, -0.1 * s);
    d.pelvis = { yaw: 0, pitch: deg(38), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(12), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-20), roll: 0 };
    if (d.footL.mode === 'ground') d.footL = { ...d.footL, yaw: deg(8), heel: deg(18), pole: v3(0.35, 0.5, 1) };
    if (d.footR.mode === 'ground') d.footR = { ...d.footR, heel: deg(18), pole: v3(-0.35, 0.5, 1) };
    d.handL = a.hand('world', v3(0.16 * s, 0.58 * s, 0.36 * s), v3(0.6, -1, -0.2), 0.2, 0.3);
    d.handR = a.hand('world', v3(-0.16 * s, 0.58 * s, 0.36 * s), v3(-0.6, -1, -0.2), 0.2, 0.3);
  });
}

/** half-way down from the squat: the hips go back and down over the heels, knees forward and up */
function sinkBack(a: Author, g: Pose): Pose {
  const s = a.s;
  return edit(squat(a, g), (d) => {
    d.hips = v3(0, 0.25 * s, -0.24 * s);
    d.pelvis = { yaw: 0, pitch: deg(5), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(25), roll: 0 };
    d.head = { yaw: 0, pitch: deg(5), roll: 0 };
    if (d.footL.mode === 'ground') d.footL = { ...d.footL, yaw: deg(16), heel: deg(8), pole: v3(0.1, 0.8, 0.8) };
    if (d.footR.mode === 'ground') d.footR = { ...d.footR, heel: deg(8), pole: v3(-0.1, 0.8, 0.8) };
    crossArms(a, d);
  });
}

/** arms crossed on the chest, as before a breakfall (chest space: they follow the trunk) */
function crossArms(a: Author, d: Pose) {
  const s = a.s;
  d.handL = a.hand('chest', v3(-0.08 * s, -0.16 * s, 0.13 * s), v3(0.8, -0.6, -0.1), 0.1, 0.8);
  d.handR = a.hand('chest', v3(0.08 * s, -0.12 * s, 0.15 * s), v3(-0.8, -0.6, -0.1), 0.1, 0.8);
}

/** sitting on the mat close to the heels, back rounded, chin tucked, arms crossed, feet just off the mat */
function sitLow(a: Author, g: Pose): Pose {
  const s = a.s;
  return edit(g, (d) => {
    d.hips = v3(0, 0.11 * s, -0.36 * s);
    d.pelvis = { yaw: 0, pitch: deg(-42), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(38), roll: 0 };
    d.head = { yaw: 0, pitch: deg(20), roll: 0 };
    // the feet leave the mat as the body rocks back: knees up, in line with the feet
    d.footL = a.air(v3(0.13 * s, 0.09 * s, -0.02 * s), 0, deg(15), 0, v3(0.1, 1, 0.4), 0);
    d.footR = a.air(v3(-0.13 * s, 0.09 * s, -0.04 * s), 0, deg(15), 0, v3(-0.1, 1, 0.4), 0);
    crossArms(a, d);
  });
}

/** rolled back on a rounded back: hips off the mat, knees over the belly, chin on the chest */
function rolledBack(a: Author, g: Pose, side = 0): Pose {
  const s = a.s;
  return edit(g, (d) => {
    d.hips = v3(-side * 0.06 * s, (0.19 + Math.abs(side) * 0.03) * s, -0.56 * s);
    d.pelvis = { yaw: side * deg(20), pitch: deg(-128), roll: side * deg(35) };
    d.chest = { yaw: 0, pitch: deg(40), roll: -side * deg(10) };
    d.head = { yaw: 0, pitch: deg(32), roll: 0 };
    d.footL = a.air(v3(0.14 * s - side * 0.1 * s, 0.5 * s, -0.2 * s), deg(-5), deg(30), 0, v3(0.3, 1, 0.4), deg(15));
    d.footR = a.air(v3(-0.14 * s - side * 0.1 * s, 0.48 * s, -0.2 * s), deg(5), deg(30), 0, v3(-0.3, 1, 0.4), deg(15));
    crossArms(a, d);
  });
}

/** a hand flat on the mat, the arm about 45° from the trunk (toward the hips), palm down */
function slapHand(a: Author, d: Pose, side: 'L' | 'R') {
  const s = a.s;
  const sh = a.shoulder(d, side);
  const sg = side === 'L' ? 1 : -1;
  const reach = (a.m.upperArm + a.m.foreArm) * 0.92;
  const pos = v3(sh.x + sg * reach * 0.72, 0.03 * s, sh.z + reach * 0.62);
  const h = a.hand('world', pos, v3(sg * 0.2, 1, -0.3), 0.5, 0, deg(-10));
  if (side === 'L') d.handL = h;
  else d.handR = h;
}

/**
 * ushiro-ukemi, low stage (Judo Québec guide, IJF/Kodokan glossary): from shizen-tai down to a squat,
 * sit close to the heels, roll back on a rounded back with the arms crossed, both arms slap the mat
 * at about 45° from the body, palms down, chin tucked so the head never touches the mat; then roll
 * back to sitting, squat and stand up. No fall from standing.
 */
function ushiroUkemi(a: Author): Motion {
  const g = fallGuard(a);
  const sq = squat(a, g);
  const sit = sitLow(a, g);
  const sink = sinkBack(a, g);
  const back = rolledBack(a, g);
  const slap = edit(back, (d) => {
    d.pelvis.pitch = deg(-118);
    slapHand(a, d, 'L');
    slapHand(a, d, 'R');
  });
  return {
    id: 'ukemi-ushiro',
    keys: [
      { t: 0, pose: g },
      { t: 0.55, pose: sq, ease: 'inOut' },
      { t: 0.85, pose: sink, ease: 'inOut' },
      { t: 1.15, pose: sit, ease: 'inOut' },
      { t: 1.5, pose: back, ease: 'inOut' },
      { t: 1.72, pose: slap, ease: 'strike' },
      { t: 2.0, pose: slap, ease: 'linear' },
      { t: 2.45, pose: sit, ease: 'inOut' },
      { t: 2.8, pose: sink, ease: 'inOut' },
      { t: 3.15, pose: sq, ease: 'inOut' },
      { t: 3.7, pose: g, ease: 'inOut' },
    ],
    impacts: [1.72],
    startState: 'stand',
    endState: 'stand',
  };
}

/**
 * yoko-ukemi, low stage (Judo Québec guide): from the squat to sitting, roll back onto one side, the
 * legs up, and the arm of that side slaps the mat at about 45° from the body; back to sitting, the
 * other side, then up.
 */
function yokoUkemi(a: Author): Motion {
  const g = fallGuard(a);
  const sq = squat(a, g);
  const sit = sitLow(a, g);
  const sink = sinkBack(a, g);
  // side +1: rolled onto the right side (the coach's right is −x)
  const right = edit(rolledBack(a, g, 1), (d) => slapHand(a, d, 'R'));
  const left = edit(rolledBack(a, g, -1), (d) => slapHand(a, d, 'L'));
  return {
    id: 'ukemi-yoko',
    keys: [
      { t: 0, pose: g },
      { t: 0.55, pose: sq, ease: 'inOut' },
      { t: 0.85, pose: sink, ease: 'inOut' },
      { t: 1.15, pose: sit, ease: 'inOut' },
      { t: 1.6, pose: right, ease: 'snap' },
      { t: 1.9, pose: right, ease: 'linear' },
      { t: 2.3, pose: sit, ease: 'inOut' },
      { t: 2.75, pose: left, ease: 'snap' },
      { t: 3.05, pose: left, ease: 'linear' },
      { t: 3.45, pose: sit, ease: 'inOut' },
      { t: 3.8, pose: sink, ease: 'inOut' },
      { t: 4.15, pose: sq, ease: 'inOut' },
      { t: 4.7, pose: g, ease: 'inOut' },
    ],
    impacts: [1.6, 2.75],
    startState: 'stand',
    endState: 'stand',
  };
}

// ------------------------------------------------------------------ BJJ: v0.28 additions (solo)

/**
 * sit-out (solo): from all fours, the left hand stays posted and the left leg threads under the body
 * through the gap left by the right arm; the hips turn and sit on the mat, facing the side, the left
 * hand now behind, the right arm framing, the right foot planted knee up; then back to all fours and
 * to the seated base. Grapplearts solo drills; Jitsu IQ "Sit-Out".
 */
function sitOut(a: Author): Motion {
  const s = a.s;
  const base = seated(a);
  const turn = turnToFours(a);
  const fours = allFours(a);
  const thread = edit(fours, (d) => {
    d.hips = v3(0.0, 0.36 * s, -0.22 * s);
    d.pelvis = { yaw: deg(-25), pitch: deg(30), roll: deg(-12) };
    d.chest = { yaw: deg(12), pitch: deg(15), roll: 0 };
    d.footL = a.air(v3(-0.08 * s, 0.12 * s, -0.3 * s), deg(-60), deg(20), 0, v3(-0.3, 0.4, 1), deg(10));
    d.footR = a.air(v3(-0.29 * s, 0.12 * s, -0.56 * s), deg(-55), deg(30), 0, v3(-0.5, 0.3, 0.8), deg(10));
    d.handR = a.hand('chest', v3(-0.05 * s, -0.05 * s, 0.32 * s), v3(-0.4, -1, 0), 0.2, 0.4);
  });
  // on the way back the right foot turns back sooner (each way keeps the hip inside its rotation range)
  const threadBack = edit(thread, (d) => {
    d.footR = a.air(v3(-0.29 * s, 0.12 * s, -0.56 * s), deg(-80), deg(30), 0, v3(-0.6, 0.3, 0.6), deg(10));
  });
  // seated facing the side (−x): left leg long in front, right foot planted knee up, left hand
  // posted behind (it never left the mat), right arm framing in front
  const out = edit(fours, (d) => {
    d.hips = v3(0.0, 0.13 * s, -0.06 * s);
    d.pelvis = { yaw: deg(-90), pitch: deg(-40), roll: 0 };
    d.chest = { yaw: deg(10), pitch: deg(35), roll: 0 };
    d.head = { yaw: deg(10), pitch: deg(-5), roll: 0 };
    d.footL = a.air(v3(-0.72 * s, 0.08 * s, 0.04 * s), deg(-90), deg(20), 0, v3(0, 1, 0.3), deg(10));
    d.footR = { ...a.ground(v3(-0.42 * s, 0, -0.36 * s), deg(-108), 0), pole: v3(-0.25, 1, -0.35) };
    d.handR = a.hand('chest', v3(-0.06 * s, 0.1 * s, 0.26 * s), v3(-0.5, -1, 0), 0.1, 1);
  });
  return {
    id: 'sit-out',
    keys: [
      { t: 0, pose: base },
      { t: 0.4, pose: turn, ease: 'inOut' },
      { t: 0.8, pose: fours, ease: 'inOut' },
      { t: 1.1, pose: thread, ease: 'inOut' },
      { t: 1.4, pose: out, ease: 'out' },
      { t: 1.7, pose: out, ease: 'linear' },
      { t: 2.0, pose: threadBack, ease: 'inOut' },
      { t: 2.3, pose: fours, ease: 'inOut' },
      { t: 2.7, pose: turn, ease: 'inOut' },
      { t: 3.1, pose: base, ease: 'inOut' },
    ],
    impacts: [1.4],
    startState: 'ground',
    endState: 'ground',
  };
}

/**
 * step up from kneeling (solo): from the stance, one knee then the other to the mat (kneeling,
 * trunk upright, hands forward as on a partner's hips), the lead foot steps up in front (combat base),
 * then the coach stands back up into his stance. Grapplearts solo drills ("Step Up From Kneeling",
 * "Standing Up From Kneeling").
 */
function kneelStepUp(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const L0 = ballOf(g.footL);
  const R0 = ballOf(g.footR);
  const kneeY = 0.5 * s;
  const Rk = v3(-0.15 * s, 0, -0.42 * s);
  const Lk = v3(0.15 * s, 0, -0.42 * s);
  const Lup = v3(0.17 * s, 0, 0.22 * s);
  const hands = (d: Pose) => {
    d.handL = a.hand('world', v3(0.2 * s, 0.5 * s, 0.32 * s), v3(0.6, -1, -0.2), 0.3, 0.6);
    d.handR = a.hand('world', v3(-0.2 * s, 0.5 * s, 0.32 * s), v3(-0.6, -1, -0.2), 0.3, 0.6);
  };
  const upright = (d: Pose) => {
    d.pelvis = { yaw: deg(-8), pitch: deg(4), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(6), roll: 0 };
    d.head = { yaw: 0, pitch: deg(-4), roll: 0 };
  };
  const rBack = edit(g, (d) => {
    d.hips = v3(0.0, a.m.hipsRest.y - 0.28 * s, -0.08 * s);
    d.footR = lifted(a, v3((R0.x + Rk.x) / 2, 0, (R0.z + Rk.z) / 2), yawOfFoot(g.footR), deg(40), 0.05);
  });
  const lunge = edit(g, (d) => {
    d.hips = v3(0.02 * s, kneeY + 0.02 * s, -0.04 * s);
    upright(d);
    d.footR = a.ground(Rk, 0, deg(75));
    d.footL = { ...a.ground(L0, yawOfFoot(g.footL), 0), pole: v3(0.1, 0.3, 1) };
    hands(d);
  });
  const lBack = edit(lunge, (d) => {
    d.footL = { ...lifted(a, v3(Lk.x, 0, (L0.z + Lk.z) / 2), 0, deg(50), 0.07), pole: v3(0.1, -0.3, 1) };
  });
  const kneel = edit(lunge, (d) => {
    d.hips = v3(0, kneeY, -0.02 * s);
    d.footL = a.ground(Lk, 0, deg(75));
  });
  const stepUp = edit(kneel, (d) => {
    d.footL = a.air(v3(Lup.x, 0.14 * s, -0.04 * s), yawOfFoot(g.footL), deg(25), 0, v3(0.1, 0.3, 1), 0);
  });
  const combat = edit(kneel, (d) => {
    d.hips = v3(0.02 * s, kneeY + 0.02 * s, -0.02 * s);
    d.footL = { ...a.ground(Lup, yawOfFoot(g.footL), 0), pole: v3(0.1, 0.3, 1) };
  });
  const rise = edit(g, (d) => {
    d.hips = v3(0, a.m.hipsRest.y - 0.24 * s, -0.04 * s);
    d.footL = a.ground(Lup, yawOfFoot(g.footL), 0);
    d.footR = lifted(a, v3((R0.x + Rk.x) / 2, 0, (R0.z + Rk.z) / 2), yawOfFoot(g.footR), deg(40), 0.05);
  });
  const settle = edit(g, (d) => {
    d.footL = lifted(a, v3((L0.x + Lup.x) / 2, 0, (L0.z + Lup.z) / 2), yawOfFoot(g.footL), deg(10), 0.03);
  });
  return {
    id: 'releve-genoux',
    keys: [
      { t: 0, pose: g },
      { t: 0.35, pose: rBack, ease: 'inOut' },
      { t: 0.75, pose: lunge, ease: 'inOut' },
      { t: 1.05, pose: lBack, ease: 'inOut' },
      { t: 1.35, pose: kneel, ease: 'inOut' },
      { t: 1.65, pose: kneel, ease: 'linear' },
      { t: 1.95, pose: stepUp, ease: 'inOut' },
      { t: 2.25, pose: combat, ease: 'inOut' },
      { t: 2.65, pose: rise, ease: 'inOut' },
      { t: 2.95, pose: settle, ease: 'inOut' },
      { t: 3.2, pose: g, ease: 'inOut' },
    ],
    impacts: [2.25],
    startState: 'stand',
    endState: 'stand',
  };
}

export function grapplingMotions(a: Author): Motion[] {
  return [
    bridge(a),
    guardRetention(a),
    baseSwitch(a),
    taiSabaki(a),
    kuzushi(a),
    uchikomiSeoi(a),
    ayumiAshi(a),
    kumikata(a),
    uchikomiOgoshi(a),
    uchikomiOsoto(a),
    uchikomiOuchi(a),
    uchikomiKouchi(a),
    ushiroUkemi(a),
    yokoUkemi(a),
    sitOut(a),
    kneelStepUp(a),
  ];
}
