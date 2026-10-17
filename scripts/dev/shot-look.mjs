import { chromium } from '@playwright/test';
// Screenshots of the customised coach with several looks (dev server on :5173).
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('ERR', e.stack?.slice(0, 800)));
p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 300)));
await p.goto('http://localhost:5173/');
await p.waitForLoadState('networkidle');
const variants = (process.argv[3] ?? 'base-h,base-f,boxe-h,thai-f,full-h,mma-f').split(',');
for (const v of variants) {
  await p.goto('http://localhost:5173/');
  await p.evaluate(async (v) => {
    const L = await import('/src/editor/look.ts');
    const sex = v.endsWith('-f') ? 'femme' : 'homme';
    const look = L.defaultLook(sex);
    const gear = (d) => Object.assign(look.outfit, { bottom: L.recommendedGear(d).bottom, shoes: L.recommendedGear(d).shoes }) && Object.assign(look.gear, { hands: L.recommendedGear(d).hands, shins: L.recommendedGear(d).shins, feet: L.recommendedGear(d).feet });
    if (v.startsWith('boxe')) gear('boxe');
    if (v.startsWith('thai')) { gear('muaythai'); look.hair.style = 'tresses'; look.skin = '#7a4a2e'; }
    if (v.startsWith('mma')) { gear('mma'); look.outfit.top = 'rashguard-court'; look.hair.style = 'queue'; }
    if (v.startsWith('full')) {
      gear('kickboxing');
      Object.assign(look.gear, { head: 'casque-joues', mouthguard: true, bodyProtector: true, feet: 'protege-pieds' });
      look.outfit.top = 'tshirt';
      look.hair.style = 'crete';
      look.beard.style = 'pleine';
      look.body.muscle = 1.4; look.body.mass = 0.6;
      look.tattoos = [{ id: 't1', design: 'bande-tribale', zone: 'bras-gauche', u: 0, v: 0, size: 0.14, rotation: 0, color: '#111111', intensity: 0.9 }];
    }
    if (v.startsWith('crete')) {
      look.hair = { style: 'crete', color: '#7a1f1f', length: 0.9 };
      look.outfit.top = 'tshirt'; look.outfit.topPaint = { color: '#16171b', color2: '#e5484d', pattern: 'uni' };
      look.body.muscle = 1.4; look.body.mass = 0.5; look.body.height = 1.06;
    }
    if (v.startsWith('dbg')) {
      look.tattoos = [{ id: 't1', design: 'etoile', zone: 'poitrine', u: 0, v: 0, size: 0.5, rotation: 0, color: '#ff0000', intensity: 1 }, { id: 't2', design: 'etoile', zone: 'bras-gauche', u: 0, v: 0, size: 0.4, rotation: 0, color: '#0000ff', intensity: 1 }];
      look.beard.style = 'pleine'; look.beard.color = '#00ff00'; look.bodyHair = 1;
    }
    if (v.startsWith('tat')) {
      look.tattoos = [
        { id: 't1', design: 'bande-tribale', zone: 'bras-gauche', u: 0, v: 0, size: 0.14, rotation: 0, color: '#111111', intensity: 0.9 },
        { id: 't2', design: 'soleil', zone: 'poitrine', u: 0.3, v: 0, size: 0.12, rotation: 0, color: '#7a1010', intensity: 0.8 },
        { id: 't3', design: 'serpent', zone: 'avant-bras-droit', u: 0, v: 0, size: 0.12, rotation: 0, color: '#111111', intensity: 0.9 },
      ];
      look.hair.style = 'afro';
      look.beard.style = 'bouc';
    }
    const put = (k, val) => new Promise((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify(val), k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); };
    });
    await put('u:local:css-profile', { state: { profile: { experience: 'aucune', levels: { boxe: 'debutant', kickboxing: 'debutant', mma: 'debutant', muaythai: 'debutant' }, goals: [], daysPerWeek: 3, sessionMinutes: 30, guard: 'orthodoxe', limitations: '', mainDiscipline: 'boxe', coach: sex, completed: true } }, version: 0 });
    await put('u:local:css-fighters', { state: { fighters: [{ id: 'f1', name: v, look, createdAt: '', updatedAt: '' }], activeId: 'f1' }, version: 0 });
  }, v);
  await p.goto('about:blank');
  await p.goto('http://localhost:5173/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await p.waitForTimeout(7000);
  if (process.env.DBG) console.log(await p.evaluate(() => { return window.__cssCustomizers.map((c) => { const u = c.u; return JSON.stringify({ n: u.uTatN.value, a: u.uTatA.value[0], q: u.uTatQ.value[0], p: u.uTatP.value[0], c: u.uTatC.value[0], atlas: !!u.uTatAtlas.value, beard: u.uBeard.value, vis: c.body.visible, inScene: !!c.root.parent }); }).join("\n"); }));
  await p.locator('.tr-stage').screenshot({ path: `${OUT}/look-${v}.png` });
}
await b.close();
