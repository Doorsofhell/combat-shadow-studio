// Real WebGL screenshots of Amara, captured from the app's own Lab; never a synthetic mockup.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const port = 5199;
const vite = await createServer({ server: { port, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
await vite.listen();
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = 'artifacts/amara-v1471';
mkdirSync(out, { recursive: true });
const cases = [
  ['mma-face', 'mma', 0, 'garde'],
  ['mma-three-quarter', 'mma', 28, 'garde'],
  ['mma-profile', 'mma', 90, 'garde'],
  ['mma-back', 'mma', 180, 'garde'],
  ['kickboxing', 'kickboxing', 28, 'garde'],
  ['muaythai', 'muaythai', 28, 'garde'],
  ['bjj-gi', 'bjj', 28, 'garde'],
  ['bjj-nogi', 'bjj', 28, 'garde'],
  ['judo', 'judo', 28, 'garde'],
];
const manifest = [];
try {
  for (const [name, discipline, az, motion] of cases) {
    const page = await browser.newPage({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 1 });
    const q = new URLSearchParams({ champion: 'mma-amara', look: 'realiste', d: discipline, tenue: name === 'bjj-nogi' ? 'bjj-nogi' : discipline, motion, style: discipline, az: String(az), el: '6', span: '1.04', fy: '0.86', mood: '1', alpha: '1' });
    const url = `http://localhost:${port}/#/lab?${q}`;
    try {
      await page.goto(url);
      await page.waitForFunction(() => window.__labReady === true, null, { timeout: 180000 });
      await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 90000 });
      const status = await page.evaluate(() => window.__labOutfit);
      if (status !== 'portee') throw new Error(`Outfit not loaded: ${status}`);
      await page.waitForTimeout(1200);
      const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
      writeFileSync(`${out}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
      manifest.push({ name, status: 'ok', url });
      console.log('REAL RENDER', name);
    } catch (e) {
      manifest.push({ name, status: 'failed', error: String(e) });
      console.error('RENDER FAILED', name, String(e));
    } finally { await page.close(); }
  }
} finally {
  writeFileSync(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
  await browser.close();
  await vite.close();
}
if (manifest.some((x) => x.status !== 'ok')) process.exitCode = 1;
