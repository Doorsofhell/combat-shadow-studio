import { chromium } from '@playwright/test';
// Captures of the app's Lab view (dev server :5173): node scripts/dev/shot-lab.mjs OUT 'query1' 'query2'...
const [OUT, ...qs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 640 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 600)));
p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
let i = 0;
for (const q of qs) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:5173/#/lab?${q}`);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${OUT}/lab-${i++}.png` });
  console.log('ok', q);
}
await b.close();
