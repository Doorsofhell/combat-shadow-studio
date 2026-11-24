// 2.5.0 os de torsion: real WebGL captures (Three.js, Lab view of a local build), before (?torsion=0: the skin
// weights as loaded, no helper bone) and after, same coach, outfit, camera, light, framing, motion and instant.
// node scripts/v250/captures.mjs OUT [coachs=all] [vues=all]   env PORT (vite preview, default 4180)
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [OUT = 'docs/v250/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', viewArg] = process.argv.slice(2);
const PORT = process.env.PORT ?? 4180;
// motion (Lab), discipline, camera azimuth, elevation, instants (fractions of the impact time; garde: of the duration)
const SHOTS = [
  { id: 'garde', q: 'motion=garde&frame=1', d: 'boxe', az: 35, el: 8, at: [['garde', 0]] },
  { id: 'crochet', q: 'tech=crochet-avant', d: 'boxe', az: 55, el: 12, at: [['armement', 0.6], ['impact', 1]] },
  { id: 'coup-de-pied-haut', q: 'tech=high-kick-arriere', d: 'kickboxing', az: 60, el: 8, at: [['armement', 0.6], ['impact', 1]] },
  { id: 'sprawl', q: 'tech=sprawl', d: 'mma', az: 90, el: 15, at: [['descente', 0.6], ['bas', 1]] },
  // close-ups on the joints that bend most (span: height shown in metres, fy: height of its centre)
  { id: 'garde-zoom', q: 'motion=garde&span=0.75&fy=1.3', d: 'boxe', az: 35, el: 8, at: [['garde', 0]] },
  { id: 'crochet-zoom', q: 'tech=crochet-avant&span=0.75&fy=1.35', d: 'boxe', az: 55, el: 12, at: [['impact', 1]] },
  { id: 'coup-de-pied-haut-zoom', q: 'tech=high-kick-arriere&span=0.9&fy=0.95', d: 'kickboxing', az: 60, el: 8, at: [['impact', 1]] },
  { id: 'sprawl-zoom', q: 'tech=sprawl&span=0.7&fy=0.35', d: 'mma', az: 90, el: 15, at: [['bas', 1]] },
];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 520, height: 700 }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
const manifest = [];
const save = () => writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ errors, shots: manifest }, null, 1));
for (const coach of coachArg.split(',')) {
  for (const s of SHOTS.filter((x) => !viewArg || viewArg.split(',').includes(x.id))) {
    for (const ver of ['avant', 'apres']) {
      const url = `http://localhost:${PORT}/#/lab?champion=${coach}&look=realiste&d=${s.d}&${s.q}&az=${s.az}&el=${s.el}${ver === 'avant' ? '&torsion=0' : ''}`;
      await p.goto('about:blank');
      await p.goto(url);
      try {
        await p.waitForFunction(() => window.__labReady === true, null, { timeout: 300000 });
      } catch {
        errors.push(`${coach} ${s.id} ${ver}: Lab non prêt`);
        continue;
      }
      await p.waitForTimeout(2500);
      const { dur, peak } = await p.evaluate(() => ({ dur: window.__labDur ?? 0, peak: window.__labPeak ?? 0 }));
      for (const [name, f] of s.at) {
        const t = s.id === 'garde' ? 0 : Math.min(dur, peak * f);
        await p.evaluate((x) => window.__labT?.(x), t);
        await p.waitForTimeout(400);
        const file = `${OUT}/${coach}_${s.id}_${name}_${ver}.png`;
        await p.screenshot({ path: file });
        manifest.push({ coach, motion: s.id, instant: name, version: ver, t: Number(t.toFixed(3)), url, file });
      }
      console.log(coach, s.id, ver, 'ok', dur, peak);
      save();
    }
  }
}
save();
await b.close();
console.log('erreurs', errors.length);
