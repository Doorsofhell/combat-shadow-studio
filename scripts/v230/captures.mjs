// 2.3.0 Lot 2: real WebGL captures (Three.js, Lab view of a local build), before (?v230=0, the engine of 2.2.0) and
// after, same coach, outfit, camera, light, framing and technique, at 7 equivalent biomechanical instants:
// garde, anticipation, début, accélération, impact, décélération, retour en garde.
// node scripts/v230/captures.mjs OUT [coachs=all] [techniques=…]   env PORT (vite preview, default 4180)
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [OUT = 'docs/v230/captures/raw', coachArg = 'mma-kadir,mma-amara,nael,victor,inaya,kanya', techArg] = process.argv.slice(2);
const PORT = process.env.PORT ?? 4180;
// technique, discipline, camera azimuth (degrees), elevation
const TECHS = (techArg ?? 'jab,direct,crochet-arriere,uppercut-arriere,overhand,high-kick-avant,middle-kick-arriere,low-kick-arriere,teep-avant,genou-direct-arriere').split(',');
const DISC = { overhand: 'mma', sprawl: 'mma', 'uchikomi-o-soto-gari': 'judo', 'teep-avant': 'muaythai', 'genou-direct-arriere': 'muaythai', 'middle-kick-arriere': 'muaythai', 'low-kick-arriere': 'kickboxing', 'high-kick-avant': 'kickboxing' };
const AZ = { sprawl: 90, 'uchikomi-o-soto-gari': 60, jab: 60, direct: 60, 'crochet-arriere': 35, 'uppercut-arriere': 60, overhand: 60, 'teep-avant': 90 };
const PHASES = [
  ['1-garde', () => 0],
  ['2-anticipation', (pk) => pk * 0.35],
  ['3-debut', (pk) => pk * 0.6],
  ['4-acceleration', (pk) => pk * 0.85],
  ['5-impact', (pk) => pk],
  ['6-deceleration', (pk) => pk + 0.06],
  ['7-retour', (pk, d) => pk + (d - pk) * 0.65],
];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 360, height: 520 }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
// the manifest is kept up to date after each technique, and added to (several runs into the same folder)
const mf = `${OUT}/manifest.json`;
const old = existsSync(mf) ? JSON.parse(readFileSync(mf, 'utf8')) : { errors: [], shots: [] };
const manifest = old.shots.filter((x) => !(coachArg.split(',').includes(x.coach) && TECHS.includes(x.tech)));
errors.push(...old.errors);
const save = () => writeFileSync(mf, JSON.stringify({ errors, shots: manifest }, null, 1));
for (const coach of coachArg.split(',')) {
  for (const tech of TECHS) {
    for (const ver of ['avant', 'apres']) {
      const url = `http://localhost:${PORT}/#/lab?champion=${coach}&look=realiste&d=${DISC[tech] ?? 'boxe'}&tech=${tech}&az=${AZ[tech] ?? 45}&el=8${ver === 'avant' ? `&v230=${process.env.AVANT ?? '0'}` : ''}`;
      await p.goto('about:blank');
      await p.goto(url);
      try {
        await p.waitForFunction(() => window.__labReady === true, null, { timeout: 300000 });
      } catch {
        errors.push(`${coach} ${tech} ${ver}: Lab non prêt`);
        continue;
      }
      await p.waitForTimeout(2500);
      const { dur, peak } = await p.evaluate(() => ({ dur: window.__labDur, peak: window.__labPeak }));
      for (const [name, f] of PHASES) {
        const t = Math.min(dur, f(peak, dur));
        await p.evaluate((x) => window.__labT(x), t);
        await p.waitForTimeout(300);
        const file = `${OUT}/${coach}_${tech}_${name}_${ver}.png`;
        await p.screenshot({ path: file });
        manifest.push({ coach, tech, phase: name, version: ver, t: Number(t.toFixed(3)), duration: dur, impact: peak, url, file });
      }
      console.log(coach, tech, ver, 'ok', dur.toFixed(2), peak.toFixed(2));
      save();
    }
  }
}
save();
console.log('erreurs', errors.length);
await b.close();
