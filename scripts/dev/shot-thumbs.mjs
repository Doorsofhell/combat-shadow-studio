import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
// Renders each technique at its key moment from its teaching angle with our own 3D coaches
// (dev server on :5173). Usage: node scripts/dev/shot-thumbs.mjs <outDir> <coach> [id,id,...]
const [OUT, COACH = 'homme', ONLY] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const ids = ONLY ? ONLY.split(',') : [...readFileSync('src/domain/techniques.ts', 'utf8').matchAll(/id: '([^']+)', name:/g)].map((m) => m[1]);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 240, height: 300 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('ERR', e.message));
for (const id of ids) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:5173/#/lab?coach=${COACH}&thumb=1&tech=${id}${process.env.AZ ? '&az=' + process.env.AZ : ''}`);
  await p.waitForFunction(() => window.__labReady, null, { timeout: 60000 });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${OUT}/${id}.png` });
  console.log(id);
}
await b.close();
