import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import type { StanceStyle } from '../author';
import type { Motion } from '../motion';

/**
 * v1.33.1: the authored pelvis turns before the thorax, then both reach the
 * original impact key. This timing belongs to the motion, not the IK solver.
 */
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai'];
const STRIKES = [
  'crochet-avant',
  'crochet-arriere',
  'crochet-avant-corps',
  'crochet-arriere-corps',
  'uppercut-avant',
  'uppercut-arriere',
];

function phase(from: number, drive: number, impact: number): number {
  const span = impact - from;
  expect(Math.abs(span)).toBeGreaterThan(1e-5);
  return (drive - from) / span;
}

function verifyLead(m: Motion, isUppercut: boolean) {
  // Hook: guard, wind, hip drive, impact, hold, guard.
  // Uppercut: guard, dip, hip drive, impact, hold, guard.
  const [start, load, drive, impact, hold, guard] = m.keys;
  expect(start.t).toBe(0);
  expect(load.t).toBeLessThan(drive.t);
  expect(drive.t).toBeLessThan(impact.t);
  expect(impact.t).toBe(m.impacts[0]);
  expect(hold.pose).toEqual(impact.pose);
  expect(guard.pose).toEqual(start.pose);
  const pelvis = phase(load.pose.pelvis.yaw, drive.pose.pelvis.yaw, impact.pose.pelvis.yaw);
  const chest = phase(load.pose.chest.yaw, drive.pose.chest.yaw, impact.pose.chest.yaw);
  expect(pelvis).toBeCloseTo(isUppercut ? 0.78 : 0.72, 5);
  expect(chest).toBeCloseTo(0.26, 5);
  expect(pelvis).toBeGreaterThan(chest + 0.4);
}

describe('v1.33.1 — bassin en avance sur le buste', () => {
  const rig = new CoachRig(loadSkeleton('homme'));
  for (const style of STYLES) {
    const lib = getLibrary(rig, style);
    for (const id of STRIKES) {
      test(`${style} ${id} : rotation du bassin avant celle des épaules`, () => {
        const m = getMotion(lib, id, false);
        expect(m).toBeDefined();
        verifyLead(m!, id.startsWith('uppercut'));
      });
      test(`${style} ${id} : même timing en garde gauchère`, () => {
        const m = getMotion(lib, id, true);
        expect(m).toBeDefined();
        verifyLead(m!, id.startsWith('uppercut'));
      });
    }
  }
});
