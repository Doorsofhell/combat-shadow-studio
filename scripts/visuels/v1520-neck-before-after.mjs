// v1.52 isolated WebGL comparative, using exact v1.51 release as baseline.
// Same viewport, camera, animation, materials, quality and lighting on both servers.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stableRoot = resolve(process.cwd(), 'reference-v1510');
const outRoot = 'captures/v1520';
const cases = [
  ['kadir', 'mma-kadir'],
  ['amara', 'mma-amara'],
  ['nael', 'nael'],
  ['inaya', 'inaya'],
  ['victor', 'victor'],
];
const angles = [['three-quarter', 35], ['profile', 90], ['back', 180]];
const servers = [], manifest = [];
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const [root, port] of [[stableRoot, 5261], [process.cwd(), 5262]]) {
    const server = await createServer({ root, logLevel: 'error',
      server: { port, strictPort: true, hmr: false, watch: null } });
    await server.listen();
    servers.push(server);
  }
  for (const [coach, champion] of cases) {
    for (const [angle, az] of angles) {
      for (const [label, port] of [['avant', 5261], ['apres', 5262]]) {
        const name = coach + '-' + angle;
        const dir = outRoot + '/' + label;
        mkdirSync(dir, { recursive: true });
        const page = await browser.newPage({ viewport: { width: 700, height: 900 },
          deviceScaleFactor: 1, colorScheme: 'dark' });
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', m => {
          if (m.type() === 'error' && /shader|webgl|compile|GLSL/i.test(m.text())) errors.push(m.text());
        });
        const q = new URLSearchParams({ champion, look: 'realiste', d: 'mma', tenue: 'mma',
          motion: 'garde', style: 'mma', az: String(az), el: '6',
          span: '1.04', fy: '0.86', mood: '1', alpha: '1' });
        try {
          await page.goto('http://localhost:' + port + '/#/lab?' + q, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => window.__labReady === true, null, { timeout: 120000 });
          await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit),
            null, { timeout: 90000 });
          if (await page.evaluate(() => window.__labOutfit) !== 'portee') throw Error('Outfit not loaded');
          await page.waitForTimeout(1250);
          if (errors.length) throw Error(errors.join(' | '));
          const capture = await page.evaluate(() => ({
            image: document.querySelector('canvas')?.toDataURL('image/png'),
            neck: window.__photoScene?.userData?.cssNeck152Report ?? null,
          }));
          if (!capture.image?.startsWith('data:image/png;base64,')) throw Error('Missing WebGL image');
          const bytes = Buffer.from(capture.image.split(',')[1], 'base64');
          if (bytes.length < 15000) throw Error('Suspicious render size ' + bytes.length);
          writeFileSync(dir + '/' + name + '.png', bytes);
          manifest.push({ coach, champion, angle, az, label, status: 'ok', bytes: bytes.length, neck: capture.neck });
          console.log('REAL WEBGL', name, label, bytes.length, JSON.stringify(capture.neck));
        } catch (e) {
          manifest.push({ coach, angle, label, status: 'failed', error: String(e) });
          console.error('REAL WEBGL FAILED', name, label, String(e));
        } finally {
          await page.close();
        }
      }
    }
  }
} finally {
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(outRoot + '/manifest.json', JSON.stringify(manifest, null, 2));
  await browser.close();
  for (const server of servers) await server.close();
}
if (manifest.some(x => x.status !== 'ok')) process.exitCode = 1;
