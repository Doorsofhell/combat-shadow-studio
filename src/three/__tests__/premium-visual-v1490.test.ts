import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, Texture } from 'three';
import { photoMaterial, skinLookFor } from '../photoMaterials';

const coaches = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
describe('1.49.0 premium optical pilot, no geometry or shader changes', () => {
  test.each(coaches)('%s: high quality skin/eyes/hair are individually enhanced', id => {
    const look = skinLookFor('/coaches/' + id + '/photo.glb');
    const head = new MeshStandardMaterial({ roughness: 0.58 });
    head.name = 'm021_head';
    const eye = new MeshStandardMaterial();
    eye.name = 'Eyes_opacity';
    const hair = new MeshStandardMaterial({ roughness: 0.75 });
    hair.name = 'Hair_opacity';
    const skin = photoMaterial(head, 'peau', 'haute', look) as MeshPhysicalMaterial;
    const eyes = photoMaterial(eye, 'yeux', 'haute', look) as MeshPhysicalMaterial;
    const hairMat = photoMaterial(hair, 'cheveux', 'haute', look);
    expect(skin.userData.cssPremium149).toBe(true);
    expect(skin.userData.cssPremiumFinish).toBe(true);
    expect(eyes.userData.cssPremium149).toBe(true);
    expect(hairMat.userData.cssPremium149).toBe(true);
    expect(eyes.roughness).toBeLessThan(0.20);
    expect(skin.specularIntensity).toBeLessThan(0.40);
    expect(skin.userData.cssNeckToneApplied).toBeUndefined();
    expect(head.roughness).toBe(0.58);
    for (const m of [head, eye, hair, skin, eyes, hairMat]) m.dispose();
  });

  test('texture filtering improves only in high quality without changing source pixels', () => {
    const tex = new Texture();
    tex.anisotropy = 1;
    const source = new MeshStandardMaterial({ map: tex });
    source.name = 'm021_body';
    const look = skinLookFor('/coaches/victor/photo.glb');
    const out = photoMaterial(source, 'peau', 'haute', look);
    expect(tex.anisotropy).toBe(8);
    expect(out.map).toBe(tex);
    expect(out.normalScale.x).toBeCloseTo(look.relief);
    expect(source.roughness).toBe(1);
    expect(out.userData.cssVictorBodyClean).toBe(true);
    out.dispose(); source.dispose(); tex.dispose();
  });

  test('fallback/low-quality profile does not acquire new high-end finish', () => {
    const old = new MeshStandardMaterial();
    old.name = 'm021_head';
    const look = skinLookFor('/coaches/not-in-production/photo.glb');
    const high = photoMaterial(old, 'peau', 'haute', look);
    const low = photoMaterial(old, 'peau', 'basse', skinLookFor('/coaches/mma-kadir/photo.glb'));
    expect(high.userData.cssPremium149).toBeUndefined();
    expect(low.userData.cssPremium149).toBeUndefined();
    expect(high.userData.cssNeckToneApplied).toBeUndefined();
    high.dispose(); low.dispose(); old.dispose();
  });
});
