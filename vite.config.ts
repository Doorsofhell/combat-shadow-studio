import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

/** the version is shown in the page title of every build (%VITE_APP_VERSION% in index.html) */
process.env.VITE_APP_VERSION = pkg.version;

/** CAP_BUILD=1: build for the Android app (Capacitor); files are packaged in the APK, no service worker */
const NATIVE = process.env.CAP_BUILD === '1';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      disable: NATIVE,
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'coaches/*.jpg', 'draco/*'],
      manifest: {
        name: 'Combat Shadow Studio',
        short_name: 'Shadow Studio',
        description: "Entraînement solo en boxe anglaise, kick-boxing, MMA et muay-thaï avec un coach 3D.",
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
        // 1.3.3 referee outfits: only for the encyclopedia illustrations (scripts/visuels), never loaded by the app
        globIgnores: ['**/tenues/arbitre*'],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1800 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
  },
});
