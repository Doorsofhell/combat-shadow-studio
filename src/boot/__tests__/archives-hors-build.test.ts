import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NATIVE_EXCLUDED } from '../../../tools/build/nativeOnly';
import { bootFiles } from '../../../tools/build/bootModels';

/** 1.56.4 réorganisation du dépôt: the archives stay out of every build, and the app keeps every file it loads */
const ARCH = '_ARCHIVES_HORS_APPLICATION';
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

describe('archives hors application', () => {
  it('the archive folder is outside src/ and public/, with its inventory', () => {
    expect(existsSync(join(ARCH, 'inventaire-archives.md'))).toBe(true);
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
    expect(tsconfig.include).toEqual(['src']);
  });

  it('public/ holds no generator working copy (_tex), no python cache and no orphan coach picture', () => {
    const files = walk('public').map((f) => f.replace(/\\/g, '/'));
    expect(files.filter((f) => f.includes('/_tex/'))).toEqual([]);
    expect(files.filter((f) => /__pycache__|\.pyc$/.test(f))).toEqual([]);
    expect(files.filter((f) => /^public\/coaches\/[^/]+\.jpg$/.test(f))).toEqual([]);
  });

  it('every coach keeps its photo model, portrait and the outfits of the six disciplines', () => {
    for (const c of ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya']) {
      expect(existsSync(`public/coaches/${c}/photo.glb`)).toBe(true);
      expect(existsSync(`public/coaches/${c}/portrait.webp`)).toBe(true);
      for (const o of ['boxe', 'kickboxing', 'mma', 'muaythai', 'judo', 'bjj', 'bjj-nogi'])
        expect(existsSync(`public/coaches/${c}/tenues/${o}.glb`), `${c}/${o}`).toBe(true);
    }
    expect(existsSync('public/coaches/mma-amara/photo-clean.glb')).toBe(true);
    expect(existsSync('public/coaches/LICENSE-ROCKETBOX.txt')).toBe(true);
  });

  it('the APK leaves out only the referee outfits, never a file of the start screen', () => {
    expect(NATIVE_EXCLUDED.test('coaches/mma-kadir/tenues/arbitre.glb')).toBe(true);
    expect(NATIVE_EXCLUDED.test('coaches/mma-amara/tenues/arbitre-judo.glb')).toBe(true);
    for (const f of bootFiles()) expect(NATIVE_EXCLUDED.test(f), f).toBe(false);
  });
});
