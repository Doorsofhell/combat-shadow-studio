// v2.2.0 Phase B — échange des textures de peau d'un photo.glb (rien d'autre ne change : maillages, os, poids,
// morphs, matériaux restent ceux du fichier).
//   node scripts/v220/textures-glb.mjs dump <glb> <dossier>      → <mat>.uv.bin (triangles UV) + <texture>.<ext>
//   node scripts/v220/textures-glb.mjs verts <glb> <dossier>     → <mat>.verts.bin (x y z u v) + <mat>.idx.bin
//   node scripts/v220/textures-glb.mjs swap <glb> <dossier> <out> → remplace chaque texture dont un fichier
//                                                                   <texture>.new.<ext> existe dans le dossier
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [mode, glb, dir, out] = process.argv.slice(2);
// SEPARATE : mêmes tampons qu'à l'origine (les tests lisent les positions sans pas d'entrelacement)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const doc = await io.read(glb);
const root = doc.getRoot();
const ext = (t) => (t.getMimeType() === 'image/png' ? 'png' : 'jpg');
if (mode === 'dump') {
  mkdirSync(dir, { recursive: true });
  for (const mesh of root.listMeshes())
    for (const p of mesh.listPrimitives()) {
      const mat = p.getMaterial();
      const uv = p.getAttribute('TEXCOORD_0');
      if (!mat || !uv) continue;
      const idx = p.getIndices();
      const n = idx ? idx.getCount() : uv.getCount();
      const tri = new Float32Array(n * 2);
      const v = [];
      for (let i = 0; i < n; i++) {
        uv.getElement(idx ? idx.getScalar(i) : i, v);
        tri[i * 2] = v[0];
        tri[i * 2 + 1] = v[1];
      }
      writeFileSync(join(dir, `${mat.getName()}.uv.bin`), Buffer.from(tri.buffer));
      for (const t of [mat.getBaseColorTexture(), mat.getNormalTexture(), mat.getMetallicRoughnessTexture()]) {
        if (t) writeFileSync(join(dir, `${t.getName()}.${ext(t)}`), t.getImage());
      }
      console.log(mat.getName(), n / 3, 'triangles', mat.getBaseColorTexture()?.getName(), mat.getNormalTexture()?.getName());
    }
} else if (mode === 'verts') {
  // par matériau : position (3) + UV (2) de chaque sommet, puis les indices des triangles
  mkdirSync(dir, { recursive: true });
  for (const mesh of root.listMeshes())
    for (const p of mesh.listPrimitives()) {
      const mat = p.getMaterial();
      const uv = p.getAttribute('TEXCOORD_0');
      const pos = p.getAttribute('POSITION');
      if (!mat || !uv) continue;
      const n = pos.getCount();
      const a = new Float32Array(n * 5);
      const v = [], t = [];
      for (let i = 0; i < n; i++) {
        pos.getElement(i, v);
        uv.getElement(i, t);
        a.set([v[0], v[1], v[2], t[0], t[1]], i * 5);
      }
      writeFileSync(join(dir, `${mat.getName()}.verts.bin`), Buffer.from(a.buffer));
      const idx = p.getIndices();
      const I = new Uint32Array(idx.getCount());
      for (let i = 0; i < I.length; i++) I[i] = idx.getScalar(i);
      writeFileSync(join(dir, `${mat.getName()}.idx.bin`), Buffer.from(I.buffer));
    }
} else if (mode === 'swap') {
  let k = 0;
  for (const t of root.listTextures()) {
    for (const e of ['jpg', 'png']) {
      const f = join(dir, `${t.getName()}.new.${e}`);
      if (!existsSync(f)) continue;
      t.setImage(new Uint8Array(readFileSync(f)));
      t.setMimeType(e === 'png' ? 'image/png' : 'image/jpeg');
      console.log('texture remplacée', t.getName(), '←', f);
      k++;
    }
  }
  await io.write(out, doc);
  console.log(k, 'texture(s) ;', out);
}
