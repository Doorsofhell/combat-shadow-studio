import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TECHNIQUES, TECHNIQUE_BY_ID } from '../techniques';
import { DISCIPLINES } from '../types';
import { DISCIPLINE_ART } from '../disciplineArt';
import { RENDERS, SCENES } from '../encyclopedia/images';

// 1.2.1 « Visuels studio » (Youssef, 2026-10-28): every picture of a coach is made by scripts/visuels from our own 3D
// coaches, in the dark gym of its discipline. These tests check what the generator promises: every file, at its size,
// one ambiance per discipline, and pose corrections that name real techniques.
const root = resolve(__dirname, '../../..');
const pub = (p: string) => resolve(root, 'public', p);

/** width and height of a WebP file (lossy VP8, lossless VP8L or extended VP8X) */
function webpSize(path: string) {
  const b = readFileSync(path);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8L') {
    const v = b.readUInt32LE(21);
    return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) };
  }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
}

/** a photo-like lossy WebP (VP8 or VP8X), as the compositor writes, not a lossless drawing */
const isPhotoWebp = (path: string) => ['VP8 ', 'VP8X'].includes(readFileSync(path).toString('ascii', 12, 16));

describe('visuels studio', () => {
  it('une ambiance par discipline, avec ses trois couleurs', () => {
    const amb = JSON.parse(readFileSync(resolve(root, 'scripts/visuels/ambiances.json'), 'utf8'));
    for (const d of DISCIPLINES) {
      expect(amb[d.id], d.id).toBeDefined();
      for (const k of ['base', 'haze', 'light']) {
        expect(amb[d.id][k], `${d.id} ${k}`).toHaveLength(3);
        for (const c of amb[d.id][k]) expect(c).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('les corrections de pose visent des techniques qui existent, avec leur raison', () => {
    const poses = JSON.parse(readFileSync(resolve(root, 'scripts/visuels/poses.json'), 'utf8'));
    for (const [key, p] of Object.entries(poses) as [string, Record<string, unknown>][]) {
      if (key.startsWith('_')) continue;
      const [tech, coach] = key.split('@');
      expect(TECHNIQUE_BY_ID.has(tech), key).toBe(true);
      if (coach) expect(['homme', 'femme']).toContain(coach);
      expect(String(p.why ?? '').length, `${key} : pourquoi`).toBeGreaterThan(10);
    }
  });

  it('vignettes : une par technique et par coach, 240 x 300', () => {
    for (const coach of ['homme', 'femme'])
      for (const t of TECHNIQUES) {
        const f = pub(`thumbs/${coach}/${t.id}.webp`);
        expect(existsSync(f), f).toBe(true);
        expect(webpSize(f), f).toEqual({ w: 240, h: 300 });
        expect(isPhotoWebp(f), f).toBe(true);
      }
  });

  it('encyclopédie : chaque illustration de coach et chaque objet, 720 x 400 et miniature 160', () => {
    for (const id of [...RENDERS.map((r) => r.id), ...SCENES.map((s) => s.id)]) {
      expect(webpSize(pub(`encyclopedie/${id}.webp`)), id).toEqual({ w: 720, h: 400 });
      expect(webpSize(pub(`encyclopedie/${id}-mini.webp`)), id).toEqual({ w: 160, h: 160 });
    }
  });

  it('les six disciplines ont leur visuel officiel, aux deux tailles', () => {
    for (const d of DISCIPLINES) {
      const a = DISCIPLINE_ART[d.id];
      expect(a, d.id).toBeDefined();
      expect(webpSize(pub(`art/disciplines/${d.id}-600.webp`))).toEqual({ w: 600, h: 760 });
      expect(webpSize(pub(`art/disciplines/${d.id}-240.webp`))).toEqual({ w: 240, h: 304 });
    }
  });
});
