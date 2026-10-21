import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { probe } from '../../test/probe';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler } from '../motion';

/**
 * v0.29 biomeca lot (Youssef, 2026-10-21 21:00, captures of « Combinaison 8 armes »: arm badly bent on the lead
 * hook). Joint read-outs of the 5 priority muay-thaï techniques on both Ultra-réaliste coaches, against the
 * references of docs/v029/BIOMECA_LOT1.md. Orthodox stance: lead side = left, +z = towards the opponent.
 */
const coaches = [
  { id: 'kadir', sex: 'homme', url: 'coaches/mma-kadir/photo.glb' },
  { id: 'amara', sex: 'femme', url: 'coaches/mma-amara/photo.glb' },
] as const;

describe.each(coaches)('muay-thaï, coach $id', ({ sex, url }) => {
  const scene = loadSkeleton(sex, url);
  const rig = new CoachRig(scene);
  const lib = getLibrary(rig, 'muaythai');
  const run = (id: string) => {
    const m = getMotion(lib, id, false)!;
    const s = new MotionSampler(rig, m);
    const at = (t: number) => probe(scene, rig, s, t);
    const frames = Array.from({ length: 61 }, (_, i) => at((s.duration * i) / 60));
    return { m, s, at, frames, impact: at(m.impacts[0]) };
  };
  const guard = probe(scene, rig, new MotionSampler(rig, getMotion(lib, 'garde', false)!), 0);
  const PRIORITY = ['crochet-avant', 'direct', 'genou-direct-arriere', 'teep-avant', 'coude-horizontal-arriere'];

  test('poing dans l’axe de l’avant-bras sur toute la durée des 5 techniques', () => {
    for (const id of PRIORITY)
      for (const f of run(id).frames) {
        expect(f.L.wristBend, id).toBeLessThan(20);
        expect(f.R.wristBend, id).toBeLessThan(20);
      }
  });

  test('crochet avant : coude fléchi vers 90°, à hauteur d’épaule [S3]', () => {
    const { L } = run('crochet-avant').impact;
    expect(L.elbowFlex).toBeGreaterThan(60);
    expect(L.elbowFlex).toBeLessThan(110);
    expect(L.elbowAboveShoulder).toBeLessThan(0.05);
    expect(L.elbowAboveShoulder).toBeGreaterThan(-0.08);
  });

  test('direct arrière : bras allongé sans coude verrouillé [S8]', () => {
    const { R } = run('direct').impact;
    expect(R.elbowFlex).toBeGreaterThan(8);
    expect(R.elbowFlex).toBeLessThan(35);
  });

  test('genou direct : genou au-dessus de la hanche, jambes jamais croisées au retour [S35]', () => {
    const r = run('genou-direct-arriere');
    expect(r.impact.fR.kneeAboveHip).toBeGreaterThan(0.1);
    // the right (rear) ankle stays on its own side of the support ankle on every frame
    for (const f of r.frames) expect(f.fR.ankle.x - f.fL.ankle.x).toBeLessThan(-0.01);
    expect(guard.lean - r.impact.lean).toBeLessThan(30);
  });

  test('teep : main du côté de la jambe qui frappe abaissée, buste peu renversé [S24, S29, S36]', () => {
    const r = run('teep-avant');
    expect(r.impact.fL.kneeAboveHip).toBeGreaterThan(0.05);
    expect(r.impact.L.hand.y).toBeLessThan(guard.L.hand.y - 0.3);
    expect(guard.lean - r.impact.lean).toBeLessThan(25);
    for (const f of r.frames) expect(f.fL.ankle.x - f.fR.ankle.x).toBeGreaterThan(0.01);
  });

  test('coude horizontal : le coude monte sans recul avant de traverser [S27]', () => {
    const r = run('coude-horizontal-arriere');
    for (let i = 0; i <= 30; i++) {
      const f = r.at((r.m.impacts[0] * i) / 30);
      expect(f.R.elbow.z - f.R.shoulder.z).toBeGreaterThan(0);
    }
    expect(r.impact.R.elbowAboveShoulder).toBeGreaterThan(0);
  });

  test('poing fermé : le pouce se replie devant les doigts', () => {
    const pose = new MotionSampler(rig, getMotion(lib, 'garde', false)!).sample(0);
    pose.handL.fist = 1;
    rig.apply(pose);
    scene.updateMatrixWorld(true);
    const P = (n: string) => scene.getObjectByName(n)!.getWorldPosition(new Vector3());
    expect(P('LeftHandThumb3').distanceTo(P('LeftHandMiddle2'))).toBeLessThan(0.035);
  });
});
