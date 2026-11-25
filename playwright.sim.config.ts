import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * 2.9.0 (Youssef, « Identification visuelle Freemium / Premium », §9): the preview build with the status simulation
 * (VITE_PREMIUM_SIMULATION=1), to test the padlocks for a free, a Premium and a refunded user on the real screens.
 * Run: CHROMIUM_PATH=… npx playwright test -c playwright.sim.config.ts
 */
export default defineConfig({
  ...base,
  testDir: 'tests/e2e-sim',
  use: { ...base.use, baseURL: 'http://localhost:4174' },
  webServer: {
    command: 'VITE_PREMIUM_SIMULATION=1 npx vite build --outDir dist-sim && npx vite preview --port 4174 --strictPort --outDir dist-sim',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
