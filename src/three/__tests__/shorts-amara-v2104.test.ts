import { describe, expect, test } from 'vitest';
import { readGlb } from '../../test/glbRead';
import { hiddenKeys } from '../outfit';

/**
 * 2.10.4 (Youssef 26/11, « les tenues de MMA et kick boxing d'Amara ont été altérées, on dirait des déchirures »).
 *
 * Constat vérifié (captures du Lab en garde, high kick, genou et low kick, versions 2.7.0 à 2.10.2 croisées corps /
 * tenue) : depuis la 2.10.0, la peau des cuisses passe devant le tissu des shorts MMA et kickboxing. Cause : le lissage
 * des poids de tools/generator/rocketbox/short_poids.py (marque `cssShortPoids`), qui décolle le short de la cuisse en
 * mouvement comme en garde ; le même lissage appliqué au short 2.7.0 refait les trous. Correction : shorts 2.7.0, masque
 * de peau recalculé point par point pour le corps actuel (tools/generator/rocketbox/remap_masque.py).
 *
 * 1. Chaque masque de peau des tenues d'Amara retrouve au moins 90 % de ses points sur le corps livré (photo-clean.glb,
 *    positions d'origine, comme outfit.ts) : sinon la peau sous le tissu n'est plus cachée (seuil d'alerte de l'app).
 * 2. Les shorts MMA et kickboxing d'Amara ne portent pas le lissage des poids.
 */
const OUTFITS = ['bjj', 'bjj-nogi', 'boxe', 'judo', 'kickboxing', 'mma', 'muaythai'];
// Défaut connu, plus ancien (déjà visible en 2.7.0, signalé le 26/11) : le masque de la tenue d'arbitre ne retrouve que
// 70 % de ses points et la peau se voit à la poitrine. `test.fails` : ce test devra passer en `test` une fois corrigé.
const KNOWN_BAD = ['arbitre'];
const body = readGlb('public/coaches/mma-amara/photo-clean.glb').parts.filter((p) => /body/i.test(p.material));

describe('2.10.4 — tenues d’Amara : peau cachée sous le tissu', () => {
  const maskMatches = (outfit: string) => {
    const g = readGlb(`public/coaches/mma-amara/tenues/${outfit}.glb`);
    const carrier = (g.json as unknown as { nodes: { extras?: Record<string, unknown> }[] }).nodes.find((n) => n.extras?.hideBody);
    expect(carrier, 'masque de peau').toBeTruthy();
    const keys = hiddenKeys(carrier!.extras!.hideBody as string);
    const scale = Number(carrier!.extras!.hideScale ?? 1000);
    const found = new Set<string>();
    for (const p of body) {
      p.positions.forEach((v) => {
        const k = `${Math.round(v.x * scale)},${Math.round(v.y * scale)},${Math.round(v.z * scale)}`;
        if (keys.has(k)) found.add(k);
      });
    }
    expect(found.size / keys.size, `${outfit} : points du masque retrouvés sur le corps`).toBeGreaterThanOrEqual(0.9);
  };
  test.each(OUTFITS)('%s : le masque de peau correspond au corps actuel', maskMatches);
  test.fails.each(KNOWN_BAD)('%s : défaut connu, masque à refaire (doit échouer tant qu’il n’est pas corrigé)', maskMatches);

  test.each(['mma', 'kickboxing'])('%s : short sans le lissage des poids qui le décolle de la cuisse', (outfit) => {
    const g = readGlb(`public/coaches/mma-amara/tenues/${outfit}.glb`);
    const extras = (g.json as unknown as { asset: { extras?: Record<string, unknown> } }).asset.extras ?? {};
    expect(extras.cssShortPoids, 'marque du lissage short_poids.py').toBeUndefined();
  });
});
