import { defineConfig, mergeConfig } from 'vite';
import { resolve } from 'node:path';
import base from './vite.config';

/** Publishable viewer: both engines side by side, few files (one chunk per library). */
export default mergeConfig(base, defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist', 'viewer'),
    rollupOptions: {
      input: { index: resolve(__dirname, 'index.html'), three: resolve(__dirname, 'three.html'), babylon: resolve(__dirname, 'babylon.html') },
      output: {
        manualChunks(id: string) {
          if (id.includes('@babylonjs')) return 'babylon-lib';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
}));
