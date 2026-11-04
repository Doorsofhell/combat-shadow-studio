import { describe, expect, test } from 'vitest';
import { readGlb } from '../../test/glbRead';

/**
 * 1.14 (Youssef, 04/11: « mets à Inaya une brassière moulante pleine pour masquer les fissures », choice « C. Crop top »,
 * then « crop top un peu court laissant voir les muscles du ventre »). In every striking discipline Inaya wears the
 * crop top:
 * - its bottom stays above the Spine1 joint, so the abdominals are bare;
 * - above the chest, no point of it lies within 11 cm of the body's axis: the halter straps of her sports body run up
 *   to the back of the neck inside that distance (x <= 0.106 m at 1.40 m), and a top laid over them came out torn.
 */
describe('Inaya : crop top dans les disciplines de frappe', () => {
  for (const o of ['boxe', 'kickboxing', 'muaythai', 'mma'])
    test(o, () => {
      const { parts, bind } = readGlb(`public/coaches/inaya/tenues/${o}.glb`);
      const top = parts.filter((p) => p.name.startsWith('haut-crop'));
      expect(top.length, 'crop top présent').toBeGreaterThan(0);
      expect(parts.some((p) => p.name.startsWith('haut-brassiere')), 'plus de brassière à bretelles au cou').toBe(false);
      const spine1 = bind.get('Spine1')!.y;
      const chest = bind.get('Spine2')!.y + 0.1;
      let low = Infinity;
      let nearAxis = Infinity;
      for (const p of top)
        for (const q of p.positions) {
          low = Math.min(low, q.y);
          if (q.y > chest) nearAxis = Math.min(nearAxis, Math.abs(q.x));
        }
      expect(low, `bas du haut ${low.toFixed(3)} m, Spine1 ${spine1.toFixed(3)} m`).toBeGreaterThan(spine1);
      expect(nearAxis, `au-dessus de la poitrine, |x| min ${nearAxis.toFixed(3)} m`).toBeGreaterThan(0.11);
    });
});
