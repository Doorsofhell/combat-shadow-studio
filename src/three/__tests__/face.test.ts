import { describe, expect, test } from 'vitest';
import { Bone, Object3D, Vector3 } from 'three';
import { loadSkeleton } from '../../test/skeleton';
import { FaceAnimator } from '../face';

/**
 * 1.9 (Youssef, 2026-10-29: « l'expression des visages est trop statique »): the four Ultra-réaliste coaches have
 * the facial bones the face animator drives, a blink closes the eyelids, the effort of a strike moves the brows
 * a few millimetres only, and a still picture (Lab, portraits) stays at rest.
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['axel', 'homme'],
  ['kaila', 'femme'],
  ['nael', 'homme'],
  ['inaya', 'femme'],
] as const;

function bone(root: Object3D, name: string) {
  let hit: Bone | undefined;
  root.traverse((o) => {
    if (!hit && (o as Bone).isBone && o.name.replace(/^mixamorig/, '') === name) hit = o as Bone;
  });
  return hit!;
}

const world = (b: Bone) => {
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(new Vector3());
};

describe.each(COACHES)('%s', (id, sex) => {
  const fresh = () => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    return { root, face: new FaceAnimator(root, 7) };
  };

  test('les os du visage sont présents (paupières, sourcils, coins de la bouche, mâchoire, yeux)', () => {
    const { root, face } = fresh();
    expect(face.active).toBe(true);
    for (const s of ['L', 'R'])
      for (const n of [`Face_${s}EyeBlinkTop`, `Face_${s}EyeBlinkBottom`, `Face_${s}InnerEyebrow`, `Face_${s}MouthCorner`]) expect(bone(root, n), n).toBeDefined();
    for (const n of ['Face_MJaw', 'LeftEye', 'RightEye']) expect(bone(root, n), n).toBeDefined();
  });

  test('un clignement ferme les paupières, puis elles reviennent au repos', () => {
    const { root, face } = fresh();
    const top = bone(root, 'Face_LEyeBlinkTop');
    const rest = { p: top.position.clone(), q: top.quaternion.clone() };
    face.update(1 / 60, { still: true, blink: 1 });
    const moved = top.position.distanceTo(rest.p) > 1e-4 || top.quaternion.angleTo(rest.q) > 0.05;
    expect(moved).toBe(true);
    face.update(1 / 60, { still: true });
    expect(top.position.distanceTo(rest.p)).toBeLessThan(1e-6);
    // angleTo (2·acos) is imprecise near 0: 0.001 rad = 0.06°
    expect(top.quaternion.angleTo(rest.q)).toBeLessThan(1e-3);
  });

  test('l’effort abaisse les sourcils de quelques millimètres seulement', () => {
    const { root, face } = fresh();
    const brow = bone(root, 'Face_LInnerEyebrow');
    const before = world(brow);
    face.update(1 / 60, { still: true, effort: 1 });
    const d = world(brow).sub(before);
    expect(d.y).toBeLessThan(-0.002);
    expect(d.length()).toBeLessThan(0.012);
  });

  test('en image fixe, ni clignement ni regard qui bouge, même après 20 s', () => {
    const { root, face } = fresh();
    const eye = bone(root, 'LeftEye');
    const q = eye.quaternion.clone();
    for (let i = 0; i < 1200; i++) face.update(1 / 60, { still: true });
    expect(face.state.blinking).toBe(false);
    expect(eye.quaternion.angleTo(q)).toBeLessThan(1e-3);
  });

  test('en direct, le coach cligne des yeux (au moins 3 fois en 20 s) et l’effort reste entre 0 et 1', () => {
    const { face } = fresh();
    let blinks = 0;
    let was = false;
    for (let i = 0; i < 1200; i++) {
      face.update(1 / 60);
      if (face.state.blinking && !was) blinks++;
      was = face.state.blinking;
      expect(face.state.effort).toBeGreaterThanOrEqual(0);
      expect(face.state.effort).toBeLessThanOrEqual(1);
    }
    expect(blinks).toBeGreaterThanOrEqual(3);
  });

  // 1.21 (Youssef 05/11 15:14: toutes les améliorations d'Inaya sur les autres coachs): the face at rest of 1.20
  // (expressions-v1160) also on the faces driven by bones: brows and mouth corners move a little, slowly
  test('1.21 au repos, sourcils et coins de la bouche bougent un peu, lentement, et reviennent au repos en image fixe', () => {
    const { root, face } = fresh();
    const watch = [bone(root, 'Face_LInnerEyebrow'), bone(root, 'Face_LMouthCorner')];
    // world positions (metres): the bones' own spaces are scaled. 1.34: seen in the frame of the head (the head's own
    // drift, made more visible in 1.33.x #74, moved the brows in the world and was counted as a facial movement)
    const head = bone(root, 'Head');
    head.updateWorldMatrix(true, false);
    const headRest = head.matrixWorld.clone();
    const inHead = (b: Bone) => world(b).applyMatrix4(head.matrixWorld.clone().invert()).applyMatrix4(headRest);
    const rest = watch.map((b) => inHead(b));
    const local = watch.map((b) => b.position.clone());
    const range = watch.map(() => 0);
    let jump = 0;
    let prev = watch.map((b) => inHead(b));
    for (let i = 0; i < 12 * 60; i++) {
      face.update(1 / 60);
      watch.forEach((b, j) => {
        const w = inHead(b);
        range[j] = Math.max(range[j], w.distanceTo(rest[j]));
        jump = Math.max(jump, w.distanceTo(prev[j]));
        prev[j] = w;
      });
    }
    range.forEach((r, j) => expect(r, watch[j].name).toBeGreaterThan(0.0004));
    range.forEach((r, j) => expect(r, watch[j].name).toBeLessThan(0.008));
    expect(jump).toBeLessThan(0.0005);
    face.update(1 / 60, { still: true, effort: 0 });
    watch.forEach((b, j) => expect(b.position.distanceTo(local[j])).toBeLessThan(1e-6));
  });
});
