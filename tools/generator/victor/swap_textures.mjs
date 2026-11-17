// 1.53.1 : remplace seulement les deux textures de couleur de la peau dans le photo.glb déjà construit de Victor
// (forme, os, expressions et tenues inchangés ; pas de reconstruction depuis Kadir).
//   node tools/generator/victor/swap_textures.mjs public/coaches/victor/photo.glb tete.jpg corps.jpg sortie.glb
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync } from 'node:fs';

const [src, headJpg, bodyJpg, out] = process.argv.slice(2);
// attributs séparés comme le modèle d'origine (les tests et l'appli lisent les positions sans entrelacement)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(src);
let n = 0;
for (const tex of doc.getRoot().listTextures()) {
  if (tex.getName() === 'm021_head_color') { tex.setImage(readFileSync(headJpg)).setMimeType('image/jpeg'); n++; }
  if (tex.getName() === 'm021_body_color') { tex.setImage(readFileSync(bodyJpg)).setMimeType('image/jpeg'); n++; }
}
if (n !== 2) throw new Error(`textures de couleur trouvées : ${n} (attendu 2)`);
await io.write(out, doc);
console.log('ok', out);
