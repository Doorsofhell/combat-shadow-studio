import { describe, expect, test } from 'vitest';
import { SkinnedMesh, MeshStandardMaterial, ShaderLib } from 'three';
import { Breath, applyBreath } from '../breath';
import { loadSkinnedBody } from '../../test/skin';

/** 1.10 breathing (src/three/breath.ts): discreet, steady through pauses, an exhale on the strikes, on all coaches */
describe('respiration', () => {
  test('amplitude discrète, rythme de repos ≈ 14/min, aucun saut sur une pause ou un ralenti', () => {
    const b = new Breath();
    let crossings = 0;
    let prev = b.amount.value.x;
    for (let i = 0; i < 60 * 60; i++) {
      b.update(1 / 60, 0);
      const x = b.amount.value.x;
      expect(Math.abs(x)).toBeLessThanOrEqual(1.0001);
      if (prev < 0 && x >= 0) crossings++;
      prev = x;
    }
    // 60 s at rest: 12 to 16 breaths
    expect(crossings).toBeGreaterThanOrEqual(12);
    expect(crossings).toBeLessThanOrEqual(16);
    // a frozen tab for 3 s (dt = 3) moves the cycle by one clamped step only
    const before = b.amount.value.x;
    b.update(3, 0);
    expect(Math.abs(b.amount.value.x - before)).toBeLessThan(0.1);
  });
  test('expiration au pic de la frappe', () => {
    const b = new Breath();
    for (let i = 0; i < 30; i++) b.update(1 / 60, 0.1);
    b.update(1 / 60, 0.9);
    expect(b.amount.value.x).toBeLessThan(-0.8);
  });
  for (const id of ['mma-kadir', 'mma-amara', 'axel', 'kaila', 'nael', 'inaya'])
    test(`${id} : centres lus sur le squelette, amplitude de quelques millimètres`, () => {
      const body = loadSkinnedBody(`coaches/${id}/photo.glb`, 50);
      let mesh: SkinnedMesh | null = null;
      body.root.traverse((o) => {
        if ((o as SkinnedMesh).isSkinnedMesh) mesh = o as SkinnedMesh;
      });
      const u = new Breath().uniformsFor(mesh!)!;
      expect(u).toBeTruthy();
      const amp = u.cssBreathAmp.value.x;
      const span = u.cssBreathChest.value.w / 0.95;
      // 2 to 3 % of the Spine2-Neck span (about 3 to 5 mm)
      expect(amp / span).toBeGreaterThan(0.02);
      expect(amp / span).toBeLessThan(0.035);
      const m = new MeshStandardMaterial();
      applyBreath(m, u);
      const shader = { uniforms: {}, vertexShader: ShaderLib.standard.vertexShader, fragmentShader: '' };
      m.onBeforeCompile(shader as never, undefined as never);
      expect(shader.vertexShader).toContain('cssBreathAmp.x * cssWc');
      // bind-space normal, never the already skinned objectNormal (posed twice: cloth thrown away in the jab, 1.10)
      expect(shader.vertexShader).toContain('transformed += normalize(normal) *');
      expect(shader.vertexShader).not.toMatch(/transformed \+= objectNormal/);
      expect(m.customProgramCacheKey()).toContain('css-breath');
    });
});
