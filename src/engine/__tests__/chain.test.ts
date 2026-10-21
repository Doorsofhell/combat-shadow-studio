import { describe, expect, test } from 'vitest';
import { Quaternion } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';
import { ComboPlayer } from '../player';

/**
 * v0.29 (Youssef, 2026-10-21: « il y a rien de naturel »): the body moves as a chain, the hips before the
 * shoulders, and the guard lives instead of repeating the same bounce.
 */
const rig = new CoachRig(loadSkeleton('homme'));
const lib = getLibrary(rig, 'boxing');
const yaw = (q: Quaternion) => 2 * Math.atan2(q.y, q.w);

describe('mouvement en chaîne', () => {
  const m = getMotion(lib, 'direct', false)!;
  const chain = new MotionSampler(rig, m);
  const block = new MotionSampler(rig, m, true, false);
  // time at which a turn has done half of its way to the impact
  const half = (s: MotionSampler, read: (p: ReturnType<MotionSampler['sample']>) => number) => {
    const t1 = m.impacts[0];
    const a = read(s.sample(0));
    const b = read(s.sample(t1));
    for (let t = 0; t <= t1; t += 0.002) if (Math.abs(read(s.sample(t)) - a) >= Math.abs(b - a) / 2) return t;
    return t1;
  };
  const pelvis = (p: ReturnType<MotionSampler['sample']>) => yaw(p.pelvis);
  const shoulders = (p: ReturnType<MotionSampler['sample']>) => yaw(p.pelvis.clone().multiply(p.chest));

  test('direct : la hanche tourne avant les épaules', () => {
    expect(half(chain, pelvis)).toBeLessThan(half(chain, shoulders) - 0.015);
    // written timing (a block): both turn together
    expect(Math.abs(half(block, pelvis) - half(block, shoulders))).toBeLessThan(0.01);
  });

  test('le poing garde son trajet et l’impact reste à l’heure', () => {
    for (const t of [0, 0.05, 0.1, m.impacts[0], 0.3]) expect(chain.sample(t).handR.pos.distanceTo(block.sample(t).handR.pos)).toBeLessThan(1e-6);
  });

  test('début et fin identiques à la pose écrite (enchaînements)', () => {
    for (const t of [0, chain.duration]) {
      const a = chain.sample(t);
      const b = block.sample(t);
      expect(a.hips.distanceTo(b.hips)).toBeLessThan(1e-6);
      expect(a.pelvis.angleTo(b.pelvis)).toBeLessThan(1e-6);
    }
  });
});

describe('garde vivante', () => {
  test('le poids, le buste et les gants bougent sans se répéter, les pieds restent posés', () => {
    const p = new ComboPlayer(rig, lib, false);
    p.play();
    const poses = Array.from({ length: 5 }, () => {
      let last = p.update(0);
      for (let i = 0; i < 54; i++) last = p.update(1 / 60); // one loop of the breathing (0.9 s)
      return last;
    });
    // same moment of the breathing loop, different weight and gloves
    const hx = poses.map((q) => q.hips.x);
    expect(Math.max(...hx) - Math.min(...hx)).toBeGreaterThan(0.004);
    expect(Math.max(...hx) - Math.min(...hx)).toBeLessThan(0.03);
    const gl = poses.map((q) => q.handL.pos.y);
    expect(Math.max(...gl) - Math.min(...gl)).toBeGreaterThan(0.002);
    for (const q of poses) {
      expect(q.footL.ankle.distanceTo(poses[0].footL.ankle)).toBeLessThan(1e-6);
      expect(q.footR.ankle.distanceTo(poses[0].footR.ankle)).toBeLessThan(1e-6);
    }
  });
});
