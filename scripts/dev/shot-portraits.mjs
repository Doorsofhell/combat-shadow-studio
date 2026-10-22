import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
// v0.32 portraits of the « Choisis ton coach » screen, rendered from the shipped 3D coaches (Ultra-réaliste, MMA
// outfit, guard, the studio lighting of the training), so the coach picked is the one seen in training.
// node scripts/dev/shot-portraits.mjs [OUTDIR=public/coaches]   env PORT (vite dev)
const [OUT = 'public/coaches'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// 450 x 600 points at density 2: 900 x 1200 pixels, sharp on Android screens
const p = await b.newPage({ viewport: { width: 450, height: 600 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('ERR', e.message));
for (const c of ['mma-kadir', 'mma-amara']) {
  await p.goto('about:blank');
  await p.goto(`http://localhost:${process.env.PORT ?? 5173}/#/lab?champion=${c}&look=realiste&d=mma&tenue=mma&motion=garde&az=28&el=6&span=1.04&fy=0.86`);
  await p.waitForFunction(() => window.__labReady === true && window.__labOutfit === 'portee', null, { timeout: 600000 });
  await p.waitForTimeout(3000);
  const png = `${OUT}/${c}/portrait.png`;
  await p.screenshot({ path: png });
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
from PIL import ImageChops
im = Image.open(sys.argv[1]).convert('RGB')
# the coach centred across the card (the camera centres the whole guard, the body leans to one side)
bg = Image.new('RGB', im.size, im.getpixel((2, 2)))
box = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 14 else 0).getbbox()
if box:
    dx = im.width // 2 - (box[0] + box[2]) // 2
    out = Image.new('RGB', im.size, im.getpixel((2, 2)))
    out.paste(im, (dx, 0))
    im = out
im.save(sys.argv[2], 'WEBP', quality=88, method=6)`, png, `${OUT}/${c}/portrait.webp`]);
  execFileSync('rm', [png]);
  console.log(c);
}
await b.close();
