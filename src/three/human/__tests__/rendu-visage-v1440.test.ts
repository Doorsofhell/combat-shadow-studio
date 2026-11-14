import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Camera, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { DEFAULT_SKIN } from '../../skinShader';
import { photoMaterial } from '../../photoMaterials';
import { Exertion, FACE_RENDER, isHeadSkin, newFaceRenderUniforms, updateFaceRender } from '../faceRender';

/**
 * 1.44 (Youssef 14/11 15:01 « léger et naturel », 16:49 « Go déploiement »; 13/11 22:36 « humaniser ne veut pas dire
 * rajouter des traits visibles »): the rendering of a living face on the five coaches. Lid shade on the eyes, light
 * through the thin parts, flush then sweat with the session. Soft zones only, never a line.
 */
const COACHES = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor'];

function materialNames(id: string) {
  const b = readFileSync(resolve(__dirname, `../../../../public/coaches/${id}/photo.glb`));
  const n = b.readUInt32LE(12);
  const j = JSON.parse(b.subarray(20, 20 + n).toString('utf8')) as { materials: { name: string }[] };
  return j.materials.map((m) => m.name);
}

const compile = (m: MeshStandardMaterial) => {
  const shader = {
    vertexShader: '',
    uniforms: {} as Record<string, unknown>,
    fragmentShader: 'void main(){\n#include <common>\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <lights_physical_pars_fragment>\n#include <lights_fragment_begin>\n#include <opaque_fragment>\n}',
  };
  m.onBeforeCompile(shader as never, null as never);
  return shader;
};

describe('rendu du visage : effort de la séance', () => {
  test('la rougeur monte avec l’effort, la brillance vient après, tout redescend au repos', () => {
    const e = new Exertion();
    let flushAt = -1;
    let sheenAt = -1;
    for (let i = 0; i < 240 * 60; i++) {
      e.update(1 / 60, 0.6);
      if (flushAt < 0 && e.flush > 0.5) flushAt = i / 60;
      if (sheenAt < 0 && e.sheen > 0.5) sheenAt = i / 60;
    }
    expect(flushAt).toBeGreaterThan(20);
    expect(sheenAt).toBeGreaterThan(flushAt);
    expect(e.level).toBeGreaterThan(0.95);
    for (let i = 0; i < 180 * 60; i++) e.update(1 / 60, 0);
    expect(e.flush).toBe(0);
    expect(e.sheen).toBe(0);
  });

  test('au repos : ni rougeur ni brillance ; « rendu=avant » coupe tout', () => {
    const u = newFaceRenderUniforms();
    const cam = new Camera();
    const e = new Exertion();
    updateFaceRender(u, e, new Quaternion(), new Vector3(0, 1, 0), cam);
    expect(u.cssFace.value.x).toBe(0);
    expect(u.cssFace.value.y).toBe(0);
    expect(u.cssFace.value.z).toBe(FACE_RENDER.thin);
    e.level = 1;
    updateFaceRender(u, e, new Quaternion(), new Vector3(0, 1, 0), cam, true);
    expect(u.cssFace.value.toArray()).toEqual([0, 0, 0, 0]);
    expect(u.cssLidShade.value).toBe(0);
  });

  test('léger : rougeur et ombre de paupière bornées', () => {
    expect(FACE_RENDER.flush).toBeLessThanOrEqual(0.5);
    expect(FACE_RENDER.lidShade).toBeLessThanOrEqual(0.3);
    expect(FACE_RENDER.sheen).toBeLessThanOrEqual(0.15);
  });
});

describe.each(COACHES)('%s : peau de la tête et yeux', (id) => {
  test('le modèle a une peau de tête reconnue, la zone du visage ne va que sur elle', () => {
    const names = materialNames(id);
    expect(names.filter((n) => isHeadSkin({ name: n }))).toHaveLength(1);
    for (const q of ['haute', 'basse'] as const)
      for (const n of names.filter((x) => x !== 'Eyes_opacity')) {
        const m = photoMaterial(new MeshStandardMaterial({ name: n }), 'peau', q, DEFAULT_SKIN);
        expect(!!m.userData.cssFaceSkin, n).toBe(isHeadSkin({ name: n }));
        const s = compile(m);
        if (isHeadSkin({ name: n })) {
          expect(s.fragmentShader).toContain('cssBlob');
          expect(s.uniforms.cssFace).toBeDefined();
          expect(m.customProgramCacheKey()).toContain('face144');
        } else expect(s.fragmentShader).not.toContain('cssBlob');
      }
  });
});

describe('rien de dessiné sur la peau', () => {
  test('les zones du visage sont des masques doux (gaussiennes), sans bord ni ligne', () => {
    const src = readFileSync(resolve(__dirname, '../../skinShader.ts'), 'utf8');
    const body = src.slice(src.indexOf('const FACE_BODY'), src.indexOf('export function applySkinShader'));
    expect(body).toContain('cssBlob');
    // no hard edge (step), no repetition (fract, sin, cos: the lines of the 1.40 wrinkles)
    for (const bad of ['step(', 'fract(', 'sin(', 'cos(']) expect(body, bad).not.toContain(bad);
  });

  test('yeux : l’ombre de la paupière est dans le shader des yeux, dans les deux qualités', () => {
    for (const q of ['haute', 'basse'] as const) {
      const m = photoMaterial(new MeshStandardMaterial({ name: 'Eyes_opacity' }), 'yeux', q, DEFAULT_SKIN);
      const s = compile(m);
      expect(s.fragmentShader).toContain('cssLidShade');
      expect(s.uniforms.cssEyeUp).toBeDefined();
    }
  });
});
