import { describe, expect, test } from 'vitest';
import { Bone, BufferGeometry, Float32BufferAttribute, Mesh, Object3D } from 'three';
import { loadSkeleton } from '../../../test/skeleton';
import { FACE_EXPRESSIONS, FaceAnimator, type FaceExpression } from '../../face';
import { newSignals } from '../behavior';
import { humanProfileFor } from '../profiles';

/**
 * 1.34 the whole face of a coach, on its real skeleton, with a stand-in for the face mesh that carries the 25
 * expressions (as photo.glb does): mouth at rest, return to neutral after a strike, irregular blinks, no grimace on
 * the first image, life during the pause, cost per image.
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['inaya', 'femme'],
  ['axel', 'homme'],
  ['kaila', 'femme'],
] as const;

function bone(root: Object3D, name: string) {
  let hit: Bone | undefined;
  root.traverse((o) => {
    if (!hit && (o as Bone).isBone && o.name.replace(/^mixamorig/, '') === name) hit = o as Bone;
  });
  return hit!;
}

/** a face mesh with the expressions, named as in the GLB files (AK_nn_<name>) */
function withExpressions(root: Object3D) {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  const m = new Mesh(g);
  m.morphTargetDictionary = Object.fromEntries(FACE_EXPRESSIONS.map((e, i) => [`AK_${String(i + 1).padStart(2, '0')}_${e}`, i]));
  m.morphTargetInfluences = FACE_EXPRESSIONS.map(() => 0);
  root.add(m);
  const w = (e: FaceExpression) => m.morphTargetInfluences![m.morphTargetDictionary![`AK_${String(FACE_EXPRESSIONS.indexOf(e) + 1).padStart(2, '0')}_${e}`]];
  return w;
}

describe.each(COACHES)('%s', (id, sex) => {
  const setup = () => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    const morph = id === 'axel' || id === 'kaila' ? null : withExpressions(root);
    const face = new FaceAnimator(root, 11, humanProfileFor(id));
    return { root, face, morph, hand: bone(root, 'RightHand') };
  };

  test('le moteur commun est actif et reconnaît le niveau du modèle', () => {
    const { face } = setup();
    expect(face.active).toBe(true);
    expect(face.profile.id).toBe(id);
    expect(['complet', 'os']).toContain(face.capabilities.level);
  });

  test('pas de grimace au premier affichage (le passage de la pose de repos à la garde n’est pas une frappe)', () => {
    const { face, hand } = setup();
    hand.position.x += 50; // the guard: hands far from the rest pose, in one image
    face.update(1 / 60, {}, { ...newSignals(), playing: true });
    expect(face.state.effort).toBeLessThan(0.01);
  });

  test('frappe : l’effort monte, puis le visage revient à la concentration en moins de 1,5 s', () => {
    const { face, hand, morph } = setup();
    const s = { ...newSignals(), playing: true };
    for (let i = 0; i < 60; i++) face.update(1 / 60, {}, s);
    const restJaw = morph?.('JawOpen') ?? 0;
    // a punch: the hand travels 9 m/s for 0.15 s (hand bone units: cm on Rocketbox, m on MakeHuman)
    const scale = hand.getWorldScale(hand.position.clone()).x;
    let peak = 0;
    for (let i = 0; i < 9; i++) {
      hand.position.z += 0.15 / scale;
      face.update(1 / 60, {}, { ...s, phase: 'execution' });
      peak = Math.max(peak, face.state.effort);
    }
    expect(peak).toBeGreaterThan(0.8);
    expect(face.behavior.state === 'frappe' || face.behavior.state === 'effort').toBe(true);
    for (let i = 0; i < 90; i++) face.update(1 / 60, {}, s);
    expect(face.state.effort).toBeLessThan(0.05);
    expect(face.behavior.state).toBe('concentration');
    if (morph) {
      // the mouth closed again, no effort left on the face
      expect(morph('JawOpen')).toBeLessThanOrEqual(restJaw + 0.01);
      expect(morph('MouthFunnel')).toBeLessThan(0.02);
      expect(morph('NoseSneerLeft')).toBeLessThan(0.2);
    }
  });

  test('bouche au repos : fermée et détendue (ni entrouverte ni crispée), quel que soit l’instant', () => {
    const { face, morph } = setup();
    if (!morph) return;
    const s = { ...newSignals(), playing: true };
    for (let i = 0; i < 20 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (i < 120) continue;
      expect(morph('JawOpen')).toBe(0);
      expect(morph('MouthFunnel')).toBe(0);
      expect(morph('MouthClose')).toBeGreaterThan(0.1);
      expect(morph('MouthPressLeft')).toBeLessThan(0.25);
      expect(morph('MouthStretchLeft')).toBeLessThan(0.05);
    }
  });

  test('clignements irréguliers (ni métronome ni rafale), regard qui bouge', () => {
    const { face, root } = setup();
    const eye = bone(root, 'LeftEye');
    const s = { ...newSignals(), playing: true };
    const starts: number[] = [];
    let was = false;
    let moves = 0;
    let prev = eye.quaternion.clone();
    for (let i = 0; i < 60 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (face.state.blinking && !was) starts.push(i / 60);
      was = face.state.blinking;
      if (eye.quaternion.angleTo(prev) > 0.002) moves++;
      prev = eye.quaternion.clone();
    }
    const gaps = starts.slice(1).map((t, i) => t - starts[i]);
    expect(starts.length).toBeGreaterThan(8);
    expect(starts.length).toBeLessThan(30);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
    expect(sd).toBeGreaterThan(0.5);
    expect(Math.min(...gaps)).toBeGreaterThan(0.25);
    // the eyes move now and then, never fixed for a minute
    expect(moves).toBeGreaterThan(30);
  });

  test('pause : le visage reste vivant (clignements) sans expression d’effort', () => {
    const { face } = setup();
    const s = newSignals();
    let blinks = 0;
    let was = false;
    for (let i = 0; i < 20 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (face.state.blinking && !was) blinks++;
      was = face.state.blinking;
    }
    expect(blinks).toBeGreaterThanOrEqual(3);
    expect(face.behavior.state).toBe('neutre');
  });

  test('coût par image compatible mobile (moins de 0,15 ms en moyenne ici)', () => {
    const { face } = setup();
    const s = { ...newSignals(), playing: true };
    for (let i = 0; i < 120; i++) face.update(1 / 60, {}, s);
    const t0 = performance.now();
    for (let i = 0; i < 1200; i++) face.update(1 / 60, {}, s);
    expect((performance.now() - t0) / 1200).toBeLessThan(0.15);
  });
});
