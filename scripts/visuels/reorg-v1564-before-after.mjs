// 1.56.4 (réorganisation du dépôt) : captures WebGL réelles avant/après, mêmes coachs, tenues, pose, angle,
// cadrage et résolution. Sert les deux builds statiques (dist d'avant et dist d'après) et compare les pixels.
// Usage : node scripts/visuels/reorg-v1564-before-after.mjs <dist-avant> <dist-apres> <dossier-sortie>
import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [avantDir, apresDir, outRoot = 'captures/v1564-reorganisation'] = process.argv.slice(2);
if (!avantDir || !apresDir) throw new Error('usage: <dist-avant> <dist-apres> [sortie]');

const COACHS = ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
const STYLE = { boxe: 'boxing', kickboxing: 'kickboxing', mma: 'mma', muaythai: 'muaythai', judo: 'judo', bjj: 'bjj' };
const D = ['boxe', 'kickboxing', 'mma', 'muaythai', 'judo', 'bjj'];
/** each coach in two disciplines (all six disciplines covered twice), three-quarter view; plus face/profile/back */
const cases = [];
COACHS.forEach((c, i) => {
  for (const d of [D[i], D[(i + 3) % 6]]) cases.push({ name: `${c}-${d}-34`, champion: c, d, tenue: d, az: 35 });
});
for (const [c, d, t] of [['mma-kadir', 'mma', 'mma'], ['inaya', 'bjj', 'bjj-nogi']])
  for (const [v, az] of [['face', 0], ['profil', 90], ['dos', 180]]) cases.push({ name: `${c}-${t}-${v}`, champion: c, d, tenue: t, az });

// CASES=a,b: only these cases (e.g. a control run avant vs avant to measure the noise of the live face)
if (process.env.CASES) { const keep = new Set(process.env.CASES.split(',')); cases.splice(0, cases.length, ...cases.filter((c) => keep.has(c.name))); }
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch({ headless: true, executablePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const servers = [];
const manifest = { date: new Date().toISOString(), avant: resolve(avantDir), apres: resolve(apresDir), viewport: '600x800 dpr1', cases: [] };
try {
  for (const [dir, port] of [[avantDir, 5261], [apresDir, 5262]]) {
    servers.push(await preview({ build: { outDir: resolve(dir) }, preview: { port, strictPort: true }, logLevel: 'error' }));
  }
  for (const k of cases) {
    const shots = {};
    for (const [label, port] of [['avant', 5261], ['apres', 5262]]) {
      const dir = `${outRoot}/${label}`;
      mkdirSync(dir, { recursive: true });
      const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1, colorScheme: 'dark' });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error' && /shader|webgl|compile|GLSL|glb|gltf/i.test(m.text())) errors.push(m.text()); });
      const q = new URLSearchParams({ champion: k.champion, look: 'realiste', d: k.d, tenue: k.tenue, motion: 'garde', style: STYLE[k.d],
        az: String(k.az), el: '6', span: '1.04', fy: '0.86', mood: '1', alpha: '1' });
      try {
        await page.goto(`http://localhost:${port}/#/lab?${q}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__labReady === true, null, { timeout: 180000 });
        await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 120000 });
        const outfit = await page.evaluate(() => window.__labOutfit);
        if (outfit !== 'portee') throw new Error('tenue non chargée : ' + outfit);
        await page.waitForTimeout(1500);
        if (errors.length) throw new Error('erreurs WebGL/navigateur : ' + errors.join(' | '));
        const png = await page.evaluate(() => {
          const c = document.querySelector('canvas');
          if (!c || c.width < 300) throw new Error('canvas WebGL absent');
          return c.toDataURL('image/png');
        });
        const bytes = Buffer.from(png.split(',')[1], 'base64');
        if (bytes.length < 15000) throw new Error('rendu vide : ' + bytes.length);
        writeFileSync(`${dir}/${k.name}.png`, bytes);
        // raw pixels for the comparison
        shots[label] = await page.evaluate(async (src) => {
          const img = new Image(); img.src = src; await img.decode();
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
          const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
          return { w: img.width, h: img.height, d: Array.from(x.getImageData(0, 0, img.width, img.height).data) };
        }, png);
        console.log('OK', label, k.name, bytes.length);
      } catch (e) {
        shots[label] = { error: String(e) };
        console.error('ÉCHEC', label, k.name, String(e));
      } finally {
        await page.close();
      }
    }
    const a = shots.avant, b = shots.apres;
    const row = { ...k };
    if (a?.d && b?.d && a.w === b.w && a.h === b.h) {
      let diff = 0, max = 0;
      for (let i = 0; i < a.d.length; i += 4) {
        const m = Math.max(Math.abs(a.d[i] - b.d[i]), Math.abs(a.d[i + 1] - b.d[i + 1]), Math.abs(a.d[i + 2] - b.d[i + 2]), Math.abs(a.d[i + 3] - b.d[i + 3]));
        if (m > 2) diff++;
        if (m > max) max = m;
      }
      Object.assign(row, { status: 'ok', pixels: a.w * a.h, pixelsDifferents: diff, ecartMax: max });
    } else Object.assign(row, { status: 'échec', avant: a?.error ?? 'ok', apres: b?.error ?? 'ok' });
    manifest.cases.push(row);
    console.log('COMPARAISON', JSON.stringify(row));
  }
} finally {
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(`${outRoot}/manifest.json`, JSON.stringify(manifest, null, 1));
  for (const s of servers) await new Promise((r) => s.httpServer.close(r));
  await browser.close();
}
