import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { ComboPlayer } from '../player';
import { getLibrary } from '../library';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { setV230FromQuery } from '../v230';

/**
 * v2.3.0 Lot 2 (performance et stabilité, Youssef 2026-11-19 « stabilité après plusieurs minutes », « éviter les
 * allocations inutiles à chaque image »): each coach plays a long training sequence (punches, kicks, knees, guard
 * between them) for 3 minutes of animation at 60 images per second, engine of 2.3.0. Nothing may become NaN, the coach
 * may not drift away, and the cost of one image (player + rig) is measured with the 2.3.0 changes on and off.
 * PERF_V230=1 writes the timings to docs/v230/PERF.json (CPU of this machine, Node: only the ratio counts).
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['victor', 'homme'],
  ['inaya', 'femme'],
  ['kanya', 'femme'],
] as const;
const SEQ = ['jab', 'direct', 'crochet-avant', 'uppercut-arriere', 'high-kick-avant', 'middle-kick-arriere', 'genou-direct-arriere', 'overhand', 'low-kick-arriere', 'teep-avant'];
const DT = 1 / 60;

function run(id: string, sex: 'homme' | 'femme', seconds: number) {
  const rig = new CoachRig(loadSkeleton(sex, `coaches/${id}/photo.glb`));
  const lib = getLibrary(rig, 'muaythai', { id, offsets: COACH_STANCES[id] });
  let reps = 0;
  const p = new ComboPlayer(rig, lib, false, { onRep: () => reps++ });
  p.setSequence(SEQ.map((m) => ({ techniqueId: m, motionId: m })), 0);
  p.play();
  let finite = true;
  let drift = 0;
  const t0 = performance.now();
  for (let f = 0; f * DT < seconds; f++) {
    const pose = p.update(DT);
    rig.apply(pose);
    if (!Number.isFinite(pose.hips.x + pose.hips.y + pose.hips.z)) finite = false;
    drift = Math.max(drift, Math.hypot(pose.hips.x, pose.hips.z));
  }
  const ms = (performance.now() - t0) / (seconds / DT);
  return { finite, drift, msPerImage: ms, reps };
}

describe('v2.3.0 : stabilité sur plusieurs minutes et coût par image', () => {
  const perf: Record<string, unknown> = {};
  afterAll(() => {
    if (process.env.PERF_V230) writeFileSync(resolve(process.cwd(), 'docs/v230/PERF.json'), JSON.stringify(perf, null, 1));
  });
  for (const [id, sex] of COACHES) {
    test(`${id} : 3 minutes d’entraînement sans valeur invalide ni dérive`, { timeout: 300_000 }, () => {
      const r = run(id, sex, 180);
      expect(r.finite).toBe(true);
      // the techniques step forward and come back: the coach stays on its spot
      expect(r.drift).toBeLessThan(1);
      // the sequence kept running (repeated, with the guard in between)
      expect(r.reps).toBeGreaterThan(10);
      if (process.env.PERF_V230) {
        // alternated runs, flags on and off, the same work: the ratio of the costs
        const on: number[] = [];
        const off: number[] = [];
        for (let i = 0; i < 3; i++) {
          setV230FromQuery('0');
          off.push(run(id, sex, 30).msPerImage);
          setV230FromQuery(null);
          on.push(run(id, sex, 30).msPerImage);
        }
        const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[1];
        perf[id] = { msParImage_avant: +med(off).toFixed(4), msParImage_apres: +med(on).toFixed(4), rapport: +(med(on) / med(off)).toFixed(3), derive_m: +r.drift.toFixed(3), repetitions_3min: r.reps, msParImage_3min: +r.msPerImage.toFixed(4) };
      }
    });
  }
});
