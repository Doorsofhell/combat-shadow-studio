import { describe, expect, it } from 'vitest';
import ref from '../reference/manifest.json';
// @ts-expect-error plain ES module script, no types
import { manifest } from '../../../../scripts/coach-reference.mjs';

// v0.42 (Youssef, « Architecture humanoïde évolutive » §3, §5.1, §21-A): Kadir, Amara and the validated movements
// are untouchable. Their models, textures, outfits, looks, stances and the movement library are fingerprinted
// (taken on v0.41.0, before any change); any difference fails here.
describe('références intouchables (Kadir, Amara, mouvements validés)', () => {
  it('aucun fichier de référence n’a changé', () => {
    const now = manifest() as Record<string, string>;
    expect(Object.keys(now).sort()).toEqual(Object.keys(ref.files).sort());
    for (const [f, h] of Object.entries(ref.files)) expect(now[f], f).toBe(h);
  });
});
