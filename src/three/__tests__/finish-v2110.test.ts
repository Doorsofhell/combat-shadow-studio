import { describe, expect, it } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, ShaderChunk, ShaderLib, Vector2 } from 'three';
import { applyFinish, COACH_RIM, DEFAULT_RIM, finishKindOf, setCoachRim } from '../finish';

/**
 * 2.11.0 « Humaniser les coachs et leurs tenues » (src/three/finish.ts): edge light, leather, satin, ribs and knit, by
 * the shaders only. Guards: every garment gets the right finish, the logos none, the shader lines it hooks still exist
 * in this three.js, the finish keeps the material's own shader changes, never runs twice, and the leather loses its
 * blotchy highlights (normal map and coat softened).
 */
const compile = (m: MeshStandardMaterial) => {
  const lib = m instanceof MeshPhysicalMaterial ? ShaderLib.physical : ShaderLib.standard;
  const shader = { uniforms: { ...lib.uniforms }, vertexShader: lib.vertexShader, fragmentShader: lib.fragmentShader } as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
  m.onBeforeCompile(shader, undefined as never);
  return shader;
};

describe('2.11.0 finition des coachs et des tenues', () => {
  it('classe chaque matière des tenues (étiquette du générateur ou nom)', () => {
    const k = (name: string, css_fabric?: string) => finishKindOf({ name, userData: css_fabric ? { css_fabric } : {} });
    expect(k('cuir-gant-boxe', 'cuir')).toBe('cuir');
    expect(k('chaussure-v2-#16181D', 'grain')).toBe('cuir');
    expect(k('gant-mma-#1D4E89')).toBe('cuir');
    expect(k('short-boxe-#F4F4F5', 'satin')).toBe('satin');
    expect(k('ceinture-boxe-#1D4E89', 'elastique')).toBe('elastique');
    expect(k('haut-rash-#111', 'jersey')).toBe('tricot');
    expect(k('short-vale-tudo-#24344D')).toBe('tricot');
    expect(k('logo-cs')).toBe('aucun');
    expect(k('veste-judo')).toBe('tissu');
  });

  it('les lignes du shader de three.js que la finition modifie existent toujours', () => {
    for (const lib of [ShaderLib.physical, ShaderLib.standard]) {
      for (const line of ['#include <common>', '#include <normal_fragment_maps>', '#include <opaque_fragment>']) expect(lib.fragmentShader).toContain(line);
      expect(lib.vertexShader).toContain('#include <begin_vertex>');
    }
    expect(ShaderChunk.normal_fragment_begin).toContain('nonPerturbedNormal');
    expect(ShaderChunk.roughnessmap_fragment).toContain('roughnessFactor');
  });

  it('ajoute la lumière de bord et le grain sans effacer les changements propres du matériau', () => {
    const m = new MeshPhysicalMaterial({ name: 'cuir-gant-boxe', userData: { css_fabric: 'cuir' } });
    m.onBeforeCompile = (s) => {
      s.fragmentShader = `// PROPRE\n${s.fragmentShader}`;
    };
    applyFinish(m, finishKindOf(m), true);
    const s = compile(m);
    expect(s.fragmentShader).toContain('// PROPRE');
    expect(s.fragmentShader).toContain('cssRimDir');
    expect(s.fragmentShader).toContain('cssBump(');
    expect(s.fragmentShader).toContain('roughnessFactor = clamp(roughnessFactor + cssRough');
    expect(s.vertexShader).toContain('cssRest = position;');
    expect(s.uniforms.cssRimK).toBe(COACH_RIM.cssRimK);
    expect(m.customProgramCacheKey()).toContain('css-finish2110-cuir-1p');
  });

  it('en qualité basse : la lumière de bord seule, sans motif', () => {
    const m = new MeshStandardMaterial({ name: 'short-boxe', userData: { css_fabric: 'satin' } });
    applyFinish(m, 'satin', false);
    const s = compile(m);
    expect(s.fragmentShader).toContain('cssRimDir');
    expect(s.fragmentShader).not.toContain('cssRough = (');
  });

  it('ne s’applique qu’une fois, jamais aux logos', () => {
    const m = new MeshStandardMaterial({ name: 'short-boxe' });
    applyFinish(m, 'satin', true);
    const once = m.onBeforeCompile;
    applyFinish(m, 'satin', true);
    expect(m.onBeforeCompile).toBe(once);
    const logo = new MeshStandardMaterial({ name: 'logo-cs' });
    const before = logo.onBeforeCompile;
    applyFinish(logo, finishKindOf(logo), true);
    expect(logo.onBeforeCompile).toBe(before);
  });

  it('cuir : reflets taches adoucis (relief de la texture ×0,3, vernis ≤ 0,18 et plus mat)', () => {
    const m = new MeshPhysicalMaterial({ name: 'cuir-gant-boxe', roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35, normalScale: new Vector2(1, 1) });
    applyFinish(m, 'cuir', true);
    expect(m.normalScale.x).toBeCloseTo(0.3);
    expect(m.roughness).toBeGreaterThanOrEqual(0.5);
    expect(m.clearcoat).toBeLessThanOrEqual(0.18);
    expect(m.clearcoatRoughness).toBeGreaterThanOrEqual(0.42);
  });

  it('la salle donne ses couleurs à la lumière de bord, puis le studio la reprend', () => {
    setCoachRim('#ff6b5e', 0.5, '#9cc0ff', 0.25);
    expect(COACH_RIM.cssRimColor.value.getHexString()).toBe('ff6b5e');
    expect(COACH_RIM.cssRimK.value.x).toBe(0.5);
    setCoachRim(DEFAULT_RIM.color, DEFAULT_RIM.k);
    expect(COACH_RIM.cssRimColor.value.getHexString()).toBe('dfe9ff');
    expect(COACH_RIM.cssRimK.value.x).toBe(DEFAULT_RIM.k);
  });
});
