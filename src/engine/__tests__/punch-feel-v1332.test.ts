import { describe, expect, test } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, punchAccents, type Motion } from '../motion';
import type { StanceStyle } from '../author';

const D = Math.PI / 180;
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai'];
const PUNCHES = ['jab', 'direct', 'crochet-avant', 'crochet-arriere', 'crochet-avant-corps', 'crochet-arriere-corps', 'uppercut-avant', 'uppercut-arriere', 'overhand'] as const;

function compare(rig: CoachRig, motion: Motion) {
  const enhanced = new MotionSampler(rig, motion);
  const baseline = new MotionSampler(rig, { ...motion, punchFeel: false });
  const impact = motion.impacts[0];
  const end = motion.chainAt ?? enhanced.duration;
  const leadAt = impact - 2.5 / 60;
  const recoilAt = impact + 0.035 + (end - impact - 0.035) * 0.7;
  const a = enhanced.sample(leadAt);
  const b = baseline.sample(leadAt);
  const forward = a.pelvis.clone().multiply(a.chest);
  const oldForward = b.pelvis.clone().multiply(b.chest);
  const yawDelta = a.pelvis.clone().multiply(b.pelvis.clone().invert());
  const direction = Math.sign(motion.keys.find((k) => k.t >= impact)!.pose.pelvis.yaw - motion.keys[0].pose.pelvis.yaw);
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), (direction || 1) * 2.5 * D);
  expect(yawDelta.angleTo(q), '2,5° de rotation anticipée dans le bon sens').toBeLessThan(1e-5);
  expect(forward.angleTo(oldForward), 'la poitrine garde sa cible').toBeLessThan(1e-5);
  expect(a.footL.ankle.distanceTo(b.footL.ankle), 'appui gauche inchangé').toBeLessThan(1e-8);
  expect(a.footR.ankle.distanceTo(b.footR.ankle), 'appui droit inchangé').toBeLessThan(1e-8);

  const rec = enhanced.sample(recoilAt);
  const rec0 = baseline.sample(recoilAt);
  expect(rec.hips.z - rec0.hips.z, 'recul léger').toBeCloseTo(-0.008 * rig.metrics.height / 1.8, 5);
  expect(rec.pelvis.clone().multiply(rec.chest).angleTo(rec0.pelvis.clone().multiply(rec0.chest)), 'recul sans à-coup des épaules').toBeLessThan(1e-5);
  for (const t of [0, impact, end, enhanced.duration]) {
    const x = enhanced.sample(t);
    const y = baseline.sample(t);
    expect(x.pelvis.angleTo(y.pelvis), `bassin inchangé à t=${t}`).toBeLessThan(1e-6);
    expect(x.chest.angleTo(y.chest), `buste inchangé à t=${t}`).toBeLessThan(1e-6);
    expect(x.hips.distanceTo(y.hips), `hanches inchangées à t=${t}`).toBeLessThan(1e-7);
    expect(x.handL.pos.distanceTo(y.handL.pos), `main gauche inchangée à t=${t}`).toBeLessThan(1e-7);
    expect(x.handR.pos.distanceTo(y.handR.pos), `main droite inchangée à t=${t}`).toBeLessThan(1e-7);
  }
}

describe('1.33.2 : anticipation du bassin et recul après frappe', () => {
  test('enveloppes continues : pas de saut à l’impact et au fondu', () => {
    const imp = 0.23;
    const chain = 0.37;
    const peak = imp - 2.5 / 60;
    const p = punchAccents(peak, imp, chain);
    expect(p.lead).toBeCloseTo(1, 6);
    expect(p.recoil).toBe(0);
    expect(punchAccents(imp, imp, chain).lead).toBe(0);
    expect(punchAccents(chain, imp, chain).recoil).toBe(0);
    expect(punchAccents(imp - 1e-5, imp, chain).lead).toBeLessThan(1e-5);
    expect(punchAccents(chain - 1e-5, imp, chain).recoil).toBeLessThan(1e-5);
  });

  const rig = new CoachRig(loadSkeleton('homme'));
  for (const style of STYLES) {
    const lib = getLibrary(rig, style);
    for (const id of PUNCHES) {
      test(`${style} ${id} : impact préservé, bassin en avance, pieds fixes`, () => {
        const m = getMotion(lib, id, false);
        expect(m?.punchFeel).toBe(true);
        compare(rig, m!);
      });
      test(`${style} ${id} en garde gauchère : anticipation inversée`, () => {
        const m = getMotion(lib, id, true);
        expect(m?.punchFeel).toBe(true);
        compare(rig, m!);
      });
    }
    test(`${style} : garde, esquive et techniques sans frappe non modifiées`, () => {
      for (const id of ['garde', 'esquive-gauche']) {
        const m = getMotion(lib, id, false)!;
        expect(m.punchFeel).toBeUndefined();
      }
    });
  }
});
