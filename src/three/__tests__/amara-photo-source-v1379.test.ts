import { describe, expect, it } from 'vitest';
import { photoAssetPath } from '../CoachModel';

describe('Amara v1.37.9 source selection, no undressed regression', () => {
  it('loads cleaned skin for all 7 discipline outfits', () => {
    for (const outfit of ['boxe','kickboxing','muaythai','mma','bjj','bjj-nogi','judo'] as const) {
      expect(photoAssetPath('mma-amara', outfit)).toBe('./coaches/mma-amara/photo-clean.glb');
    }
  });
  it('always preserves the unchanged original sportswear when no outfit is selected', () => {
    expect(photoAssetPath('mma-amara', null)).toBe('./coaches/mma-amara/photo.glb');
  });
  it('does not change the skin asset of the other three coaches', () => {
    for (const coach of ['mma-kadir', 'inaya', 'nael']) {
      expect(photoAssetPath(coach, 'mma')).toBe(`./coaches/${coach}/photo.glb`);
      expect(photoAssetPath(coach, null)).toBe(`./coaches/${coach}/photo.glb`);
    }
  });
  it('supports the JSON-wrapped preview format as well as the production GLB', () => {
    expect(photoAssetPath('mma-amara','mma','json')).toBe('./coaches/mma-amara/photo-clean.json');
  });
});
