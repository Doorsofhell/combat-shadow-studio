import { chromium } from '@playwright/test';
// 1.26/1.27 finitions des tenues: close-ups of belts, collars, boxing shoes, MMA shorts and bras, before/after.
// node scripts/dev/shot-finitions.mjs OUT [filter]   env PORT, CHROMIUM_PATH
const [OUT, filter = ''] = process.argv.slice(2);
// name, coach, outfit, discipline, motion or tech, t, az, el, span, fy
const SHOTS = [
  ['col', 'mma-kadir', 'judo', 'judo', 'garde', null, 15, 8, 0.3, 1.25],
  ['ceinture', 'mma-kadir', 'judo', 'judo', 'garde', null, 15, 4, 0.2, 0.98],
  ['col', 'mma-amara', 'bjj', 'bjj', 'garde', null, 15, 8, 0.3, 1.2],
  ['ceinture', 'mma-amara', 'bjj', 'bjj', 'garde', null, 15, 4, 0.2, 0.95],
  ['entier', 'nael', 'judo', 'judo', 'garde', null, 25, 8, 1.0, 0.9],
  ['bottes', 'mma-kadir', 'boxe', 'boxe', 'garde', null, 30, 6, 0.45, 0.12],
  ['bottes-arriere', 'mma-kadir', 'boxe', 'boxe', 'garde', null, 150, 6, 0.45, 0.12],
  ['bottes', 'mma-amara', 'boxe', 'boxe', 'garde', null, 30, 6, 0.45, 0.12],
  ['bottes', 'axel', 'boxe', 'boxe', 'garde', null, 30, 6, 0.45, 0.12],
  ['bottes-coup', 'kaila', 'boxe', 'boxe', 'crochet-avant', 0.2, 60, 6, 0.5, 0.12],
  ['short', 'mma-kadir', 'mma', 'mma', 'garde', null, 70, 6, 0.55, 0.5],
  ['short', 'mma-amara', 'mma', 'mma', 'garde', null, 70, 6, 0.55, 0.5],
  ['short', 'kaila', 'mma', 'mma', 'garde', null, 70, 6, 0.55, 0.5],
  ['brassiere', 'mma-amara', 'boxe', 'boxe', 'garde', null, 15, 8, 0.4, 1.15],
  ['brassiere-dos', 'inaya', 'muaythai', 'muaythai', 'garde', null, 180, 8, 0.4, 1.15],
  ['brassiere', 'kaila', 'mma', 'mma', 'garde', null, 15, 8, 0.4, 1.15],
  ['entier', 'mma-amara', 'kickboxing', 'kickboxing', 'garde', null, 25, 8, 1.0, 0.9],
  // 1.27 protège-tibias MMA
  ['tibias', 'mma-kadir', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias-talon', 'mma-kadir', 'mma', 'mma', 'garde', null, 160, 6, 0.6, 0.3],
  ['tibias', 'mma-amara', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias', 'axel', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias', 'kaila', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias', 'nael', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias', 'inaya', 'mma', 'mma', 'garde', null, 25, 6, 0.6, 0.3],
  ['tibias-haut', 'kaila', 'mma', 'mma', 'garde', null, 25, 6, 0.25, 0.42],
  ['tibias-haut', 'inaya', 'mma', 'mma', 'garde', null, 25, 6, 0.25, 0.42],
  ['tibias-kick', 'mma-kadir', 'mma', 'mma', 'high-kick-arriere', 0.45, 60, 6, 1.6, 0.9],
];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1.5 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 300)));
for (const [n, c, o, d, m, t, az, el, span, fy] of SHOTS) {
  const file = `${c}-${o}-${n}`;
  if (filter && !file.includes(filter)) continue;
  const mv = t === null ? `motion=${m}` : `tech=${m}`;
  await p.goto('about:blank');
  await p.goto(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${c}&look=realiste&d=${d}&${mv}&tenue=${o}&az=${az}&el=${el}&span=${span}&fy=${fy}`);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'erreur', 'aucune'].includes(window.__labOutfit ?? ''), null, { timeout: 600000 });
  if (t !== null) await p.evaluate((t) => window.__labT(t), t);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/${file}.png` });
  console.log(file, await p.evaluate(() => window.__labOutfit));
}
await b.close();
