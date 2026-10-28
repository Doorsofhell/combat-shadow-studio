/**
 * 1.3.2 Poses of the encyclopedia illustrations (scripts/visuels, Lab view `illu=<id>`): moments that are not
 * techniques of the app (a warm-up, the tap of a submission, the wai kru). They are never trained or listed: the
 * Lab builds them on demand, the main library (getLibrary) does not hold them. Same authoring and the same joint
 * safety as the techniques (openElbows on every key), so the coach stays within his natural ranges.
 */
import { Author, edit } from '../author';
import type { Motion } from '../motion';
import { Pose, deg, v3 } from '../pose';
import { allFours } from './grappling';

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

/** ippon: the judo referee's arm straight up, palm forward, the other arm by the side */
function ippon(a: Author): Motion {
  const s = a.s;
  const sh = a.shoulder(a.neutral(), 'R');
  const p = edit(a.neutral(), (d) => {
    d.head.pitch = deg(-4);
    d.handR = a.hand('world', v3(sh.x - 0.02 * s, sh.y + 0.56 * s, sh.z + 0.06 * s), v3(-1, 0, -0.2), -1, 0, deg(-10));
  });
  return still('illu-ippon', p, 'stand');
}

export function illustrationMotions(a: Author): Motion[] {
  return [waiKru(a), warmUp(a), tap(a), ippon(a)];
}

// ------------------------------------------------------------------ scenes with two people (1.3.3)

/** where a body stands in the scene: ground position and heading (yaw, same convention as the poses) */
export interface Place {
  x: number;
  z: number;
  yaw: number;
}

/** two coaches together (a ground position, a submission, a referee): each moves in its own frame, placed in the scene */
export interface DuoScene {
  id: string;
  a: Motion;
  b: Motion;
  placeA: Place;
  placeB: Place;
}

/** a body's own frame, placed in the scene: scene points and directions written once, read by that body */
class Frame {
  constructor(readonly p: Place) {}
  /** scene point -> the body's ground space */
  pt(x: number, y: number, z: number) {
    const c = Math.cos(this.p.yaw);
    const s = Math.sin(this.p.yaw);
    const dx = x - this.p.x;
    const dz = z - this.p.z;
    return v3(dx * c - dz * s, y, dx * s + dz * c);
  }
  dir(x: number, y: number, z: number) {
    const c = Math.cos(this.p.yaw);
    const s = Math.sin(this.p.yaw);
    return v3(x * c - z * s, y, x * s + z * c);
  }
}

const still = (id: string, pose: Pose, state: 'ground' | 'stand' = 'ground'): Motion => ({
  id,
  keys: [
    { t: 0, pose },
    { t: 1, pose, ease: 'linear' },
  ],
  impacts: [1],
  startState: state,
  endState: state,
});

/** lying on the back, legs long, arms along the body (the base of the bottom positions, edited by each scene) */
function lying(a: Author, f: Frame, hips: [number, number, number], pitch = deg(-90)): Pose {
  const s = a.s;
  const hp = f.pt(...hips);
  return {
    hips: hp,
    pelvis: { yaw: 0, pitch, roll: 0 },
    chest: { yaw: 0, pitch: 0, roll: 0 },
    head: { yaw: 0, pitch: deg(10), roll: 0 },
    handL: a.hand('world', v3(hp.x + 0.3 * s, 0.05 * s, hp.z - 0.1 * s), v3(0.4, 1, 0), 0, 0.4),
    handR: a.hand('world', v3(hp.x - 0.3 * s, 0.05 * s, hp.z - 0.1 * s), v3(-0.4, 1, 0), 0, 0.4),
    footL: a.air(v3(hp.x + 0.14 * s, 0.07 * s, hp.z + 0.78 * s), deg(15), deg(-70), 0, v3(0.2, 1, 0), 0),
    footR: a.air(v3(hp.x - 0.14 * s, 0.07 * s, hp.z + 0.78 * s), deg(-15), deg(-70), 0, v3(-0.2, 1, 0), 0),
  };
}

type T3 = [number, number, number];
const P = (x: number, z: number, yawDeg: number): Place => ({ x, z, yaw: deg(yawDeg) });

/** scene-space writing of a body's pose: hands, feet and hips given where they are in the scene */
function kit(a: Author, f: Frame) {
  return {
    hips: (p: T3) => f.pt(...p),
    hand: (p: T3, pole: T3, pron = 0, fist = 0.5, wrist = 0) => a.hand('world', f.pt(...p), f.dir(...pole), pron, fist, wrist),
    /** planted foot: ball of the foot, toes heading (scene yaw, degrees), heel lift (degrees: 80 = kneeling on the toes) */
    ground: (x: number, z: number, yawDeg: number, heelDeg = 0, pole?: T3) => ({ ...a.ground(f.pt(x, 0, z), deg(yawDeg) - f.p.yaw, deg(heelDeg)), ...(pole ? { pole: f.dir(...pole) } : {}) }),
    /** foot in the air: ankle, toes heading (scene yaw), pitch (+ toes down), roll, knee direction */
    air: (p: T3, yawDeg: number, pitchDeg: number, rollDeg: number, pole: T3, point = 0) => a.air(f.pt(...p), deg(yawDeg) - f.p.yaw, deg(pitchDeg), deg(rollDeg), f.dir(...pole), point),
    rot: (yawDeg: number, pitchDeg: number, rollDeg = 0) => ({ yaw: deg(yawDeg), pitch: deg(pitchDeg), roll: deg(rollDeg) }),
  };
}

/** B (Kadir) on his back, head towards −z, knees bent and feet flat (the bottom of most ground positions) */
function onBack(b: Author, fb: Frame, hips: T3 = [0, 0.11, 0]): Pose {
  const k = kit(b, fb);
  return edit(lying(b, fb, hips), (d) => {
    d.footL = k.ground(hips[0] + 0.17, hips[2] + 0.44, 8, 0, [0.25, 1, 0.2]);
    d.footR = k.ground(hips[0] - 0.17, hips[2] + 0.44, -8, 0, [-0.25, 1, 0.2]);
    d.head.pitch = deg(16);
  });
}

const duo = (id: string, a: Pose, b: Pose, pa: Place, pb: Place, state: 'ground' | 'stand' = 'ground', stateB = state): DuoScene => ({
  id,
  a: still(id, a, state),
  b: still(`${id}@b`, b, stateB),
  placeA: pa,
  placeB: pb,
});

// In every ground scene A is Amara and B is Kadir, lying on his back along z (hips at the origin, head towards −z),
// unless the scene says otherwise. Contacts are written in scene coordinates (metres, a 1.8 m body).

/** mount: A astride B's chest, knees on the mat on each side of his ribs, hands on his chest */
function mount(a: Author, b: Author): DuoScene {
  const pa = P(0, -0.47, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head.pitch = deg(20);
    // hands framing on the knees of the partner on top
    d.handL = kb.hand([0.3, 0.2, -0.24], [1, -0.4, -0.6], 0.3, 0.6);
    d.handR = kb.hand([-0.3, 0.2, -0.24], [-1, -0.4, -0.6], 0.3, 0.6);
  });
  const top = edit(kneeling(a), (d) => {
    d.hips = ka.hips([0, 0.38, -0.25]);
    d.pelvis = ka.rot(0, 30);
    d.chest = ka.rot(0, 30);
    d.head = ka.rot(0, 22);
    d.footL = ka.ground(-0.38, 0.16, 195, 80, [-0.5, 0.6, -0.6]);
    d.footR = ka.ground(0.38, 0.16, 165, 80, [0.5, 0.6, -0.6]);
    d.handL = ka.hand([-0.13, 0.26, -0.55], [-0.8, 0.3, 0.4], 0.8, 0.5);
    d.handR = ka.hand([0.13, 0.26, -0.55], [0.8, 0.3, 0.4], 0.8, 0.5);
  });
  return duo('duo-montee', top, bottom, pa, pb);
}

/** closed guard: B on his back, legs around A's waist, ankles crossed behind her back; A kneels upright in his guard */
function closedGuard(a: Author, b: Author): DuoScene {
  const pa = P(0, 0.02, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(lying(b, new Frame(pb), [0, 0.15, -0.1], deg(-80)), (d) => {
    d.chest = kb.rot(0, 12);
    d.head = kb.rot(0, 26);
    d.footL = kb.air([-0.05, 0.42, 0.42], -100, 40, 0, [1, 0.3, 0.1], deg(30));
    d.footR = kb.air([0.06, 0.46, 0.46], 100, 40, 0, [-1, 0.3, 0.1], deg(30));
    // grips on her sleeves
    d.handL = kb.hand([0.16, 0.4, -0.04], [1, -0.3, -0.5], 0.2, 0.9);
    d.handR = kb.hand([-0.16, 0.4, -0.04], [-1, -0.3, -0.5], 0.2, 0.9);
  });
  const top = edit(kneeling(a), (d) => {
    d.hips = ka.hips([0, 0.42, 0.24]);
    d.pelvis = ka.rot(0, 12);
    d.chest = ka.rot(0, 20);
    d.head = ka.rot(0, 12);
    d.footL = ka.ground(-0.17, 0.58, 180, 80, [0, 0.3, -1]);
    d.footR = ka.ground(0.17, 0.58, 180, 80, [0, 0.3, -1]);
    // hands on his belt line, elbows tight
    d.handL = ka.hand([-0.13, 0.3, -0.1], [-0.6, -0.6, 0.5], 0.9, 0.9);
    d.handR = ka.hand([0.13, 0.3, -0.1], [0.6, -0.6, 0.5], 0.9, 0.9);
  });
  return duo('duo-garde-fermee', top, bottom, pa, pb);
}

/** half guard: A chest to chest on top, her right shin trapped between B's legs, her left knee wide on the mat */
function halfGuard(a: Author, b: Author): DuoScene {
  const pa = P(0, 0.42, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head = kb.rot(-25, 18);
    // legs locked around her right ankle: left foot over it, right foot under it
    d.footL = kb.air([0.12, 0.3, 0.62], -100, 30, 0, [1, 1, 0.3], deg(20));
    d.footR = kb.air([0.16, 0.06, 0.6], 80, 30, 0, [-0.4, 1, 0.3], deg(20));
    // frames: forearm across her collar, other hand on her hip
    d.handL = kb.hand([0.22, 0.34, 0.02], [1, -0.2, -0.4], 0.5, 0.6);
    d.handR = kb.hand([-0.06, 0.42, -0.34], [-1, -0.3, -0.2], 0.9, 0.5);
  });
  const top = edit(kneeling(a), (d) => {
    d.hips = ka.hips([-0.02, 0.32, 0.1]);
    d.pelvis = ka.rot(-6, 80);
    d.chest = ka.rot(0, 10);
    d.head = ka.rot(-30, 6);
    d.footL = ka.ground(-0.52, 0.66, 200, 70, [-0.8, 0.3, -0.6]);
    d.footR = ka.air([0.15, 0.15, 0.7], 185, 50, 0, [0, -1, -0.4]);
    // underhook under his left arm, other arm around his head
    d.handR = ka.hand([0.3, 0.07, -0.6], [0.6, 0.6, 0.4], 1, 0.3);
    d.handL = ka.hand([-0.12, 0.07, -0.88], [-0.8, 0.6, 0], 1, 0.3);
  });
  return duo('duo-demi-garde', top, bottom, pa, pb);
}

/** side control: A across B's chest, chest to chest, knees tight to his near side, one arm around his head */
function sideControl(a: Author, b: Author): DuoScene {
  const pa = P(-0.62, -0.36, 90);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head = kb.rot(10, 15);
    // frames: one hand on her hip, the far forearm against her shoulder
    d.handR = kb.hand([-0.38, 0.4, -0.22], [-0.6, -0.4, 0.6], 0.4, 0.6);
    d.handL = kb.hand([-0.02, 0.46, -0.52], [1, 0.1, -0.2], 0.9, 0.5);
  });
  const top = edit(allFours(a), (d) => {
    d.hips = ka.hips([-0.5, 0.31, -0.3]);
    d.pelvis = ka.rot(0, 82);
    d.chest = ka.rot(0, 10);
    d.head = ka.rot(-20, -10);
    d.footL = ka.ground(-1.06, -0.72, 90, 70, [0.6, 0.2, -1]);
    d.footR = ka.ground(-1.06, 0.08, 90, 70, [0.6, 0.2, 1]);
    // left arm under his head, right arm under his far arm
    d.handL = ka.hand([0.14, 0.07, -0.84], [-0.4, 0.6, -0.6], 1, 0.3);
    d.handR = ka.hand([0.26, 0.07, -0.28], [-0.4, 0.6, 0.6], 1, 0.3);
  });
  return duo('duo-controle-lateral', top, bottom, pa, pb);
}

/** knee on belly: A's right knee across B's belly, left leg long to the side, trunk up, grips on collar and sleeve */
function kneeOnBelly(a: Author, b: Author): DuoScene {
  const pa = P(-0.32, -0.25, 90);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head = kb.rot(-10, 18);
    d.handR = kb.hand([-0.12, 0.36, -0.12], [-0.6, -0.4, -0.6], 0.6, 0.5);
    d.handL = kb.hand([0.08, 0.3, -0.25], [1, -0.2, -0.4], 0.9, 0.5);
  });
  const top: Pose = {
    hips: ka.hips([-0.3, 0.6, -0.2]),
    pelvis: ka.rot(20, 12, -6),
    chest: ka.rot(-14, 22),
    head: ka.rot(0, 28),
    handL: ka.hand([-0.2, 0.18, -0.56], [-0.6, -0.6, -0.3], 0.5, 0.9),
    handR: ka.hand([0.02, 0.3, -0.5], [0.3, -0.6, 0.6], 0.9, 0.9),
    // right knee on his belly, shin across, toes on the mat at his near hip
    footR: ka.air([-0.32, 0.12, -0.05], 120, 60, 0, [1, -0.3, -0.15], 0),
    footL: ka.ground(-0.72, -0.62, 120, 0, [-0.3, 0.6, -1]),
  };
  return duo('duo-genou-ventre', top, bottom, pa, pb, 'stand', 'ground');
}

/** north-south: A lying head to tail on B's chest, her knees on the mat beyond his head, arms around his body */
function northSouth(a: Author, b: Author): DuoScene {
  const pa = P(0, -1.0, 0);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head = kb.rot(0, 8);
    d.handL = kb.hand([0.22, 0.34, -0.92], [1, 0.2, 0.3], 0.5, 0.6);
    d.handR = kb.hand([-0.22, 0.34, -0.92], [-1, 0.2, 0.3], 0.5, 0.6);
  });
  const top = edit(allFours(a), (d) => {
    d.hips = ka.hips([0, 0.36, -1.02]);
    d.pelvis = ka.rot(0, 80);
    d.chest = ka.rot(0, 12);
    d.head = ka.rot(25, -5);
    d.footL = ka.ground(0.33, -1.48, 10, 70, [0.6, 0.2, 1]);
    d.footR = ka.ground(-0.33, -1.48, -10, 70, [-0.6, 0.2, 1]);
    d.handL = ka.hand([0.3, 0.07, -0.1], [0.6, 0.6, -0.3], 1, 0.3);
    d.handR = ka.hand([-0.3, 0.07, -0.1], [-0.6, 0.6, -0.3], 1, 0.3);
  });
  return duo('duo-nord-sud', top, bottom, pa, pb);
}

/** B sitting on the mat, trunk upright, knees bent, feet flat (the one controlled from behind) */
function sitting(b: Author, fb: Frame): Pose {
  const k = kit(b, fb);
  return {
    hips: k.hips([0, 0.13, 0]),
    pelvis: k.rot(0, -12),
    chest: k.rot(0, 8),
    head: k.rot(0, 8),
    handL: k.hand([0.1, 0.62, 0.14], [1, -0.6, 0], 0.1, 0.8),
    handR: k.hand([-0.1, 0.62, 0.14], [-1, -0.6, 0], 0.1, 0.8),
    footL: k.ground(0.2, 0.62, 10, 0, [0.3, 1, 0.3]),
    footR: k.ground(-0.2, 0.62, -10, 0, [-0.3, 1, 0.3]),
  };
}

/** A sitting close behind B, chest on his back, heels hooked inside his thighs */
function behind(a: Author, fa: Frame): Pose {
  const k = kit(a, fa);
  return {
    hips: k.hips([0, 0.13, -0.32]),
    pelvis: k.rot(0, -28),
    chest: k.rot(0, 18),
    head: k.rot(-18, 10, 8),
    handL: k.hand([-0.06, 0.62, 0.12], [1, 0, -0.5], 0.9, 0.8),
    handR: k.hand([-0.1, 0.52, 0.12], [-1, -0.4, -0.4], -0.6, 0.8),
    footL: k.air([0.16, 0.2, 0.3], 60, -20, 0, [1, 0.6, 0], 0),
    footR: k.air([-0.16, 0.2, 0.3], -60, -20, 0, [-1, 0.6, 0], 0),
  };
}

/** back control: seat belt grip (one arm over the shoulder, one under the arm), hooks in */
function backControl(a: Author, b: Author): DuoScene {
  const pa = P(0, 0, 0);
  const pb = P(0, 0, 0);
  const fb = new Frame(pb);
  const kb = kit(b, fb);
  const front = edit(sitting(b, fb), (d) => {
    d.handL = kb.hand([0.02, 0.6, 0.16], [1, -0.5, 0], 0.2, 0.9);
    d.handR = kb.hand([-0.12, 0.56, 0.16], [-1, -0.5, 0], 0.2, 0.9);
  });
  return duo('duo-controle-dos', behind(a, new Frame(pa)), front, pa, pb);
}

/** rear naked choke: from the back, the right arm around the neck, hand on the left biceps, left hand behind his head */
function rearChoke(a: Author, b: Author): DuoScene {
  const pa = P(0, 0, 0);
  const pb = P(0, 0, 0);
  const fa = new Frame(pa);
  const fb = new Frame(pb);
  const ka = kit(a, fa);
  const kb = kit(b, fb);
  const back = edit(behind(a, fa), (d) => {
    d.handR = ka.hand([0.13, 0.86, -0.02], [-0.2, -0.6, 1], 0, 0.6);
    d.handL = ka.hand([0.0, 0.92, -0.14], [1, 0.2, -0.3], 1, 0.2);
    d.head = ka.rot(-25, 5, 10);
  });
  const front = edit(sitting(b, fb), (d) => {
    d.head = kb.rot(0, 14);
    // both hands pulling at the choking forearm
    d.handL = kb.hand([0.06, 0.74, 0.16], [1, -0.6, 0], 0.2, 0.9);
    d.handR = kb.hand([-0.08, 0.76, 0.16], [-1, -0.6, 0], 0.2, 0.9);
  });
  return duo('duo-etranglement-arriere', back, front, pa, pb);
}

/** cross-body armbar (juji-gatame): B on his back; A sits against his right shoulder and lies back perpendicular to
 * him, her left leg across his face, her right leg across his chest, his right arm long between her thighs, wrist
 * held on her chest, hips lifted under his elbow */
function armbar(a: Author, b: Author): DuoScene {
  const pa = P(-0.34, -0.5, 90);
  const pb = P(0, 0, 0);
  const fa = new Frame(pa);
  const fb = new Frame(pb);
  const ka = kit(a, fa);
  const kb = kit(b, fb);
  const bottom = edit(onBack(b, fb), (d) => {
    d.head = kb.rot(-15, 14);
    // the trapped arm: straight, thumb up, along her body; the other hand grabs at her leg
    d.handR = kb.hand([-0.72, 0.24, -0.5], [0, 1, 0.4], 0, 0.8);
    d.handL = kb.hand([0.12, 0.34, -0.32], [1, 0.3, -0.2], 0.6, 0.7);
  });
  const top = edit(lying(a, fa, [-0.34, 0.17, -0.5], deg(-96)), (d) => {
    d.chest = ka.rot(0, 14);
    d.head = ka.rot(0, 26);
    // left calf across his face, right leg across his chest, knees pinched together over his arm
    d.footL = ka.air([0.3, 0.16, -0.8], 90, 50, 0, [0.1, 1, -0.3], deg(20));
    d.footR = ka.air([0.32, 0.2, -0.26], 90, 50, 0, [0.1, 1, 0.3], deg(20));
    // both hands hold his wrist on her chest
    d.handL = ka.hand([-0.66, 0.32, -0.54], [-0.2, -0.4, -1], 0.2, 0.9);
    d.handR = ka.hand([-0.66, 0.32, -0.46], [-0.2, -0.4, 1], 0.2, 0.9);
  });
  return duo('duo-cle-de-bras', top, bottom, pa, pb);
}

/** triangle: A on her back; B on his knees, posture broken, head down on her chest; her left leg over his right
 * shoulder and across the back of his neck, her right knee pit locking her left ankle; his left arm trapped inside,
 * his right arm out, posted on the mat */
function triangle(a: Author, b: Author): DuoScene {
  const pa = P(0, 0, 0);
  const pb = P(0, 0.3, 180);
  const fa = new Frame(pa);
  const fb = new Frame(pb);
  const ka = kit(a, fa);
  const kb = kit(b, fb);
  const top = edit(kneeling(b), (d) => {
    d.hips = kb.hips([0, 0.44, 0.5]);
    d.pelvis = kb.rot(0, 75);
    d.chest = kb.rot(0, 40);
    d.head = kb.rot(10, 30);
    d.footL = kb.ground(0.17, 0.86, 180, 75, [0, 0.3, -1]);
    d.footR = kb.ground(-0.17, 0.86, 180, 75, [0, 0.3, -1]);
    d.handR = kb.hand([0.4, 0.06, -0.08], [0.8, 0.2, 0.4], 1, 0.2, deg(-60));
    d.handL = kb.hand([0.06, 0.24, -0.24], [-0.8, 0.4, 0.2], 0.6, 0.5);
  });
  const bottom = edit(lying(a, fa, [0, 0.14, -0.02], deg(-108)), (d) => {
    d.chest = ka.rot(0, 24);
    d.head = ka.rot(0, 30);
    d.footL = ka.air([-0.22, 0.56, 0.12], -90, 30, 0, [1, 0.6, -0.4], deg(30));
    d.footR = ka.air([0.08, 0.64, 0.3], 60, 40, 0, [-1, 0.5, -0.2], deg(30));
    // pulling his head down
    d.handL = ka.hand([0.06, 0.46, -0.08], [1, 0, -0.4], 0.8, 0.8);
    d.handR = ka.hand([-0.06, 0.46, -0.1], [-1, 0, -0.4], 0.8, 0.8);
  });
  return duo('duo-triangle', bottom, top, pa, pb);
}

/** kesa-gatame: A sits against B's right side, leaning onto his chest, her right arm around his head, his right arm
 * clamped under her left armpit, legs wide (right leg forward bent, left leg back) */
function kesaGatame(a: Author, b: Author): DuoScene {
  const pa = P(-0.3, -0.32, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(onBack(b, new Frame(pb)), (d) => {
    d.head = kb.rot(-15, 20);
    // his right arm caught against her left side, his left hand pushing at her
    d.handR = kb.hand([-0.6, 0.3, -0.28], [-0.2, 1, 0.3], 0, 0.6);
    d.handL = kb.hand([-0.1, 0.46, -0.36], [1, 0.2, -0.3], 0.5, 0.6);
  });
  const top: Pose = {
    hips: ka.hips([-0.3, 0.14, -0.32]),
    pelvis: ka.rot(-15, -8, -22),
    chest: ka.rot(-20, 26, -18),
    head: ka.rot(-30, 20),
    handR: ka.hand([0.14, 0.06, -0.84], [0.6, 0.6, 0.4], 1, 0.4),
    handL: ka.hand([-0.46, 0.32, -0.38], [-0.6, -0.4, 0.4], 0.4, 0.9),
    // right leg forward along his shoulder, bent; left leg back, inside of the knee on the mat
    footR: ka.air([-0.12, 0.07, -1.0], 120, 0, 60, [-0.6, 1, -0.4], 0),
    footL: ka.air([-0.55, 0.07, 0.45], 180, 30, -60, [-0.8, 0.3, 0.3], deg(20)),
  };
  return duo('duo-kesa-gatame', top, bottom, pa, pb);
}

/** guard pass (toreando): A standing, both hands pinning B's knees to his left, stepping around to his right side */
function guardPass(a: Author, b: Author): DuoScene {
  const pa = P(-0.2, 0.62, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(lying(b, new Frame(pb), [0, 0.13, 0]), (d) => {
    d.pelvis = kb.rot(25, -85, 35);
    d.chest = kb.rot(-10, 18);
    d.head = kb.rot(-30, 25);
    // knees together, pushed down to his left
    d.footL = kb.air([0.5, 0.08, 0.36], 60, 30, 70, [0.6, 0.6, 0.6], deg(20));
    d.footR = kb.air([0.44, 0.2, 0.46], 60, 30, 70, [0.6, 0.6, 0.6], deg(20));
    d.handR = kb.hand([-0.2, 0.36, -0.15], [-1, -0.2, -0.3], 0.5, 0.6);
    d.handL = kb.hand([0.1, 0.42, -0.2], [1, -0.2, -0.3], 0.5, 0.6);
  });
  const top: Pose = {
    hips: ka.hips([-0.25, 0.78, 0.4]),
    pelvis: ka.rot(-25, 40),
    chest: ka.rot(-10, 25),
    head: ka.rot(15, 15),
    handL: ka.hand([0.22, 0.34, 0.2], [-0.6, 0.2, 0.8], 1, 0.9),
    handR: ka.hand([0.27, 0.3, 0.33], [0.8, 0.2, 0.6], 1, 0.9),
    footL: ka.ground(-0.55, 0.15, 220, 30, [-0.6, 0.2, -1]),
    footR: ka.ground(0.0, 0.85, 200, 0, [0.4, 0.2, -1]),
  };
  return duo('duo-passage-garde', top, bottom, pa, pb, 'stand', 'ground');
}

/** open guard: B on his back, feet on A's hips, grips on her sleeves; A standing in front, bent, hands on his knees */
function openGuard(a: Author, b: Author): DuoScene {
  const pa = P(0, 0.62, 180);
  const pb = P(0, 0, 0);
  const ka = kit(a, new Frame(pa));
  const kb = kit(b, new Frame(pb));
  const bottom = edit(lying(b, new Frame(pb), [0, 0.12, 0], deg(-100)), (d) => {
    d.chest = kb.rot(0, 20);
    d.head = kb.rot(0, 26);
    d.footL = kb.air([0.16, 0.74, 0.42], 10, -60, 0, [0.6, 0.6, 0.3], 0);
    d.footR = kb.air([-0.16, 0.74, 0.42], -10, -60, 0, [-0.6, 0.6, 0.3], 0);
    d.handL = kb.hand([0.24, 0.5, 0.16], [1, -0.3, -0.5], 0.2, 0.9);
    d.handR = kb.hand([-0.24, 0.5, 0.16], [-1, -0.3, -0.5], 0.2, 0.9);
  });
  const top: Pose = {
    hips: ka.hips([0, 0.82, 0.66]),
    pelvis: ka.rot(0, 30),
    chest: ka.rot(0, 22),
    head: ka.rot(0, 14),
    handL: ka.hand([-0.22, 0.46, 0.24], [-0.6, -0.6, 0.6], 1, 0.9),
    handR: ka.hand([0.22, 0.46, 0.24], [0.6, -0.6, 0.6], 1, 0.9),
    footL: ka.ground(-0.2, 0.62, 190, 0, [-0.2, 0.2, -1]),
    footR: ka.ground(0.2, 1.02, 170, 10, [0.2, 0.2, -1]),
  };
  return duo('duo-garde-ouverte', top, bottom, pa, pb, 'stand', 'ground');
}

/** the tap: caught in the armbar, B taps the mat flat with his free hand (the scene is moved so the hand is at the
 * centre of a close-up) */
function tapOut(a: Author, b: Author): DuoScene {
  const d = armbar(a, b);
  const at = { x: 0.34, z: -0.36 };
  const fb = new Frame(d.placeB);
  const kb = kit(b, fb);
  const pose = edit(d.b.keys[0].pose, (p) => {
    p.handL = kb.hand([at.x, 0.03, at.z], [0.6, 0.6, -0.4], 1, 0, deg(-20));
    p.head = kb.rot(25, 20);
  });
  const shift = (p: Place): Place => ({ ...p, x: p.x - at.x, z: p.z - at.z });
  return { id: 'duo-tape', a: { ...d.a, id: 'duo-tape' }, b: still('duo-tape@b', pose), placeA: shift(d.placeA), placeB: shift(d.placeB) };
}

// Standing scenes of the rules (boxing): A is Amara as the referee, B is Kadir as the boxer, unless said otherwise.

/** standing, relaxed, feet a little apart (the referee's base), at (x, z) facing its place's heading */
function standing(a: Author, f: Frame, x: number, z: number): Pose {
  const k = kit(a, f);
  const yawDeg = f.p.yaw / (Math.PI / 180);
  const c = Math.cos(f.p.yaw);
  const s = Math.sin(f.p.yaw);
  // feet at hip width, across the heading
  const at = (side: number, fwd: number): [number, number] => [x + side * 0.13 * c + fwd * s, z - side * 0.13 * s + fwd * c];
  return edit(a.neutral(), (d) => {
    d.hips = k.hips([x, a.m.hipsRest.y - 0.03 * a.s, z]);
    const [lx, lz] = at(1, 0.06);
    const [rx, rz] = at(-1, -0.04);
    d.footL = k.ground(lx, lz, yawDeg + 8, 0);
    d.footR = k.ground(rx, rz, yawDeg - 8, 0);
  });
}

/** the referee steps in: one arm long, palm towards the boxer's chest, the other arm out to the side */
function refereeStop(a: Author, b: Author): DuoScene {
  const pa = P(-0.32, 0.1, 100);
  const pb = P(0.55, 0, -70);
  const fa = new Frame(pa);
  const ka = kit(a, fa);
  const ref = edit(standing(a, fa, -0.32, 0.1), (d) => {
    d.pelvis = ka.rot(0, 4);
    d.chest = ka.rot(-10, 4);
    d.head = ka.rot(10, 0);
    d.footL = ka.ground(-0.18, -0.08, 80, 0);
    d.footR = ka.ground(-0.44, 0.3, 110, 20);
    d.handR = ka.hand([0.16, 1.22, 0.2], [0, -1, 0.4], 0, 0, deg(-60));
    d.handL = ka.hand([-0.36, 1.18, -0.62], [0, -1, -0.3], 0, 0, deg(-50));
  });
  return duo('duo-arbitre-stop', ref, b.guard(), pa, pb, 'stand');
}

/** knockdown: the boxer down on one knee, a glove on the canvas; the referee above him counts, hand open */
function refereeCount(a: Author, b: Author): DuoScene {
  const pa = P(-0.45, -0.15, 60);
  const pb = P(0.25, 0.1, -40);
  const fa = new Frame(pa);
  const ka = kit(a, fa);
  const down: Pose = edit(b.neutral(), (d) => {
    const s = b.s;
    d.hips = v3(0, 0.4 * s, -0.08 * s);
    d.pelvis = { yaw: 0, pitch: deg(18), roll: 0 };
    d.chest = { yaw: deg(-8), pitch: deg(22), roll: 0 };
    d.head = { yaw: deg(-15), pitch: deg(18), roll: 0 };
    d.footL = { ...b.ground(v3(0.15 * s, 0, 0.36 * s), deg(-4), 0), pole: v3(0.2, 0.4, 1) };
    d.footR = { ...b.ground(v3(-0.16 * s, 0, -0.56 * s), deg(-6), deg(60)), pole: v3(-0.1, -1, 0.6) };
    d.handR = b.hand('world', v3(-0.3 * s, 0.07 * s, 0.12 * s), v3(-0.8, 0.4, -0.2), 1, 1);
    d.handL = b.hand('world', v3(0.14 * s, 0.52 * s, 0.34 * s), v3(0.8, -0.4, -0.3), 0.5, 1);
  });
  const ref = edit(standing(a, fa, -0.45, -0.15), (d) => {
    d.pelvis = ka.rot(0, 8);
    d.chest = ka.rot(0, 14);
    d.head = ka.rot(0, 22);
    // the counting hand, open, towards the boxer's face; the other on the thigh
    d.handR = ka.hand([0.02, 0.98, 0.18], [0.2, -1, -0.6], 0, 0, deg(-30));
    d.handL = ka.hand([-0.62, 0.78, 0.02], [-0.3, -1, -0.6], 0, 0.3);
  });
  return duo('duo-arbitre-compte', ref, down, pa, pb, 'stand', 'ground');
}

/** decision: side by side, facing the judges, the referee raises the winner's right arm by the wrist */
function refereeDecision(a: Author, b: Author): DuoScene {
  const pa = P(-0.32, 0, 0);
  const pb = P(0.26, 0, 0);
  const fa = new Frame(pa);
  const fb = new Frame(pb);
  const ka = kit(a, fa);
  const kb = kit(b, fb);
  const ref = edit(standing(a, fa, -0.32, 0), (d) => {
    d.chest = ka.rot(0, 0, -6);
    d.head = ka.rot(-10, 0);
    d.handL = ka.hand([0.02, 1.84, 0.04], [1, 0, -0.3], 0, 0.9);
    d.handR = ka.hand([-0.44, 0.84, 0.04], [-0.3, 0, -1], 0, 0.3);
  });
  const winner = edit(standing(b, fb, 0.26, 0), (d) => {
    d.chest = kb.rot(0, -2, 6);
    d.head = kb.rot(0, -8);
    d.handR = kb.hand([0.04, 1.97, 0.05], [-1, 0, -0.3], 0, 1);
    d.handL = kb.hand([0.48, 0.92, 0.12], [0.3, 0, -1], 0.3, 1);
  });
  return duo('duo-arbitre-vainqueur', ref, winner, pa, pb, 'stand');
}

/** warning: the referee faces the boxer, arm long pointing at him, the other hand at her own belt line (low blow) */
function refereeWarning(a: Author, b: Author): DuoScene {
  const pa = P(-0.45, 0, 100);
  const pb = P(0.45, 0.1, -70);
  const fa = new Frame(pa);
  const fb = new Frame(pb);
  const ka = kit(a, fa);
  const kb = kit(b, fb);
  const ref = edit(standing(a, fa, -0.45, 0), (d) => {
    d.chest = ka.rot(0, 4);
    d.handR = ka.hand([0.08, 1.32, 0.3], [0, -1, 0.3], 0, 0.6);
    d.handL = ka.hand([-0.36, 0.98, 0.12], [-0.6, -0.6, -0.5], 1, 0.2);
  });
  const boxer = edit(standing(b, fb, 0.45, 0.1), (d) => {
    d.head = kb.rot(0, 8);
    d.handL = kb.hand([0.36, 0.98, -0.18], [0.3, 0, -1], 0.3, 1);
    d.handR = kb.hand([0.62, 0.98, 0.2], [-0.3, 0, -1], 0.3, 1);
  });
  return duo('duo-arbitre-avertit', ref, boxer, pa, pb, 'stand');
}

/** sparring: two boxers face to face; A's jab comes in light, B's rear glove catches it in front of his face */
function sparring(a: Author, b: Author): DuoScene {
  const pa = P(0, 0, 0);
  const pb = P(0.04, 1.42, 180);
  const ga = a.guard();
  const jab = edit(ga, (d) => {
    // towards his face, not through it: three quarters of the reach
    const t = new Frame(pa).pt(0.02, 1.5, 1.1);
    d.handL = a.hand('world', a.reach(ga, 'L', t, 0.92), v3(0.3, -1, -0.2), 1, 1);
    d.chest.yaw -= deg(10);
    d.pelvis.yaw -= deg(6);
  });
  const gb = b.guard();
  const catchIt = edit(gb, (d) => {
    d.head.pitch += deg(6);
  });
  return duo('duo-sparring', jab, catchIt, pa, pb, 'stand');
}

export function duoScenes(a: Author, b: Author): DuoScene[] {
  return [refereeStop(a, b), refereeCount(a, b), refereeDecision(a, b), refereeWarning(a, b), sparring(a, b), mount(a, b), closedGuard(a, b), halfGuard(a, b), sideControl(a, b), kneeOnBelly(a, b), northSouth(a, b), backControl(a, b), rearChoke(a, b), armbar(a, b), triangle(a, b), kesaGatame(a, b), guardPass(a, b), openGuard(a, b), tapOut(a, b)];
}
