import { describe, expect, test } from 'vitest';
import { MeshStandardMaterial, ShaderLib, Texture } from 'three';
import { photoMaterial, SKIN_LOOK } from '../photoMaterials';

// 1.17 (Youssef 04/11 13:52 « peux-tu la bronzer un tout petit peu ? », 13:53 « non juste bronzage »): Inaya's skin
// albedo is graded slightly darker and warmer; the other coaches keep their painted skin, untouched.
describe('bronzage léger d’Inaya', () => {
  test('Inaya : un peu plus foncée et plus chaude, dans des limites modestes', () => {
    const l = SKIN_LOOK.inaya;
    expect(l.gain).toBeGreaterThanOrEqual(0.75);
    expect(l.gain).toBeLessThan(1);
    expect(l.warm).toBeGreaterThan(0);
    expect(l.warm).toBeLessThanOrEqual(0.2);
    expect(l.sat).toBeGreaterThanOrEqual(1);
    expect(l.sat).toBeLessThanOrEqual(1.2);
  });
  test('les autres coachs ne changent pas', () => {
    for (const [id, l] of Object.entries(SKIN_LOOK)) {
      if (id === 'inaya') continue;
      expect([l.sat ?? 1, l.gain ?? 1, l.warm ?? 0], id).toEqual([1, 1, 0]);
    }
  });
  test('le réglage passe au shader de la peau', () => {
    const m = photoMaterial(new MeshStandardMaterial({ name: 'Skin', map: new Texture() }), 'peau', 'haute', SKIN_LOOK.inaya);
    const shader = { uniforms: {}, fragmentShader: ShaderLib.physical.fragmentShader, vertexShader: '' };
    m.onBeforeCompile(shader as never, undefined as never);
    expect(shader.fragmentShader).toContain('diffuseColor.rgb = cssGradeRgb(diffuseColor.rgb);');
    const g = (shader.uniforms as Record<string, { value: { toArray(): number[] } }>).cssGrade.value.toArray();
    expect(g).toEqual([SKIN_LOOK.inaya.sat, SKIN_LOOK.inaya.gain, SKIN_LOOK.inaya.warm]);
  });
});
