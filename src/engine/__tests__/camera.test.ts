import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { sequenceEnvelope } from '../envelope';
import { analyseMotion, StudyPlayer } from '../study';
import { TECHNIQUES } from '../../domain/techniques';
import { oriented, sequenceView, techniqueView } from '../../domain/camera';
import { STYLE_OF } from '../../three/CoachStage';
import { FOV, cameraBasis, fitDistance } from '../../three/framing';

const BONES = ['Head', 'LeftHand', 'RightHand', 'LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot', 'Hips', 'LeftForeArm', 'RightForeArm'];
const rigs = { homme: new CoachRig(loadSkeleton('homme')), femme: new CoachRig(loadSkeleton('femme')) };

/** largest |NDC| of the coach's limbs over the whole motion, seen from the teaching camera */
function worstNdc(c: 'homme' | 'femme', techId: string, southpaw: boolean, aspect: number) {
  const t = TECHNIQUES.find((x) => x.id === techId)!;
  const rig = rigs[c];
  const lib = getLibrary(rig, STYLE_OF[t.disciplines[0]]);
  const v = techniqueView(techId);
  const az = (oriented(v, southpaw) * Math.PI) / 180;
  const el = (v.el * Math.PI) / 180;
  const box = sequenceEnvelope(rig, lib, [t.motion], southpaw);
  const target = box.getCenter(new Vector3());
  const dist = fitDistance(box, target, az, el, aspect) / v.zoom;
  const b = cameraBasis(az, el);
  const cam = target.clone().addScaledVector(b.fwd, -dist);
  const tv = Math.tan((FOV * Math.PI) / 360);
  const m = getMotion(lib, t.motion, southpaw)!;
  const s = new MotionSampler(rig, m);
  let worst = 0;
  for (let i = 0; i <= 20; i++) {
    rig.apply(s.sample((duration(m) * i) / 20));
    for (const bone of BONES) {
      const p = rig.worldOf(bone)!.clone().sub(cam);
      const z = p.dot(b.fwd);
      worst = Math.max(worst, Math.abs(p.dot(b.right) / z / (tv * aspect)), Math.abs(p.dot(b.up) / z / tv));
    }
  }
  return worst;
}

describe('caméra pédagogique', () => {
  test('chaque technique a un angle justifié', () => {
    for (const t of TECHNIQUES) {
      const v = techniqueView(t.id);
      expect(v.why.length, t.id).toBeGreaterThan(30);
      expect(Math.abs(v.az), t.id).toBeLessThanOrEqual(180);
    }
  });

  test.each([
    ['portrait', 0.75],
    ['paysage', 1.8],
  ])('le corps entier reste dans le cadre pendant tout le mouvement (%s)', (_n, aspect) => {
    for (const c of ['homme', 'femme'] as const)
      for (const t of TECHNIQUES)
        for (const southpaw of [false, true]) expect(worstNdc(c, t.id, southpaw, aspect), `${c} ${t.id} ${southpaw ? 'gaucher' : ''}`).toBeLessThan(0.97);
  });

  test('une combinaison garde un angle unique, sans zoom serré', () => {
    const v = sequenceView(['jab', 'direct', 'crochet-avant', 'low-kick-arriere']);
    expect(v.az).toBe(techniqueView('low-kick-arriere').az);
    expect(v.zoom).toBeLessThanOrEqual(1);
    expect(v.closeUp).toBeUndefined();
    expect(sequenceView(['jab', 'direct']).az).toBe(40);
  });

  test('les angles sont inversés en garde gaucher', () => {
    expect(oriented({ az: 40 }, true)).toBe(-40);
  });
});

describe('mode Décomposer', () => {
  test('trouve le membre qui frappe et le point clé', () => {
    const rig = rigs.homme;
    const lib = getLibrary(rig, 'boxing');
    expect(analyseMotion(rig, getMotion(lib, 'jab', false)!).effector).toBe('handL');
    expect(analyseMotion(rig, getMotion(lib, 'direct', false)!).effector).toBe('handR');
    const k = analyseMotion(rig, getMotion(getLibrary(rig, 'muaythai'), 'middle-kick-arriere', false)!);
    expect(k.effector).toBe('footR');
    expect(k.pivots.some((p) => p.side === 'L')).toBe(true);
  });

  test('enchaîne départ, préparation, exécution, point clé, retour et recommence', () => {
    const rig = rigs.femme;
    const p = new StudyPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setTechnique('crochet-avant');
    const seen: string[] = [];
    for (let i = 0; i < 2000 && seen.length < 7; i++) {
      p.update(1 / 30);
      if (seen[seen.length - 1] !== p.phase) seen.push(p.phase);
    }
    expect(seen).toEqual(['depart', 'preparation', 'execution', 'point', 'retour', 'pause', 'depart']);
  });

  test('pas à pas entre les positions clés', () => {
    const rig = rigs.homme;
    const p = new StudyPlayer(rig, getLibrary(rig, 'boxing'), false);
    p.setTechnique('jab');
    p.stepKey(1);
    expect(p.playing).toBe(false);
    expect(p.t).toBeGreaterThan(0);
    const t1 = p.t;
    p.stepKey(1);
    expect(p.t).toBeGreaterThan(t1);
    p.stepKey(-1);
    expect(p.t).toBeCloseTo(t1, 5);
  });
});
