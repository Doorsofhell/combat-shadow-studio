import { describe, expect, test } from 'vitest';
import { MeshStandardMaterial, Vector2 } from 'three';
import { DEFAULT_SKIN } from '../skinShader';
import { photoMaterial, skinLookFor } from '../photoMaterials';
import { dressOutfitMaterial } from '../outfit';

/** 1.47.1: optical-only pilot; no changes to body, rig, clothes geometry or other coaches. */
describe('Amara 1.47.1 — isolated semi-realistic material pilot', () => {
  const amara = skinLookFor('/coaches/mma-amara/photo-clean.glb');
  test('preserves the established 1.47 anatomy/colour/lighting profile', () => {
    expect(amara.relief).toBe(1.21);
    expect(amara.pores).toBe(0.03);
    expect(amara.wrap).toBe(0.43);
    expect(amara.shadowLift).toBe(0.33);
    expect(amara.sat).toBeUndefined();
    expect(amara.gain).toBeUndefined();
    expect(amara.warm).toBeUndefined();
  });
  test('introduces only restrained skin optical variation', () => {
    expect(amara.roughVar).toBe(0.15);
    expect(amara.tintVar).toBe(0.055);
    expect(amara.roughVar).toBeGreaterThan(DEFAULT_SKIN.roughVar);
  });
  test.each(['mma-kadir', 'nael', 'inaya', 'victor'])('%s retains independent skin values', (id) => {
    const profile = skinLookFor(`/coaches/${id}/photo.glb`);
    expect(profile).not.toBe(amara);
    expect(profile.roughVar).toBe(DEFAULT_SKIN.roughVar);
    expect(profile.tintVar).toBe(DEFAULT_SKIN.tintVar);
  });
  test.each(['haute', 'basse'] as const)('clones skin material without mutating source (%s)', (quality) => {
    const src = new MeshStandardMaterial({ roughness: 0.58, normalScale: new Vector2(1, 1) });
    const revised = photoMaterial(src, 'peau', quality, amara);
    expect(src.roughness).toBe(0.58);
    expect(src.normalScale.x).toBe(1);
    expect(revised.normalScale.x).toBeCloseTo(1.21);
    revised.dispose(); src.dispose();
  });
  test('does not change cached source clothing materials', () => {
    const src = new MeshStandardMaterial({ roughness: 0.62 });
    src.name = 'short-mma';
    src.userData = { css_fabric: 'serge', css_sheen: 0.2 };
    const amaraCloth = dressOutfitMaterial(src, 'haute', true);
    expect(src.roughness).toBe(0.62);
    expect(amaraCloth).not.toBe(src);
    amaraCloth.dispose(); src.dispose();
  });
});
