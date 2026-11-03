import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { probe } from '../../test/probe';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';

/**
 * v0.32 (Youssef, 2026-10-22 09:11 « je valide tout »: the v0.31 method extended to the other priority
 * techniques): uppercuts, middle and high kicks, straight knees, horizontal elbows, measured on both
 * Ultra-réaliste coaches. Orthodox stance: lead side = left, +z = towards the opponent. Report:
 * docs/v032/EXTENSION.md.
 */
const coaches = [
  { id: 'kadir', sex: 'homme', url: 'coaches/mma-kadir/photo.glb' },
  { id: 'amara', sex: 'femme', url: 'coaches/mma-amara/photo.glb' },
] as const;
const N = 160;
const wrap = (d: number) => ((d + 540) % 360) - 180;

describe.each(coaches)('extension v0.32, coach $id', ({ sex, url }) => {
  const scene = loadSkeleton(sex, url);
  const rig = new CoachRig(scene);
  const lib = getLibrary(rig, 'muaythai');
  const P = (n: string) => scene.getObjectByName(n)!.getWorldPosition(new Vector3());
  const run = (id: string, part: 'fist' | 'elbow' | 'knee' | 'foot') => {
    const m = getMotion(lib, id, false)!;
    const s = new MotionSampler(rig, m);
    const side = id.endsWith('arriere') ? 'R' : 'L';
    const fr = Array.from({ length: N + 1 }, (_, i) => {
      const t = (s.duration * i) / N;
      const p = probe(scene, rig, s, t);
      const hl = P('RightUpLeg').sub(P('LeftUpLeg'));
      const sl = P('RightArm').sub(P('LeftArm'));
      const arm = side === 'L' ? p.L : p.R;
      const leg = side === 'L' ? p.fL : p.fR;
      const eff = part === 'fist' ? arm.hand : part === 'elbow' ? arm.elbow : part === 'knee' ? leg.knee : leg.ankle;
      return { t, p, eff: eff.clone(), hip: (Math.atan2(hl.z, hl.x) * 180) / Math.PI, sho: (Math.atan2(sl.z, sl.x) * 180) / Math.PI, toeL: P('LeftToeBase'), toeR: P('RightToeBase') };
    });
    const ii = Math.round((m.impacts[0] / s.duration) * N);
    // from the end of the preparation (dip, wind-up, load) to the impact
    const i1 = Math.round((m.keys[1].t / s.duration) * N);
    const peak = (f: (i: number) => number) => {
      let best = 0;
      let at = 0;
      for (let i = i1 + 1; i <= ii; i++) {
        const v = Math.abs(f(i));
        if (v > best) [best, at] = [v, i];
      }
      return at;
    };
    const chain = {
      hip: peak((i) => wrap(fr[i].hip - fr[i - 1].hip)),
      sho: peak((i) => wrap(fr[i].sho - fr[i - 1].sho)),
      eff: peak((i) => fr[i].eff.distanceTo(fr[i - 1].eff)),
    };
    let hipsMax = 0;
    for (let i = 1; i <= N; i++) hipsMax = Math.max(hipsMax, fr[i].p.hips.distanceTo(fr[i - 1].p.hips) / (s.duration / N));
    return { m, s, fr, ii, chain, hipsMax, impact: probe(scene, rig, s, m.impacts[0]), side };
  };
  /** horizontal travel of the toes while they are under `h` metres */
  const travel = (fr: ReturnType<typeof run>['fr'], k: 'toeL' | 'toeR', h: number) => {
    let d = 0;
    for (let i = 1; i <= N; i++) if (fr[i][k].y < h && fr[i - 1][k].y < h) d += Math.hypot(fr[i][k].x - fr[i - 1][k].x, fr[i][k].z - fr[i - 1][k].z);
    return d;
  };

  test.each(['uppercut-avant', 'uppercut-arriere'])('%s : jambes, hanches, épaules, puis poing [S3]', (id) => {
    const r = run(id, 'fist');
    // before v0.32 the fist was fastest before the hips turned (the arm lifted the body)
    expect(r.chain.hip).toBeLessThanOrEqual(r.chain.sho);
    expect(r.chain.sho).toBeLessThan(r.chain.eff);
    expect(r.chain.eff).toBeGreaterThan(r.ii * 0.75);
    // the legs push up from the dip
    let low = 9;
    for (let i = 0; i <= r.ii; i++) low = Math.min(low, r.fr[i].p.hips.y);
    expect(r.fr[r.ii].p.hips.y - low).toBeGreaterThan(0.04);
    // arm bent, fist rising in front of the chin
    const arm = r.side === 'L' ? r.impact.L : r.impact.R;
    expect(arm.elbowFlex).toBeGreaterThan(70);
    expect(arm.elbowFlex).toBeLessThan(120);
    for (const k of ['toeL', 'toeR'] as const) expect(travel(r.fr, k, 0.015), k).toBeLessThan(0.015);
  });

  test.each(['coude-horizontal-avant', 'coude-horizontal-arriere'])('%s : hanches, épaules, puis coude [S27]', (id) => {
    const r = run(id, 'elbow');
    expect(r.chain.hip).toBeLessThanOrEqual(r.chain.sho);
    expect(r.chain.sho).toBeLessThan(r.chain.eff);
    expect(r.chain.eff).toBeGreaterThan(r.ii * 0.75);
    for (const k of ['toeL', 'toeR'] as const) expect(travel(r.fr, k, 0.015), k).toBeLessThan(0.015);
  });

  test.each(['middle-kick-arriere', 'middle-kick-avant', 'high-kick-arriere', 'high-kick-avant'])('%s : poids transféré sans à-coup, pied qui ne traîne pas', (id) => {
    const r = run(id, 'foot');
    // before v0.32: up to 4.8 m/s of hip speed, with a 4 to 5 cm dip of the hips in one frame at the landing
    expect(r.hipsMax).toBeLessThan(3.5);
    const kick = r.side === 'L' ? 'toeL' : 'toeR';
    const sup = r.side === 'L' ? 'toeR' : 'toeL';
    expect(travel(r.fr, kick, 0.06)).toBeLessThan(0.15);
    expect(travel(r.fr, kick, 0.015)).toBeLessThan(0.03);
    expect(travel(r.fr, sup, 0.015)).toBeLessThan(0.01);
    // the hips turn with the leg, never after it
    expect(r.chain.hip).toBeLessThanOrEqual(r.chain.eff + 1);
  });

  test.each(['genou-direct-arriere', 'genou-direct-avant'])('%s : le pied quitte le sol sans frotter, bras de garde non verrouillé [S35]', (id) => {
    const r = run(id, 'knee');
    const kick = r.side === 'L' ? 'toeL' : 'toeR';
    const sup = r.side === 'L' ? 'toeR' : 'toeL';
    // before v0.32: 20 to 29 cm under 6 cm and 4 to 6 cm of sliding on the floor
    expect(travel(r.fr, kick, 0.06)).toBeLessThan(0.16);
    expect(travel(r.fr, kick, 0.015)).toBeLessThan(0.025);
    expect(travel(r.fr, sup, 0.015)).toBeLessThan(0.01);
    expect(r.hipsMax).toBeLessThan(3.5);
    // the framing arm (kicking side) reaches without locking (2° of flexion before v0.32)
    const arm = r.side === 'L' ? r.impact.L : r.impact.R;
    expect(arm.elbowFlex).toBeGreaterThan(8);
  });
});
