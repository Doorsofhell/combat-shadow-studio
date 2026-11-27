import { defineConfig } from '@playwright/test';

/** End-to-end tests. Set CHROMIUM_PATH to use a preinstalled Chromium instead of the downloaded one. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 400, height: 820 },
    // 2.10.7 (CI GitHub): without CHROMIUM_PATH, the full Chromium in its new headless mode, as with the preinstalled
    // browser of the cloud sessions; the default « headless shell » handles fullscreen and the viewport differently
    // (the stage was not given the whole screen in fullscreen-dbltap.spec on GitHub)
    channel: process.env.CHROMIUM_PATH ? undefined : 'chromium',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
