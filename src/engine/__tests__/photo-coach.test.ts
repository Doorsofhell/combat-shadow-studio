import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { measureLibrary } from '../../test/torsions';

/**
 * v0.29: the Ultra-réaliste coaches are photo-textured avatars (Microsoft Rocketbox, MIT) converted with our
 * bone names (tools/generator/rocketbox/convert.py). The same animations must drive them within the human
 * range of motion, like the generated models (torsion-range.test.ts, same tolerance).
 */
const TOLERANCE = 3;
const photos = [
  { id: 'mma-kadir', rig: new CoachRig(loadSkeleton('homme', 'coaches/mma-kadir/photo.glb')), offsets: COACH_STANCES['mma-kadir'] },
  { id: 'mma-amara', rig: new CoachRig(loadSkeleton('femme', 'coaches/mma-amara/photo.glb')), offsets: COACH_STANCES['mma-amara'] },
];

describe('coachs photo-réalistes (Rocketbox)', () => {
  test('le squelette a tous les os de nos animations et une taille humaine', () => {
    for (const p of photos) {
      expect(p.rig.metrics.height, p.id).toBeGreaterThan(1.55);
      expect(p.rig.metrics.height, p.id).toBeLessThan(1.95);
    }
  });

  const report = measureLibrary(photos, 30);
  test('chaque articulation reste dans l’amplitude humaine, toutes techniques', () => {
    const bad = report.over
      .filter((o) => o.value - o.limit > TOLERANCE)
      .map((o) => `${o.run.coach} ${o.run.style} ${o.run.technique}${o.run.southpaw ? ' gaucher' : ''} t=${o.t.toFixed(2)} ${o.key} ${o.side ?? ''} ${o.value.toFixed(1)}° (limite ${o.limit.toFixed(0)}°)`);
    // one line per joint and technique (worst case), so that a failure reads at a glance
    const worst = new Map<string, number>();
    for (const o of report.over.filter((o) => o.value - o.limit > TOLERANCE)) {
      const k = `${o.run.coach} ${o.run.technique} ${o.key} (limite ${o.limit.toFixed(0)}°)`;
      worst.set(k, Math.max(worst.get(k) ?? 0, o.value));
    }
    const lines = [...worst].map(([k, v]) => `${k} : ${v.toFixed(1)}°`);
    expect(lines, `${bad.length} dépassements\n${lines.join('\n')}`).toEqual([]);
  });
});
