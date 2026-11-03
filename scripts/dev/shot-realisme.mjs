import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
/**
 * 1.10 (Youssef, 2026-11-03, « améliorer concrètement le réalisme ») — reproducible before/after captures of the
 * Ultra-réaliste coaches in the Lab: same coach, pose, camera, light, quality and animation instant on both builds.
 *
 *   node scripts/dev/shot-realisme.mjs OUT [plan]      env BASE (default http://localhost:4180)
 *
 * plan = comma list of named shots (see SHOTS) or "all"; coaches / outfits from env COACHES, OUTFITS.
 * One PNG per shot: OUT/<coach>-<outfit>-<shot>-<light>.png, and a contact sheet per coach x outfit.
 */
const [OUT, plan = 'all'] = process.argv.slice(2);
const BASE = process.env.BASE ?? 'http://localhost:4180';
const COACHES = (process.env.COACHES ?? 'mma-kadir,mma-amara,axel,kaila').split(',');
const OUTFITS = (process.env.OUTFITS ?? 'boxe,kickboxing,muaythai,mma,bjj,bjj-nogi,judo').split(',');
const LIGHTS = (process.env.LIGHTS ?? 'app').split(',');
const W = Number(process.env.W ?? 360);
const Hh = Number(process.env.H ?? 520);
const DISC = { 'bjj-nogi': 'bjj' };
// pose, camera (az/el, close-up span in metres and focus height in metres)
const SHOTS = {
  'neutre-face': { q: 'frame=1&motion=neutre&az=0&el=6' },
  'neutre-profil': { q: 'frame=1&motion=neutre&az=90&el=6' },
  'neutre-dos': { q: 'frame=1&motion=neutre&az=180&el=6' },
  'garde-34': { q: 'frame=1&motion=garde&az=35&el=8' },
  'garde-dos': { q: 'frame=1&motion=garde&az=180&el=8' },
  'garde-dos34': { q: 'frame=1&motion=garde&az=145&el=10' },
  'gaucher-34': { q: 'frame=1&motion=garde&az=35&el=8&garde=gaucher' },
  visage: { q: 'frame=1&motion=garde&az=20&el=4&span=0.15&fy=1.6' },
  'buste-dos': { q: 'frame=1&motion=garde&az=165&el=6&span=0.42&fy=1.3' },
  mains: { q: 'frame=1&motion=garde&az=60&el=4&span=0.28&fy=1.4' },
  pieds: { q: 'frame=1&motion=garde&az=30&el=14&span=0.25&fy=0.15' },
  jab: { q: 'tech=jab&az=40&el=8' },
  crochet: { q: 'tech=crochet-avant&az=40&el=8' },
  'high-kick': { q: 'tech=high-kick-avant&az=60&el=8' },
  squat: { q: 'tech=changement-niveau&az=50&el=8' },
  sol: { q: 'tech=retention-garde&az=70&el=22' },
  'sit-out': { q: 'tech=sit-out&az=60&el=14' },
};
const LIGHT_Q = { app: '&light=app', vive: '&light=vive', sombre: '&light=sombre', studio: '&mood=1' };
const names = plan === 'all' ? Object.keys(SHOTS) : plan.split(',');
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 300)));
const shot = async (url, file) => {
  await p.goto('about:blank');
  await p.goto(url);
  await p.waitForFunction(() => window.__labReady === true && ['portee', 'erreur', 'aucune'].includes(window.__labOutfit ?? ''), null, { timeout: 600000 });
  await p.waitForTimeout(1800);
  const st = await p.evaluate(() => window.__labOutfit);
  if (st !== 'portee') console.log('OUTFIT', st, url);
  await p.screenshot({ path: file });
  return file;
};
const t0 = Date.now();
for (const c of COACHES) {
  for (const o of OUTFITS) {
    const files = [];
    for (const l of LIGHTS) {
      for (const n of names) {
        const d = DISC[o] ?? o;
        const url = `${BASE}/#/lab?champion=${c}&d=${d}&tenue=${o}&${SHOTS[n].q}${LIGHT_Q[l] ?? ''}`;
        files.push(await shot(url, `${OUT}/${c}-${o}-${n}-${l}.png`));
      }
    }
    if (files.length > 1)
      execFileSync('python3', ['-c', `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size; n=min(6,len(ims)); r=(len(ims)+n-1)//n
o=Image.new('RGB',(w*n,h*r),'white')
for i,im in enumerate(ims): o.paste(im.convert('RGB'),((i%n)*w,(i//n)*h))
o.save(sys.argv[1], quality=86)`, `${OUT}/planche-${c}-${o}.jpg`, ...files]);
    console.log(c, o, files.length, 'images', Math.round((Date.now() - t0) / 1000), 's');
  }
}
await b.close();
