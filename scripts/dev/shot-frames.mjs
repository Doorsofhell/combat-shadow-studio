import { chromium } from '@playwright/test';
// Frames of a motion at a fixed rate, for before/after videos (Lab view of a dev server).
// node scripts/dev/shot-frames.mjs OUT tech [fps=30] [angles=0,35,90]   env PORT, CHAMP
const [OUT, tech, fps = '30', angles = '0,35,90'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 300, height: 460 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 400)));
for (const az of angles.split(',')) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${process.env.CHAMP ?? 'mma-kadir'}&look=realiste&d=muaythai&tech=${tech}&az=${az}&el=8`);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
  await p.waitForTimeout(2500);
  const dur = await p.evaluate(() => window.__labDur);
  const n = Math.ceil(dur * Number(fps));
  for (let i = 0; i <= n; i++) {
    await p.evaluate((t) => window.__labT(t), Math.min(dur, i / Number(fps)));
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${OUT}/${tech}-${az}-${String(i).padStart(3, '0')}.png` });
  }
  console.log(tech, az, n + 1, 'frames', dur.toFixed(2), 's');
}
await b.close();
