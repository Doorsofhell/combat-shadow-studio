import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
// v0.42 hooks: frame grid of one technique, several angles (dev server). node scripts/dev/shot-hooks.mjs OUT PORT tech champion garde 'times' 'angles' label
const [OUT, PORT, tech, champ, garde, times, angles, label] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 300, height: 420 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 400)));
const files = [];
for (const az of angles.split(',')) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:${PORT}/#/lab?champion=${champ}&look=realiste&d=boxe&tech=${tech}&az=${az}&el=10${garde === 'gaucher' ? '&garde=gaucher' : ''}`);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 900000 });
  await p.waitForTimeout(2500);
  for (const t of times.split(',').map(Number)) {
    await p.evaluate((t) => window.__labT(t), t);
    await p.waitForTimeout(900);
    const f = `${OUT}/${label}-${tech}-${champ}-${garde}-${az}-${t}.png`;
    await p.screenshot({ path: f });
    files.push(f);
  }
}
const n = times.split(',').length;
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[3:]; n=int(sys.argv[1]); lab=sys.argv[2]; rows=len(fs)//n
ims=[Image.open(f) for f in fs]; w,h=ims[0].size
g=Image.new('RGB',(w*n,h*rows+28),'white')
d=ImageDraw.Draw(g); d.text((8,8),lab,fill=(0,0,0))
for k,im in enumerate(ims): g.paste(im,((k%n)*w,28+(k//n)*h))
g.save(sys.argv[3].rsplit('-',2)[0]+'.jpg',quality=84)
`, String(n), `${label} ${tech} ${champ} ${garde} | t=${times} | angles ${angles}`, ...files]);
console.log('done', label, tech, champ, garde);
await b.close();
