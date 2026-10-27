/**
 * Static integrity checks of authored motions, ported from CME-3D (src/lab/biomechanicsAudit.ts).
 * They read the key poses only (no rig, no camera) and never change a motion: errors are authoring
 * mistakes (a key out of order, a non-finite value, a planted foot under the floor), warnings are
 * places to review (fast or abrupt hips, a planted ball that moves between two keys).
 */
import type { Motion } from './motion';
import type { Pose, V3 } from './pose';

export type IntegrityLevel = 'error' | 'warning';
export interface IntegrityFinding {
  motionId: string;
  keyIndex: number;
  code: string;
  level: IntegrityLevel;
  detail: string;
}

/** a planted ball deeper than this under the floor is an authoring error (m) */
export const MAX_GROUND_PENETRATION = 0.005;

const finite = (v: number) => Number.isFinite(v);
const xyz = (v: V3) => finite(v.x) && finite(v.y) && finite(v.z);
const dist = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** central-difference acceleration between three samples (Infinity when the samples are unusable) */
export function acceleration(a: number, b: number, c: number, dt0: number, dt1: number): number {
  if (![a, b, c, dt0, dt1].every(finite) || dt0 <= 0 || dt1 <= 0) return Infinity;
  return Math.abs((c - b) / dt1 - (b - a) / dt0) / ((dt0 + dt1) / 2);
}

export function checkMotion(m: Motion): IntegrityFinding[] {
  const out: IntegrityFinding[] = [];
  const add = (keyIndex: number, code: string, level: IntegrityLevel, detail: string) => out.push({ motionId: m.id, keyIndex, code, level, detail });
  if (m.keys.length < 2) {
    add(-1, 'KEY_COUNT', 'error', 'a motion needs at least two key poses');
    return out;
  }
  let previous = -Infinity;
  for (let i = 0; i < m.keys.length; i++) {
    const k = m.keys[i];
    const p: Pose = k.pose;
    if (!finite(k.t) || k.t < 0 || k.t <= previous) add(i, 'TIME_ORDER', 'error', `key time ${k.t} after ${previous}`);
    if (i === 0 && k.t !== 0) add(i, 'TIME_ORIGIN', 'error', 'the first key must start at 0');
    if (!xyz(p.hips)) add(i, 'HIPS_NONFINITE', 'error', 'hips');
    for (const name of ['pelvis', 'chest', 'head'] as const) {
      const r = p[name];
      if (![r.yaw, r.pitch, r.roll].every(finite)) add(i, 'ROT_NONFINITE', 'error', name);
    }
    for (const name of ['handL', 'handR'] as const) {
      const h = p[name];
      if (!xyz(h.pos) || !xyz(h.pole) || ![h.pron, h.fist, h.wrist ?? 0].every(finite)) add(i, 'HAND_NONFINITE', 'error', name);
      if (h.fist < 0 || h.fist > 1) add(i, 'FIST_RANGE', 'error', `${name}: ${h.fist}`);
    }
    for (const name of ['footL', 'footR'] as const) {
      const f = p[name];
      if (f.mode === 'ground') {
        if (!xyz(f.ball) || !finite(f.yaw) || !finite(f.heel)) add(i, 'FOOT_NONFINITE', 'error', name);
        if (f.ball.y < -MAX_GROUND_PENETRATION) add(i, 'GROUND_PENETRATION', 'error', `${name}: ball ${(f.ball.y * 100).toFixed(1)} cm under the floor`);
      } else if (!xyz(f.ankle) || !xyz(f.pole) || ![f.yaw, f.pitch, f.roll].every(finite)) add(i, 'FOOT_NONFINITE', 'error', name);
    }
    if (i > 0) {
      const before = m.keys[i - 1];
      const dt = k.t - before.t;
      if (dt > 0 && dt < 0.025) add(i, 'KEY_INTERVAL', 'warning', 'less than 25 ms between two keys');
      if (dt > 0 && dist(p.hips, before.pose.hips) / dt > 4) add(i, 'HIP_SPEED', 'warning', 'hips faster than 4 m/s');
      for (const side of ['footL', 'footR'] as const) {
        const now = p[side];
        const prior = before.pose[side];
        if (now.mode === 'ground' && prior.mode === 'ground' && dt > 0) {
          const d = Math.hypot(now.ball.x - prior.ball.x, now.ball.z - prior.ball.z);
          if (d > 0.025) add(i, 'PLANTED_FOOT_MOVE', 'warning', `${side}: planted ball moved ${(d * 100).toFixed(1)} cm (step or pivot?)`);
        }
      }
    }
    if (i > 0 && i < m.keys.length - 1 && !k.hold) {
      const a = m.keys[i - 1];
      const b = m.keys[i + 1];
      const dt0 = k.t - a.t;
      const dt1 = b.t - k.t;
      if (dt0 > 0.025 && dt1 > 0.025) {
        const acc = Math.hypot(
          acceleration(a.pose.hips.x, p.hips.x, b.pose.hips.x, dt0, dt1),
          acceleration(a.pose.hips.y, p.hips.y, b.pose.hips.y, dt0, dt1),
          acceleration(a.pose.hips.z, p.hips.z, b.pose.hips.z, dt0, dt1),
        );
        if (acc > 45) add(i, 'HIP_ACCELERATION', 'warning', `abrupt change of hip speed (${acc.toFixed(0)} m/s²)`);
      }
    }
    previous = k.t;
  }
  const end = m.keys[m.keys.length - 1].t;
  for (const t of m.impacts) if (!finite(t) || t < 0 || t > end) add(-1, 'IMPACT_TIME', 'error', `impact at ${t} outside 0–${end}`);
  return out;
}

export function checkLibrary(motions: Iterable<Motion>): IntegrityFinding[] {
  const out: IntegrityFinding[] = [];
  for (const m of motions) out.push(...checkMotion(m));
  return out;
}
