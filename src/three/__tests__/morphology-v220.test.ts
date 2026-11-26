import { describe, expect, test } from 'vitest';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { Bone, BufferAttribute, BufferGeometry, Skeleton } from 'three';
import { applyMorphology, displace, MORPHOLOGY_V220, morphologyFor } from '../morphology';

/**
 * 2.2.0 (expérimentale) — morphologies individuelles (src/three/morphology.ts). Mesures sur les vrais photo.glb :
 * le corps garde ses positions d'origine sur disque, la correction est appliquée au chargement, au corps et aux tenues.
 */
const PUB = resolve(__dirname, '../../../public/coaches');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function part(file: string, match: RegExp) {
  const doc = await io.read(file);
  const out: { geometry: BufferGeometry; skeleton: Skeleton }[] = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    const skin = node.getSkin();
    if (!mesh || !skin) continue;
    const skeleton = new Skeleton(skin.listJoints().map((j) => Object.assign(new Bone(), { name: j.getName().replace(/:/g, '') })));
    for (const p of mesh.listPrimitives()) {
      if (!match.test(p.getMaterial()?.getName() ?? '')) continue;
      const g = new BufferGeometry();
      for (const [sem, name, n] of [['POSITION', 'position', 3], ['NORMAL', 'normal', 3], ['JOINTS_0', 'skinIndex', 4], ['WEIGHTS_0', 'skinWeight', 4]] as const) {
        const a = p.getAttribute(sem);
        if (a) g.setAttribute(name, new BufferAttribute(Float32Array.from(a.getArray()!), n));
      }
      out.push({ geometry: g, skeleton });
    }
  }
  return out;
}

function hull(pts: [number, number][]) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1));
  let s = 0;
  for (let i = 0; i < h.length; i++) s += Math.hypot(h[i][0] - h[(i + 1) % h.length][0], h[i][1] - h[(i + 1) % h.length][1]);
  return s;
}

/** tours de taille (minimum) et de hanches (maximum) du tronc, os dominant bassin/colonne (+ cuisses sous le bassin) */
function girths(g: BufferGeometry, k: Skeleton, hipY: number) {
  const pos = g.getAttribute('position');
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  const per = (y: number, legs: boolean) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i) - y) > 0.01) continue;
      let b = 0;
      for (let c = 1; c < 4; c++) if (sw.getComponent(i, c) > sw.getComponent(i, b)) b = c;
      const n = k.bones[si.getComponent(i, b)].name;
      if (/^(Hips|Spine\d?)$/.test(n) || (legs && /UpLeg/.test(n))) pts.push([pos.getX(i), pos.getZ(i)]);
    }
    return pts.length > 5 ? hull(pts) : NaN;
  };
  let waist = Infinity, hips = 0;
  for (let y = hipY + 0.06; y < hipY + 0.32; y += 0.01) waist = Math.min(waist, per(y, false) || Infinity);
  for (let y = hipY - 0.14; y < hipY + 0.02; y += 0.01) hips = Math.max(hips, per(y, true) || 0);
  return { waist, hips, ratio: waist / hips };
}

const HIP_Y: Record<string, number> = { 'mma-amara': 0.923, inaya: 0.923, kanya: 0.9 };

describe('2.2.0 morphologies individuelles', () => {
  test('seules les trois combattantes à la taille mesurée trop étroite sont corrigées ; Kadir, Naël, Victor non', () => {
    expect(Object.keys(MORPHOLOGY_V220).sort()).toEqual(['inaya', 'kanya', 'mma-amara']);
    for (const id of ['mma-kadir', 'nael', 'victor']) expect(morphologyFor(`./coaches/${id}/photo.glb`)).toBeUndefined();
    // l'adresse d'une tenue désigne le même coach
    expect(morphologyFor('./coaches/inaya/tenues/mma.glb')).toBe(MORPHOLOGY_V220.inaya);
  });

  // Amara habillée est dessinée sur photo-clean.glb (CoachModel, 1.37.9) : les deux fichiers sont mesurés
  test.each([['mma-amara', 'photo'], ['mma-amara', 'photo-clean'], ['inaya', 'photo'], ['kanya', 'photo']])('%s (%s) : rapport taille/hanches relevé de façon modérée, hanches et poitrine inchangées', async (id, file) => {
    const [{ geometry: g, skeleton: k }] = await part(`${PUB}/${id}/${file}.glb`, /body/);
    const before = girths(g, k, HIP_Y[id]);
    const orig = Float32Array.from(g.getAttribute('position').array);
    const moved = applyMorphology(g, MORPHOLOGY_V220[id], k);
    const after = girths(g, k, HIP_Y[id]);
    expect(moved).toBeGreaterThan(500);
    // 2.1.0 : 0,63 à 0,67 ; cible 0,67 à 0,71 (repère des combattantes de haut niveau : environ 0,70 à 0,75)
    expect(before.ratio).toBeLessThan(0.68);
    expect(after.ratio).toBeGreaterThan(0.665);
    expect(after.ratio).toBeLessThan(0.72);
    expect(after.ratio - before.ratio).toBeGreaterThan(0.015);
    expect(Math.abs(after.hips - before.hips) / before.hips).toBeLessThan(0.01);
    // rien ne bouge au-dessus de la poitrine ni sous le bassin, rien en hauteur
    const pos = g.getAttribute('position');
    let far = 0, dy = 0;
    for (let i = 0; i < pos.count; i++) {
      const y = orig[i * 3 + 1];
      const d = Math.hypot(pos.getX(i) - orig[i * 3], pos.getZ(i) - orig[i * 3 + 2]);
      if ((y > 1.42 || y < 0.85) && d > 1e-4) far++;
      dy = Math.max(dy, Math.abs(pos.getY(i) - y));
    }
    expect(far).toBe(0);
    expect(dy).toBe(0);
    // les masques de peau sous les tenues lisent les positions d'origine
    expect(Array.from(g.userData.cssOriginalMaskPositions as Float32Array)).toEqual(Array.from(orig));
  });

  test.each(['mma-amara', 'inaya', 'kanya'])('%s : bras et mains jamais déplacés, normales unitaires', async (id) => {
    const [{ geometry: g, skeleton: k }] = await part(`${PUB}/${id}/photo.glb`, /body/);
    const orig = Float32Array.from(g.getAttribute('position').array);
    applyMorphology(g, MORPHOLOGY_V220[id], k);
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    const si = g.getAttribute('skinIndex');
    const sw = g.getAttribute('skinWeight');
    let limbMoved = 0;
    for (let i = 0; i < pos.count; i++) {
      let limb = 0;
      for (let c = 0; c < 4; c++) if (/(Arm|Hand)/.test(k.bones[si.getComponent(i, c)].name)) limb += sw.getComponent(i, c);
      const d = Math.hypot(pos.getX(i) - orig[i * 3], pos.getZ(i) - orig[i * 3 + 2]);
      if (limb > 0.999 && d > 1e-6) limbMoved++;
      expect(Math.abs(Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i)) - 1)).toBeLessThan(1e-3);
    }
    expect(limbMoved).toBe(0);
  });

  test('le champ garde l’ordre des surfaces le long de chaque rayon : une tenue au-dessus de la peau y reste', () => {
    const d: [number, number, number] = [0, 0, 0];
    for (const m of Object.values(MORPHOLOGY_V220)) {
      for (const b of m.bands) {
        for (let y = b.y - 3 * b.sigma; y <= b.y + 3 * b.sigma; y += 0.01) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 24) {
            let prev = -Infinity;
            for (let r = 0.02; r < 0.35; r += 0.002) {
              const x = Math.cos(a) * r, z = b.z0 + Math.sin(a) * r;
              displace(m, x, y, z, d);
              const nr = Math.hypot(x + d[0], z + d[2] - b.z0);
              expect(nr).toBeGreaterThan(prev);
              prev = nr;
            }
          }
        }
      }
    }
  }, 30_000); // 2.10.7 : ~2,7 s seul, plus de 5 s sur une machine GitHub à 2 cœurs pendant la suite complète (mêmes vérifications)

  test.each(['mma-amara', 'inaya', 'kanya'])('%s : chaque tenue reçoit le même champ que le corps (aucun écart nouveau)', async (id) => {
    const files = readdirSync(`${PUB}/${id}/tenues`).filter((f) => f.endsWith('.glb'));
    expect(files.length).toBeGreaterThanOrEqual(7);
    const m = MORPHOLOGY_V220[id];
    const d: [number, number, number] = [0, 0, 0];
    for (const f of files) {
      for (const { geometry: g, skeleton: k } of await part(`${PUB}/${id}/tenues/${f}`, /./)) {
        const orig = Float32Array.from(g.getAttribute('position').array);
        applyMorphology(g, m, k);
        const pos = g.getAttribute('position');
        const si = g.getAttribute('skinIndex');
        const sw = g.getAttribute('skinWeight');
        for (let i = 0; i < pos.count; i += 7) {
          let limb = 0;
          for (let c = 0; c < 4; c++) if (/(Arm|ForeArm|Hand|Thumb|Index|Middle|Ring|Pinky)/.test(k.bones[si.getComponent(i, c)]?.name ?? '')) limb += sw.getComponent(i, c);
          displace(m, orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2], d);
          const keep = 1 - Math.min(1, limb);
          expect(pos.getX(i) - orig[i * 3]).toBeCloseTo(d[0] * keep, 5);
          expect(pos.getZ(i) - orig[i * 3 + 2]).toBeCloseTo(d[2] * keep, 5);
        }
      }
    }
  });
});
