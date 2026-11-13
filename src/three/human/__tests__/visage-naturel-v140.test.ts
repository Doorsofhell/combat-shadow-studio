import { describe, expect, test } from 'vitest';
import { Bone, BufferGeometry, Float32BufferAttribute, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import { loadSkeleton } from '../../../test/skeleton';
import { CoachRig } from '../../../engine/rig';
import { getLibrary, getMotion } from '../../../engine/library';
import { MotionSampler } from '../../../engine/motion';
import { COACH_STANCES } from '../../../domain/coaches/motion';
import { FACE_BASE_DEFAULT, FACE_EXPRESSIONS, FaceAnimator, type FaceExpression } from '../../face';
import { newSignals } from '../behavior';
import { humanProfileFor } from '../profiles';
import { MicroLife, SMILE_KINDS, type SmileKind } from '../micro';
import { wrinkleStrength } from '../wrinkles';

/**
 * 1.40 (Youssef 13/11 18:35 « les visages sont toujours trop crispés », 19:03 « applique les choix conseillés », 19:04
 * « regarde en face comme si le coach regarde son élève, quelques petits sourires doux… sans que ça soit mécanique ou
 * répétitif »). Held on the four coaches: a calm face at rest, eye contact with the student when the camera is in
 * front, soft smiles of several kinds at irregular times, never pressed lips, forehead lines only on a real raise.
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['inaya', 'femme'],
] as const;

const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function bone(root: Object3D, name: string) {
  let hit: Bone | undefined;
  root.traverse((o) => {
    if (!hit && (o as Bone).isBone && o.name.replace(/^mixamorig/, '') === name) hit = o as Bone;
  });
  return hit!;
}

function withExpressions(root: Object3D) {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  const m = new Mesh(g);
  m.morphTargetDictionary = Object.fromEntries(FACE_EXPRESSIONS.map((e, i) => [`AK_${String(i + 1).padStart(2, '0')}_${e}`, i]));
  m.morphTargetInfluences = FACE_EXPRESSIONS.map(() => 0);
  root.add(m);
  return (e: FaceExpression) => m.morphTargetInfluences![FACE_EXPRESSIONS.indexOf(e)];
}

describe('sourires doux', () => {
  test('3 minutes au calme : plusieurs sourires, de sortes variées, jamais deux pareils à la suite, intervalles irréguliers', () => {
    const m = new MicroLife(rng(21));
    const kinds: SmileKind[] = [];
    const starts: number[] = [];
    let was = false;
    for (let i = 0; i < 180 * 60; i++) {
      m.update(1 / 60, { rest: 1, breath: 0.5, calm: 1, strength: 1, warmth: 1 });
      if (m.smile && !was) {
        kinds.push(m.smile.kind);
        starts.push(i / 60);
      }
      was = !!m.smile;
      const w = m.w as Record<string, number>;
      expect(w.MouthPressLeft ?? 0).toBe(0);
      expect(w.JawOpen ?? 0).toBe(0);
      expect(w.MouthSmileLeft ?? 0).toBeLessThan(0.6);
    }
    expect(kinds.length).toBeGreaterThanOrEqual(6);
    expect(kinds.length).toBeLessThanOrEqual(20);
    expect(new Set(kinds).size).toBe(SMILE_KINDS.length);
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `sourire ${i}`).not.toBe(kinds[i - 1]);
    const gaps = starts.slice(1).map((t, i) => t - starts[i]);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
    expect(sd, 'intervalles').toBeGreaterThan(2);
    expect(Math.min(...gaps)).toBeGreaterThan(6);
  });

  test('chaque sourire revient au neutre ; aucun pendant la préparation ou la frappe', () => {
    const m = new MicroLife(rng(3));
    m.startSmile();
    for (let i = 0; i < 6 * 60; i++) m.update(1 / 60, { rest: 1, breath: 0, calm: 0, strength: 1, warmth: 1 });
    expect(m.smile).toBeNull();
    for (let i = 0; i < 60 * 60; i++) {
      m.update(1 / 60, { rest: 1, breath: 0, calm: 0, strength: 1, warmth: 1 });
      expect(m.smile).toBeNull();
    }
  });

  test('un coach plus chaleureux sourit plus souvent (Naël plus que Kadir)', () => {
    const count = (warmth: number) => {
      const m = new MicroLife(rng(8));
      let n = 0;
      let was = false;
      for (let i = 0; i < 600 * 60; i++) {
        m.update(1 / 60, { rest: 1, breath: 0.5, calm: 1, strength: 1, warmth });
        if (m.smile && !was) n++;
        was = !!m.smile;
      }
      return n;
    };
    expect(count(humanProfileFor('nael').traits.warmth)).toBeGreaterThan(count(humanProfileFor('mma-kadir').traits.warmth));
  });
});

describe('rides du front', () => {
  test('seulement sur un vrai haussement des sourcils', () => {
    expect(wrinkleStrength({ BrowInnerUp: 0.15 })[0]).toBe(0);
    expect(wrinkleStrength({ BrowInnerUp: 0.2 })[0]).toBe(0);
    expect(wrinkleStrength({ BrowInnerUp: 0.6 })[0]).toBeGreaterThan(0.4);
  });
});

describe.each(COACHES)('%s : visage calme et regard vers l’élève', (id, sex) => {
  test('visage calme par défaut : sourcils à peine froncés en moyenne, lèvres jamais pincées', () => {
    expect(FACE_BASE_DEFAULT).toBe('calme');
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    const at = withExpressions(root);
    const face = new FaceAnimator(root, 11, humanProfileFor(id));
    const s = { ...newSignals(), playing: true };
    let brow = 0;
    let n = 0;
    for (let i = 0; i < 60 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (i < 120) continue;
      brow += (at('BrowDownLeft') + at('BrowDownRight')) / 2;
      n++;
      expect(at('MouthPressLeft')).toBeLessThanOrEqual(0.2);
      expect(at('JawOpen')).toBe(0);
    }
    // 1.39 (base « actuel »): about 0.3 in concentration
    expect(brow / n).toBeLessThan(0.15);
  });

  test('caméra en face : le coach regarde l’élève, avec des pauses ; caméra derrière : il garde l’adversaire', () => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    const le = bone(root, 'LeftEye');
    const re = bone(root, 'RightEye');
    const lat = le.getWorldPosition(new Vector3()).sub(re.getWorldPosition(new Vector3())).normalize();
    const facing = new Vector3().crossVectors(lat, new Vector3(0, 1, 0)).normalize();
    const local = facing.clone().applyQuaternion(le.getWorldQuaternion(new Quaternion()).invert());
    const face = new FaceAnimator(root, 5, humanProfileFor(id));
    const rig = new CoachRig(root);
    const lib = getLibrary(rig, 'boxing', COACH_STANCES[id as keyof typeof COACH_STANCES]);
    const sampler = new MotionSampler(rig, getMotion(lib, 'garde', false)!);
    const s = { ...newSignals(), playing: true };
    const eyeAt = () => le.getWorldPosition(new Vector3());
    rig.apply(sampler.sample(0));
    root.updateMatrixWorld(true);
    // the student 2.5 m away, 20° to the side, a little lower than the coach's eyes (a phone held at chest height)
    const side = new Vector3().crossVectors(new Vector3(0, 1, 0), facing).normalize();
    const viewer = eyeAt().add(facing.clone().multiplyScalar(2.35)).add(side.clone().multiplyScalar(0.85)).add(new Vector3(0, -0.3, 0));
    face.setViewer(viewer);
    let onViewer = 0;
    let off = 0;
    let frames = 0;
    for (let i = 0; i < 20 * 60; i++) {
      rig.apply(sampler.sample(i / 60));
      face.update(1 / 60, {}, s);
      if (i < 60) continue;
      frames++;
      le.updateWorldMatrix(true, false);
      const sight = local.clone().applyQuaternion(le.getWorldQuaternion(new Quaternion())).normalize();
      const toViewer = viewer.clone().sub(eyeAt()).normalize();
      const err = (sight.angleTo(toViewer) * 180) / Math.PI;
      if (err < 4) onViewer++;
      if (face.eyeContact < 0.5) off++;
    }
    // mostly on the student, never a fixed stare: the glances aside break the contact now and then
    expect(onViewer / frames).toBeGreaterThan(0.6);
    expect(off).toBeGreaterThan(0);
    // behind the coach: no contact, the eyes stay on the opponent
    face.setViewer(eyeAt().sub(facing.clone().multiplyScalar(3)));
    for (let i = 0; i < 120; i++) {
      rig.apply(sampler.sample(20 + i / 60));
      face.update(1 / 60, {}, s);
    }
    expect(face.eyeContact).toBeLessThan(0.01);
  });
});
