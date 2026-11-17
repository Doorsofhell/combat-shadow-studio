// 1.56.0 kimonos: Lab captures, same coach/outfit/pose/camera/resolution for before and after.
// node scripts/dev/shot-kimonos-v1560.mjs OUT_DIR '[["name","champion=…&d=judo&tenue=judo&motion=garde&az=45&el=5"],…]'   (vite dev on :5173)
import { chromium } from '@playwright/test';
const OUT = process.argv[2]; const list = JSON.parse(process.argv[3]);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 620 }, deviceScaleFactor: 1 });
for (const [name, q] of list) {
  const t = Date.now();
  await p.goto('about:blank');
  await p.goto(`http://127.0.0.1:${process.env.PORT ?? 5173}/#/lab?look=realiste&frame=1&${q}`);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'erreur', 'aucune'].includes(window.__labOutfit ?? ''), null, { timeout: 600000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name, await p.evaluate(() => window.__labOutfit), (Date.now() - t) / 1000);
}
await b.close();
