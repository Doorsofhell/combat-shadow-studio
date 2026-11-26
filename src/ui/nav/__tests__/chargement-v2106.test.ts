/**
 * 2.10.6 (graphe du code, lot 1 et 2): no two files of src/ import each other, and the bar, the menu and the
 * settings no longer load the whole history of the versions (src/domain/releases.ts) — only « Nouveautés » does.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LATEST_RELEASE_VERSION, hasUnseenRelease } from '../../../domain/releaseNotice';
import { LATEST_RELEASE, RELEASES } from '../../../domain/releases';
import pkg from '../../../../package.json';

const files: string[] = [];
(function walk(d: string) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      if (f !== '__tests__') walk(p);
    } else if (/\.tsx?$/.test(f) && !/\.test\.|\.d\.ts$/.test(f)) files.push(p);
  }
})('src');

const resolveImport = (from: string, spec: string) => {
  const b = resolve(dirname(from), spec);
  for (const c of [`${b}.ts`, `${b}.tsx`, `${b}/index.ts`, `${b}/index.tsx`, b]) if (existsSync(c) && statSync(c).isFile()) return relative('.', c);
  return null;
};

/** the files a file imports at run time (`import type` is erased by the compiler, it does not count) */
const imports = (f: string) =>
  [...readFileSync(f, 'utf8').matchAll(/^\s*(?:import|export)\s+(type\s+)?[^;]*?from\s+['"](\.[^'"]+)['"]/gm)]
    .filter((m) => !m[1])
    .map((m) => resolveImport(f, m[2]))
    .filter((x): x is string => !!x);

describe('2.10.6 dépendances circulaires', () => {
  it('aucun fichier de src/ n’importe un fichier qui l’importe', () => {
    const g = new Map(files.map((f) => [f, imports(f)]));
    const cycles: string[] = [];
    for (const [a, deps] of g) for (const b of deps) if (a < b && g.get(b)?.includes(a)) cycles.push(`${a} <-> ${b}`);
    expect(cycles).toEqual([]);
  });

  it('les trois boucles trouvées par le graphe sont cassées', () => {
    expect(imports('src/engine/phases.ts')).not.toContain(join('src', 'engine', 'study.ts'));
    expect(imports('src/ui/nav/SearchSheet.tsx')).not.toContain(join('src', 'ui', 'nav', 'NavSheets.tsx'));
    expect(imports('src/three/human/capabilities.ts')).not.toContain(join('src', 'three', 'face.ts'));
  });
});

describe('2.10.6 historique des versions chargé à la demande', () => {
  it('la dernière version connue de la barre est la première des Nouveautés et celle du paquet', () => {
    expect(LATEST_RELEASE_VERSION).toBe(RELEASES[0].version);
    expect(LATEST_RELEASE_VERSION).toBe(LATEST_RELEASE.version);
    expect(LATEST_RELEASE_VERSION).toBe(pkg.version.replace(/-.*$/, ''));
    expect(hasUnseenRelease(null)).toBe(true);
    expect(hasUnseenRelease(RELEASES[1].version)).toBe(true);
    expect(hasUnseenRelease(RELEASES[0].version)).toBe(false);
  });

  it('seule la liste des Nouveautés importe releases.ts, et elle est chargée à la demande', () => {
    const readers = files.filter((f) => imports(f).includes(join('src', 'domain', 'releases.ts')));
    // projectFacts.ts is read by the tests only (no screen imports it)
    expect(readers.sort()).toEqual([join('src', 'domain', 'projectFacts.ts'), join('src', 'ui', 'nav', 'NewsList.tsx')]);
    expect(files.filter((f) => imports(f).includes(join('src', 'domain', 'projectFacts.ts')))).toEqual([]);
    const sheets = readFileSync('src/ui/nav/NavSheets.tsx', 'utf8');
    expect(sheets).toMatch(/lazy\(\(\) => import\('\.\/NewsList'\)\)/);
    expect(sheets).not.toMatch(/from '\.\/NewsList'/);
  });
});
