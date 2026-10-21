/**
 * Elbows (muay-thaï), simulated clinch and feints.
 */
import { Author, add, edit } from '../author';
import type { Motion } from '../motion';
import { deg, v3 } from '../pose';

const stand = { startState: 'stand' as const, endState: 'stand' as const };

function elbow(a: Author, side: 'L' | 'R', kind: 'horizontal' | 'diagonal' | 'montant'): Motion {
  const g = a.guard();
  const s = a.s;
  const sg = side === 'L' ? 1 : -1;
  const hk = side === 'L' ? 'handL' : 'handR';
  const C = a.target('chin', 0.4);
  const turn = side === 'L' ? -1 : 1; // lead elbow rotates the hips right, rear elbow left
  const hit = edit(g, (d) => {
    d.pelvis.yaw += turn * deg(side === 'L' ? 32 : 48);
    d.chest.yaw += turn * deg(14);
    d.hips.x += (side === 'R' ? 0.05 : 0.02) * s;
    d.hips.z += 0.03 * s;
    const f = side === 'L' ? d.footL : d.footR;
    if (f.mode === 'ground') {
      f.heel = deg(side === 'L' ? 20 : 45);
      f.yaw += turn * deg(side === 'L' ? 25 : 35);
    }
    if (kind === 'diagonal') {
      d.hips.y -= 0.06 * s;
      d.chest.pitch += deg(10);
      d.chest.roll += deg(-8 * sg);
    }
    if (kind === 'montant') {
      d.hips.y += 0.02 * s;
      d.chest.pitch += deg(-6);
      d.chest.roll += deg(-6 * sg);
    }
  });
  const sh = a.shoulder(hit, side);
  // the elbow tip lands on the target: hand folded back close to the head, forearm across
  if (kind === 'horizontal') {
    hit[hk] = a.hand('world', v3(C.x - sg * 0.12 * s, C.y + 0.04 * s, sh.z + 0.12 * s), v3(sg * 0.5, 0.15, 1), 1, 1);
  } else if (kind === 'diagonal') {
    hit[hk] = a.hand('world', v3(C.x - sg * 0.1 * s, C.y - 0.12 * s, sh.z + 0.14 * s), v3(sg * 0.3, -0.3, 1), 1, 1);
  } else {
    hit[hk] = a.hand('world', v3(sh.x - sg * 0.02 * s, sh.y + 0.32 * s, sh.z + 0.02 * s), v3(sg * 0.1, 0.4, 1), -0.2, 1);
  }
  const wind = edit(g, (d) => {
    const h = d[hk];
    h.space = 'world';
    const sh0 = a.shoulder(g, side);
    if (kind === 'diagonal') {
      h.pos = v3(sh0.x + sg * 0.02 * s, sh0.y + 0.3 * s, sh0.z + 0.08 * s);
      h.pole = v3(sg * 0.6, 1, 0.3);
      h.pron = 0.6;
      d.hips.y += 0.02 * s;
    } else if (kind === 'montant') {
      d.hips.y -= 0.07 * s;
      d.chest.pitch += deg(6);
      h.pos = v3(sh0.x, sh0.y + 0.05 * s, sh0.z + 0.16 * s);
      h.pole = v3(sg * 0.2, -1, 0.3);
      h.pron = -0.2;
    } else {
      // v0.29: the elbow rises to the height of the shoulder in place (no pull back, which would announce it),
      // then crosses « from one shoulder to the other » [S27]
      h.pos = v3(sh0.x + sg * 0.03 * s, sh0.y + 0.08 * s, sh0.z + 0.2 * s);
      h.pole = v3(sg, 0.25, -0.2);
      h.pron = 0.8;
    }
    d.pelvis.yaw += -turn * deg(6);
  });
  const names = { horizontal: 'horizontal', diagonal: 'diagonal', montant: 'montant' };
  return {
    id: `coude-${names[kind]}-${side === 'L' ? 'avant' : 'arriere'}`,
    keys: [
      { t: 0, pose: g },
      { t: 0.12, pose: wind, ease: 'load' },
      { t: 0.26, pose: hit, ease: 'strike' },
      { t: 0.3, pose: hit, ease: 'linear' },
      { t: 0.52, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.44,
    impacts: [0.26],
    ...stand,
  };
}

/** Solo clinch: hands lock behind an imaginary neck, elbows squeeze, pull down and turn. */
function clinchPull(a: Author): Motion {
  const g = a.guard();
  const s = a.s;
  const C = a.target('chin', 0.4);
  const lock = edit(g, (d) => {
    d.hips.z += 0.05 * s;
    d.pelvis.yaw = deg(-8);
    d.chest.yaw = deg(0);
    d.chest.pitch = deg(4);
    d.handL = a.hand('world', v3(0.04 * s, C.y, C.z + 0.04 * s), v3(0.5, -0.8, 0), -0.5, 0.6, deg(35));
    d.handR = a.hand('world', v3(-0.06 * s, C.y + 0.01 * s, C.z + 0.02 * s), v3(-0.5, -0.8, 0), -0.5, 0.6, deg(35));
  });
  const pull = edit(lock, (d) => {
    d.hips.z -= 0.05 * s;
    d.pelvis.yaw += deg(-25);
    d.chest.yaw += deg(-15);
    d.chest.pitch += deg(4);
    d.handL.pos = add(d.handL.pos, { y: -0.14 * s, z: -0.1 * s, x: -0.08 * s });
    d.handR.pos = add(d.handR.pos, { y: -0.14 * s, z: -0.1 * s, x: -0.08 * s });
  });
  return {
    id: 'clinch-tirage',
    keys: [
      { t: 0, pose: g },
      { t: 0.25, pose: lock, ease: 'inOut' },
      { t: 0.5, pose: pull, ease: 'inOut' },
      { t: 0.65, pose: pull, ease: 'linear' },
      { t: 0.95, pose: g, ease: 'inOut' },
    ],
    chainAt: 0.85,
    impacts: [0.5],
    ...stand,
  };
}

/** Feints: a short, sharp start of a technique that is not thrown. */
function feint(a: Author, kind: 'jab' | 'epaule' | 'lutte'): Motion {
  const g = a.guard();
  const s = a.s;
  const p = edit(g, (d) => {
    if (kind === 'jab') {
      d.chest.yaw += deg(-8);
      d.hips.z += 0.02 * s;
      d.handL.pos = add(d.handL.pos, { z: 0.08 * s });
      if (d.footL.mode === 'ground') d.footL.ball = add(d.footL.ball, { y: 0.015 * s });
    } else if (kind === 'epaule') {
      d.chest.yaw += deg(12);
      d.chest.roll += deg(4);
      d.handR.pos = add(d.handR.pos, { z: 0.04 * s });
    } else {
      d.hips.y -= 0.16 * s;
      d.pelvis.pitch += deg(14);
      d.chest.pitch += deg(18);
      d.handL.pos = add(d.handL.pos, { y: -0.12 * s, z: 0.06 * s });
      d.handR.pos = add(d.handR.pos, { y: -0.1 * s, z: 0.04 * s });
      d.head.pitch += deg(-14);
    }
  });
  const dt = kind === 'lutte' ? 0.18 : 0.1;
  return {
    id: `feinte-${kind}`,
    keys: [
      { t: 0, pose: g },
      { t: dt, pose: p, ease: 'snap' },
      { t: dt * 2.4, pose: g, ease: 'inOut' },
    ],
    chainAt: dt * 2,
    impacts: [],
    ...stand,
  };
}

export function upperMotions(a: Author): Motion[] {
  return [
    elbow(a, 'L', 'horizontal'),
    elbow(a, 'R', 'horizontal'),
    elbow(a, 'R', 'diagonal'),
    elbow(a, 'L', 'diagonal'),
    elbow(a, 'R', 'montant'),
    elbow(a, 'L', 'montant'),
    clinchPull(a),
    feint(a, 'jab'),
    feint(a, 'epaule'),
    feint(a, 'lutte'),
  ];
}
