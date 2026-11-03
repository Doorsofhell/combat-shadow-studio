import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as engine from '..';

// v0.49 (Youssef, 2026-10-27: « le moteur soit une espèce de module à part qui est utilisé par l'application et
// que je peux faire évoluer progressivement »): the engine is used through src/engine/index.ts only, and reads
// nothing of the app around it.

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
const imports = (file: string) => [...readFileSync(file, 'utf8').matchAll(/^\s*import\s+(type\s+)?[^'"]*from\s+'([^']+)'/gm)].map((m) => ({ typeOnly: !!m[1], from: m[2] }));
const isTest = (f: string) => f.includes('__tests__') || f.startsWith(join('src', 'test'));

/** the catalogue checks: they read the technique catalogue to measure the engine, the app never loads them */
const CATALOGUE_CHECKS = [join('src', 'engine', 'registry.ts'), join('src', 'engine', 'audit.ts')];

describe('module moteur (v0.49)', () => {
  it('l’application passe uniquement par src/engine/index.ts', () => {
    const outside = walk('src').filter((f) => !f.startsWith(join('src', 'engine')) && !isTest(f));
    const deep = outside.flatMap((f) => imports(f).filter((i) => /(^|\/)engine\/./.test(i.from)).map((i) => `${f} → ${i.from}`));
    expect(deep).toEqual([]);
  });

  it('le moteur ne lit ni écran, ni réglages, ni son, ni scène de l’application', () => {
    const inside = walk(join('src', 'engine')).filter((f) => !isTest(f) && !CATALOGUE_CHECKS.includes(f));
    const bad = inside.flatMap((f) =>
      imports(f)
        .filter((i) => i.from.startsWith('.'))
        .filter((i) => /(^|\/)\.\.\/(ui|three|store|audio|coach|platform|firebase|domain)\b/.test(i.from) || /^\.\.\/\.\.\/\.\.\//.test(i.from))
        // the shared vocabulary of the catalogue (types only, nothing loaded)
        .filter((i) => !(i.typeOnly && /\/domain\/types$/.test(i.from)))
        .map((i) => `${f} → ${i.from}`),
    );
    expect(bad).toEqual([]);
  });

  it('l’application ne charge pas les contrôles du catalogue', () => {
    const outside = walk('src').filter((f) => !f.startsWith(join('src', 'engine')) && !isTest(f));
    const used = outside.flatMap((f) => imports(f).filter((i) => /engine\/(registry|audit)$/.test(i.from)).map((i) => `${f} → ${i.from}`));
    expect(used).toEqual([]);
  });

  it('a un numéro de version et un journal des changements', () => {
    expect(engine.ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    const log = readFileSync('docs/moteur/CHANGELOG.md', 'utf8');
    expect(log).toContain(`## ${engine.ENGINE_VERSION}`);
  });
});
