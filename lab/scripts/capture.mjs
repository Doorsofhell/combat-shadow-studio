/**
 * Comparative screenshots: same coach, same animation, same time, same camera and resolution,
 * one fresh browser per engine (the two engines are never loaded together). Also records the
 * world position of the main joints in both versions to check that the animation is identical.
 * Usage: node lab/scripts/capture.mjs <outDir>   (lab dev server on :5199)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'lab/out';
mkdirSync(`${OUT}/captures`, { recursive: true });
const SCEN = ['garde', 'jab', 'direct', 'crochet-avant', 'uppercut-arriere', 'pivot-droite', 'combo'];
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const joints = {};

async function run(engine, coach, look = 'realiste') {
  const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  for (const s of SCEN) {
    await p.goto(`http://localhost:5199/${engine}.html?coach=${coach}&s=${s}&t=0&look=${look}`);
    await p.waitForFunction(() => window.__lab?.ready, null, { timeout: 120000 });
    const keys = await p.evaluate(() => window.__lab.keyTimes);
    for (const [i, t] of keys.entries()) {
      await p.evaluate((t) => window.__lab.setTime(t), t);
      await p.waitForTimeout(700);
      const tag = `${coach}-${s}${keys.length > 1 ? '-' + (i + 1) : ''}`;
      await p.screenshot({ path: `${OUT}/captures/${tag}-${engine}${look === 'encre' ? '-encre' : ''}.png` });
      if (look === 'realiste') (joints[tag] ??= { t })[engine] = await p.evaluate(() => window.__lab.joints());
    }
  }
  await b.close();
  if (errors.length) console.log(engine, coach, 'erreurs:', errors);
}

for (const coach of ['homme', 'femme']) {
  await run('three', coach);
  await run('babylon', coach);
  await run('three', coach, 'encre');
  console.log('fait', coach);
}
// largest gap between the two versions, over all joints and all captures
let worst = 0;
for (const v of Object.values(joints))
  for (const b of Object.keys(v.three)) worst = Math.max(worst, Math.hypot(...v.three[b].map((x, i) => x - v.babylon[b][i])));
writeFileSync(`${OUT}/joints.json`, JSON.stringify({ worstGapMetres: worst, joints }, null, 1));
console.log('écart max entre les articulations A et B :', worst, 'm');
