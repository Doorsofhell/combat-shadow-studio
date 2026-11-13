import { describe, expect, test } from 'vitest';
import { Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary, getMotion } from '../library';
import { MotionSampler, duration } from '../motion';
import { sequenceEnvelope } from '../envelope';
import { analyseMotion, StudyPlayer } from '../study';
import { TECHNIQUES } from '../../domain/techniques';
import { oriented, sequenceView, stageAzimuth, stepViews, techniqueView, torsoYaw, viewName } from '../../domain/camera';
import { STYLE_OF } from '../../three/CoachStage';
import { FOV, cameraBasis, centerOnSpheres, fitSpheres } from '../../three/framing';

const BONES = ['Head', 'LeftHand', 'RightHand', 'LeftToeBase', 'RightToeBase', 'LeftFoot', 'RightFoot', 'Hips', 'LeftForeArm', 'RightForeArm'];
const rigs = { homme: new CoachRig(loadSkeleton('homme')), femme: new CoachRig(loadSkeleton('femme')) };

/** largest |NDC| of the coach's limbs over the whole motion, seen from the teaching camera */
function worstNdc(c: 'homme' | 'femme', techId: string, southpaw: boolean, aspect: number) {
  const t = TECHNIQUES.find((x) => x.id === techId)!;
  const rig = rigs[c];
  const lib = getLibrary(rig, STYLE_OF[t.disciplines[0]]);
  const v = techniqueView(techId);
  const az = (stageAzimuth(v, t.disciplines[0], southpaw) * Math.PI) / 180;
  const el = (v.el * Math.PI) / 180;
  const env = sequenceEnvelope(rig, lib, [t.motion], southpaw);
  const target = centerOnSpheres(env.pts, { x: 0, z: 0, yaw: 0 }, env.box.getCenter(new Vector3()), az, el);
  const dist = fitSpheres(env.pts, { x: 0, z: 0, yaw: 0 }, target, az, el, aspect) / v.zoom;
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

  // 1.0.0 (Youssef, 2026-10-27, PERMANENT: « les mouvements du coach ne doivent jamais sortir de l'écran »): also the
  // wide frame of the new home (393 × 272 px, aspect 1.45)
  test.each([
    ['portrait', 0.75],
    ['accueil 1.0', 1.45],
    ['paysage', 1.8],
  ])('le corps entier reste dans le cadre pendant tout le mouvement (%s)', (_n, aspect) => {
    for (const c of ['homme', 'femme'] as const)
      for (const t of TECHNIQUES)
        for (const southpaw of [false, true]) expect(worstNdc(c, t.id, southpaw, aspect), `${c} ${t.id} ${southpaw ? 'gaucher' : ''}`).toBeLessThan(0.97);
    // the whole library, both coaches and guards: a time budget, not a threshold (0.28: 91 techniques)
  }, 60_000);

  test.each([
    ['portrait', 0.75],
    ['paysage', 1.8],
  ])('le coach remplit le cadre : pas de grand espace vide autour du mouvement (%s)', (_n, aspect) => {
    const fills: number[] = [];
    for (const c of ['homme', 'femme'] as const)
      for (const t of TECHNIQUES) {
        const w = worstNdc(c, t.id, false, aspect);
        fills.push(w);
        // the farthest limb reaches at least 60 % of the half-frame (footwork travels: the lowest)
        expect(w, `${c} ${t.id}`).toBeGreaterThan(0.6);
      }
    expect(fills.reduce((a, b) => a + b) / fills.length).toBeGreaterThan(0.75);
  });

  test('une combinaison garde un angle unique, sans zoom serré', () => {
    const v = sequenceView(['jab', 'direct', 'crochet-avant', 'low-kick-arriere']);
    expect(v.az).toBe(techniqueView('low-kick-arriere').az);
    expect(v.zoom).toBeLessThanOrEqual(1);
    expect(v.closeUp).toBeUndefined();
    // punches only: the three-quarter view of the trunk
    expect(sequenceView(['jab', 'direct'])).toMatchObject({ az: 60, ref: 'torse' });
  });

  test('Jab : vu de trois quarts par rapport au buste dans chaque discipline, jamais de profil', () => {
    for (const d of ['boxe', 'kickboxing', 'mma', 'muaythai'] as const) {
      const az = stageAzimuth(techniqueView('jab'), d, false);
      // angle between the camera and the direction the trunk faces
      expect(az - torsoYaw(d), d).toBe(60);
      // and the arm extension stays visible: the camera is not in the punch line
      expect(az, d).toBeGreaterThanOrEqual(15);
      expect(stageAzimuth(techniqueView('jab'), d, true), `${d} gaucher`).toBe(-az);
    }
  });

  test('caméra Auto pas à pas : chaque technique sous son angle, sans vue de haut sur les coups', () => {
    // « Pivots et angles » : the punches were filmed from 45° above because of the pivots
    const seq = ['jab', 'pivot-droite', 'direct', 'pivot-gauche', 'jab', 'direct'];
    const v = stepViews(seq, 'boxe');
    expect(v).toHaveLength(seq.length);
    for (const i of [0, 2, 4, 5]) expect(v[i].el, seq[i]).toBeLessThanOrEqual(10);
    for (const i of [1, 3]) {
      expect(v[i].el, seq[i]).toBeGreaterThanOrEqual(20);
      expect(v[i].el, seq[i]).toBeLessThanOrEqual(24);
    }
    // a kick keeps its own angle inside a combination
    const k = stepViews(['jab', 'direct', 'sortie-angle', 'crochet-avant', 'low-kick-arriere'], 'kickboxing');
    expect(k[4].az).toBe(techniqueView('low-kick-arriere').az);
    expect(k[0].el).toBeLessThanOrEqual(10);
    // punches only: one stable three-quarter view, no shaking between quick strikes
    const p = stepViews(['jab', 'direct', 'crochet-avant', 'direct'], 'boxe');
    expect(new Set(p).size).toBe(1);
    expect(p[0]).toMatchObject({ az: 60, ref: 'torse' });
    // a single technique keeps its own angle, close-up included
    expect(stepViews(['coude-horizontal-avant'], 'muaythai')[0]).toEqual(techniqueView('coude-horizontal-avant'));
    // footwork only keeps the view from above
    expect(stepViews(['pas-avant', 'pas-arriere'], 'boxe')[0].el).toBe(techniqueView('pas-avant').el);
    // no step is ever closer than the whole body in a combination
    for (const x of [...v, ...k]) expect(x.zoom).toBeLessThanOrEqual(1);
  });

  test('nom de l’angle affiché', () => {
    expect(viewName({ az: 60, el: 7 })).toBe('3/4 avant');
    expect(viewName({ az: 0, el: 6 })).toBe('Face');
    expect(viewName({ az: 90, el: 6 })).toBe('Profil avant');
    expect(viewName({ az: 20, el: 24 })).toBe('3/4 avant, en hauteur');
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
