import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three';
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
    expect(profile.roughVar).toBeGreaterThan(0);
    expect(profile.tintVar).toBeGreaterThan(0);
  });
  test.each(['haute', 'basse'] as const)('clones skin material without mutating source (%s)', (quality) => {
    const src = new MeshStandardMaterial({ roughness: 0.58, normalScale: new Vector2(1, 1) });
    const revised = photoMaterial(src, 'peau', quality, amara);
    expect(src.roughness).toBe(0.58);
    expect(src.normalScale.x).toBe(1);
    expect(revised.normalScale.x).toBeCloseTo(1.21);
    revised.dispose(); src.dispose();
  });
  test('face-only natural finish preserves body and other coaches', () => {
    const head = new MeshStandardMaterial({ roughness: 0.58 });
    head.name = 'f021_head';
    const body = new MeshStandardMaterial({ roughness: 0.58 });
    body.name = 'f021_body';
    const face = photoMaterial(head, 'peau', 'haute', amara) as MeshPhysicalMaterial;
    const torso = photoMaterial(body, 'peau', 'haute', amara) as MeshPhysicalMaterial;
    const other = photoMaterial(head, 'peau', 'haute', skinLookFor('/coaches/inaya/photo.glb')) as MeshPhysicalMaterial;
    expect(face.userData.cssAmaraFaceFinish).toBe(true);
    expect(face.sheen).toBe(0.14);
    expect(face.sheenRoughness).toBe(0.79);
    expect(face.specularIntensity).toBeCloseTo(0.30);
    expect(torso.userData.cssAmaraFaceFinish).toBeUndefined();
    expect(torso.userData.cssAmaraBodyFinish).toBe(true);
    expect(torso.specularIntensity).toBeCloseTo(0.31);
    expect(other.userData.cssAmaraFaceFinish).toBeUndefined();
    expect(head.roughness).toBe(0.58);
    face.dispose(); torso.dispose(); other.dispose(); head.dispose(); body.dispose();
  });
  test('premium eyes only on Amara in high quality', () => {
    const src = new MeshStandardMaterial({ roughness: 0.7 });
    const a = photoMaterial(src, 'yeux', 'haute', amara) as MeshPhysicalMaterial;
    const other = photoMaterial(src, 'yeux', 'haute', skinLookFor('/coaches/mma-kadir/photo.glb')) as MeshPhysicalMaterial;
    expect(a.roughness).toBeCloseTo(0.165);
    expect(a.clearcoatRoughness).toBe(0.038);
    expect(other.roughness).toBeCloseTo(0.175);
    expect(other.clearcoatRoughness).toBe(0.038);
    expect(src.roughness).toBe(0.7);
    a.dispose(); other.dispose(); src.dispose();
  });
  test('hair highlights only on Amara; alpha and source unchanged', () => {
    const src = new MeshStandardMaterial({ roughness: 0.65 });
    const a = photoMaterial(src, 'cheveux', 'haute', amara);
    const other = photoMaterial(src, 'cheveux', 'haute', skinLookFor('/coaches/inaya/photo.glb'));
    expect(a.roughness).toBeCloseTo(0.65 * 0.92 * 0.94);
    expect(other.roughness).toBeCloseTo(0.65 * 0.97 * 0.94);
    expect(a.alphaTest).toBe(0.4);
    expect(a.depthWrite).toBe(true);
    expect(src.roughness).toBe(0.65);
    a.dispose(); other.dispose(); src.dispose();
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
