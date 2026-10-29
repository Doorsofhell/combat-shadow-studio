import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { COACH_LOOKS } from '../../domain/coaches/looks';
import { ALL_COACHES, championFor, championLook } from '../../domain/coaches/catalog';
import { measureLibrary } from '../../test/torsions';
import { readFileSync, existsSync } from 'node:fs';

/**
 * 1.5 (Youssef 2026-10-28): Axel and Kaila, built from MakeHuman (tools/generator/makehuman, CC0 assets). Same
 * requirements as the other coaches: our bone names, a human size, every animation within the human range of motion
 * on both models (Ultra-réaliste photo.glb and Anime model.glb), the files of every discipline, and a weight that
 * suits phones.
 */
const TOLERANCE = 3;
const COACHES = [
  { id: 'axel', sex: 'homme' as const, height: [1.85, 2.0] },
  { id: 'kaila', sex: 'femme' as const, height: [1.55, 1.75] },
];
/** the JSON part of a GLB: material names and triangle count of each mesh (no geometry decoding needed) */
function glbInfo(file: string) {
  const buf = readFileSync(file);
  const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
  return (json.meshes as { primitives: { material: number; indices: number }[] }[]).flatMap((m) =>
    m.primitives.map((p) => ({ material: json.materials[p.material].name as string, triangles: json.accessors[p.indices].count / 3 })),
  );
}
const OUTFITS = ['boxe', 'kickboxing', 'muaythai', 'mma', 'bjj', 'bjj-nogi', 'judo'];

describe('coachs MakeHuman : Axel et Kaila', () => {
  const rigs = COACHES.flatMap((c) =>
    (['photo', 'model'] as const).map((f) => ({ id: `${c.id} (${f})`, c, rig: new CoachRig(loadSkeleton(c.sex, `coaches/${c.id}/${f}.glb`)), offsets: COACH_STANCES[c.id] })),
  );

  test('le squelette a tous les os de nos animations et la taille du personnage', () => {
    for (const r of rigs) {
      expect(r.rig.metrics.height, r.id).toBeGreaterThan(r.c.height[0]);
      expect(r.rig.metrics.height, r.id).toBeLessThan(r.c.height[1]);
    }
  });

  test('Ultra-réaliste : peau, yeux, sourcils et cils sur le squelette, cheveux de Kaila en cartes (alpha)', () => {
    for (const c of COACHES) {
      const mats = glbInfo(`public/coaches/${c.id}/photo.glb`).map((m) => m.material);
      expect(mats, c.id).toEqual(expect.arrayContaining(['Skin', 'Eyes_opacity', 'Eyebrows_opacity', 'Eyelashes_opacity']));
      if (c.id === 'kaila') expect(mats).toContain('Hair_opacity');
    }
  });

  test('poids pour mobile : modèle photo sous 2,5 Mo (Kadir : 2,5 Mo), corps sous 45 000 triangles', () => {
    for (const c of COACHES) {
      const buf = readFileSync(`public/coaches/${c.id}/photo.glb`);
      expect(buf.length, c.id).toBeLessThan(2.5e6);
      const body = glbInfo(`public/coaches/${c.id}/photo.glb`).find((m) => m.material === 'Skin')!;
      expect(body.triangles, c.id).toBeLessThan(45000);
    }
  });

  test('une tenue par discipline et un portrait', () => {
    for (const c of COACHES) {
      for (const o of OUTFITS) expect(existsSync(`public/coaches/${c.id}/tenues/${o}.glb`), `${c.id} ${o}`).toBe(true);
      expect(existsSync(`public/coaches/${c.id}/portrait.webp`), c.id).toBe(true);
    }
  });

  test('catalogue : quatre coachs, choix gardé par type de corps, tenue propre à chaque discipline', () => {
    expect(ALL_COACHES.map((c) => c.id)).toEqual(['mma-kadir', 'axel', 'mma-amara', 'kaila']);
    expect(championFor('homme', 'axel').id).toBe('axel');
    expect(championFor('femme', 'kaila').id).toBe('kaila');
    // a choice that does not match the body type falls back to Kadir or Amara; no choice: Kadir or Amara as before
    expect(championFor('femme', 'axel').id).toBe('mma-amara');
    expect(championFor('homme', null).id).toBe('mma-kadir');
    for (const c of COACHES) {
      expect(COACH_LOOKS[c.id].sex).toBe(c.sex);
      expect(championLook(championFor(c.sex, c.id), 'boxe').gear.hands).toBe('gants-boxe');
    }
  });

  const report = measureLibrary(rigs.map((r) => ({ id: r.id, rig: r.rig, offsets: r.offsets })), 30);
  test('chaque articulation reste dans l’amplitude humaine, toutes techniques, deux modèles', () => {
    const worst = new Map<string, number>();
    for (const o of report.over.filter((o) => o.value - o.limit > TOLERANCE)) {
      const k = `${o.run.coach} ${o.run.technique} ${o.key} (limite ${o.limit.toFixed(0)}°)`;
      worst.set(k, Math.max(worst.get(k) ?? 0, o.value));
    }
    const lines = [...worst].map(([k, v]) => `${k} : ${v.toFixed(1)}°`);
    expect(lines, lines.join('\n')).toEqual([]);
  });
});
