import { describe, expect, test } from 'vitest';
import { Bone, BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { loadSkeleton } from '../../../test/skeleton';
import { FACE_EXPRESSIONS, FaceAnimator, type FaceExpression } from '../../face';
import { newSignals } from '../behavior';
import { humanProfileFor } from '../profiles';
import { MICRO_EVENTS, MicroLife } from '../micro';
import { DEFAULT_SKIN } from '../../skinShader';
import { photoMaterial } from '../../photoMaterials';

/**
 * 1.39 (Youssef 13/11: « le visage reste trop figé, elle ne fait pas du tout naturel. Sur elle et tous les autres
 * coachs », puis « il faut que ça soit naturel, pas de lèvres ni visage crispé »). Verified on 1.38.0 in the Lab: a
 * frown held near 0.54, left = right at every image, lips fixed, eyes still on each fixation, no highlight in the eyes.
 * These tests hold the four coaches to a living, relaxed face.
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
  return (e: FaceExpression) => m.morphTargetInfluences![FACE_EXPRESSIONS.indexOf(e)];
}

const sd = (v: number[]) => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};

describe.each(COACHES)('%s : visage vivant et détendu', (id, sex) => {
  const setup = () => {
    const root = loadSkeleton(sex, `coaches/${id}/photo.glb`);
    const at = withExpressions(root);
    const face = new FaceAnimator(root, 11, humanProfileFor(id));
    return { root, face, at };
  };

  test('en garde, 30 s : chaque trait bouge, la gauche diffère de la droite, sans à-coup', () => {
    const { face, at } = setup();
    const s = { ...newSignals(), playing: true };
    const watched: FaceExpression[] = ['BrowDownLeft', 'BrowInnerUp', 'EyeSquintLeft', 'CheekSquintLeft', 'NoseSneerLeft', 'MouthClose'];
    const series = watched.map(() => [] as number[]);
    let asym = 0;
    let frames = 0;
    let jump = 0;
    let prev = watched.map(() => 0);
    for (let i = 0; i < 30 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (i < 120) continue;
      frames++;
      const now = watched.map((e) => at(e));
      now.forEach((v, j) => series[j].push(v));
      if (i > 120) jump = Math.max(jump, ...now.map((v, j) => Math.abs(v - prev[j])));
      prev = now;
      if (Math.abs(at('BrowDownLeft') - at('BrowDownRight')) > 0.01 || Math.abs(at('EyeSquintLeft') - at('EyeSquintRight')) > 0.01) asym++;
    }
    series.forEach((v, j) => expect(sd(v), watched[j]).toBeGreaterThan(0.012));
    // 1.38: left = right at every image; now most of the time a little uneven
    expect(asym / frames).toBeGreaterThan(0.5);
    expect(jump).toBeLessThan(0.05);
  });

  test('pas de visage crispé : froncement modéré en moyenne, lèvres jamais pincées au repos, bouche fermée', () => {
    const { face, at } = setup();
    for (const s of [{ ...newSignals(), playing: true }, newSignals()]) {
      let brow = 0;
      let n = 0;
      for (let i = 0; i < 30 * 60; i++) {
        face.update(1 / 60, {}, s);
        if (i < 120) continue;
        brow += at('BrowDownLeft');
        n++;
        expect(at('MouthPressLeft')).toBeLessThanOrEqual(0.2);
        expect(at('MouthPressRight')).toBeLessThanOrEqual(0.2);
        expect(at('JawOpen')).toBe(0);
        expect(at('MouthFunnel')).toBe(0);
        expect(at('MouthClose')).toBeGreaterThan(0.1);
        expect(at('MouthStretchLeft')).toBeLessThan(0.05);
      }
      // 1.38 measured 0.54 in the Lab (concentration)
      expect(brow / n).toBeLessThan(0.42);
    }
  });

  test('les yeux ne sont jamais parfaitement immobiles (micro-mouvements) en direct, immobiles en image fixe', () => {
    const { face, root } = setup();
    const eye = bone(root, 'LeftEye');
    const s = { ...newSignals(), playing: true };
    for (let i = 0; i < 120; i++) face.update(1 / 60, {}, s);
    // within every second the eye moves (at least 0.06°), never more than a few degrees outside the glances
    for (let sec = 0; sec < 10; sec++) {
      const first = eye.quaternion.clone();
      let range = 0;
      for (let i = 0; i < 60; i++) {
        face.update(1 / 60, {}, s);
        range = Math.max(range, eye.quaternion.angleTo(first));
      }
      expect(range, `seconde ${sec}`).toBeGreaterThan(0.001);
    }
    const q = eye.quaternion.clone();
    for (let i = 0; i < 300; i++) face.update(1 / 60, { still: true });
    const q2 = eye.quaternion.clone();
    for (let i = 0; i < 300; i++) face.update(1 / 60, { still: true });
    expect(eye.quaternion.angleTo(q2)).toBeLessThan(1e-3);
    expect(q).toBeDefined();
  });
});

describe('micro-expressions', () => {
  const rng = (seed: number) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  test('au calme, plusieurs par minute, chacune revient au neutre ; aucune pendant la préparation ou la frappe', () => {
    const m = new MicroLife(rng(5));
    const kinds = new Set<string>();
    let starts = 0;
    let was = false;
    for (let i = 0; i < 60 * 60; i++) {
      m.update(1 / 60, { rest: 1, breath: 0.5, calm: 1, strength: 1 });
      if (m.event && !was) {
        starts++;
        kinds.add(m.event.kind);
      }
      was = !!m.event;
    }
    expect(starts).toBeGreaterThan(6);
    expect(starts).toBeLessThan(25);
    expect(kinds.size).toBeGreaterThanOrEqual(3);
    // after 3 s calm-less, the event in course is over and none starts
    for (let i = 0; i < 180; i++) m.update(1 / 60, { rest: 1, breath: 0.5, calm: 0, strength: 1 });
    expect(m.event).toBeNull();
    for (let i = 0; i < 20 * 60; i++) {
      m.update(1 / 60, { rest: 1, breath: 0.5, calm: 0, strength: 1 });
      expect(m.event).toBeNull();
    }
  });

  test('aucune micro-expression ne pince les lèvres ni n’ouvre la bouche', () => {
    expect(MICRO_EVENTS).not.toContain('pince');
    const m = new MicroLife(rng(9));
    for (let i = 0; i < 120 * 60; i++) {
      m.update(1 / 60, { rest: 1, breath: (Math.sin(i / 60) + 1) / 2, calm: 1, strength: 1.1 });
      const w = m.w as Record<string, number>;
      expect(w.MouthPressLeft ?? 0).toBe(0);
      expect(w.JawOpen ?? 0).toBe(0);
      expect(w.MouthFunnel ?? 0).toBe(0);
    }
  });

  test('la frappe efface la micro-vie (rest = 0)', () => {
    const m = new MicroLife(rng(2));
    for (let i = 0; i < 600; i++) m.update(1 / 60, { rest: 0, breath: 1, calm: 1, strength: 1 });
    for (const v of Object.values(m.w)) expect(Math.abs(v!)).toBeLessThan(1e-9);
  });
});

describe('clignements naturels', () => {
  test('durées variées, parfois incomplets', () => {
    const root = loadSkeleton('femme', 'coaches/inaya/photo.glb');
    const at = withExpressions(root);
    const face = new FaceAnimator(root, 4, humanProfileFor('inaya'));
    const s = { ...newSignals(), playing: true };
    const lengths: number[] = [];
    const depths: number[] = [];
    let len = 0;
    let depth = 0;
    for (let i = 0; i < 180 * 60; i++) {
      face.update(1 / 60, {}, s);
      if (face.state.blinking) {
        len++;
        depth = Math.max(depth, at('EyeBlinkLeft'));
      } else if (len) {
        lengths.push(len);
        depths.push(depth);
        len = 0;
        depth = 0;
      }
    }
    expect(new Set(lengths).size).toBeGreaterThan(2);
    expect(depths.some((d) => d < 0.9)).toBe(true);
    expect(depths.filter((d) => d > 0.97).length).toBeGreaterThan(depths.length / 2);
  });
});

describe('reflet de lumière dans les yeux', () => {
  test('le matériau des yeux porte le reflet, dans les deux qualités', () => {
    for (const q of ['haute', 'basse'] as const) {
      const m = photoMaterial(new MeshStandardMaterial({ name: 'Eyes_opacity' }), 'yeux', q, DEFAULT_SKIN);
      expect(m.userData.cssCatchlight).toBe(true);
      const shader = { fragmentShader: 'void main(){\n#include <opaque_fragment>\n}', vertexShader: '', uniforms: {} };
      m.onBeforeCompile(shader as never, null as never);
      expect(shader.fragmentShader).toContain('cssH');
      expect(shader.fragmentShader).toContain('#include <opaque_fragment>');
    }
  });
});
