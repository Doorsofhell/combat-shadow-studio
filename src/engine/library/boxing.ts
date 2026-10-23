/**
 * Punches, defences and footwork (all disciplines use them, with their own stance).
 * Orthodox; southpaw versions are mirrored automatically.
 */
import { Author, add, edit } from '../author';
import type { Motion } from '../motion';
import { Pose, deg, v3 } from '../pose';

const stand = { startState: 'stand' as const, endState: 'stand' as const };

/** fighting stance with a light breathing/bounce, used as idle between repetitions */
export function guardIdle(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const down = edit(g, (d) => {
    d.hips.y -= 0.018 * s;
    d.hips.z -= 0.005 * s;
    d.chest.pitch += deg(1.5);
    d.footR.mode === 'ground' && (d.footR.heel += deg(4));
    d.handL.pos.y -= 0.008 * s;
    d.handR.pos.y -= 0.008 * s;
  });
  return { id: 'garde', keys: [{ t: 0, pose: g }, { t: 0.45, pose: down }, { t: 0.9, pose: g }], impacts: [], ...stand };
}

/** neutral standing posture with a slow breathing, reference posture of the fighter creator */
export function neutralIdle(a: Author): Motion {
  const n = a.neutral();
  const s = a.s;
  const breath = edit(n, (d) => {
    d.chest.pitch -= deg(0.8);
    d.hips.y -= 0.004 * s;
  });
  return { id: 'neutre', keys: [{ t: 0, pose: n }, { t: 1.6, pose: breath }, { t: 3.2, pose: n }], impacts: [], ...stand };
}

function straight(a: Author, side: 'L' | 'R', target: 'chin' | 'body'): Motion {
  const g = a.guard();
  const s = a.s;
  const T = a.target(target, target === 'chin' ? 0.66 : 0.6);
  const low = target === 'body';
  let ext: Pose;
  if (side === 'L') {
    ext = edit(g, (d) => {
      d.pelvis.yaw += deg(-5);
      d.chest.yaw += deg(-12);
      d.chest.roll += deg(low ? 4 : 2);
      d.hips.z += 0.035 * s;
      d.hips.x -= 0.01 * s;
      if (low) {
        d.hips.y -= 0.11 * s;
        d.chest.pitch += deg(8);
      }
      d.head.roll += deg(3);
      if (d.footR.mode === 'ground') d.footR.heel += deg(5);
    });
    ext.handL = a.hand('world', a.reach(ext, 'L', T, 0.975), v3(0.7, -0.35, -0.2), 0.95);
  } else {
    ext = edit(g, (d) => {
      d.pelvis.yaw += deg(40);
      d.chest.yaw += deg(14);
      d.chest.roll += deg(low ? 6 : 3);
      d.hips.z += 0.05 * s;
      d.hips.x += 0.045 * s;
      d.hips.y -= (low ? 0.12 : 0.01) * s;
      if (low) d.chest.pitch += deg(8);
      d.head.roll += deg(-2);
      if (d.footR.mode === 'ground') {
        d.footR.heel = deg(42);
        d.footR.yaw += deg(32);
      }
      // lead hand back to the chin while the rear hand fires
      d.handL.pos = add(d.handL.pos, { z: -0.1 * s, y: 0.01 * s, x: -0.02 * s });
    });
    ext.handR = a.hand('world', a.reach(ext, 'R', T, 0.98), v3(-0.75, -0.3, -0.2), 0.95);
  }
  const t1 = side === 'L' ? 0.13 : 0.17;
  const t2 = side === 'L' ? 0.32 : 0.4;
  return {
    id: `${side === 'L' ? 'jab' : 'direct'}${low ? '-corps' : ''}`,
    keys: [
      { t: 0, pose: g },
      { t: t1, pose: ext, ease: 'snap' },
      { t: t1 + 0.04, pose: ext, ease: 'linear' },
      { t: t2, pose: g, ease: 'inOut' },
    ],
    chainAt: t2 - 0.08,
    impacts: [t1],
    ...stand,
  };
}

function hook(a: Author, side: 'L' | 'R', target: 'chin' | 'body'): Motion {
  const g = a.guard();
  const s = a.s;
  const body = target === 'body';
  const sg = side === 'L' ? 1 : -1;
  const T = a.target(target, 0.5);
  const hit = edit(g, (d) => {
    if (side === 'L') {
      d.pelvis.yaw += deg(-34);
      d.chest.yaw += deg(-14);
      d.hips.x += 0.02 * s;
      if (d.footL.mode === 'ground') {
        d.footL.yaw += deg(-40);
        d.footL.heel = deg(22);
      }
      d.handR.pos = add(d.handR.pos, { y: 0.01 * s });
    } else {
      d.pelvis.yaw += deg(48);
      d.chest.yaw += deg(18);
      d.hips.x += 0.05 * s;
      d.hips.z += 0.02 * s;
      if (d.footR.mode === 'ground') {
        d.footR.yaw += deg(42);
        d.footR.heel = deg(45);
      }
      d.handL.pos = add(d.handL.pos, { z: -0.08 * s });
    }
    d.hips.y -= (body ? 0.12 : 0.02) * s;
    d.chest.roll += deg(body ? 10 * sg : 4 * sg);
    if (body) d.chest.pitch += deg(6);
  });
  // hand arrives on the target from the side, elbow up, forearm horizontal
  const hand = a.hand('world', v3(T.x + 0.04 * sg * s, T.y, T.z), v3(sg, body ? -0.4 : 0.25, -0.1), body ? 0.1 : 0.85);
  hit[side === 'L' ? 'handL' : 'handR'] = hand;
  const wind = edit(g, (d) => {
    const h = side === 'L' ? d.handL : d.handR;
    h.space = 'world';
    const sh = a.shoulder(g, side);
    // Keep the fist close to the guard: a hook must not wind up behind the shoulder.
    h.pos = v3(sh.x + 0.08 * sg * s, T.y + 0.02 * s, sh.z + 0.18 * s);
    h.pole = v3(sg, body ? -0.35 : 0.55, 0.1);
    h.pron = body ? 0.1 : 0.7;
    d.pelvis.yaw += deg(-4 * sg);
    d.chest.yaw += deg(-3 * sg);
    d.hips.y -= (body ? 0.08 : 0.015) * s;
  });
  // An intermediate arc keeps the elbow leading the fist instead of cutting
  // straight across the chest. The torso rotates progressively into impact.
  const arc = edit(hit, (d) => {
    d.pelvis.yaw = g.pelvis.yaw + (hit.pelvis.yaw - g.pelvis.yaw) * 0.55;
    d.chest.yaw = g.chest.yaw + (hit.chest.yaw - g.chest.yaw) * 0.55;
    const h = side === 'L' ? d.handL : d.handR;
    const wh = side === 'L' ? wind.handL : wind.handR;
    h.pos = v3(
      wh.pos.x + (h.pos.x - wh.pos.x) * 0.58 + 0.035 * sg * s,
      wh.pos.y + (h.pos.y - wh.pos.y) * 0.58,
      wh.pos.z + (h.pos.z - wh.pos.z) * 0.58,
    );
  });
  const t1 = 0.07;
  const t2 = side === 'L' ? 0.23 : 0.27;
  const t3 = t2 + 0.19;
  return {
    id: `crochet-${side === 'L' ? 'avant' : 'arriere'}${body ? '-corps' : ''}`,
    keys: [
      { t: 0, pose: g },
      { t: t1, pose: wind, ease: 'inOut' },
      { t: (t1 + t2) / 2, pose: arc, ease: 'inOut' },
      { t: t2, pose: hit, ease: 'out' },
      { t: t2 + 0.03, pose: hit, ease: 'linear' },
      { t: t3, pose: g, ease: 'inOut' },
    ],
    chainAt: t3 - 0.08,
    impacts: [t2],
    ...stand,
  };
}

function uppercut(a: Author, side: 'L' | 'R'): Motion {
  const g = a.guard();
  const s = a.s;
  const sg = side === 'L' ? 1 : -1;
  const dip = edit(g, (d) => {
    d.hips.y -= 0.08 * s;
    d.pelvis.yaw += deg(side === 'L' ? 8 : -6);
    d.chest.yaw += deg(side === 'L' ? 6 : -6);
    d.chest.roll += deg(8 * sg);
    d.chest.pitch += deg(6);
    const h = side === 'L' ? d.handL : d.handR;
    h.pos = add(h.pos, { y: -0.16 * s, z: -0.04 * s });
    h.pron = -0.6;
  });
  const hit = edit(g, (d) => {
    d.hips.y += 0.01 * s;
    if (side === 'L') {
      d.pelvis.yaw += deg(-22);
      d.chest.yaw += deg(-8);
      if (d.footL.mode === 'ground') d.footL.heel = deg(14);
    } else {
      d.pelvis.yaw += deg(36);
      d.chest.yaw += deg(12);
      d.hips.x += 0.04 * s;
      if (d.footR.mode === 'ground') {
        d.footR.heel = deg(40);
        d.footR.yaw += deg(30);
      }
    }
    d.chest.roll += deg(-3 * sg);
  });
  const sh = a.shoulder(hit, side);
  // fist rises in front of the boxer's own chin line (close range), forearm vertical, palm toward the boxer
  const fr = a.frame(hit).origin;
  hit[side === 'L' ? 'handL' : 'handR'] = a.hand('world', v3(fr.x + 0.03 * sg * s, fr.y + 0.05 * s, Math.max(fr.z + 0.34 * s, sh.z + 0.3 * s)), v3(0.2 * sg, -1, 0.25), -0.95);
  const t1 = 0.12;
  const t2 = 0.26;
  const t3 = 0.48;
  return {
    id: `uppercut-${side === 'L' ? 'avant' : 'arriere'}`,
    keys: [
      { t: 0, pose: g },
      { t: t1, pose: dip, ease: 'inOut' },
      { t: t2, pose: hit, ease: 'snap' },
      { t: t2 + 0.03, pose: hit, ease: 'linear' },
      { t: t3, pose: g, ease: 'inOut' },
    ],
    chainAt: t3 - 0.08,
    impacts: [t2],
    ...stand,
  };
}

/** MMA overhand: looping rear punch over the top, with a level drop */
function overhand(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const C = a.target('chin', 0.6);
  const load = edit(g, (d) => {
    d.hips.y -= 0.05 * s;
    d.pelvis.yaw += deg(-6);
    d.chest.roll += deg(-6);
    const sh = a.shoulder(g, 'R');
    d.handR = a.hand('world', v3(sh.x - 0.12 * s, sh.y + 0.2 * s, sh.z + 0.02 * s), v3(-1, 0.4, -0.4), 0.3);
  });
  const hit = edit(g, (d) => {
    d.hips.y -= 0.1 * s;
    d.hips.x += 0.07 * s;
    d.hips.z += 0.06 * s;
    d.pelvis.yaw += deg(48);
    d.chest.yaw += deg(14);
    d.chest.roll += deg(14);
    d.chest.pitch += deg(12);
    if (d.footR.mode === 'ground') {
      d.footR.heel = deg(48);
      d.footR.yaw += deg(36);
    }
    d.handL.pos = add(d.handL.pos, { z: -0.08 * s, y: 0.03 * s });
  });
  hit.handR = a.hand('world', a.reach(hit, 'R', add(C, { y: -0.02 * s }), 0.92), v3(-0.6, 0.8, -0.2), 0.95);
  return {
    id: 'overhand',
    keys: [
      { t: 0, pose: g },
      { t: 0.14, pose: load, ease: 'inOut' },
      { t: 0.32, pose: hit, ease: 'snap' },
      { t: 0.36, pose: hit, ease: 'linear' },
      { t: 0.62, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.54,
    impacts: [0.32],
    ...stand,
  };
}

// ------------------------------------------------------------------ defence
function slip(a: Author, dir: 'gauche' | 'droite'): Motion {
  const g = a.guard();
  const s = a.s;
  const sg = dir === 'gauche' ? 1 : -1; // gauche = toward the coach's left
  const p = edit(g, (d) => {
    d.hips.x += 0.07 * sg * s;
    d.hips.y -= 0.06 * s;
    d.pelvis.yaw += deg(sg > 0 ? 6 : -10);
    d.chest.roll += deg(-15 * sg);
    d.chest.pitch += deg(6);
    d.chest.yaw += deg(sg > 0 ? 6 : -8);
    d.head.roll += deg(-5 * sg);
  });
  return {
    id: `esquive-${dir}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.18, pose: p, ease: 'snap' },
      { t: 0.26, pose: p, ease: 'linear' },
      { t: 0.46, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.38,
    impacts: [],
    ...stand,
  };
}

/** bob and weave: U-shaped path under a hook, ending on the other side */
function roll(a: Author, dir: 'gauche' | 'droite'): Motion {
  const g = a.guard();
  const s = a.s;
  const sg = dir === 'gauche' ? 1 : -1;
  const side1 = edit(g, (d) => {
    d.hips.x -= 0.05 * sg * s;
    d.hips.y -= 0.06 * s;
    d.chest.roll += deg(10 * sg);
    d.chest.pitch += deg(8);
  });
  const bottom = edit(g, (d) => {
    d.hips.y -= 0.19 * s;
    d.hips.z -= 0.02 * s;
    d.chest.pitch += deg(18);
    d.pelvis.pitch += deg(8);
    d.head.pitch += deg(-14);
  });
  const side2 = edit(g, (d) => {
    d.hips.x += 0.06 * sg * s;
    d.hips.y -= 0.07 * s;
    d.chest.roll += deg(-10 * sg);
    d.chest.pitch += deg(6);
  });
  return {
    id: `roll-${dir}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.14, pose: side1, ease: 'inOut' },
      { t: 0.32, pose: bottom, ease: 'linear' },
      { t: 0.5, pose: side2, ease: 'linear' },
      { t: 0.7, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.6,
    impacts: [],
    ...stand,
  };
}

/** tight cover: forearms protect the head, elbows close, chin down */
function blockHigh(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const p = edit(g, (d) => {
    d.hips.y -= 0.04 * s;
    d.chest.pitch += deg(8);
    d.head.pitch += deg(8);
    d.handL = a.hand('chest', v3(0.06 * s, 0.25 * s, 0.13 * s), v3(0.15, -1, 0.35), -0.15, 1, deg(-10));
    d.handR = a.hand('chest', v3(-0.08 * s, 0.25 * s, 0.11 * s), v3(-0.15, -1, 0.35), -0.15, 1, deg(-10));
  });
  return {
    id: 'blocage-haut',
    keys: [
      { t: 0, pose: g },
      { t: 0.14, pose: p, ease: 'snap' },
      { t: 0.4, pose: p, ease: 'linear' },
      { t: 0.6, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.5,
    impacts: [0.14],
    ...stand,
  };
}

/** elbow/forearm block to protect the body on one side */
function blockBody(a: Author, side: 'L' | 'R'): Motion {
  const g = a.guard();
  const s = a.s;
  const sg = side === 'L' ? 1 : -1;
  const p = edit(g, (d) => {
    d.hips.y -= 0.03 * s;
    d.chest.roll += deg(8 * sg);
    d.chest.yaw += deg(-6 * sg);
    const h = side === 'L' ? d.handL : d.handR;
    h.pos = add(h.pos, { y: -0.03 * s, z: -0.06 * s, x: 0.02 * sg * s });
    h.pole = v3(0.2 * sg, -1, 0.05);
  });
  return {
    id: `blocage-corps-${side === 'L' ? 'avant' : 'arriere'}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.14, pose: p, ease: 'snap' },
      { t: 0.32, pose: p, ease: 'linear' },
      { t: 0.5, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.42,
    impacts: [0.14],
    ...stand,
  };
}

/** rear hand parry: short slap that deflects a jab across the face */
function parry(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const p = edit(g, (d) => {
    d.chest.yaw += deg(5);
    d.handR.pos = add(d.handR.pos, { x: 0.1 * s, z: 0.08 * s });
    d.handR.fist = 0.4;
    d.handR.pron = -0.2;
  });
  return {
    id: 'parade',
    keys: [
      { t: 0, pose: g },
      { t: 0.1, pose: p, ease: 'snap' },
      { t: 0.32, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.26,
    impacts: [0.1],
    ...stand,
  };
}

/** lean back out of range, weight on the rear leg, then back */
function pullBack(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const p = edit(g, (d) => {
    d.hips.z -= 0.09 * s;
    d.hips.x -= 0.02 * s;
    d.pelvis.pitch += deg(-4);
    d.chest.pitch += deg(-14);
    d.chest.yaw += deg(-6);
    if (d.footR.mode === 'ground') d.footR.heel = deg(5);
    if (d.footL.mode === 'ground') d.footL.heel = deg(10);
  });
  return {
    id: 'retrait',
    keys: [
      { t: 0, pose: g },
      { t: 0.2, pose: p, ease: 'snap' },
      { t: 0.32, pose: p, ease: 'linear' },
      { t: 0.56, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.46,
    impacts: [],
    ...stand,
  };
}

// ------------------------------------------------------------------ footwork
type StepDir = 'avant' | 'arriere' | 'gauche' | 'droite';

/** step-drag footwork: the foot closest to the direction moves first, the other follows */
function step(a: Author, dir: StepDir): Motion {
  const g = a.guard();
  const s = a.s;
  const dist = (dir === 'avant' || dir === 'arriere' ? 0.22 : 0.2) * s;
  const dx = dir === 'gauche' ? dist : dir === 'droite' ? -dist : 0;
  const dz = dir === 'avant' ? dist : dir === 'arriere' ? -dist : 0;
  const first: 'footL' | 'footR' = dir === 'avant' || dir === 'gauche' ? 'footL' : 'footR';
  const second = first === 'footL' ? 'footR' : 'footL';
  const lift = 0.05 * s;
  const mid = edit(g, (d) => {
    d.hips.x += dx * 0.55;
    d.hips.z += dz * 0.55;
    d.hips.y -= 0.01 * s;
    const f = d[first];
    if (f.mode === 'ground') {
      f.ball = add(f.ball, { x: dx * 0.6, z: dz * 0.6, y: lift });
      f.heel = Math.max(f.heel, deg(10));
    }
  });
  const land = edit(g, (d) => {
    d.hips.x += dx * 0.7;
    d.hips.z += dz * 0.7;
    const f = d[first];
    if (f.mode === 'ground') f.ball = add(f.ball, { x: dx, z: dz });
    const o = d[second];
    if (o.mode === 'ground') {
      o.ball = add(o.ball, { x: dx * 0.45, z: dz * 0.45, y: lift * 0.6 });
      o.heel = Math.max(o.heel, deg(18));
    }
  });
  const end = edit(g, (d) => {
    d.hips.x += dx;
    d.hips.z += dz;
    for (const k of ['footL', 'footR'] as const) {
      const f = d[k];
      if (f.mode === 'ground') f.ball = add(f.ball, { x: dx, z: dz });
    }
  });
  return {
    id: `pas-${dir}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.14, pose: mid, ease: 'inOut' },
      { t: 0.24, pose: land, ease: 'inOut' },
      { t: 0.4, pose: end, ease: 'inOut' },
    ],
    chainAt: 0.36,
    impacts: [],
    travel: { x: dx, z: dz, yaw: 0 },
    ...stand,
  };
}

/**
 * Pivot on the lead foot: the rear foot swings around (clockwise for 'droite' in orthodox),
 * the whole stance turns by `angle`, the coach ends facing the new direction.
 */
function pivot(a: Author, dir: 'gauche' | 'droite', angle = deg(60)): Motion {
  const g = a.guard();
  const s = a.s;
  const yaw = dir === 'droite' ? -angle : angle;
  const lead = g.footL.mode === 'ground' ? g.footL.ball : v3(0, 0, 0);
  // rotate a point of the guard about the lead ball
  const rotP = (p: { x: number; z: number }, t: number) => {
    const c = Math.cos(yaw * t);
    const sn = Math.sin(yaw * t);
    const x = p.x - lead.x;
    const z = p.z - lead.z;
    return { x: lead.x + x * c + z * sn, z: lead.z - x * sn + z * c };
  };
  const at = (t: number, lift: number) =>
    edit(g, (d) => {
      const h = rotP(d.hips, t);
      d.hips.x = h.x;
      d.hips.z = h.z;
      d.pelvis.yaw += yaw * t;
      if (d.footL.mode === 'ground') {
        d.footL.yaw += yaw * t;
        d.footL.heel = deg(14) * Math.sin(Math.PI * t);
      }
      if (d.footR.mode === 'ground') {
        const b = rotP(d.footR.ball, t);
        d.footR.ball = v3(b.x, lift, b.z);
        d.footR.yaw += yaw * t;
      }
    });
  const end = at(1, 0);
  return {
    id: `pivot-${dir}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.18, pose: at(0.5, 0.04 * s), ease: 'inOut' },
      { t: 0.36, pose: end, ease: 'inOut' },
    ],
    chainAt: 0.34,
    impacts: [],
    // origin change: rotation about the lead ball
    travel: (() => {
      const o = rotP({ x: 0, z: 0 }, 1);
      return { x: o.x, z: o.z, yaw };
    })(),
    ...stand,
  };
}

/** step off at an angle: lead foot steps out to the left-front while the body turns back toward the target */
function angleOut(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const dx = 0.2 * s;
  const dz = 0.12 * s;
  const yaw = deg(-35);
  const mid = edit(g, (d) => {
    d.hips.x += dx * 0.5;
    d.hips.z += dz * 0.5;
    if (d.footL.mode === 'ground') {
      d.footL.ball = add(d.footL.ball, { x: dx * 0.7, z: dz * 0.7, y: 0.05 * s });
      d.footL.yaw += yaw * 0.5;
    }
  });
  const end = edit(g, (d) => {
    d.hips.x += dx;
    d.hips.z += dz;
    d.pelvis.yaw += yaw;
    if (d.footL.mode === 'ground') {
      d.footL.ball = add(d.footL.ball, { x: dx, z: dz });
      d.footL.yaw += yaw;
    }
    if (d.footR.mode === 'ground' && g.footL.mode === 'ground') {
      // rear foot swings to rebuild the stance facing the new angle
      const L0 = g.footL.ball;
      const rx = d.footR.ball.x - L0.x;
      const rz = d.footR.ball.z - L0.z;
      const c = Math.cos(yaw);
      const sn = Math.sin(yaw);
      d.footR.ball = v3(L0.x + dx + rx * c + rz * sn, 0, L0.z + dz - rx * sn + rz * c);
      d.footR.yaw += yaw;
    }
  });
  const rearMid = edit(end, (d) => {
    if (d.footR.mode === 'ground') {
      d.footR.ball = v3((g.footR.mode === 'ground' ? g.footR.ball.x : 0) * 0.5 + d.footR.ball.x * 0.5, 0.05 * s, d.footR.ball.z);
    }
  });
  return {
    id: 'sortie-angle',
    keys: [
      { t: 0, pose: g },
      { t: 0.16, pose: mid, ease: 'inOut' },
      { t: 0.3, pose: rearMid, ease: 'inOut' },
      { t: 0.44, pose: end, ease: 'inOut' },
    ],
    chainAt: 0.42,
    impacts: [],
    travel: { x: dx, z: dz, yaw },
    ...stand,
  };
}

export function boxingMotions(a: Author): Motion[] {
  return [
    guardIdle(a),
    neutralIdle(a),
    straight(a, 'L', 'chin'),
    straight(a, 'R', 'chin'),
    straight(a, 'L', 'body'),
    straight(a, 'R', 'body'),
    hook(a, 'L', 'chin'),
    hook(a, 'R', 'chin'),
    hook(a, 'L', 'body'),
    hook(a, 'R', 'body'),
    uppercut(a, 'L'),
    uppercut(a, 'R'),
    overhand(a),
    slip(a, 'gauche'),
    slip(a, 'droite'),
    roll(a, 'gauche'),
    roll(a, 'droite'),
    blockHigh(a),
    blockBody(a, 'L'),
    blockBody(a, 'R'),
    parry(a),
    pullBack(a),
    step(a, 'avant'),
    step(a, 'arriere'),
    step(a, 'gauche'),
    step(a, 'droite'),
    pivot(a, 'droite'),
    pivot(a, 'gauche'),
    angleOut(a),
  ];
}
