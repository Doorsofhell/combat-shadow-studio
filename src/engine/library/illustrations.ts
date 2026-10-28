/**
 * 1.3.2 Poses of the encyclopedia illustrations (scripts/visuels, Lab view `illu=<id>`): moments that are not
 * techniques of the app (a warm-up, the tap of a submission, the wai kru). They are never trained or listed: the
 * Lab builds them on demand, the main library (getLibrary) does not hold them. Same authoring and the same joint
 * safety as the techniques (openElbows on every key), so the coach stays within his natural ranges.
 */
import { Author, edit } from '../author';
import type { Motion } from '../motion';
import { Pose, deg, v3 } from '../pose';

/** kneeling, sitting back towards the heels, toes tucked, trunk upright (the start of the wai kru) */
function kneeling(a: Author): Pose {
  const s = a.s;
  const n = a.neutral();
  return edit(n, (d) => {
    // knees on the mat: thigh and shin both reach it (ball of the foot under the buttocks)
    d.hips = v3(0, 0.36 * s, -0.22 * s);
    d.pelvis = { yaw: 0, pitch: deg(18), roll: 0 };
    d.chest = { yaw: 0, pitch: deg(-6), roll: 0 };
    d.head = { yaw: 0, pitch: deg(4), roll: 0 };
    d.footL = { ...a.ground(v3(0.12 * s, 0, -0.4 * s), 0, deg(80)), pole: v3(0.1, 0.3, 1) };
    d.footR = { ...a.ground(v3(-0.12 * s, 0, -0.4 * s), 0, deg(80)), pole: v3(-0.1, 0.3, 1) };
  });
}

/** wai kru: kneeling, palms joined in front of the face, then a deep bow, hands and forehead towards the mat */
function waiKru(a: Author): Motion {
  const s = a.s;
  const k = kneeling(a);
  const wai = edit(k, (d) => {
    d.handL = a.hand('world', v3(0.012 * s, 1.0 * s, 0.12 * s), v3(1, -0.6, -0.3), deg(90), 0, deg(-40));
    d.handR = a.hand('world', v3(-0.012 * s, 1.0 * s, 0.12 * s), v3(-1, -0.6, -0.3), deg(90), 0, deg(-40));
  });
  const half = edit(wai, (d) => {
    d.hips = v3(0, 0.33 * s, -0.26 * s);
    d.pelvis.pitch = deg(50);
    d.chest.pitch = deg(24);
    d.head.pitch = deg(14);
    d.handL = a.hand('world', v3(0.1 * s, 0.3 * s, 0.4 * s), v3(0.8, -0.5, -0.3), deg(10), 0.1);
    d.handR = a.hand('world', v3(-0.1 * s, 0.3 * s, 0.4 * s), v3(-0.8, -0.5, -0.3), deg(10), 0.1);
  });
  const bow = edit(wai, (d) => {
    // sitting back on the heels, the trunk folds forward, gloves flat on the mat far in front, head low
    d.hips = v3(0, 0.3 * s, -0.3 * s);
    d.pelvis.pitch = deg(80);
    d.chest.pitch = deg(32);
    d.head.pitch = deg(22);
    d.handL = a.hand('world', v3(0.1 * s, 0.05 * s, 0.5 * s), v3(0.8, 0.3, -0.4), 0, 0);
    d.handR = a.hand('world', v3(-0.1 * s, 0.05 * s, 0.5 * s), v3(-0.8, 0.3, -0.4), 0, 0);
  });
  return {
    id: 'illu-wai-kru',
    keys: [
      { t: 0, pose: wai },
      { t: 0.5, pose: half, ease: 'inOut' },
      { t: 1, pose: bow, ease: 'inOut' },
    ],
    impacts: [1],
    startState: 'ground',
    endState: 'ground',
  };
}

/** warm-up: shoulder mobility standing, arms forward, then overhead, then open to the sides */
function warmUp(a: Author): Motion {
  const s = a.s;
  const n = a.neutral();
  const sh = a.shoulder(n, 'L');
  const y = sh.y;
  const fwd = edit(n, (d) => {
    d.handL = a.hand('world', v3(0.2 * s, y - 0.02 * s, 0.6 * s), v3(0.6, -1, 0), 0, 0.2);
    d.handR = a.hand('world', v3(-0.2 * s, y - 0.02 * s, 0.6 * s), v3(-0.6, -1, 0), 0, 0.2);
  });
  const up = edit(n, (d) => {
    d.chest.pitch = deg(-3);
    d.head.pitch = deg(-8);
    d.handL = a.hand('world', v3(0.2 * s, y + 0.58 * s, 0.06 * s), v3(1, 0, -0.3), deg(90), 0.2);
    d.handR = a.hand('world', v3(-0.2 * s, y + 0.58 * s, 0.06 * s), v3(-1, 0, -0.3), deg(90), 0.2);
  });
  const open = edit(n, (d) => {
    d.handL = a.hand('world', v3(0.74 * s, y + 0.02 * s, 0.0), v3(0, -1, -0.4), deg(-90), 0.2);
    d.handR = a.hand('world', v3(-0.74 * s, y + 0.02 * s, 0.0), v3(0, -1, -0.4), deg(-90), 0.2);
  });
  return {
    id: 'illu-echauffement',
    keys: [
      { t: 0, pose: fwd },
      { t: 0.5, pose: up, ease: 'inOut' },
      { t: 1, pose: open, ease: 'inOut' },
    ],
    impacts: [1],
    startState: 'stand',
    endState: 'stand',
  };
}

/** the tap: kneeling forward, the open hand comes down flat on the mat (a submission is accepted) */
function tap(a: Author): Motion {
  const s = a.s;
  const k = kneeling(a);
  // on the knees, trunk forward, weight on the left hand; the right arm swings wide and slaps the mat
  const base = edit(k, (d) => {
    d.hips = v3(0, 0.42 * s, -0.16 * s);
    d.pelvis.pitch = deg(52);
    d.chest = { yaw: deg(-14), pitch: deg(16), roll: deg(-6) };
    d.head = { yaw: deg(-30), pitch: deg(18), roll: 0 };
    d.handL = a.hand('world', v3(0.16 * s, 0.03 * s, 0.4 * s), v3(0.8, 0.3, -0.4), 0, 0.15);
  });
  const up = edit(base, (d) => {
    d.handR = a.hand('world', v3(-0.42 * s, 0.62 * s, 0.32 * s), v3(-0.6, -0.6, -0.4), deg(-20), 0);
  });
  const mid = edit(base, (d) => {
    d.handR = a.hand('world', v3(-0.5 * s, 0.3 * s, 0.4 * s), v3(-0.6, -0.4, -0.4), deg(-10), 0);
  });
  const down = edit(base, (d) => {
    d.handR = a.hand('world', v3(-0.46 * s, 0.025 * s, 0.44 * s), v3(-0.8, 0.3, -0.4), 0, 0);
  });
  return {
    id: 'illu-tape',
    keys: [
      { t: 0, pose: up },
      { t: 0.25, pose: mid, ease: 'in' },
      { t: 0.5, pose: down, ease: 'in' },
    ],
    impacts: [0.5],
    startState: 'ground',
    endState: 'ground',
  };
}

export function illustrationMotions(a: Author): Motion[] {
  return [waiKru(a), warmUp(a), tap(a)];
}
