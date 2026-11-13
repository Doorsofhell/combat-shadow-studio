import { describe, expect, it } from 'vitest';
import { CATEGORY_LABEL, techniquesFor } from '../../../domain/techniques';
import { filterTechniques } from '../../../domain/kickboxingStyles';
import { neighbours, parseTechniqueFilter, sheetQuery, techniqueCatalogue } from '../techniqueOrder';

const CATS = Object.keys(CATEGORY_LABEL);

describe('technique sheet order (previous / next)', () => {
  it('neighbours in the middle, at both ends, and outside the list', () => {
    const ids = ['a', 'b', 'c'];
    expect(neighbours(ids, 'b')).toEqual({ index: 1, total: 3, prev: 'a', next: 'c' });
    expect(neighbours(ids, 'a')).toEqual({ index: 0, total: 3, prev: undefined, next: 'b' });
    expect(neighbours(ids, 'c')).toEqual({ index: 2, total: 3, prev: 'b', next: undefined });
    expect(neighbours(['a'], 'a')).toEqual({ index: 0, total: 1, prev: undefined, next: undefined });
    expect(neighbours(ids, 'z')).toBeNull();
  });

  it('follows the catalogue: discipline, kick-boxing style, category, « À revoir »', () => {
    const all = techniqueCatalogue('boxe', 'tous', 'tout', {});
    expect(all.map((t) => t.id)).toEqual(techniquesFor('boxe').map((t) => t.id));
    const cat = all[0].category;
    const filtered = techniqueCatalogue('boxe', 'tous', cat, {});
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.category === cat)).toBe(true);
    const review = techniqueCatalogue('boxe', 'tous', 'a-revoir', { [all[2].id]: 'a-revoir', [all[0].id]: 'a-revoir', [all[1].id]: 'acquise' });
    expect(review.map((t) => t.id)).toEqual([all[0].id, all[2].id]);
    for (const style of ['k1', 'full-contact'] as const) {
      expect(techniqueCatalogue('kickboxing', style, 'tout', {}).map((t) => t.id)).toEqual(filterTechniques(techniquesFor('kickboxing'), 'kickboxing', style).map((t) => t.id));
    }
  });

  it('reads and writes the filter carried by the URL', () => {
    expect(parseTechniqueFilter(null, CATS)).toBe('tout');
    expect(parseTechniqueFilter('nimporte', CATS)).toBe('tout');
    expect(parseTechniqueFilter('a-revoir', CATS)).toBe('a-revoir');
    expect(parseTechniqueFilter(CATS[0], CATS)).toBe(CATS[0]);
    expect(sheetQuery('boxe', 'tout')).toBe('?d=boxe');
    expect(sheetQuery('mma', 'a-revoir')).toBe('?d=mma&cat=a-revoir');
  });
});
