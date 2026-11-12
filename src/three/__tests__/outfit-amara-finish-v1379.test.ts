import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three';
import { dressOutfitMaterial, isAmaraOutfitUrl } from '../outfit';

function mat(name: string, fabric: string, roughness: number, sheen: number) {
  const m = new MeshStandardMaterial({ roughness, metalness: 0.2, normalScale: new Vector2(1, -1) });
  m.name = name;
  m.userData = { css_fabric: fabric, css_sheen: sheen, css_coat: 0 };
  return m;
}

describe('v1.37.9 — finitions réservées aux vêtements Amara', () => {
  test('la sélection est liée au fichier de tenue et non à un modèle photo', () => {
    expect(isAmaraOutfitUrl('./coaches/mma-amara/tenues/mma.glb')).toBe(true);
    expect(isAmaraOutfitUrl('/coaches/mma-amara/tenues/boxe.glb?v=1379')).toBe(true);
    for (const url of ['./coaches/mma-kadir/tenues/mma.glb', './coaches/inaya/tenues/mma.glb',
      './coaches/nael/tenues/mma.glb', './coaches/mma-amara/photo.glb', null]) {
      expect(isAmaraOutfitUrl(url)).toBe(false);
    }
  });

  test.each(['haute', 'basse'] as const)('haut Amara plus mat mais inchangé pour Inaya en %s', (quality) => {
    const src = mat('haut-crop-#141519', 'jersey', 0.62, 0.12);
    const old = dressOutfitMaterial(src, quality) as MeshStandardMaterial;
    const revised = dressOutfitMaterial(src, quality, true) as MeshStandardMaterial;
    expect(old.roughness).toBeCloseTo(0.8);
    expect(revised.roughness).toBeCloseTo(0.86);
    expect(old.normalScale.x).toBeCloseTo(0.65);
    expect(revised.normalScale.x).toBeCloseTo(0.65 * 1.12);
    expect(revised.normalScale.y).toBeCloseTo(-0.65 * 1.12);
    expect(src.roughness).toBe(0.62);
    expect(src.normalScale.x).toBe(1);
    old.dispose(); revised.dispose(); src.dispose();
  });

  test('surshort Amara : moins de reflets et de crêtes de tissu, source préservée', () => {
    const src = mat('short-surshort-#141519', 'serge', 0.64, 0.35);
    const reference = dressOutfitMaterial(src, 'haute') as MeshPhysicalMaterial;
    const amara = dressOutfitMaterial(src, 'haute', true) as MeshPhysicalMaterial;
    expect(reference.sheen).toBeCloseTo(0.35);
    expect(amara.sheen).toBeCloseTo(0.18);
    expect(amara.roughness).toBeGreaterThanOrEqual(0.76);
    expect(amara.normalScale.x).toBeCloseTo(0.84);
    expect(src.roughness).toBe(0.64);
    expect(src.normalScale.x).toBe(1);
    reference.dispose(); amara.dispose(); src.dispose();
  });

  test('ceinture Amara adoucie sans changer le tissu de référence', () => {
    const src = mat('ceinture-mma-#D4AF37', 'elastique', 0.65, 0);
    const a = dressOutfitMaterial(src, 'basse', true) as MeshStandardMaterial;
    const ref = dressOutfitMaterial(src, 'basse') as MeshStandardMaterial;
    expect(a.roughness).toBeCloseTo(0.79);
    expect(a.normalScale.x).toBeCloseTo(0.80);
    expect(ref.roughness).toBe(0.65);
    expect(ref.normalScale.x).toBe(1);
    src.dispose(); a.dispose(); ref.dispose();
  });

  test('logo et gi restent strictement identiques même pour Amara', () => {
    for (const name of ['logo-cs', 'veste-judo-#ffffff']) {
      const src = mat(name, 'judogi', 0.48, 0.15);
      const a = dressOutfitMaterial(src, 'haute', true) as MeshPhysicalMaterial;
      const ref = dressOutfitMaterial(src, 'haute') as MeshPhysicalMaterial;
      expect(a.roughness).toBe(ref.roughness);
      expect(a.sheen).toBe(ref.sheen);
      expect(a.normalScale.x).toBe(ref.normalScale.x);
      src.dispose(); a.dispose(); ref.dispose();
    }
  });
});
