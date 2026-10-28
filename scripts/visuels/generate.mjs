// Studio visuals: every picture of a coach in the app, made from our own 3D coaches (Kadir, Amara) in the dark gym of
// their discipline. One command makes them all; the same command regenerates one picture or one family on demand.
//
//   npm run visuels                              everything (renders cached in .cache/visuels, then composed)
//   npm run visuels -- --only thumbs,art         families: thumbs, ency, art, portraits, scenes
//   npm run visuels -- --id jab,tech-jab         some pictures only (technique id, encyclopedia id, discipline id…)
//   npm run visuels -- --d judo,bjj --only thumbs,ency,art   the pictures of some disciplines only (an outfit changed)
//   npm run visuels -- --force                   render again even when the cached render exists (coach or motion changed)
//   npm run visuels -- --recompose               no rendering: compose the cached renders again (ambiances.json changed)
//
// The renders come from the app's Lab view (mood=1: dark studio lights, alpha=1: transparent) on a Vite dev server
// started here; the poses are the app's own animation at the key moment of each move, corrected by poses.json where a
// raw key moment does not look human. Encyclopedia objects and places (scenes) are Blender renders: scenes.py.
// env JOBS=<pages in parallel> (default 2), PORT (default 5199), CHROMIUM_PATH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? undefined : (args[i + 1] ?? '').split(',').filter(Boolean);
};
const ONLY = opt('only');
const IDS = opt('id');
const DISC = opt('d');
const FORCE = args.includes('--force');
const RECOMPOSE = args.includes('--recompose');
const CACHE = '.cache/visuels';
const PORT = Number(process.env.PORT ?? 5199);
const JOBS = Number(process.env.JOBS ?? 2);
const POSES = JSON.parse(readFileSync('scripts/visuels/poses.json', 'utf8'));
const STYLE = { boxe: 'boxing', kickboxing: 'kickboxing', mma: 'mma', muaythai: 'muaythai', bjj: 'bjj', judo: 'judo' };
const CHAMPION = { homme: 'mma-kadir', femme: 'mma-amara' };

// no hot reload: editing the app while the renders run must not reload the pages being captured
const vite = await createServer({ server: { port: PORT, strictPort: true, hmr: false, watch: null }, logLevel: 'error' });
await vite.listen();
const { TECHNIQUES } = await vite.ssrLoadModule('/src/domain/techniques.ts');
const { RENDERS, SCENES } = await vite.ssrLoadModule('/src/domain/encyclopedia/images.ts');
const { ART } = await import('./recipes.mjs');

/** pose corrections of poses.json: by technique, or technique@coach for one coach only */
const pose = (tech, coach) => ({ ...(POSES[tech] ?? {}), ...(POSES[`${tech}@${coach}`] ?? {}) });

// ---- what to make: renders (Lab captures) and compositions (pictures of the app)
const renders = [];
const jobs = [];
const want = (family, ...ids) => (!ONLY || ONLY.includes(family)) && (!IDS || ids.some((id) => IDS.includes(id)));
/** --d: discipline of the picture (its gym and the coach's outfit) */
const inD = (d) => !DISC || DISC.includes(d);

function techQuery(tech, coach, d, extra = {}) {
  const p = pose(tech, coach);
  const q = new URLSearchParams({ champion: CHAMPION[coach], look: 'realiste', d, tech, ...extra });
  if (p.at) q.set('at', String(p.at));
  if (p.az !== undefined) q.set('az', String(p.az));
  if (p.garde) q.set('garde', p.garde);
  return q;
}

for (const t of TECHNIQUES) {
  for (const coach of ['homme', 'femme']) {
    if (!want('thumbs', t.id, `${t.id}@${coach}`)) continue;
    const d = pose(t.id, coach).d ?? t.disciplines[0];
    if (!inD(d)) continue;
    const png = `${CACHE}/thumbs/${coach}/${t.id}.png`;
    renders.push({ png, q: techQuery(t.id, coach, d, { thumb: '1' }), vw: 240, vh: 300, dpr: 2 });
    jobs.push({ out: `public/thumbs/${coach}/${t.id}`, w: 240, h: 300, mood: d, seed: `thumb-${coach}-${t.id}`, layers: [png], centers: [0.5], fill: 0.98, quality: 78 });
  }
}

for (const r of RENDERS) {
  const t = TECHNIQUES.find((x) => x.id === r.tech);
  if (!want('ency', r.id, r.tech)) continue;
  const d = r.d ?? t?.disciplines[0] ?? 'boxe';
  if (!inD(d)) continue;
  const out = `public/encyclopedie/${r.id}`;
  if (r.views) {
    // a schema: the coach still, seen from one or more sides, with marks on his bones
    const pngs = r.views.map((v, i) => `${CACHE}/ency/${r.id}-${i}.png`);
    const joints = [...new Set(r.marks.flatMap((m) => [].concat(m.bone)))];
    r.views.forEach((v, i) => {
      const q = new URLSearchParams({ champion: CHAMPION[r.coach], look: 'realiste', d, motion: r.motion ?? r.tech, style: STYLE[d], az: String(v.az), el: String(v.el ?? 4) });
      if (v.span) {
        q.set('span', String(v.span));
        q.set('fy', String(v.fy));
      }
      renders.push({ png: pngs[i], q, vw: v.span ? 720 : 360, vh: v.span ? 400 : 480, dpr: 2, joints });
    });
    const n = r.views.length;
    const close = r.views[0].span;
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: pngs, centers: n === 1 ? [0.5] : [0.3, 0.7], ...(close ? { mode: 'top', fill: 1, top: 0 } : { fill: 0.92 }), markSpec: r.marks, mini: { layer: 0, size: 160 } });
  } else if (r.mix) {
    // several techniques side by side, each at its key moment, from the same side
    const pngs = r.mix.map((m, i) => `${CACHE}/ency/${r.id}-${i}.png`);
    r.mix.forEach((m, i) => renders.push({ png: pngs[i], q: techQuery(m.tech, m.coach, m.d, { az: String(m.az ?? r.az ?? 60) }), vw: 240, vh: 400, dpr: 2 }));
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: pngs, centers: [1 / 6, 0.5, 5 / 6], fill: 0.95, mini: { layer: 1, size: 160 } });
  } else if (r.duo) {
    // 1.3.3 two coaches in one scene (engine/library/illustrations.ts, duoScenes): Amara and Kadir, one picture
    const png = `${CACHE}/ency/${r.id}.png`;
    const q = new URLSearchParams({ champion: CHAMPION.femme, champion2: CHAMPION.homme, look: 'realiste', d, duo: r.duo, style: STYLE[d], az: String(r.az ?? 60), el: String(r.el ?? 20), span: String(r.span ?? 0.85), fy: String(r.fy ?? 0.4) });
    if (r.tenue) q.set('tenue', r.tenue);
    renders.push({ png, q, vw: 720, vh: 400, dpr: 2 });
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: [png], centers: [0.5], fill: 0.95, mini: { size: 160 } });
  } else if (r.illu && r.once) {
    // a still gesture of the illustrations, once
    const png = `${CACHE}/ency/${r.id}.png`;
    const q = new URLSearchParams({ champion: CHAMPION[r.coach], look: 'realiste', d, illu: r.illu, style: STYLE[d], az: String(r.az ?? 30), el: String(r.el ?? 8) });
    if (r.tenue) q.set('tenue', r.tenue);
    renders.push({ png, q, vw: 360, vh: 400, dpr: 2 });
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: [png], centers: [0.5], fill: 0.95, mini: { size: 160 } });
  } else if (r.illu) {
    // a pose of the illustrations (engine/library/illustrations.ts), three instants
    const q = new URLSearchParams({ champion: CHAMPION[r.coach], look: 'realiste', d, illu: r.illu, style: STYLE[d], az: String(r.az ?? 30), el: '8' });
    if (r.span) {
      q.set('span', String(r.span));
      q.set('fy', String(r.fy));
    }
    const pngs = [0, 1, 2].map((i) => `${CACHE}/ency/${r.id}-${i}.png`);
    renders.push({ png: pngs[2], pngs, q, vw: 240, vh: 400, dpr: 2, times: [0, 0.5, 1] });
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: pngs, centers: [1 / 6, 0.5, 5 / 6], fill: 0.95, mini: { layer: 2, size: 160 } });
  } else if (r.still) {
    const png = `${CACHE}/ency/${r.id}.png`;
    const q = new URLSearchParams({ champion: CHAMPION[r.coach], look: 'realiste', d, motion: r.tech, style: STYLE[d] });
    for (const k of ['az', 'el', 'span', 'fy']) q.set(k, String(r.still[k]));
    renders.push({ png, q, vw: 720, vh: 400, dpr: 2 });
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: [png], centers: [0.5], mode: 'top', fill: 1.15, top: 0.04, mini: { size: 160 } });
  } else {
    const q = techQuery(r.tech, r.coach, d);
    if (r.southpaw) q.set('garde', 'gaucher');
    const pngs = [0, 1, 2].map((i) => `${CACHE}/ency/${r.id}-${i}.png`);
    // the key moment of poses.json (at) also moves the three instants of the sequence
    const at = pose(r.tech, r.coach).at ?? 1;
    renders.push({ png: pngs[2], pngs, q, vw: 240, vh: 400, dpr: 2, times: [0, 0.5 * at, at] });
    jobs.push({ out, w: 720, h: 400, mood: d, seed: r.id, layers: pngs, centers: [1 / 6, 0.5, 5 / 6], fill: 0.95, mini: { layer: 2, size: 160 } });
  }
}

for (const a of ART) {
  if (!want('art', a.discipline, a.tech) || !inD(a.discipline)) continue;
  const png = `${CACHE}/art/${a.discipline}.png`;
  renders.push({ png, q: techQuery(a.tech, a.coach, a.discipline, a.az !== undefined ? { az: String(a.az) } : {}), vw: 600, vh: 760, dpr: 1.5 });
  jobs.push({ out: `public/art/disciplines/${a.discipline}-600`, w: 600, h: 760, mood: a.discipline, seed: `art-${a.discipline}`, layers: [png], centers: [0.5], fill: 0.92, sizes: [[240, 304, `public/art/disciplines/${a.discipline}-240`]], quality: 82 });
}

for (const coach of ['homme', 'femme']) {
  const c = CHAMPION[coach];
  if (!want('portraits', c) || !inD('mma')) continue;
  const png = `${CACHE}/portraits/${c}.png`;
  const q = new URLSearchParams({ champion: c, look: 'realiste', d: 'mma', tenue: 'mma', motion: 'garde', style: 'mma', az: '28', el: '6', span: '1.04', fy: '0.86' });
  renders.push({ png, q, vw: 450, vh: 600, dpr: 2 });
  jobs.push({ out: `public/coaches/${c}/portrait`, w: 900, h: 1200, mood: 'mma', seed: `portrait-${c}`, layers: [png], centers: [0.5], fill: 0.96, quality: 84 });
}

const SCENE_MOOD = { 'gants-boxe': 'boxe', 'protege-tibias': 'kickboxing', rashguard: 'bjj', 'short-combat': 'mma', 'short-muaythai': 'muaythai', judogi: 'judo', 'kimono-jjb': 'bjj', ring: 'boxe', cage: 'mma', tatami: 'judo', ceintures: 'judo', bandes: 'boxe', 'protege-dents': 'mma', casque: 'boxe', coquille: 'kickboxing', 'protege-poitrine': 'kickboxing', sac: 'boxe', 'pattes-ours': 'boxe', paos: 'muaythai', dojo: 'judo', round: 'boxe', mongkon: 'muaythai', 'boxe-ancienne': 'boxe', 'tableau-jjb': 'bjj', 'livre-regles': 'boxe', pesee: 'boxe', juges: 'boxe' };
// the rule book stands among the emblems of the six disciplines (our own, public/emblems)
const BADGES = { 'livre-regles': ['boxe', 'kickboxing', 'muaythai', 'mma', 'judo', 'bjj'].map((d) => `public/emblems/${d}-256.webp`) };
const ROOMS = new Set(['dojo']);
// a wide set seen from above (the judges' table and the ring): it fills the height, no floor line under it
const WIDE = new Set(['juges']);
const sceneJobs = [];
for (const s of SCENES) {
  if (!want('scenes', s.id, s.scene) || !inD(SCENE_MOOD[s.scene] ?? 'boxe')) continue;
  const png = `${CACHE}/scenes/${s.scene}.png`;
  sceneJobs.push(s.scene);
  // a whole room (the dojo) fills the picture; an object stands on the floor of the gym
  const room = ROOMS.has(s.scene) ? { mode: 'top', fill: 1, top: 0, full: true } : WIDE.has(s.scene) ? { mode: 'top', fill: 0.96, top: 0.03 } : BADGES[s.scene] ? { fill: 0.5, floor: 0.9, badges: BADGES[s.scene], badgeH: 0.24 } : { fill: 0.86, floor: 0.9 };
  jobs.push({ out: `public/encyclopedie/${s.id}`, w: 720, h: 400, mood: SCENE_MOOD[s.scene] ?? 'boxe', seed: s.id, layers: [png], centers: [0.5], ...room, mini: { size: 160 }, object: true });
}

// ---- renders
const todo = RECOMPOSE ? [] : renders.filter((r) => FORCE || !existsSync(r.png));
console.log(`${renders.length} rendus prévus, ${todo.length} à faire ; ${jobs.length} images à composer`);
if (todo.length) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < todo.length) {
      const r = todo[next++];
      const page = await browser.newPage({ viewport: { width: r.vw, height: r.vh }, deviceScaleFactor: r.dpr });
      page.on('pageerror', (e) => console.log('ERR', r.png, e.message.slice(0, 200)));
      try {
        r.q.set('mood', '1');
        r.q.set('alpha', '1');
        // under heavy CPU load the outfit can fail to load (the coach would be drawn without it): load the page again
        let outfit;
        for (let attempt = 0; attempt < 3 && outfit !== 'portee' && outfit !== 'aucune'; attempt++) {
          await page.goto(attempt ? 'about:blank' : `http://localhost:${PORT}/#/lab?${r.q}`);
          if (attempt) await page.goto(`http://localhost:${PORT}/#/lab?${r.q}`);
          await page.waitForFunction(() => window.__labReady === true, null, { timeout: 600000 });
          await page.waitForFunction(() => ['portee', 'aucune', 'erreur'].includes(window.__labOutfit), null, { timeout: 120000 }).catch(() => {});
          outfit = await page.evaluate(() => window.__labOutfit);
          if (outfit !== 'portee') console.log('ATTENTION tenue', outfit, r.png, attempt < 2 && outfit !== 'aucune' ? '(nouvel essai)' : '');
        }
        await page.waitForTimeout(3000);
        const shots = r.times ? r.times.map((f, i) => [f, r.pngs[i]]) : [[null, r.png]];
        for (const [f, png] of shots) {
          if (f !== null) {
            await page.evaluate((f) => window.__labT(window.__labPeak * f), f);
            await page.waitForTimeout(1500);
          }
          const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
          mkdirSync(png.slice(0, png.lastIndexOf('/')), { recursive: true });
          writeFileSync(png, Buffer.from(data.split(',')[1], 'base64'));
          if (r.joints) {
            // where the bones fall in this capture (raw pixels), for the marks of the schemas
            const j = await page.evaluate((names) => window.__labJoints(names), r.joints);
            for (const k in j) if (j[k]) j[k] = j[k].map((v) => v * r.dpr);
            writeFileSync(`${png}.json`, JSON.stringify(j));
          }
        }
        console.log(`rendu [${++done}/${todo.length}] ${r.png}`);
      } catch (e) {
        console.log('ÉCHEC', r.png, String(e).slice(0, 200));
      }
      await page.close();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, JOBS) }, worker));
  await browser.close();
}
await vite.close();

// Blender scenes (objects and places of the encyclopedia), rendered once and cached like the coaches
const scenesTodo = RECOMPOSE ? [] : sceneJobs.filter((s) => FORCE || !existsSync(`${CACHE}/scenes/${s}.png`));
if (scenesTodo.length) {
  mkdirSync(`${CACHE}/scenes`, { recursive: true });
  const r = spawnSync('python3', ['scripts/encyclopedie/scenes.py', `${CACHE}/scenes`, ...scenesTodo], { stdio: 'inherit' });
  if (r.status) console.log('ÉCHEC des scènes Blender (pip install bpy) : les objets gardent leur image actuelle');
}

// ---- compositions
// marks of the schemas: each mark sits on a bone (or between bones) of its layer, as the Lab reported it
for (const j of jobs) {
  if (!j.markSpec) continue;
  j.marks = j.markSpec.flatMap((m) => {
    const file = `${j.layers[m.layer ?? 0]}.json`;
    if (!existsSync(file)) return [];
    const at = JSON.parse(readFileSync(file, 'utf8'));
    const pts = [].concat(m.bone).map((b) => at[b]).filter(Boolean);
    if (!pts.length) return [];
    const x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return [{ ...m, x, y }];
  });
  delete j.markSpec;
}
const ready = jobs.filter((j) => j.layers.every((p) => existsSync(p)));
if (ready.length < jobs.length) console.log(`MANQUE ${jobs.length - ready.length} rendus : ${jobs.filter((j) => !ready.includes(j)).map((j) => j.out).join(', ')}`);
mkdirSync(CACHE, { recursive: true });
writeFileSync(`${CACHE}/jobs.json`, JSON.stringify(ready, null, 1));
const c = spawnSync('python3', ['-I', 'scripts/visuels/compose.py', `${CACHE}/jobs.json`], { stdio: 'inherit' });
process.exit(c.status ?? 1);
