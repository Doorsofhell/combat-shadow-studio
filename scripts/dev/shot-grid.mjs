import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
// Frame grid of several motions: rows = camera angles, columns = moments (Lab view, dev server :5173).
// node scripts/dev/shot-grid.mjs OUT 'tech1,tech2' [extra query] [frames] [angles]
const [OUT, techs, extra = '', n = '7', angles = '0,35,90'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 300, height: 460 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 400)));
for (const tech of techs.split(',')) {
  const files = [];
  for (const az of angles.split(',')) {
    await p.goto('about:blank');
    await p.goto(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${process.env.CHAMP ?? 'mma-kadir'}&look=realiste&d=muaythai&tech=${tech}&az=${az}&el=8${extra}`);
    await p.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
    await p.waitForTimeout(2500);
    const dur = await p.evaluate(() => window.__labDur);
    for (let i = 0; i < Number(n); i++) {
      const t = (dur * i) / (Number(n) - 1);
      await p.evaluate((t) => window.__labT(t), t);
      await p.waitForTimeout(900);
      const f = `${OUT}/${tech}-${az}-${i}.png`;
      await p.screenshot({ path: f });
      files.push(f);
    }
  }
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; n=int(sys.argv[1]); rows=len(fs)//n
ims=[Image.open(f) for f in fs]; w,h=ims[0].size
g=Image.new('RGB',(w*n,h*rows),'white')
for k,im in enumerate(ims): g.paste(im,((k%n)*w,(k//n)*h))
g.save(fs[0].rsplit('-',2)[0]+'.jpg',quality=82)
`, n, ...files]);
  console.log('grid', tech);
}
await b.close();
