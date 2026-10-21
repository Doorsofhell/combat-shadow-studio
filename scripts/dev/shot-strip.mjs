import { chromium } from '@playwright/test';
// Frame strip of one motion in the Lab view (dev server :5173): node scripts/dev/shot-strip.mjs OUT name 'query' frames
const [OUT, name, q, n = '8'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 360, height: 560 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 400)));
await p.goto(`http://localhost:5173/#/lab?${q}`);
await p.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
await p.waitForTimeout(3000);
const dur = await p.evaluate(() => window.__labDur);
for (let i = 0; i < Number(n); i++) {
  const t = (dur * i) / (Number(n) - 1);
  await p.evaluate((t) => window.__labT(t), t);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${name}-${i}.png` });
  console.log('ok', name, i, t.toFixed(2));
}
await b.close();
