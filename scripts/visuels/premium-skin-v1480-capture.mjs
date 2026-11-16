// Real WebGL captures of the production photo coaches for 1.48.0 review.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const port = 5201;
const vite = await createServer({ server: { port, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
await vite.listen();
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = 'artifacts/premium-skin-v1480';
mkdirSync(out, { recursive: true });
const cases = [
  ['kadir-front', 'mma-kadir', 0], ['amara-front', 'mma-amara', 0],
  ['nael-front', 'nael', 0], ['inaya-front', 'inaya', 0],
  ['victor-front', 'victor', 0], ['victor-profile', 'victor', 90],
  ['victor-back', 'victor', 180],
];
const manifest = [];
try {
  for (const [name, champion, az] of cases) {
    const page = await browser.newPage({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 1 });
    const q = new URLSearchParams({ champion, look: 'realiste', d: 'mma', tenue: 'mma', motion: 'garde', style: 'mma', az: String(az), el: '6', span: '1.04', fy: '0.86', mood: '1', alpha: '1' });
    const url = `http://localhost:${port}/#/lab?${q}`;
    try {
      await page.goto(url);
      await page.waitForFunction(() => window.__labReady === true, null, { timeout: 180000 });
      await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 90000 });
      const status = await page.evaluate(() => window.__labOutfit);
      if (status !== 'portee') throw new Error(`Outfit not loaded: ${status}`);
      await page.waitForTimeout(1000);
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
if (manifest.some(x => x.status !== 'ok')) process.exitCode = 1;
