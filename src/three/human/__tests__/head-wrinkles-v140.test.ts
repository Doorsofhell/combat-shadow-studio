import { describe, expect, test } from 'vitest';
import { Bone, BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, Object3D, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { loadSkeleton } from '../../../test/skeleton';
import { FACE_EXPRESSIONS, FaceAnimator, expressionWeights } from '../../face';
import { newSignals } from '../behavior';
import { humanProfileFor } from '../profiles';
import { applyWrinkles, wrinkleStrength } from '../wrinkles';
import { applySkinShader } from '../../skinShader';
import { DEFAULT_SKIN } from '../../skinShader';

/**
 * 1.40 (Youssef 13/11 17:13, lot validé: « la tête et le regard ensemble », « des rides qui apparaissent avec
 * l'expression »). The head follows the eyes a moment later and takes a share of a glance, it re-settles now and
 * then by less than a degree; the skin of the face creases with the expressions (forehead, between the brows, crow's
 * feet) and is smooth on a neutral face.
 */
const COACHES = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
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

function withExpressions(root: Object3D) {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  const m = new Mesh(g);
  m.morphTargetDictionary = Object.fromEntries(FACE_EXPRESSIONS.map((e, i) => [`AK_${String(i + 1).padStart(2, '0')}_${e}`, i]));
  m.morphTargetInfluences = FACE_EXPRESSIONS.map(() => 0);
  root.add(m);
}

const deg = (r: number) => (r * 180) / Math.PI;

describe.each(COACHES)('%s : la tête suit le regard', (id, sex) => {
  const setup = () => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    withExpressions(root);
    const face = new FaceAnimator(root, 11, humanProfileFor(id));
    return { root, face, head: bone(root, 'Head'), eye: bone(root, 'LeftEye') };
  };

  test('regard de côté : les yeux partent d’abord, la tête suit un instant après et prend environ la moitié', () => {
    const { face, head } = setup();
    const s = { ...newSignals(), playing: true };
    for (let i = 0; i < 120; i++) face.update(1 / 60, {}, s);
    const g = (face as unknown as { gaze: { toYaw: number; next: number; away: boolean; yaw: number } }).gaze;
    const h = (face as unknown as { head: { follow: number } }).head;
    // a glance of 12° to the side, now, held 1.2 s
    g.toYaw = 0.21;
    g.away = true;
    g.next = Number.POSITIVE_INFINITY;
    const q0 = head.quaternion.clone();
    let eyesAt = -1;
    let headAt = -1;
    for (let i = 1; i <= 72; i++) {
      face.update(1 / 60, {}, s);
      if (eyesAt < 0 && g.yaw > 0.21 * 0.5) eyesAt = i / 60;
      if (headAt < 0 && h.follow > 0.21 * 0.55 * 0.5) headAt = i / 60;
    }
    expect(eyesAt).toBeGreaterThan(0);
    expect(eyesAt).toBeLessThan(0.08);
    // the head reaches half of its share later than the eyes, within half a second
    expect(headAt - eyesAt).toBeGreaterThan(0.1);
    expect(headAt).toBeLessThan(0.5);
    expect(h.follow).toBeGreaterThan(0.21 * 0.45);
    expect(h.follow).toBeLessThan(0.21 * 0.6);
    // the head did turn (a few degrees), not more than the glance
    expect(deg(head.quaternion.angleTo(q0))).toBeGreaterThan(2);
    expect(deg(head.quaternion.angleTo(q0))).toBeLessThan(12);
  });

  test('la tête se réajuste de temps en temps, de moins d’un degré et demi, puis revient', () => {
    const { face } = setup();
    const s = { ...newSignals(), playing: true };
    const h = (face as unknown as { head: { adj: Vector3 } }).head;
    let max = 0;
    let moves = 0;
    let was = false;
    for (let i = 0; i < 30 * 60; i++) {
      face.update(1 / 60, {}, s);
      const a = h.adj.length();
      max = Math.max(max, a);
      const on = a > (0.25 * Math.PI) / 180;
      if (on && !was) moves++;
      was = on;
    }
    expect(moves).toBeGreaterThanOrEqual(3);
    expect(deg(max)).toBeLessThan(1.5);
  });

  test('en image fixe : ni regard de côté ni réajustement de la tête', () => {
    const { face, head } = setup();
    for (let i = 0; i < 60; i++) face.update(1 / 60, { still: true });
    // normalised copies: a skeleton read from the file may carry quaternions a hair off unit length, and angleTo
    // then reads a few tenths of a milliradian between a quaternion and itself
    const q = head.quaternion.clone().normalize();
    for (let i = 0; i < 600; i++) face.update(1 / 60, { still: true });
    expect(head.quaternion.clone().normalize().angleTo(q)).toBeLessThan(1e-4);
  });

  test('rides : repère du visage centré entre les yeux, unité = écart des yeux', () => {
    const { face, root } = setup();
    expect(face.wrinkles).not.toBeNull();
    const cam = new PerspectiveCamera();
    cam.updateMatrixWorld(true);
    face.updateWrinkles(cam);
    const M = face.wrinkles!.uniforms.cssWrView.value;
    // the camera at the origin of the world looking down -z: a point in view space is a point in the world
    const l = bone(root, 'LeftEye').getWorldPosition(new Vector3()).applyMatrix4(M);
    const r = bone(root, 'RightEye').getWorldPosition(new Vector3()).applyMatrix4(M);
    expect(l.x).toBeCloseTo(0.5, 2);
    expect(r.x).toBeCloseTo(-0.5, 2);
    expect(Math.abs(l.y) + Math.abs(l.z)).toBeLessThan(0.01);
    // the head turned: the frame turns with it
    bone(root, 'Head').quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.4));
    root.updateMatrixWorld(true);
    face.updateWrinkles(cam);
    const l2 = bone(root, 'LeftEye').getWorldPosition(new Vector3()).applyMatrix4(face.wrinkles!.uniforms.cssWrView.value);
    expect(l2.x).toBeCloseTo(0.5, 2);
  });
});

describe('rides d’expression', () => {
  test('visage neutre : aucune ride ; sourcil levé : front ; froncement : entre les sourcils ; yeux plissés : pattes d’oie', () => {
    expect(wrinkleStrength(expressionWeights(0, 0, 0))).toEqual([0, 0, 0, 0]);
    const [f] = wrinkleStrength({ BrowInnerUp: 1 });
    expect(f).toBeGreaterThan(0.8);
    const [, g] = wrinkleStrength({ BrowDownLeft: 1, BrowDownRight: 1 });
    expect(g).toBeGreaterThan(0.8);
    const [, , cl, cr] = wrinkleStrength({ EyeSquintLeft: 1, CheekSquintLeft: 0.5 });
    expect(cl).toBeGreaterThan(0.8);
    expect(cr).toBe(0);
    for (const v of wrinkleStrength({ BrowInnerUp: 5, BrowDownLeft: 5, BrowDownRight: 5, EyeSquintLeft: 5, CheekSquintLeft: 5, MouthSmileLeft: 5 })) expect(v).toBeLessThanOrEqual(1);
  });

  test('en séance, les rides suivent les expressions du visage et restent légères au repos', () => {
    const root = loadSkeleton('femme', 'coaches/inaya/photo.glb');
    withExpressions(root);
    const face = new FaceAnimator(root, 3, humanProfileFor('inaya'));
    const cam = new PerspectiveCamera();
    const s = { ...newSignals(), playing: true };
    let sum = 0;
    let n = 0;
    for (let i = 0; i < 20 * 60; i++) {
      face.update(1 / 60, {}, s);
      face.updateWrinkles(cam);
      const a = face.wrinkles!.uniforms.cssWrA.value;
      expect(a.toArray()).toEqual(wrinkleStrength(face.weights as Record<string, number>));
      if (i > 120) {
        sum += a.x + a.y + a.z + a.w;
        n++;
      }
    }
    // present (the face lives) but light at rest: on average under a fifth of a full wrinkle each
    expect(sum / n).toBeGreaterThan(0.02);
    expect(sum / n / 4).toBeLessThan(0.2);
  });

  test('le shader de la peau reçoit les rides, enchaîné après la peau (une seule clé de programme)', () => {
    const m = new MeshStandardMaterial();
    applySkinShader(m, DEFAULT_SKIN, true);
    const root = loadSkeleton('homme', 'coaches/nael/photo.glb');
    withExpressions(root);
    const face = new FaceAnimator(root, 1, humanProfileFor('nael'));
    applyWrinkles(m, face.wrinkles!.uniforms);
    const frag = '#include <common>\nvoid main(){\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>\n}';
    const shader = { fragmentShader: frag, vertexShader: '#include <common>\n#include <begin_vertex>', uniforms: {} as Record<string, unknown> };
    m.onBeforeCompile(shader as never, null as never);
    expect(shader.fragmentShader).toContain('cssWrinkle(');
    expect(shader.uniforms.cssWrView).toBeDefined();
    expect(shader.uniforms.cssWrA).toBeDefined();
    expect(m.customProgramCacheKey()).toContain('css-wrinkles-v140');
  });
});
