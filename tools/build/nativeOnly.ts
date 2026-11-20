import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * 1.56.4 (réorganisation du dépôt, Youssef 2026-11-18 : « conserver dans l'application Android uniquement les
 * composants, fichiers et ressources réellement nécessaires »).
 *
 * The referee outfits (coaches/<id>/tenues/arbitre*.glb) are only worn in the lab, to render the encyclopedia
 * pictures (src/domain/encyclopedia/images.ts, scripts/visuels); the app never loads them (src/boot/preload.ts,
 * bootFiles() and the service worker already leave them out). They stay in public/ and in the web build for the
 * illustration tools; the Android build (CAP_BUILD=1) leaves them out of the APK.
 */
export const NATIVE_EXCLUDED = /^coaches\/[^/]+\/tenues\/arbitre[^/]*\.glb$/;

export function nativeOnly(native: boolean): Plugin {
  let outDir = 'dist';
  return {
    name: 'css-native-only',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      if (!native) return;
      const coaches = join(outDir, 'coaches');
      if (!existsSync(coaches)) return;
      for (const c of readdirSync(coaches)) {
        const t = join(coaches, c, 'tenues');
        if (!existsSync(t)) continue;
        for (const f of readdirSync(t)) if (NATIVE_EXCLUDED.test(`coaches/${c}/tenues/${f}`)) rmSync(join(t, f));
      }
    },
  };
}
