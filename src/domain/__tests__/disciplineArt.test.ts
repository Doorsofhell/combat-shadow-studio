import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART_PENDING, DISCIPLINE_ART, disciplineArt } from '../disciplineArt';
import { DISCIPLINES } from '../types';

const root = join(__dirname, '../../..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('illustrations officielles des disciplines', () => {
  it('chaque discipline a son illustration, avec ses fichiers présents', () => {
    for (const d of DISCIPLINES) {
      // artwork still to be produced (BJJ, judo): listed explicitly, the UI shows the name alone
      if (ART_PENDING.includes(d.id)) {
        expect(disciplineArt(d.id), d.id).toBeUndefined();
        continue;
      }
      const a = disciplineArt(d.id);
      expect(a, d.id).toBeDefined();
      expect(a!.alt.length).toBeGreaterThan(5);
      expect(a!.credit.licence.length).toBeGreaterThan(5);
      for (const s of a!.sources) expect(existsSync(join(root, 'public', s.src)), s.src).toBe(true);
    }
  });

  it('une seule source par discipline : aucun écran ne cite un chemin d’image de discipline', () => {
    const offenders = walk(join(root, 'src'))
      .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('disciplineArt.ts') && !f.includes('__tests__'))
      .filter((f) => /art\/disciplines|disciplines\/[a-z]+\.(jpg|png|webp)/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('les images utilisent le même dessin à toutes les tailles (mêmes proportions)', () => {
    for (const a of Object.values(DISCIPLINE_ART).filter((x) => !!x)) {
      expect(a.sources.length).toBeGreaterThan(0);
      expect(a.width / a.height).toBeCloseTo(600 / 760, 2);
    }
  });

  it('une discipline sans illustration ne casse rien', () => {
    expect(disciplineArt('inconnue')).toBeUndefined();
  });
});
