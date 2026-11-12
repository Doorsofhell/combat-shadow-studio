import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkinnedBody } from '../../test/skin';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';
import type { StanceStyle } from '../author';

/**
 * 1.33 (Youssef 11/11: « son cou ne fait pas naturel », option « cou B » choisie sur captures): in guard the trunk
 * leans forward and the neck followed it, so the head stood in front of the shoulders. Now the neck stands nearly
 * upright and the chin tucks a little: the head sits over the shoulders. The shoulders and arms do not move (the
 * Rocketbox clavicles hang from the neck bone), and lying or bent over the neck still follows the trunk.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya'] as const;
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai'];

function pose(id: string, style: StanceStyle, motion: string, at: number, oldNeck: boolean) {
  (globalThis as { __cssOldNeck?: boolean }).__cssOldNeck = oldNeck;
  try {
    const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 3);
    const rig = new CoachRig(body.root);
    rig.reset();
    const m = getMotion(getLibrary(rig, style), motion, false)!;
    const s = new MotionSampler(rig, m);
    rig.apply(s.sample(at));
    body.root.updateMatrixWorld(true);
    const p = (n: string) => body.bones.find((b) => b.name === n)!.getWorldPosition(new Vector3());
    const unit = p('Head').y > 10 ? 100 : 1;
    const sh = p('LeftArm').add(p('RightArm')).multiplyScalar(0.5 / unit);
    const neck = p('Neck').divideScalar(unit);
    const head = p('Head').divideScalar(unit);
    // the neck's lean from the vertical, degrees
    const lean = (Math.acos(Math.min(1, (head.y - neck.y) / head.distanceTo(neck))) * 180) / Math.PI;
    return { sh, head, lean, arms: [p('LeftArm'), p('RightArm'), p('LeftHand'), p('RightHand')].map((v) => v.divideScalar(unit)) };
  } finally {
    delete (globalThis as { __cssOldNeck?: boolean }).__cssOldNeck;
  }
}

describe('1.33 cou : tête au-dessus des épaules en garde', () => {
  for (const id of COACHES)
    for (const style of STYLES)
      test(`${id} ${style} : cou plus droit, épaules et mains inchangées`, () => {
        const before = pose(id, style, 'garde', 0, true);
        const after = pose(id, style, 'garde', 0, false);
        // the neck leans clearly less than before; in the tall muay-thaï guard (trunk nearly upright) it was already
        // near the vertical and stays there
        if (style === 'muaythai') expect(after.lean, 'inclinaison du cou').toBeLessThan(Math.max(before.lean + 3, 20));
        else expect(after.lean, 'inclinaison du cou').toBeLessThan(before.lean - 5);
        // the head comes back over the shoulders (horizontal distance between the head and the shoulders' middle)
        const flat = (v: Vector3) => new Vector3(v.x, 0, v.z);
        const gap = (r: typeof before) => flat(r.head).distanceTo(flat(r.sh));
        expect(gap(after), 'tête devant les épaules').toBeLessThan(gap(before) + (style === 'muaythai' ? 0.01 : 0));
        // shoulders and hands: the guard is the same (under 2 mm)
        after.arms.forEach((v, i) => expect(v.distanceTo(before.arms[i]), `bras ${i}`).toBeLessThan(0.002));
      });

  test('au sol, le cou suit le tronc comme avant', () => {
    for (const id of ['mma-kadir', 'mma-amara'])
      for (const [motion, at] of [['retention-garde', 1.0], ['sit-out', 1.4]] as const) {
        const before = pose(id, 'mma', motion, at, true);
        const after = pose(id, 'mma', motion, at, false);
        if (before.lean < 55) continue;
        expect(after.head.distanceTo(before.head), `${id} ${motion}`).toBeLessThan(0.005);
      }
  });
});
