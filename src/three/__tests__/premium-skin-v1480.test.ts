import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import { photoMaterial, PREMIUM_FINISH, SKIN_LOOK, skinLookFor } from '../photoMaterials';

describe('1.48.0 premium skin: isolated per-coach calibration', () => {
  const ids = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor'] as const;
  test.each(ids)('%s uses a dedicated high quality skin, eye and hair finish', id => {
    const look = skinLookFor('/coaches/' + id + '/photo.glb');
    const finish = PREMIUM_FINISH[id]!;
    expect(look).toBe(SKIN_LOOK[id]);
    expect(finish).toBeDefined();
    const body = new MeshStandardMaterial();
    body.name = 'm021_body';
    const head = new MeshStandardMaterial();
    head.name = 'm021_head';
    const eye = new MeshStandardMaterial();
    eye.name = 'Eyes_opacity';
    const hair = new MeshStandardMaterial({ roughness: 0.8 });
    hair.name = 'Hair_opacity';
    const b = photoMaterial(body, 'peau', 'haute', look) as MeshPhysicalMaterial;
    const h = photoMaterial(head, 'peau', 'haute', look) as MeshPhysicalMaterial;
    const e = photoMaterial(eye, 'yeux', 'haute', look) as MeshPhysicalMaterial;
    const t = photoMaterial(hair, 'cheveux', 'haute', look);
    expect(b.userData.cssPremiumFinish).toBe(true);
    expect(h.userData.cssPremiumFinish).toBe(true);
    expect(b.sheen).toBe(finish.bodySheen);
    expect(h.sheen).toBe(finish.faceSheen);
    expect(e.userData.cssPremiumEyes).toBe(true);
    expect(e.roughness).toBe(finish.eyeRoughness);
    expect(t.roughness).toBeCloseTo(Math.max(0.49, 0.8 * finish.hairScale));
    expect(body.roughness).toBe(1);
    expect(hair.roughness).toBe(0.8);
    for (const m of [body, head, eye, hair, b, h, e, t]) m.dispose();
  });

  test('Victor has isolated body-only stain attenuation, not on his face or other coaches', () => {
    const victor = SKIN_LOOK.victor;
    const kadir = SKIN_LOOK['mma-kadir'];
    const body = new MeshStandardMaterial(); body.name = 'm021_body';
    const head = new MeshStandardMaterial(); head.name = 'm021_head';
    const vb = photoMaterial(body, 'peau', 'haute', victor);
    const vh = photoMaterial(head, 'peau', 'haute', victor);
    const kb = photoMaterial(body, 'peau', 'haute', kadir);
    expect(victor.cleanBody).toBe(true);
    expect(vb.userData.cssVictorBodyClean).toBe(true);
    expect(vh.userData.cssVictorBodyClean).toBeUndefined();
    expect(kb.userData.cssVictorBodyClean).toBeUndefined();
    expect(vb.customProgramCacheKey()).toContain('victor-clean148');
    expect(vh.customProgramCacheKey()).not.toContain('victor-clean148');
    expect(kb.customProgramCacheKey()).not.toContain('victor-clean148');
    for (const m of [body, head, vb, vh, kb]) m.dispose();
  });

  test('legacy or unknown skin defaults unchanged', () => {
    const fallback = skinLookFor('/coaches/not-in-production/photo.glb');
    expect(fallback).not.toBe(SKIN_LOOK.victor);
    expect(fallback.cleanBody).toBeUndefined();
    const src = new MeshStandardMaterial();
    src.name = 'head';
    const m = photoMaterial(src, 'peau', 'haute', fallback) as MeshPhysicalMaterial;
    expect(m.userData.cssPremiumFinish).toBeUndefined();
    src.dispose(); m.dispose();
  });
});
