// v2.2.0 — captures réelles du moteur WebGL (Lab) pour l'audit et les comparatifs avant/après.
// node scripts/v220/captures.mjs <base-url> <dossier> [coachs,séparés] [vues,séparées]
// Même caméra, même cadrage, même pose et même éclairage pour chaque version : seule la build change.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const [BASE, OUT, coachArg, viewArg] = process.argv.slice(2);
const COACHES = coachArg ? coachArg.split(',') : ['mma-kadir', 'mma-amara', 'nael', 'inaya', 'victor', 'kanya'];
// span = part de la hauteur du corps montrée, fy = hauteur visée (m, 1,85 = haut du corps)
const L = 'light=app';
export const VIEWS = {
  '01-face': `d=mma&rest=1&az=0&el=6&span=1.08&fy=0.92&${L}`,
  '02-profil-gauche': `d=mma&rest=1&az=90&el=6&span=1.08&fy=0.92&${L}`,
  '03-profil-droit': `d=mma&rest=1&az=-90&el=6&span=1.08&fy=0.92&${L}`,
  '04-dos': `d=mma&rest=1&az=180&el=6&span=1.08&fy=0.92&${L}`,
  '05b-visage-face': `d=mma&rest=1&az=0&el=2&span=0.13&fy=1.66&${L}`,
  '05c-visage-profil': `d=mma&rest=1&az=90&el=2&span=0.13&fy=1.66&${L}`,
  '05-visage': `d=mma&rest=1&az=18&el=4&span=0.15&fy=1.63&${L}`,
  '06-torse-epaules-cou': `d=mma&rest=1&az=20&el=6&span=0.36&fy=1.30&${L}`,
  '07-abdomen-bassin-hanches': `d=mma&rest=1&az=25&el=4&span=0.34&fy=1.05&${L}`,
  '08-jambes': `d=mma&rest=1&az=30&el=4&span=0.6&fy=0.5&${L}`,
  '09-garde': `d=mma&frame=1&motion=garde&az=35&el=8&${L}`,
  '10-direct': `tech=direct&d=boxe&at=1&az=60&el=8&${L}`,
  '11-crochet': `tech=crochet-avant&d=boxe&at=1&az=20&el=8&${L}`,
  '12-uppercut': `tech=uppercut-arriere&d=boxe&at=1&az=30&el=8&${L}`,
  '13-coup-de-pied': `tech=middle-kick-arriere&d=muaythai&at=1&az=40&el=8&${L}`,
  '14-tenue-judo-mouvement': `d=judo&frame=1&motion=garde&az=30&el=8&${L}`,
  '15-dos-garde': `d=mma&frame=1&motion=garde&az=200&el=10&${L}`,
  '16-amenee': `tech=double-leg&d=mma&at=1&az=60&el=8&${L}`,
  '17-blocage-corps': `tech=blocage-corps-avant&d=boxe&at=1&az=30&el=8&${L}`,
  '18-pont': `tech=pont&d=bjj&at=1&az=70&el=20&${L}`,
  '05d-visage-trois-quarts': `d=mma&rest=1&az=35&el=2&span=0.13&fy=1.66&${L}`,
};
// hauteur visée proportionnelle à la taille mesurée du modèle (scripts/v220/anatomie.py), calée sur Kadir
const SCALE = { 'mma-kadir': 1, victor: 1, nael: 0.998, 'mma-amara': 0.958, inaya: 0.96, kanya: 0.9375 };
const scaled = (c, q) => q.replace(/fy=([\d.]+)/, (_, f) => `fy=${(Number(f) * (SCALE[c] ?? 1)).toFixed(3)}`);
const views = viewArg ? viewArg.split(',') : Object.keys(VIEWS);
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 540, height: 720 }, deviceScaleFactor: 1 });
const log = [];
p.on('pageerror', (e) => log.push(`pageerror ${e.message.slice(0, 300)}`));
p.on('console', (m) => (m.type() === 'error' || /THREE\.WebGL|shader/i.test(m.text())) && log.push(`console ${m.text().slice(0, 300)}`));
const manifestPath = `${OUT}/manifest.json`;
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { base: BASE, shots: {} };
for (const c of COACHES) {
  for (const v of views) {
    const q = `champion=${c}&look=realiste&${scaled(c, VIEWS[v])}${process.env.EXTRA ? `&${process.env.EXTRA}` : ''}`;
    const t0 = Date.now();
    log.length = 0;
    await p.goto('about:blank');
    await p.goto(`${BASE}/#/lab?${q}`);
    let ok = true;
    try {
      await p.waitForFunction(() => window.__labReady === true, null, { timeout: 300000 });
      // la tenue portée (le coach reste caché tant qu'elle charge), puis une image non vide
      await p.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 120000 });
      await p.waitForTimeout(2500);
      for (let k = 0; k < 20; k++) {
        const ink = await p.evaluate(() => {
          const c = document.querySelector('canvas');
          const g = document.createElement('canvas');
          g.width = 64; g.height = 64;
          const x = g.getContext('2d');
          x.drawImage(c, 0, 0, 64, 64);
          const d = x.getImageData(0, 0, 64, 64).data;
          let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && d[i] + d[i + 1] + d[i + 2] < 700) n++;
          return n / 4096;
        });
        if (ink > 0.01) break;
        if (k === 19) ok = false;
        await p.waitForTimeout(1000);
      }
      await p.waitForTimeout(800);
    } catch {
      ok = false;
    }
    const tag = process.env.TAG ? `__${process.env.TAG}` : '';
    const file = `${OUT}/${c}__${v}${tag}.png`;
    await p.screenshot({ path: file });
    manifest.shots[`${c}__${v}${tag}`] = { query: q, ok, ms: Date.now() - t0, errors: [...log] };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
    console.log(ok ? 'ok' : 'ÉCHEC', c, v, Date.now() - t0, 'ms', log.length ? log.join(' | ').slice(0, 200) : '');
  }
}
await b.close();
