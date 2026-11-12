import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three';
import { dressOutfitMaterial } from '../outfit';

function material(name: string, fabric: string) {
  const m = new MeshStandardMaterial({
    color: '#2474ac',
    metalness: 0.3,
    roughness: 0.52,
    normalScale: new Vector2(1, 1),
  });
  m.name = name;
  m.userData = { css_fabric: fabric, css_sheen: 0.35, css_coat: 0.2 };
  return m;
}

describe('v1.37.1 : rendu de vêtements réaliste', () => {
  test('rashguard : mat, relief modéré et pas de vernis en haute qualité', () => {
    const src = material('haut-rash-long-bleu', 'jersey');
    const m = dressOutfitMaterial(src, 'haute');
    expect(m).toBeInstanceOf(MeshPhysicalMaterial);
    const cloth = m as MeshPhysicalMaterial;
    expect(cloth.roughness).toBeGreaterThanOrEqual(0.8);
    expect(cloth.metalness).toBe(0);
    expect(cloth.sheen).toBeLessThanOrEqual(0.06);
    expect(cloth.clearcoat).toBe(0);
    expect(cloth.normalScale.x).toBeCloseTo(0.65);
    expect(src.roughness).toBe(0.52);
    expect(src.metalness).toBe(0.3);
    expect(src.normalScale.x).toBe(1);
  });

  test('legging et short de compression : aspect mat même en basse qualité', () => {
    for (const name of ['pantalon-leggings', 'short-vale-tudo-noir', 'short-compression']) {
      const src = material(name, 'jersey');
      const cloth = dressOutfitMaterial(src, 'basse') as MeshStandardMaterial;
      expect(cloth.roughness, name).toBeGreaterThanOrEqual(0.8);
      expect(cloth.metalness).toBe(0);
      expect(cloth.normalScale.x).toBeCloseTo(0.65);
      expect(cloth).not.toBe(src);
      expect(src.roughness).toBe(0.52);
    }
  });

  test('un matériau coton ou cuir conserve sa distinction du jersey', () => {
    for (const fabric of ['judogi', 'perle', 'cuir']) {
      const src = material('matiere-'+fabric, fabric);
      const cloth = dressOutfitMaterial(src, 'haute') as MeshPhysicalMaterial;
      expect(cloth.roughness).toBe(0.52);
      expect(cloth.normalScale.x).toBe(1);
      expect(cloth.clearcoat).toBeCloseTo(0.2);
      expect(src.roughness).toBe(0.52);
    }
  });

  test('la marque est avancée sur le depth buffer sans modifier le matériau du cache', () => {
    const src = material('logo-cs', 'flat');
    const cloth = dressOutfitMaterial(src, 'basse') as MeshStandardMaterial;
    expect(cloth.polygonOffset).toBe(true);
    expect(cloth.polygonOffsetFactor).toBe(-2);
    expect(src.polygonOffset).toBe(false);
  });
});
