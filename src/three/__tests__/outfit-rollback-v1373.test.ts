import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/** Prevent re-introducing the shorts regression seen after the 1.37.1 rebuild.
 * 1.46.0 (Youssef 15/11, Kadir plus réaliste : cou, mâchoire, trapèzes) : new body, and the three outfits that cover
 * the neck and the trapezius (judo, bjj, bjj-nogi) follow it by tools/generator/kadir/tenues_suivent.py (garment
 * points moved with the body, hidden skin keys renamed); the shorts and the other outfits keep their 1.37.0 bytes.
 * 1.56.0 (Youssef 15/11 « kimonos trop gros, trop épais », option B « Tombé » choisie le 17/11) : judo and bjj rebuilt
 * on the current body by outfits.py (GI_STYLE tombe: real cloth thicknesses, the cloth spans the hollows; then the cut of Youssef's reference sheets: straight wide trouser legs and sleeves). New approved
 * fingerprints for these two only; the 1.46 ones are in the git history. The shorts guard is untouched. */
// 2.4.0 prototype 2 (Youssef 25/11, carte « Oui, toutes les tenues », avec l'accord de Youssef pour Kadir) : seuls les ourlets des quatre shorts sont redressés
// (tools/generator/rocketbox/hem_straight.py, hauteur des points du bas seulement) ; le reste des fichiers est celui de
// 1.37.0. Nouvelles empreintes des shorts ; celles de 1.37.0 dans l'historique git
const GOOD_1370 = {
  'boxe': '0e8fc11dd7addc2b68c1ee2f40a4ef3a46b130eb',
  'kickboxing': '15fc5e5de085c4539273a81f966841ebdd81f243',
  'muaythai': '9dc7195993f4a5428e378d78bde0693d41792652',
  'mma': 'f82288c5e17ca9a919c86a53d74b278a4dea5d7d',
  'judo': 'd6e9adaeff0a9ce8d629f748d84655efa00f08c6',
  'bjj': '5b34f461f1fb7e8ea090461ee22a5ce20f46eb41',
  'bjj-nogi': 'cadc6b5cc30f20cd87b98bd9dfbbe2d027393fcc',
} as const;
function gitSha(path: string) {
  const data = readFileSync(path);
  expect(data.toString('ascii', 0, 4)).toBe('glTF');
  return createHash('sha1').update(Buffer.from('blob ' + data.length + '\0')).update(data).digest('hex');
}
describe('v1.37.3 — rollback non régressif des shorts de Kadir', () => {
  for (const [outfit, expected] of Object.entries(GOOD_1370)) {
    test(outfit + ' : correspond aux modèles validés v1.37.0', () => {
      expect(gitSha('public/coaches/mma-kadir/tenues/' + outfit + '.glb')).toBe(expected);
    });
  }
  // 2.4.0 prototype 2 (Youssef 24/11 « je valide » : méthode d'Amara et Victor étendue aux 4 autres coachs) : visage de
  // Kadir rapproché de sa planche et peau sans ombrage cuit (tools/generator/fideles, configs/kadir2.json, kadir-peau.json).
  // Corps, squelette et poids inchangés (aucune mise à l'échelle) : les tenues et les shorts gardent leurs empreintes.
  // Empreinte 2.3.5 : c31999b521a53267262e77679afbc53d594c4ae2 (modèle archivé dans _ARCHIVES_HORS_APPLICATION).
  test('modèle corporel Kadir intact', () => {
    expect(gitSha('public/coaches/mma-kadir/photo.glb')).toBe('357dd8d634238cb3d55462136847dfe73d35d1d5');
  });
});
