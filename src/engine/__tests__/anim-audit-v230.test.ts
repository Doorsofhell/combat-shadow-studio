import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUES } from '../../domain/techniques';
import { measureCoach, measureCombo, measureIdle, type CoachUnderTest } from '../../test/animAudit';
import type { DisciplineId } from '../../domain/types';
import { setV230FromQuery } from '../v230';

/**
 * v2.3.0 Lot 2: full measurement of the animations on the six coaches (src/test/animAudit.ts). With AUDIT_V230=<name>
 * the measures are written to docs/v230/audit/<name>.json (état initial « avant », then « apres »); without it the
 * test only checks that every coach and every technique could be measured.
 */
export const COACHES_V230: CoachUnderTest[] = [
  ['mma-kadir', 'homme'],
  ['mma-amara', 'femme'],
  ['nael', 'homme'],
  ['victor', 'homme'],
  ['inaya', 'femme'],
  ['kanya', 'femme'],
].map(([id, sex]) => ({ id, rig: new CoachRig(loadSkeleton(sex as 'homme' | 'femme', `coaches/${id}/photo.glb`)), offsets: COACH_STANCES[id] }));

export const PAIRS = (() => {
  const seen = new Set<string>();
  const out: { discipline: DisciplineId; motion: string }[] = [];
  for (const t of TECHNIQUES) {
    for (const d of t.disciplines) {
      const k = `${d}:${t.motion}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ discipline: d, motion: t.motion });
    }
  }
  return out;
})();

export const COMBOS: [Parameters<typeof measureCombo>[1], string[]][] = [
  ['boxing', ['jab', 'direct', 'crochet-avant', 'direct']],
  ['boxing', ['jab', 'uppercut-arriere', 'crochet-avant']],
  ['boxing', ['esquive-gauche', 'crochet-avant', 'direct']],
  ['kickboxing', ['jab', 'direct', 'low-kick-arriere']],
  ['kickboxing', ['jab', 'direct', 'crochet-avant', 'middle-kick-arriere']],
  ['muaythai', ['teep-avant', 'direct', 'middle-kick-arriere']],
  ['muaythai', ['jab', 'direct', 'genou-direct-arriere']],
  ['mma', ['jab', 'direct', 'entree-lutte']],
  ['mma', ['pas-avant', 'jab', 'direct']],
];

describe('v2.3.0 : mesures des animations sur les six coachs', () => {
  test('chaque coach, chaque technique est mesurée', { timeout: 1_200_000 }, () => {
    // AUDIT_FLAGS=0: the engine as in 2.2.0 (every 2.3.0 change turned off), for the « avant » measures
    setV230FromQuery(process.env.AUDIT_FLAGS ?? null);
    const all = COACHES_V230.flatMap((c) => measureCoach(c, PAIRS));
    const combos = COACHES_V230.flatMap((c) => COMBOS.map(([st, seq]) => measureCombo(c, st, seq)));
    const idle = COACHES_V230.flatMap((c) => (['boxing', 'muaythai', 'mma'] as const).map((st) => measureIdle(c, st)));
    expect(all.length).toBeGreaterThan(PAIRS.length * 5);
    const name = process.env.AUDIT_V230;
    setV230FromQuery(null);
    if (name) writeFileSync(resolve(__dirname, `../../../docs/v230/audit/${name}.json`), JSON.stringify({ motions: all, combos, idle }, null, 1));
  });
});
