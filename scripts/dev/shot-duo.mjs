// Captures of duo scenes of the Lab view (own Vite server, hmr off): node scripts/dev/shot-duo.mjs OUT 'query1' 'query2'...
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
const [OUT, ...qs] = process.argv.slice(2);
const PORT = Number(process.env.PORT ?? 5197);
const vite = await createServer({ server: { port: PORT, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
await vite.listen();
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// a few pages at a time: under load the outfits time out (JOBS, default 3), and a failed outfit is retried
const JOBS = Number(process.env.JOBS ?? 3);
const queue = qs.map((q, k) => [q, k]);
async function shoot(q, k) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = await b.newPage({ viewport: { width: Number(process.env.VW ?? 720), height: Number(process.env.VH ?? 400) }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 600)));
    await p.goto(`http://localhost:${PORT}/#/lab?${q}`);
    await p.waitForFunction(() => window.__labReady === true, null, { timeout: 900000 });
    await p.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 300000 }).catch(() => {});
    const st = await p.evaluate(() => window.__labOutfit);
    if (st === 'erreur' && attempt < 2) {
      await p.close();
      continue;
    }
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `${OUT}/${process.env.NAME ?? 'duo'}-${k}.png` });
    console.log('ok', k, st, q);
    await p.close();
    return;
  }
}
await Promise.all(
  Array.from({ length: JOBS }, async () => {
    while (queue.length) await shoot(...queue.shift());
  }),
);
await b.close();
await vite.close();
