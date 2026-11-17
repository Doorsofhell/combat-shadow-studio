// 1.51.0: matched real WebGL screenshots for Kadir, Naël and Inaya versus published 1.50.0.
// Screens are committed to captures/v1510/ by the CI workflow for direct image URLs.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stableRoot = resolve(process.cwd(), 'reference-v1500');
const outRoot = 'captures/v1510';
const cases = [
  ['kadir-face', 'mma-kadir', 0],
  ['kadir-three-quarter', 'mma-kadir', 35],
  ['kadir-profile', 'mma-kadir', 90],
  ['nael-face', 'nael', 0],
  ['nael-three-quarter', 'nael', 35],
  ['nael-profile', 'nael', 90],
  ['inaya-face', 'inaya', 0],
  ['inaya-three-quarter', 'inaya', 35],
  ['inaya-profile', 'inaya', 90],
];
const servers = [];
const manifest = [];
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const [root, port] of [[stableRoot, 5247], [process.cwd(), 5248]]) {
    const server = await createServer({ root, logLevel: 'error',
      server: { port, strictPort: true, hmr: false, watch: null } });
    await server.listen();
    servers.push(server);
  }
  for (const [name, champion, az] of cases) {
    for (const [label, port] of [['avant', 5247], ['apres', 5248]]) {
      const dir = `${outRoot}/${label}`;
      mkdirSync(dir, { recursive: true });
      const page = await browser.newPage({ viewport: { width: 700, height: 900 },
        deviceScaleFactor: 1, colorScheme: 'dark' });
      const errors = [];
      page.on('pageerror', err => errors.push(String(err)));
      page.on('console', m => {
        if (m.type() === 'error' && /shader|webgl|compile|GLSL/i.test(m.text())) errors.push(m.text());
      });
      const q = new URLSearchParams({ champion, look: 'realiste', d: 'mma',
        tenue: 'mma', motion: 'garde', style: 'mma', az: String(az),
        el: '6', span: '1.04', fy: '0.86', mood: '1', alpha: '1' });
      const url = `http://localhost:${port}/#/lab?${q}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__labReady === true, null, { timeout: 120000 });
        await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null,
          { timeout: 90000 });
        const outfit = await page.evaluate(() => window.__labOutfit);
        if (outfit !== 'portee') throw new Error('Outfit not loaded: ' + outfit);
        await page.waitForTimeout(1250);
        if (errors.length) throw new Error('WebGL/browser error(s): ' + errors.join(' | '));
        const png = await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas || canvas.width < 300 || canvas.height < 300) {
            throw new Error('Missing / undersized WebGL canvas');
          }
          return canvas.toDataURL('image/png');
        });
        if (!png.startsWith('data:image/png;base64,')) throw new Error('Invalid screenshot');
        const bytes = Buffer.from(png.split(',')[1], 'base64');
        if (bytes.length < 15000) throw new Error('Suspiciously empty render: ' + bytes.length + ' bytes');
        writeFileSync(`${dir}/${name}.png`, bytes);
        manifest.push({ name, champion, az, label, status: 'ok', bytes: bytes.length });
        console.log('MATCHED WEBGL', label, name, bytes.length);
      } catch (e) {
        manifest.push({ name, champion, az, label, status: 'failed', error: String(e) });
        console.error('MATCHED WEBGL FAILED', label, name, String(e));
      } finally {
        await page.close();
      }
    }
  }
} finally {
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(`${outRoot}/manifest.json`, JSON.stringify(manifest, null, 2));
  await browser.close();
  for (const server of servers) await server.close();
}
if (manifest.some(x => x.status !== 'ok')) process.exitCode = 1;
