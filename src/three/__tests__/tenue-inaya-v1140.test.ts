import { describe, expect, test } from 'vitest';
import { readGlb } from '../../test/glbRead';

/**
 * 1.14 (Youssef, 04/11: « mets à Inaya une brassière moulante pleine pour masquer les fissures », choice « C. Crop top »,
 * then « crop top un peu court laissant voir les muscles du ventre »). In every striking discipline Inaya wears the
 * crop top:
 * - its bottom stays above the Spine1 joint, so the abdominals are bare;
 * - above the chest, no point of it lies within 11 cm of the body's axis: the halter straps of her sports body run up
 *   to the back of the neck inside that distance (x <= 0.106 m at 1.40 m), and a top laid over them came out torn.
 *
 * 1.19 (rule rewritten, not loosened: its cause is gone). Inaya's body was rebuilt from a clean Rocketbox base and the
 * halter was erased from the skin (tools/generator/rocketbox/clean_torso.py + skin_paint.py), so nothing sits near the
 * neck any more. The straps were then moved onto the trapezius (outfits.py _SQ, SQ_IN 0.075 m) because at 11 cm the
 * deltoid skin showed white gaps under them in guard. The check keeps its purpose (no strap round the neck): no point
 * of the top within 7 cm of the axis above the chest, and none further out than 13 cm (the straps stay on the
 * trapezius, not on the shoulder joint).
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
      let farUp = 0;
      const neck = bind.get('Neck')!.y;
      for (const p of top)
        for (const q of p.positions) {
          low = Math.min(low, q.y);
          if (q.y > chest) nearAxis = Math.min(nearAxis, Math.abs(q.x));
          if (q.y > neck - 0.03) farUp = Math.max(farUp, Math.abs(q.x));
        }
      expect(low, `bas du haut ${low.toFixed(3)} m, Spine1 ${spine1.toFixed(3)} m`).toBeGreaterThan(spine1);
      expect(nearAxis, `au-dessus de la poitrine, |x| min ${nearAxis.toFixed(3)} m`).toBeGreaterThan(0.07);
      expect(farUp, `bretelles près du cou, |x| max ${farUp.toFixed(3)} m`).toBeLessThan(0.13);
    });
});
