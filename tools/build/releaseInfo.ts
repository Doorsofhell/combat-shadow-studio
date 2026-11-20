import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';
import { androidVersion } from '../../scripts/android-version.mjs';
import { RELEASES } from '../../src/domain/releases';

/**
 * 2.3.3 (Youssef 2026-11-20, P0 « version et documentation désynchronisées ») : publication information generated
 * at every build from the single source of the version, package.json. The build writes `version.json` next to
 * index.html: the deployed version can be read at <site>/version.json (GitHub Pages check, support), with the
 * Android versionName/versionCode computed by the same formula as the Play Store build and the « Nouveautés » entry
 * of that version. The build stops if Nouveautés does not announce the package version.
 */
export interface ReleaseInfo {
  name: string;
  version: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  commit: string | null;
  builtAt: string;
}

export function releaseInfo(version: string, now = new Date()): ReleaseInfo {
  const top = RELEASES[0];
  if (!top || top.version !== version) throw new Error(`Nouveautés (src/domain/releases.ts) annonce ${top?.version ?? 'rien'} au lieu de la version ${version} de package.json`);
  let commit: string | null = process.env.GITHUB_SHA ?? null;
  if (!commit) {
    try {
      commit = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
    } catch {
      commit = null;
    }
  }
  return { name: 'Combat Shadow Studio', version, ...androidVersion(version), releaseDate: top.releaseDate, title: top.title, commit, builtAt: now.toISOString() };
}

export function releaseInfoPlugin(version: string): Plugin {
  return {
    name: 'css-release-info',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: `${JSON.stringify(releaseInfo(version), null, 2)}\n` });
    },
  };
}
