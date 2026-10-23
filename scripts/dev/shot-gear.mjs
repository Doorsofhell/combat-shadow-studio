import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
// v0.43 equipment: views of one coach in one outfit (dev server).
// node scripts/dev/shot-gear.mjs OUT PORT champion discipline tenue look label
// views: face, profile, three-quarter (guard), hands and feet close-ups, a jab and a high kick
const [OUT, PORT, champ, d, tenue, look, label] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 360, height: 500 }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 300)));
const base = `http://localhost:${PORT}/#/lab?champion=${champ}&look=${look}&d=${d}&tenue=${tenue}&el=8`;
const VIEWS = [
  ['face', '&az=0'],
  ['profil', '&az=90'],
  ['troisquarts', '&az=40'],
  ['mains', '&az=25&span=0.55&fy=1.35'],
  ['pieds', '&az=35&span=0.6&fy=0.18'],
  ['jab', '&az=60&tech=jab&at=1'],
  ['kick', '&az=70&tech=high-kick-arriere&at=1'],
];
const files = [];
for (const [name, q] of VIEWS) {
  await p.goto('about:blank');
  await p.goto(base + q);
  await p.waitForFunction(() => window.__labReady === true, null, { timeout: 900000 });
  // the coach stays hidden until the outfit is worn (outfit.ts): wait for it, or the view comes out blank
  if (tenue !== '0') await p.waitForFunction(() => ['portee', 'erreur', 'aucune'].includes(window.__labOutfit), null, { timeout: 120000 }).catch(() => console.log('tenue non portée', name));
  await p.waitForTimeout(2500);
  const f = `${OUT}/${label}-${name}.png`;
  await p.screenshot({ path: f });
  files.push(f);
}
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size
g=Image.new('RGB',(w*len(ims),h+24),'white'); d=ImageDraw.Draw(g); d.text((6,6),sys.argv[1],fill=(0,0,0))
for k,im in enumerate(ims): g.paste(im,(k*w,24))
g.save(fs[0].rsplit('-',1)[0]+'.jpg',quality=85)
`, `${label} | ${champ} ${look} ${d} tenue=${tenue} | face, profil, 3/4, mains, pieds, jab, high kick`, ...files]);
console.log('done', label);
await b.close();
