import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Comparison lab, separate from the app build. LAB_ENTRY=three|babylon builds one engine at a time,
 * so each bundle is measured alone and the two engines are never loaded on the same page.
 */
const entry = process.env.LAB_ENTRY;
const pages = { three: resolve(__dirname, 'three.html'), babylon: resolve(__dirname, 'babylon.html') };

export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: resolve(__dirname, '../public'),
  plugins: [react()],
  server: { fs: { allow: [resolve(__dirname, '..')] } },
  build: {
    outDir: resolve(__dirname, 'dist', entry ?? 'all'),
    emptyOutDir: true,
    copyPublicDir: false,
    chunkSizeWarningLimit: 5000,
    sourcemap: process.env.LAB_SOURCEMAP === '1',
    rollupOptions: { input: entry ? { [entry]: pages[entry as keyof typeof pages] } : pages },
  },
});
