import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig, ELBOW_MAX_FLEX } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { getBiomecaLibrary } from '../biomeca';

describe('moteur biomécanique expérimental (isolé)', () => {
  test.each(['homme', 'femme'] as const)('%s : la bibliothèque historique ne change pas', (sex) => {
    const rig = new CoachRig(loadSkeleton(sex));
    const classic = getLibrary(rig, 'muaythai');
    const snapshot = JSON.stringify(classic.get('coude-diagonal-avant'));
    const candidate = getBiomecaLibrary(rig, classic);

    expect(candidate).not.toBe(classic);
    expect(getBiomecaLibrary(rig, classic)).toBe(candidate);
    expect(JSON.stringify(classic.get('coude-diagonal-avant'))).toBe(snapshot);
    expect(candidate.get('coude-diagonal-avant')).not.toBe(classic.get('coude-diagonal-avant'));
    expect(candidate.get('jab')).toBe(classic.get('jab'));
    expect(candidate.get('coude-horizontal-avant')).toBe(classic.get('coude-horizontal-avant'));

    for (const id of ['coude-diagonal-avant', 'coude-diagonal-arriere']) {
      const original = classic.get(id)!;
      const preview = candidate.get(id)!;
      expect(preview.keys.map((key) => key.t)).toEqual(original.keys.map((key) => key.t));
      expect(preview.impacts).toEqual(original.impacts);
      expect(preview.chainAt).toBe(original.chainAt);
      expect(preview.keys[0].pose).toEqual(original.keys[0].pose);
      expect(preview.keys[preview.keys.length - 1].pose).toEqual(original.keys[original.keys.length - 1].pose);
      // Only the strike-arm path changes: feet and body timing remain identical.
      for (let i = 0; i < original.keys.length; i++) {
        expect(preview.keys[i].pose.footL).toEqual(original.keys[i].pose.footL);
        expect(preview.keys[i].pose.footR).toEqual(original.keys[i].pose.footR);
        expect(preview.keys[i].pose.pelvis).toEqual(original.keys[i].pose.pelvis);
      }
      const strikeHand = id.endsWith('avant') ? 'handL' : 'handR';
      expect(preview.keys[1].pose[strikeHand].pos.y).toBeLessThan(original.keys[1].pose[strikeHand].pos.y);
    }
  });

  test.each(['homme', 'femme'] as const)('%s : coude diagonal droit/gauche et garde gaucher sans torsion numérique', (sex) => {
    const rig = new CoachRig(loadSkeleton(sex));
    const lib = getBiomecaLibrary(rig, getLibrary(rig, 'muaythai'));
    for (const id of ['coude-diagonal-avant', 'coude-diagonal-arriere']) {
      for (const southpaw of [false, true]) {
        const motion = getMotion(lib, id, southpaw)!;
        const sampler = new MotionSampler(rig, motion);
        for (let i = 0; i <= 24; i++) {
          rig.apply(sampler.sample(duration(motion) * i / 24));
          for (const side of ['Left', 'Right']) {
            const a = rig.worldOf(`${side}Arm`)!;
            const b = rig.worldOf(`${side}ForeArm`)!;
            const c = rig.worldOf(`${side}Hand`)!;
            const flex = b.clone().sub(a).angleTo(c.clone().sub(b));
            expect(Number.isFinite(flex), `${sex} ${id} ${side} t${i}`).toBe(true);
            expect(flex).toBeLessThanOrEqual(ELBOW_MAX_FLEX + 0.02);
          }
        }
      }
    }
  });
});
