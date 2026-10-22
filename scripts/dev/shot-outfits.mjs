import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
// Gallery of the discipline outfits (v0.31): each coach x outfit, guard pose from 3 angles plus a moment of a
// technique that bends the outfit. node scripts/dev/shot-outfits.mjs OUT [coaches] [outfits] [angles]   env PORT
const [OUT, coaches = 'mma-kadir,mma-amara', outfits = 'boxe,kickboxing,muaythai,mma,bjj,bjj-nogi,judo', angles = '0,90,180'] = process.argv.slice(2);
const MOVE = { boxe: ['crochet-avant', 0.2], kickboxing: ['high-kick-avant', 0.36], muaythai: ['low-kick-arriere', 0.4], mma: ['sprawl', 0.5], bjj: ['high-kick-arriere', 0.42], 'bjj-nogi': ['genou-direct-arriere', 0.34], judo: ['high-kick-arriere', 0.42] };
const DISC = { 'bjj-nogi': 'bjj' };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 300, height: 460 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 400)));
const shot = async (url, file, t) => {
  await p.goto('about:blank');
  await p.goto(url);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'erreur', 'aucune'].includes(window.__labOutfit ?? ''), null, { timeout: 600000 });
  if (t !== undefined) await p.evaluate((t) => window.__labT(t), t);
  await p.waitForTimeout(2500);
  const st = await p.evaluate(() => window.__labOutfit);
  if (st !== 'portee') console.log('OUTFIT', st, url);
  await p.screenshot({ path: file });
  return file;
};
for (const c of coaches.split(',')) {
  for (const o of outfits.split(',')) {
    const d = DISC[o] ?? o;
    const files = [];
    for (const az of angles.split(',')) files.push(await shot(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${c}&look=realiste&d=${d}&motion=garde&tenue=${o}&az=${az}&el=8`, `${OUT}/${c}-${o}-${az}.png`));
    const [tech, at] = MOVE[o];
    files.push(await shot(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${c}&look=realiste&d=${d}&tech=${tech}&tenue=${o}&az=35&el=8`, `${OUT}/${c}-${o}-move.png`, at));
    execFileSync('python3', ['-c', `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size
o=Image.new('RGB',(w*len(ims),h),'white')
for i,im in enumerate(ims): o.paste(im.convert('RGB'),(i*w,0))
o.save(sys.argv[1], quality=86)`, `${OUT}/${c}-${o}.jpg`, ...files]);
    console.log(c, o);
  }
}
await b.close();
