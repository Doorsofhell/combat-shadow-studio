import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };
import { bootAssets, bootModels, compressedBuild } from './tools/build/bootModels.ts';
import { modelCaching } from './tools/build/swModeles.ts';
import { nativeOnly } from './tools/build/nativeOnly.ts';

/** the version is shown in the page title of every build (%VITE_APP_VERSION% in index.html) */
process.env.VITE_APP_VERSION = pkg.version;

/** CAP_BUILD=1: build for the Android app (Capacitor); files are packaged in the APK, no service worker */
const NATIVE = process.env.CAP_BUILD === '1';

/**
 * 2.3.4: the public folder. Another one only for the GLB update test (tests/e2e/maj-modeles-v234.spec.ts builds a
 * second version of the app with one model changed, without touching public/).
 */
const PUBLIC = process.env.CSS_PUBLIC_DIR || 'public';

export default defineConfig(async ({ command }) => {
  // 2.3.4: the fingerprint of each 3D file this build serves, written into the service worker (tools/build/swModeles.ts)
  const fingerprints: Record<string, string> = {};
  if (command === 'build' && !NATIVE) for (const [rel, [, v]] of Object.entries(await bootAssets(PUBLIC, compressedBuild(command)))) fingerprints[rel] = v;
  return {
    base: './',
    publicDir: PUBLIC,
    plugins: [
      react(),
      // 1.34: the coaches' models compressed in the build, and the fingerprint of each file of the start screen
      bootModels(PUBLIC),
      // 1.56.4: the APK leaves out the files only the illustration tools use (referee outfits)
      nativeOnly(NATIVE),
      VitePWA({
        disable: NATIVE,
        registerType: 'autoUpdate',
        includeAssets: ['icons/*.png', 'icons/*.svg', 'draco/*'],
        manifest: {
          name: 'Combat Shadow Studio',
          short_name: 'Shadow Studio',
          description: 'Entraînement solo en boxe anglaise, kick-boxing, MMA et muay-thaï avec un coach 3D.',
          lang: 'fr',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0b0f14',
          theme_color: '#0b0f14',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,webp,svg,glb,wasm,json,woff,woff2}', 'draco/*'],
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          // 1.3.3 referee outfits: only for the encyclopedia illustrations (scripts/visuels), never loaded by the app.
          // 1.10.1 (Youssef, 03/11 « je ne vois toujours pas la 1.10 ») : the coaches and their outfits (108 Mo) are no
          // longer kept ahead. Every update had to download all changed models before the new version could start
          // (71 Mo for 1.10); closed before the end, the phone stayed on the old one. They are kept on first use instead.
          globIgnores: ['**/tenues/arbitre*', 'coaches/*/**', 'models/**', 'salles/**'],
          // 2.3.4 (Youssef, 2026-11-20, P0): before, two rules matched coaches/ and salles/ and Workbox only ever
          // applies the first one (CacheFirst): the NetworkFirst written after it never ran for them. Now two rules
          // that never match the same file: the versioned 3D (CacheFirst checked by fingerprint) and the rest
          // (NetworkFirst). Who does what: tools/build/swModeles.ts.
          runtimeCaching: modelCaching(fingerprints),
        },
      }),
    ],
    build: { chunkSizeWarningLimit: 1800 },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['src/test/setup.ts'],
    },
  };
});
