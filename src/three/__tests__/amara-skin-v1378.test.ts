import { describe, expect, test } from 'vitest';
import { MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three';
import { photoMaterial, skinLookFor } from '../photoMaterials';

describe('Amara v1.37.8 — correction optique isolée, sans géométrie', () => {
  const path = (id: string) => `/coaches/${id}/photo.glb`;

  test('only Amara receives the subtle contrast and relief update', () => {
    const amara = skinLookFor(path('mma-amara'));
    // 2.4.0 prototype 2 (Youssef 20/11 14:30, journal 2.4.0) : relief 1,21 -> 1,0 (pas d'ombres musculaires cuites)
    expect(amara.relief).toBe(1.0);
    expect(amara.wrap).toBe(0.43);
    expect(amara.shadowLift).toBe(0.36);
    expect(amara.pores).toBe(0.03);
    expect(amara.sat).toBe(0.84);
    expect(amara.gain).toBe(1.06);
    expect(amara.warm).toBe(-0.07);
  });

  test('Kadir, Nael and Inaya keep the previous skin profile', () => {
    const kadir = skinLookFor(path('mma-kadir'));
    expect([kadir.relief, kadir.pores, kadir.wrap, kadir.shadowLift]).toEqual([1.2, 0.035, 0.45, 0.36]);
    const nael = skinLookFor(path('nael'));
    expect([nael.relief, nael.pores, nael.wrap, nael.shadowLift]).toEqual([1.2, 0.035, 0.45, 0.34]);
    const inaya = skinLookFor(path('inaya'));
    // 2.4.0 prototype 2 (Youssef 25/11, maquette des femmes, « fais mieux ») : peau d'Inaya plus claire et unie, ombres
    // plus douces, toujours un léger hâle (bronzage-inaya-v1170) ; avant : [1.15, 0.03, 0.45, 0.32] et [1.12, 0.8, 0.12]
    expect([inaya.relief, inaya.pores, inaya.wrap, inaya.shadowLift]).toEqual([1.0, 0.025, 0.48, 0.4]);
    expect([inaya.sat, inaya.gain, inaya.warm]).toEqual([1.0, 0.92, 0.03]);
  });

  test.each(['haute', 'basse'] as const)('normal map relief is adjusted only in %s, preserving the source material', (quality) => {
    const source = new MeshStandardMaterial({ normalScale: new Vector2(0.8, 0.6) });
    const amara = photoMaterial(source, 'peau', quality, skinLookFor(path('mma-amara')));
    const inaya = photoMaterial(source, 'peau', quality, skinLookFor(path('inaya')));
    expect(amara.normalScale.x).toBeCloseTo(0.8 * 1.0);
    expect(amara.normalScale.y).toBeCloseTo(0.6 * 1.0);
    expect(inaya.normalScale.x).toBeCloseTo(0.8 * 1.0);
    expect(source.normalScale.x).toBe(0.8);
    expect(source.normalScale.y).toBe(0.6);
    if (quality === 'haute') expect(amara).toBeInstanceOf(MeshPhysicalMaterial);
    source.dispose();
    amara.dispose();
    inaya.dispose();
  });
});
