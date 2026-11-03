import { chromium } from '@playwright/test';
// close-ups of the gis (collar and lapels, belt knot, sleeve, trousers) node closeups.mjs OUT   env PORT
const [OUT] = process.argv.slice(2);
const SHOTS = [['torse', 15, 8, 0.3, 1.25], ['ceinture', 15, 4, 0.2, 0.98], ['manche', 70, 8, 0.3, 1.25], ['pantalon', 25, 4, 0.5, 0.5], ['dos', 180, 8, 0.4, 1.2]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 420, height: 420 }, deviceScaleFactor: 1.5 });
for (const c of ['mma-kadir', 'mma-amara']) for (const o of ['judo', 'bjj']) for (const [n, az, el, span, fy] of SHOTS) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${c}&look=realiste&d=${o}&motion=garde&tenue=${o}&az=${az}&el=${el}&span=${span}&fy=${fy}`);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'erreur', 'aucune'].includes(window.__labOutfit ?? ''), null, { timeout: 600000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/${c}-${o}-${n}.png` });
  console.log(c, o, n);
}
await b.close();
