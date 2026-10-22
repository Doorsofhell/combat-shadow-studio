import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { probe } from '../../test/probe';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';

/**
 * v0.31 (Youssef, 2026-10-22, « CORRECTION MAJEURE DU MOTEUR 3D », parties III et V): the 5 prototype
 * techniques (jab, rear straight, lead hook, low kick, teep) measured on both Ultra-réaliste coaches.
 * Orthodox stance: lead side = left, +z = towards the opponent. Report: docs/v031/MOTEUR_3D.md.
 */
const coaches = [
  { id: 'kadir', sex: 'homme', url: 'coaches/mma-kadir/photo.glb' },
  { id: 'amara', sex: 'femme', url: 'coaches/mma-amara/photo.glb' },
] as const;
const N = 120;
const wrap = (d: number) => ((d + 540) % 360) - 180;

describe.each(coaches)('prototypes v0.31, coach $id', ({ sex, url }) => {
  const scene = loadSkeleton(sex, url);
  const rig = new CoachRig(scene);
  const lib = getLibrary(rig, 'muaythai');
  const P = (n: string) => scene.getObjectByName(n)!.getWorldPosition(new Vector3());
  const run = (id: string) => {
    const m = getMotion(lib, id, false)!;
    const s = new MotionSampler(rig, m);
    const fr = Array.from({ length: N + 1 }, (_, i) => {
      const t = (s.duration * i) / N;
      const p = probe(scene, rig, s, t);
      const hl = P('RightUpLeg').sub(P('LeftUpLeg'));
      const sl = P('RightArm').sub(P('LeftArm'));
      return { t, p, hip: (Math.atan2(hl.z, hl.x) * 180) / Math.PI, sho: (Math.atan2(sl.z, sl.x) * 180) / Math.PI, toeL: P('LeftToeBase'), toeR: P('RightToeBase') };
    });
    const ii = Math.round((m.impacts[0] / s.duration) * N);
    return { m, s, fr, ii, impact: probe(scene, rig, s, m.impacts[0]) };
  };
  /** moment (index) of the top speed of a measure before the impact */
  const peak = (fr: ReturnType<typeof run>['fr'], ii: number, f: (i: number) => number) => {
    let best = 0;
    let at = 0;
    for (let i = 1; i <= ii; i++) {
      const v = Math.abs(f(i));
      if (v > best) [best, at] = [v, i];
    }
    return at;
  };
  /** horizontal travel of the toes while they touch the floor, or while they are under `h` metres */
  const travel = (fr: ReturnType<typeof run>['fr'], k: 'toeL' | 'toeR', h: number) => {
    let d = 0;
    for (let i = 1; i <= N; i++) if (fr[i][k].y < h && fr[i - 1][k].y < h) d += Math.hypot(fr[i][k].x - fr[i - 1][k].x, fr[i][k].z - fr[i - 1][k].z);
    return d;
  };

  test.each(['jab', 'direct'])('%s : coude ni verrouillé ni replié à l’impact [S8]', (id) => {
    const { L, R } = run(id).impact;
    const flex = id === 'jab' ? L.elbowFlex : R.elbowFlex;
    expect(flex).toBeGreaterThan(8);
    expect(flex).toBeLessThan(35);
  });

  test.each(['jab', 'direct'])('%s : chaîne cinétique hanches → épaules → poing [S3, S8]', (id) => {
    const { fr, ii } = run(id);
    const hand = id === 'jab' ? 'L' : 'R';
    const hip = peak(fr, ii, (i) => wrap(fr[i].hip - fr[i - 1].hip));
    const sho = peak(fr, ii, (i) => wrap(fr[i].sho - fr[i - 1].sho));
    const fist = peak(fr, ii, (i) => fr[i].p[hand].hand.distanceTo(fr[i - 1].p[hand].hand));
    expect(hip).toBeLessThanOrEqual(sho);
    expect(sho).toBeLessThanOrEqual(fist);
    // the fist is fastest in the last third before the impact, not at the start of the punch
    expect(fist).toBeGreaterThan(ii * 0.66);
  });

  test('low kick : le pied quitte le sol et s’y repose sans frotter', () => {
    const { fr } = run('low-kick-arriere');
    // before v0.31: the toes skimmed under 6 cm for 38 to 42 cm on the way out and back
    expect(travel(fr, 'toeR', 0.06)).toBeLessThan(0.2);
    expect(travel(fr, 'toeR', 0.015)).toBeLessThan(0.03);
    // the support foot turns on its ball without moving
    expect(travel(fr, 'toeL', 0.015)).toBeLessThan(0.01);
  });

  test.each(['jab', 'direct', 'crochet-avant', 'teep-avant'])('%s : aucun appui ne glisse', (id) => {
    const { fr } = run(id);
    const kick = id === 'teep-avant' ? 'toeL' : null;
    for (const k of ['toeL', 'toeR'] as const) if (k !== kick) expect(travel(fr, k, 0.015), k).toBeLessThan(0.015);
  });
});
