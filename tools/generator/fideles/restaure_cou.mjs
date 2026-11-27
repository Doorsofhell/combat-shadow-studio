// v2.14.1 (Youssef 27/11 : « problème de cou sur tous les coachs », visages d'Amara et d'Inaya de la 2.3.1) :
//  - les six coachs : image de couleur du CORPS de la 2.9.0 (l'ombrage naturel des trapèzes et du cou, retiré en 2.10.0) ;
//  - Amara et Inaya : TÊTE de la 2.9.0 (forme du visage, 25 expressions, image de couleur de la tête).
// Géométrie du corps, os, poids, tenues : ceux de la 2.10.x gardés. Amara a été retaillée (x0,9829) : la tête de la 2.9.0
// est mise à la même échelle (raccord au cou mesuré à 0,4 mm).
// Kadir, Naël, Victor, Kanya : images de couleur actuelles gardées (teint, taches corrigées) ; seul l'ombrage du cou et des
// trapèzes de la 2.9.0 est rendu à l'image de la tête (rapport de luminance à grande échelle, bande du cou, limité à
// 0,82-1,12), calculé par neck.py (images prêtes dans <dossier ombrage>/<coach>/new-head.jpeg).
// node restaure_cou.mjs <dossier public/coaches courant> <dossier public/coaches 2.9.0> <dossier ombrage>
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [CUR, OLD, SHADE] = process.argv.slice(2);
import { readFileSync } from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
const FILES = { 'mma-kadir': ['photo.glb'], nael: ['photo.glb'], victor: ['photo.glb'], kanya: ['photo.glb'], inaya: ['photo.glb'], 'mma-amara': ['photo.glb', 'photo-clean.glb'] };
const HEAD = { 'mma-amara': 0.9829, inaya: 1 };
const scaleArr = (a, s) => (s === 1 ? a : a.map((v) => v * s));
for (const [coach, files] of Object.entries(FILES)) {
  for (const f of files) {
    const path = `${CUR}/${coach}/${f}`;
    const cur = await io.read(path);
    const old = await io.read(`${OLD}/${coach}/${f}`);
        const log = [];
    for (const t of cur.getRoot().listTextures()) {
      const n = t.getName();
      const isBody = /body_color$/.test(n);
      const isHead = /head_color$/.test(n);
      if (isHead && !(coach in HEAD)) {
        t.setImage(new Uint8Array(readFileSync(`${SHADE}/${coach}/new-head.jpeg`)));
        log.push(`${n} (ombrage du cou)`);
        continue;
      }
      if (coach in HEAD && (isBody || isHead)) {
        // images de la 2.9.0 ramenées à la taille actuelle et recompressées par neck.py (le modèle reste sous 3,5 Mo)
        t.setImage(new Uint8Array(readFileSync(`${SHADE}/${coach}/small-${isBody ? 'body' : 'head'}.jpeg`)));
        t.setMimeType('image/jpeg');
        log.push(n);
      }
    }
    if (coach in HEAD) {
      const s = HEAD[coach];
      const cm = cur.getRoot().listMeshes()[0].listPrimitives();
      const om = old.getRoot().listMeshes()[0].listPrimitives();
      cm.forEach((cp, i) => {
        const op = om[i];
        const isBody = cp.getAttribute('POSITION').getCount() === cm[0].getAttribute('POSITION').getCount() && i === 0;
        if (isBody) return; // le corps garde la 2.10.x
        if (cp.getAttribute('POSITION').getCount() !== op.getAttribute('POSITION').getCount()) throw new Error(`${coach}/${f}: tête de forme différente (primitive ${i})`);
        for (const sem of ['POSITION', 'NORMAL', 'TANGENT', 'TEXCOORD_0', 'COLOR_0', 'COLOR_1']) {
          const a = cp.getAttribute(sem), b = op.getAttribute(sem);
          if (!a || !b) continue;
          if (sem === 'POSITION') {
            // raccord : sous 1,44 m la position actuelle, au-dessus 1,50 m celle de la 2.9.0, fondu entre les deux
            const cu = a.getArray(), ol = b.getArray(), out = new Float32Array(cu.length);
            for (let v = 0; v < cu.length; v += 3) {
              const t = Math.min(1, Math.max(0, (ol[v + 1] * s - 1.44) / 0.06));
              for (let k = 0; k < 3; k++) out[v + k] = cu[v + k] * (1 - t) + ol[v + k] * s * t;
            }
            a.setArray(out);
          } else a.setArray(b.getArray().slice());
        }
        cp.listTargets().forEach((ct, k) => {
          const ot = op.listTargets()[k];
          for (const sem of ['POSITION', 'NORMAL', 'TANGENT']) {
            const a = ct.getAttribute(sem), b = ot?.getAttribute(sem);
            if (!a || !b) continue;
            a.setArray(sem === 'POSITION' ? Float32Array.from(scaleArr(Array.from(b.getArray()), s)) : b.getArray().slice());
          }
        });
        log.push(`primitive ${i} (tête)`);
      });
    }
    await io.write(path, cur);
    console.log(`${coach}/${f} : ${log.join(', ')}`);
  }
}
