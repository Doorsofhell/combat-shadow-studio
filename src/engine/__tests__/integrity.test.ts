import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { getLibrary } from '../library';
import type { StanceStyle } from '../author';
import { checkLibrary } from '../integrity';

// Static checks ported from CME-3D: every authored motion, for both coaches and every stance style.
const STYLES: StanceStyle[] = ['boxing', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'];

describe('intégrité des animations (contrôles statiques repris de CME-3D)', () => {
  test.each(['homme', 'femme'] as const)('%s : aucune erreur d’écriture dans la bibliothèque', (coach) => {
    const rig = new CoachRig(loadSkeleton(coach));
    const errors = STYLES.flatMap((s) => checkLibrary(getLibrary(rig, s).values()).filter((f) => f.level === 'error').map((f) => `${s} ${f.motionId}#${f.keyIndex} ${f.code} ${f.detail}`));
    expect(errors).toEqual([]);
  });
});
