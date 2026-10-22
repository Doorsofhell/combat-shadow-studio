import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadSkeleton } from '../../../test/skeleton';
import { CoachRig } from '../../../engine/rig';
import { TECHNIQUES } from '../../../domain/techniques';
import { buildPicto } from '../build';
import data from '../techniquePictos.json';

/**
 * PICTOS_WRITE=1 npx vitest run src/ui/pictos/__tests__/pictos.test.ts  → regenerates techniquePictos.json from the
 * animations (to do after a motion changes). Without it, the file is checked against the animations.
 */
const rig = new CoachRig(loadSkeleton('homme'));
const built = Object.fromEntries(TECHNIQUES.map((t) => [t.id, buildPicto(rig, t)]));
if (process.env.PICTOS_WRITE === '1') writeFileSync(resolve(__dirname, '../techniquePictos.json'), JSON.stringify(built) + '\n');

describe('pictogrammes des techniques (v0.38)', () => {
  test('une figure pour chaque technique du catalogue, tirée de son animation', () => {
    const d = data as Record<string, unknown>;
    for (const t of TECHNIQUES) expect(d[t.id], t.id).toBeTruthy();
    expect(Object.keys(d).sort()).toEqual(TECHNIQUES.map((t) => t.id).sort());
  });
  test('le fichier correspond aux animations actuelles (sinon : PICTOS_WRITE=1)', () => {
    expect(JSON.parse(JSON.stringify(built))).toEqual(data);
  });
  test('chaque figure tient dans le cadre 48 × 48', () => {
    for (const [id, v] of Object.entries(data as Record<string, { p: [number, number][] }>))
      for (const [x, y] of v.p) {
        expect(x, id).toBeGreaterThanOrEqual(0);
        expect(x, id).toBeLessThanOrEqual(48);
        expect(y, id).toBeGreaterThanOrEqual(0);
        expect(y, id).toBeLessThanOrEqual(48);
      }
  });
});
