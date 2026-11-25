import { chromium } from '@playwright/test';
// 2.10.2 captures (vite preview :4173). OUT=dir node scripts/dev/shot-hooks-v2102.mjs <tech> <champion> <times> <az/el,...> ; before = ?v230=-hookDirect
const OUT = process.env.OUT || '.';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 300, height: 420 }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' && /webgl|shader|context/i.test(m.text())) errs.push(m.text()); });
const [tech, champ, times, angles] = process.argv.slice(2);
for (const [lab, v] of [['avant', '&v230=-hookDirect'], ['apres', '']]) {
  for (const az of angles.split(',')) {
    const [a, el] = az.split('/');
    await p.goto('about:blank');
    await p.goto(`http://localhost:4173/#/lab?champion=${champ}&look=realiste&d=boxe&tech=${tech}&az=${a}&el=${el}${v}`);
    await p.waitForFunction(() => window.__labReady === true, null, { timeout: 900000 });
    await p.waitForTimeout(2500);
    for (const t of times.split(',')) {
      await p.evaluate((t) => window.__labT(t), Number(t));
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${OUT}/${tech}-${champ}-${lab}-${a}_${el}-${t}.png` });
    }
  }
}
console.log('errors', JSON.stringify(errs));
await b.close();
