import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig, type Side } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { getLibrary } from '../library';
import { ComboPlayer } from '../player';
import { measureTorsions } from '../../test/torsions';

/**
 * v0.42 (Youssef, 2026-10-23, « Correction biomécanique des crochets 3D », §7): the hooks inside combinations, as the
 * training screen plays them (ComboPlayer: overlapping blends, no return to a neutral pose between blows), at slow,
 * normal and fast speed, on Kadir and Amara (Ultra-réaliste) in both guards. Between two techniques no arm may twist
 * (shoulder near its rotation limit, elbow far behind the shoulders, bend plane flipping) and no hand may jump.
 * Measured while a hook plays and during the blends into and out of it; the other techniques of the combinations
 * (jab, direct, uppercut, slip) are measured by their own tests (torsion-range, photo-coach).
 */
const SEQUENCES: [string, string[]][] = [
  ['Jab → Direct → Crochet avant', ['jab', 'direct', 'crochet-avant']],
  ['Jab → Direct → Crochet arrière', ['jab', 'direct', 'crochet-arriere']],
  ['Crochet avant → Crochet arrière', ['crochet-avant', 'crochet-arriere']],
  ['Double crochet avant', ['crochet-avant', 'crochet-avant']],
  ['Crochet → Esquive → Crochet', ['crochet-avant', 'esquive-droite', 'crochet-arriere']],
  ['Crochet au corps → Crochet à la tête', ['crochet-avant-corps', 'crochet-avant']],
  ['Crochet → Uppercut', ['crochet-avant', 'uppercut-arriere']],
  ['Crochet → Retour en garde', ['crochet-arriere']],
];
const SPEEDS = [0.5, 1, 1.5];
const BODIES = [
  { id: 'Kadir', sex: 'homme', file: 'coaches/mma-kadir/photo.glb', profile: 'mma-kadir' },
  { id: 'Amara', sex: 'femme', file: 'coaches/mma-amara/photo.glb', profile: 'mma-amara' },
] as const;
const DT = 1 / 120;
const D = 180 / Math.PI;

interface Worst {
  ext: number;
  behind: number;
  plane: number;
  handSpeed: number;
  reps: number;
}

function play(rig: CoachRig, lib: ReturnType<typeof getLibrary>, steps: string[], speed: number, southpaw: boolean): Worst {
  let reps = 0;
  const p = new ComboPlayer(rig, lib, southpaw, { onRep: () => reps++ });
  p.setSequence(
    steps.map((s) => ({ techniqueId: s, motionId: s })),
    0.6,
  );
  p.speed = speed;
  p.play();
  const w: Worst = { ext: 0, behind: 0, plane: 0, handSpeed: 0, reps: 0 };
  const prev: Partial<Record<Side, { plane: Vector3; hand: Vector3 }>> = {};
  const frames = Math.ceil((steps.length * 0.6 + 1.6) / speed / DT);
  let sinceHook = Infinity;
  for (let i = 0; i < frames; i++) {
    rig.apply(p.update(DT));
    // the hooks and the blends into and out of them (the other techniques are measured by their own tests)
    const tech = p.activeStep()?.techniqueId;
    sinceHook = tech?.startsWith('crochet') ? 0 : sinceHook + DT * speed;
    if (sinceHook > 0.15 && tech) {
      for (const s of ['L', 'R'] as Side[]) delete prev[s];
      continue;
    }
    const tq = measureTorsions(rig);
    const W = (b: string) => rig.worldOf(b)!;
    const x = W('LeftArm').sub(W('RightArm')).normalize();
    const z = new Vector3().crossVectors(x, W('Neck').sub(W('Hips')).normalize()).normalize();
    for (const s of ['L', 'R'] as Side[]) {
      const n = s === 'L' ? 'Left' : 'Right';
      const sh = W(`${n}Arm`);
      const el = W(`${n}ForeArm`);
      const hand = W(`${n}Hand`);
      w.ext = Math.max(w.ext, tq.side[s].shoulderRot);
      w.behind = Math.max(w.behind, -el.clone().sub(sh).dot(z));
      const plane = new Vector3().crossVectors(el.clone().sub(sh), hand.clone().sub(el)).normalize();
      const q = prev[s];
      // motion time: a jump is judged per 1/120 s of the technique, whatever the playback speed
      if (q && tq.side[s].elbowFlex > 25) w.plane = Math.max(w.plane, (Math.acos(Math.max(-1, Math.min(1, plane.dot(q.plane)))) * D) / speed);
      if (q) w.handSpeed = Math.max(w.handSpeed, hand.distanceTo(q.hand) / DT / speed);
      prev[s] = { plane, hand };
    }
  }
  w.reps = reps;
  return w;
}

describe('crochets dans les enchaînements (lent, normal, rapide ; droitier et gaucher)', () => {
  for (const b of BODIES) {
    const rig = new CoachRig(loadSkeleton(b.sex, b.file));
    const lib = getLibrary(rig, 'boxing', { id: b.profile, offsets: COACH_STANCES[b.profile] });
    for (const [label, steps] of SEQUENCES)
      test(`${b.id} : ${label}`, () => {
        const bad: string[] = [];
        for (const speed of SPEEDS)
          for (const southpaw of [false, true]) {
            const w = play(rig, lib, steps, speed, southpaw);
            const at = `vitesse ${speed}${southpaw ? ' gaucher' : ''}`;
            if (w.reps < 1) bad.push(`${at} : enchaînement non terminé`);
            if (w.ext > 80) bad.push(`${at} : rotation externe de l’épaule ${w.ext.toFixed(0)}°`);
            if (w.behind > 0.06) bad.push(`${at} : coude ${(w.behind * 100).toFixed(0)} cm derrière les épaules`);
            if (w.plane > 15) bad.push(`${at} : plan du coude ${w.plane.toFixed(0)}° en 1/120 s`);
            if (w.handSpeed > 12) bad.push(`${at} : main à ${w.handSpeed.toFixed(1)} m/s (saut)`);
          }
        expect(bad).toEqual([]);
      });
  }
});
