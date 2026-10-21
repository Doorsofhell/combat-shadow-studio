import { chromium } from '@playwright/test';
// Captures of the groom lab (dev server on :5173): node scripts/dev/shot-groom.mjs OUT_DIR prefix [extra query]
const [OUT, prefix = 'shot', extra = ''] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 600)));
p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
const views = (process.env.VIEWS ?? 'homme:tete:0,homme:tete:90,homme:tete:180,homme:tete:35,femme:tete:0,femme:tete:90,femme:tete:180,femme:tete:35').split(',');
for (const v of views) {
  const [coach, shot, az, style = 'realiste'] = v.split(':');
  await p.goto(`http://localhost:5173/lab/groom.html?coach=${coach}&shot=${shot}&az=${az}&style=${style}${extra}`);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${prefix}-${coach}-${shot}-${az}-${style}.png` });
  console.log('ok', v);
}
await b.close();
