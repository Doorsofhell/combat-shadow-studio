import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import type { StanceStyle } from '../author';
import type { Motion } from '../motion';
import { V230 } from '../v230';
import { hookSummary, sampleHook } from '../../test/hooks';

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

/**
 * 2.10.2 (V230.hookDirect): the hooks no longer have the « drive » key (the fist swept round with the trunk, path up to
 * 2.8 times the straight line, hooks-biomeca « pas d'armé » and fluidity.test failing since 1.33.1). Their pelvis
 * lead is then checked where it is seen, on the posed body: the pelvis reaches its fastest turn before the shoulders,
 * and halfway from the preparation to the impact it has done a larger share of its turn than the shoulders.
 */
function verifyHookLead(rig: CoachRig, m: Motion, snapped: boolean, southpaw: boolean, id: string) {
  const [start, load, impact] = m.keys;
  expect(m.keys.length).toBe(snapped ? 4 : 5);
  expect(start.t).toBe(0);
  expect(load.t).toBeLessThan(impact.t);
  expect(impact.t).toBe(m.impacts[0]);
  expect(m.keys[m.keys.length - 1].pose).toEqual(start.pose);
  const side = id.startsWith('crochet-avant') !== southpaw ? 'L' : 'R';
  const f = sampleHook(rig, m, side);
  const s = hookSummary(f, m.impacts[0]);
  expect(s.timing.pelvis).toBeLessThanOrEqual(s.timing.chest + 1e-6);
  const at = (t: number) => f.reduce((b, x) => (Math.abs(x.t - t) < Math.abs(b.t - t) ? x : b));
  const [f0, fm, f1] = [at(load.t), at((load.t + impact.t) / 2), at(impact.t)];
  const share = (g: (x: (typeof f)[number]) => number) => (g(fm) - g(f0)) / (g(f1) - g(f0));
  expect(share((x) => x.pelvisYaw)).toBeGreaterThan(share((x) => x.chestYaw));
}

function verifyLead(m: Motion, isUppercut: boolean, snapped: boolean) {
  // Hook: guard, wind, hip drive, impact, hold, guard.
  // Uppercut: guard, dip, hip drive, impact, hold, guard.
  // 2.3.0 (V230.snap, library/index.ts snapImpactHold): the hold is removed, the return starts at the impact:
  // guard, wind or dip, hip drive, impact, guard. Both forms are checked (the hold must be there without snap).
  const [start, load, drive, impact] = m.keys;
  const guard = m.keys[snapped ? 4 : 5];
  expect(m.keys.length).toBe(snapped ? 5 : 6);
  expect(start.t).toBe(0);
  expect(load.t).toBeLessThan(drive.t);
  expect(drive.t).toBeLessThan(impact.t);
  expect(impact.t).toBe(m.impacts[0]);
  if (!snapped) expect(m.keys[4].pose).toEqual(impact.pose);
  expect(guard.pose).toEqual(start.pose);
  const pelvis = phase(load.pose.pelvis.yaw, drive.pose.pelvis.yaw, impact.pose.pelvis.yaw);
  const chest = phase(load.pose.chest.yaw, drive.pose.chest.yaw, impact.pose.chest.yaw);
  expect(pelvis).toBeCloseTo(isUppercut ? 0.78 : 0.72, 5);
  expect(chest).toBeCloseTo(0.26, 5);
  expect(pelvis).toBeGreaterThan(chest + 0.4);
}

describe('v1.33.1 — bassin en avance sur le buste', () => {
  const rig = new CoachRig(loadSkeleton('homme'));
  // with the 2.3.0 snap (default) and without it (the motions as authored, hold included)
  for (const snap of [true, false]) {
    const tag = snap ? '' : ' (sans snap 2.3.0)';
    const libOf = (style: StanceStyle) => {
      const was = V230.snap;
      V230.snap = snap;
      try {
        return getLibrary(rig, style);
      } finally {
        V230.snap = was;
      }
    };
    for (const style of STYLES) {
      for (const id of STRIKES) {
        const snapped = snap && !id.endsWith('-corps');
        const check = (m: Motion, southpaw: boolean) =>
          id.startsWith('crochet') && V230.hookDirect ? verifyHookLead(rig, m, snapped, southpaw, id) : verifyLead(m, id.startsWith('uppercut'), snapped);
        test(`${style} ${id} : rotation du bassin avant celle des épaules${tag}`, () => {
          const m = getMotion(libOf(style), id, false);
          expect(m).toBeDefined();
          check(m!, false);
        });
        test(`${style} ${id} : même timing en garde gauchère${tag}`, () => {
          const m = getMotion(libOf(style), id, true);
          expect(m).toBeDefined();
          check(m!, true);
        });
      }
    }
  }
});
