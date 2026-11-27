import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

/** 2.10.7: the full suite runs on GitHub for every PR, and only the workflows still in use stay active */
describe('intégration continue (2.10.7)', () => {
  it('ci.yml lance tsc, toute la suite Vitest, la construction et Playwright sur chaque PR', () => {
    const wf = readFileSync('.github/workflows/ci.yml', 'utf8');
    expect(wf).toMatch(/^on:\n  pull_request:/m);
    expect(wf).toContain('npm run typecheck');
    expect(wf).toMatch(/run: npm run test\n/); // la suite complète, sans liste de fichiers
    expect(wf).toContain('npm run build');
    expect(wf).toMatch(/npx playwright test --shard=\$\{\{ matrix\.shard \}\}\/4/);
    expect(wf).toContain('shard: [1, 2, 3, 4]');
  });

  it('seuls les workflows utilisés restent actifs ; les anciens sont archivés, pas supprimés', () => {
    expect(readdirSync('.github/workflows').sort()).toEqual(['android-apk.yml', 'android-release.yml', 'ci.yml', 'preview.yml']);
    for (const f of ['amara-v1377', 'amara-finish-v1380', 'amara-skin-v1378', 'audit-amara-mma-v1376', 'audit-amara-torso-v1375',
      'cinematic-v1530-webgl', 'fighter-visual-v1510', 'premium-skin-v1480', 'premium-visual-v1490', 'visual-v1500-pilot'])
      expect(existsSync(`_ARCHIVES_HORS_APPLICATION/anciens-scripts/.github/workflows/${f}.yml`), f).toBe(true);
  });
});
