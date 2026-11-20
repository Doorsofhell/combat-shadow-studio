/**
 * 2.3.3 (Youssef 2026-11-20, P0 « Version et documentation désynchronisées ») : one source for the version
 * (package.json) and documents generated from the real catalogues. This test fails when anything drifts.
 *
 * `npm run docs:sync` runs this file with SYNC_DOCS=1: it then rewrites the generated blocks of README.md and
 * docs/ETAT.md before checking them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import pkg from '../../package.json';
import { androidVersion } from '../../scripts/android-version.mjs';
import { releaseInfo } from '../../tools/build/releaseInfo';
import { etatBlock, projectFacts, readmeBlock, replaceBlock, type ComboCatalogFile } from './projectFacts';
import { RELEASES } from './releases';
import { DISCIPLINES } from './types';

const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = <T,>(p: string) => JSON.parse(read(p)) as T;

const facts = projectFacts({
  version: pkg.version,
  versionCode: androidVersion(pkg.version).versionCode,
  legends: json<ComboCatalogFile>('public/catalog/catalog-v1.json'),
  programmes: json<ComboCatalogFile>('public/catalog/programmes-v1.json'),
});
const DOCS: [file: string, id: string, body: string][] = [
  ['README.md', 'presentation', readmeBlock(facts)],
  ['docs/ETAT.md', 'etat', etatBlock(facts)],
];

if (process.env.SYNC_DOCS === '1') {
  for (const [file, id, body] of DOCS) fs.writeFileSync(path.join(ROOT, file), replaceBlock(read(file), id, body));
}

/** semver order of "x.y.z" (the « -protoN » drafts of v0.29 compare by their numbers only) */
const cmp = (a: string, b: string) => {
  const pa = a.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};

describe('source unique de version (2.3.3)', () => {
  test('package-lock.json porte la même version que package.json', () => {
    const lock = json<{ version: string; packages: Record<string, { version?: string }> }>('package-lock.json');
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages['']?.version).toBe(pkg.version);
  });

  test('le titre et l’écran À propos lisent la version injectée, jamais un numéro écrit à la main', () => {
    expect(read('index.html')).toContain('<title>Combat Shadow Studio v%VITE_APP_VERSION%</title>');
    expect(read('vite.config.ts')).toMatch(/process\.env\.VITE_APP_VERSION = pkg\.version/);
    expect(read('src/ui/screens/Settings.tsx')).toContain('Version {import.meta.env.VITE_APP_VERSION}');
  });

  test('Android : versionName et versionCode viennent de package.json', () => {
    const { versionName, versionCode } = androidVersion(pkg.version);
    const [x, y, z] = pkg.version.split('.').map(Number);
    expect(versionName).toBe(pkg.version);
    expect(versionCode).toBe(x * 10000 + y * 100 + z);
    const gradle = read('android/app/build.gradle');
    expect(gradle).toMatch(/versionCode = Integer\.parseInt\(versionProps\.getProperty\('versionCode'/);
    expect(gradle).toMatch(/versionName = versionProps\.getProperty\('versionName'/);
    expect(read('package.json')).toMatch(/node scripts\/android-version\.mjs && cap sync android/);
    expect(() => androidVersion('2.3')).toThrow();
    expect(() => androidVersion('2.100.0')).toThrow();
  });

  // dates: 1.33.2 (lot made outside this follow-up, recorded on 2026-11-12) is dated after 1.34.0; the history is
  // kept as it is, so only « no version dated after the newest one » is required
  test('Nouveautés : versions uniques, de la plus récente à la plus ancienne, aucune datée après la dernière', () => {
    expect(RELEASES[0]?.version).toBe(pkg.version);
    for (let i = 1; i < RELEASES.length; i++) {
      expect(cmp(RELEASES[i - 1].version, RELEASES[i].version), `${RELEASES[i - 1].version} avant ${RELEASES[i].version}`).toBeGreaterThan(0);
    }
    for (const r of RELEASES) {
      expect(r.releaseDate, r.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.releaseDate <= RELEASES[0].releaseDate, `${r.version} datée après ${RELEASES[0].version}`).toBe(true);
    }
  });

  test('informations de publication (version.json) générées depuis la même source', () => {
    const info = releaseInfo(pkg.version, new Date('2026-11-20T12:00:00Z'));
    expect(info).toMatchObject({ version: pkg.version, versionName: pkg.version, versionCode: androidVersion(pkg.version).versionCode, releaseDate: RELEASES[0].releaseDate, title: RELEASES[0].title });
    expect(() => releaseInfo('99.0.0')).toThrow(/Nouveautés/);
  });
});

describe('documentation générée depuis les catalogues réels (2.3.3)', () => {
  test('les chiffres comptés correspondent au modèle métier', () => {
    expect(facts.disciplines.map((d) => d.id)).toEqual(DISCIPLINES.map((d) => d.id));
    expect(facts.disciplines).toHaveLength(6);
    for (const d of facts.disciplines) {
      expect(d.techniques, d.id).toBeGreaterThan(0);
      expect(d.exercises, d.id).toBeGreaterThan(0);
    }
    expect(facts.coaches.length).toBeGreaterThanOrEqual(6);
    expect(facts.legends.combos).toBe(Object.values(facts.legends.statuses).reduce((a, b) => a + b, 0));
  });

  for (const [file, id, body] of DOCS) {
    test(`${file} est à jour (sinon lancer « npm run docs:sync »)`, () => {
      expect(read(file)).toBe(replaceBlock(read(file), id, body));
    });
  }

  test('plus aucun ancien chiffre figé dans le README ni dans l’état du projet', () => {
    for (const file of ['README.md', 'docs/ETAT.md']) {
      const doc = read(file);
      expect(doc, file).not.toMatch(/quatre disciplines|4 disciplines|64 techniques|17 octobre 2026/);
    }
    expect(read('docs/ETAT.md')).toContain(`version ${pkg.version}`);
  });
});
