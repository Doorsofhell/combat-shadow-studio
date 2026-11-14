import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadSkeleton } from '../../test/skeleton';
import { CoachRig } from '../rig';
import { buildRegistry, registryMarkdown } from '../registry';
import { COACH_STANCES } from '../../domain/coaches/motion';
import { TECHNIQUES } from '../../domain/techniques';

// 1.41.0: the four coaches of the app, their own skeleton and guard (was: the generated skeleton coach_male.glb)
const rows = buildRegistry(
  (
    [
      ['mma-kadir', 'homme'],
      ['mma-amara', 'femme'],
      ['nael', 'homme'],
      ['inaya', 'femme'],
    ] as const
  ).map(([id, sex]) => ({ id, rig: new CoachRig(loadSkeleton(sex, `coaches/${id}/photo.glb`)), offsets: COACH_STANCES[id] })),
);
const DOC = 'docs/ANIMATIONS.md';
const JSON_FILE = 'src/domain/animationStatus.json';
const json = JSON.stringify(Object.fromEntries(rows.map((r) => [r.id, { status: r.status, notes: r.notes }])), null, 1) + '\n';

describe('registre des animations', () => {
  test('à jour dans la documentation et dans l’application', () => {
    const md = registryMarkdown(rows);
    if (process.env.UPDATE_REGISTRY) {
      writeFileSync(DOC, md);
      writeFileSync(JSON_FILE, json);
    }
    expect(existsSync(DOC) && readFileSync(DOC, 'utf8')).toBe(md);
    expect(readFileSync(JSON_FILE, 'utf8')).toBe(json);
  });

  test('chaque technique solo a une animation, aucune n’est « validée » sans revue d’expert', () => {
    for (const t of TECHNIQUES.filter((x) => x.mode !== 'partenaire')) expect(rows.find((r) => r.id === t.id)?.status).not.toBe('manquante');
    expect(rows.filter((r) => r.status === 'validee')).toHaveLength(0);
  });

  test('les coups ne présentent ni glissement d’appui ni chaîne inversée', () => {
    const bad = rows.filter((r) => r.status === 'a-corriger').map((r) => `${r.id}: ${r.notes.join(', ')}`);
    expect(bad).toEqual([]);
  });
});
