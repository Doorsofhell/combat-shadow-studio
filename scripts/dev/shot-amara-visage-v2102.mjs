import { chromium } from '@playwright/test';
// 2.10.2 Amara face capture (vite preview :4173): OUT=dir node scripts/dev/shot-amara-visage-v2102.mjs <label> ; swap dist/coaches/mma-amara/photo.glb for the before image
const [label] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 400, height: 500 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
for (const az of ['0', '35']) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:4173/#/lab?champion=mma-amara&look=realiste&d=mma&frame=1&motion=garde&az=${az}&el=0&span=0.32&fy=1.58`);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 900000 });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${process.env.OUT || '.'}/amara-${label}-${az}.png` });
}
console.log('errors', JSON.stringify(errs)); await b.close();
