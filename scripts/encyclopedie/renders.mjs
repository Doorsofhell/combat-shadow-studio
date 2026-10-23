// v0.46 Encyclopédie: renders the coach illustrations listed in src/domain/encyclopedia/images.ts (RENDERS) from the
// Lab view of a dev server, on the Lab's light background: three instants of the technique (start, half-way to the key
// moment, key moment), or one close-up for a « still ». Then scripts/encyclopedie/webp.py composes the files.
// Usage: PORT=5173 node scripts/encyclopedie/renders.mjs <out png dir> [id ...]
import { mkdirSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const STYLE = { boxe: 'boxing', kickboxing: 'kickboxing', mma: 'mma', muaythai: 'muaythai', bjj: 'bjj', judo: 'judo' };
const [OUT, ...only] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const port = Number(process.env.PORT ?? 5173);
const base = `http://localhost:${port}`;

// the recipes, read from the TypeScript source through Vite
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { RENDERS } = await vite.ssrLoadModule('/src/domain/encyclopedia/images.ts');
await vite.close();
const list = RENDERS.filter((r) => !only.length || only.includes(r.id)).filter((r) => process.env.FORCE || !existsSync(`${OUT}/${r.id}${r.still ? '' : '-2'}.png`));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const r of list) {
  const still = r.still;
  const page = await browser.newPage({ viewport: still ? { width: 720, height: 400 } : { width: 240, height: 400 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('ERR', r.id, e.message.slice(0, 200)));
  // a still is framed by hand (az, el, span, fy), which the Lab only allows for a motion, not a technique
  const q = new URLSearchParams(still ? { motion: r.tech, style: STYLE[r.d ?? 'boxe'] } : { tech: r.tech });
  // the coaches of the app: Kadir and Amara (photo-realistic models with their discipline outfits)
  q.set('champion', r.coach === 'homme' ? 'mma-kadir' : 'mma-amara');
  q.set('look', 'realiste');
  if (r.d) q.set('d', r.d);
  if (r.southpaw) q.set('garde', 'gaucher');
  if (still) for (const k of ['az', 'el', 'span', 'fy']) q.set(k, String(still[k]));
  await page.goto(`${base}/#/lab?${q}`);
  await page.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
  // the discipline outfit loads after the body: wait until it is worn (or known to be missing)
  await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 120000 }).catch(() => {});
  const outfit = await page.evaluate(() => window.__labOutfit);
  if (outfit !== 'portee') console.log('WARN', r.id, 'tenue', outfit);
  await page.waitForTimeout(3000);
  const peak = await page.evaluate(() => window.__labPeak);
  const times = still ? [0] : [0, peak / 2, peak];
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.__labT(t), times[i]);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${r.id}${still ? '' : `-${i}`}.png` });
  }
  console.log('ok', r.id);
  await page.close();
}
await browser.close();
