import { chromium } from '@playwright/test';
const [OUT, PORT] = process.argv.slice(2);
const base = `http://localhost:${PORT}`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
async function seed() {
  await p.goto(base + '/'); await p.waitForLoadState('networkidle');
  await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onupgradeneeded = () => r.result.createObjectStore('keyval'); r.onsuccess = () => { const tx = r.result.transaction('keyval', 'readwrite'); tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach: 'homme', champion: 'mma-kadir', mainDiscipline: 'boxe', disciplines: ['boxe'], guard: 'orthodoxe', pseudo: '', level: 'debutant' } }, version: 0 }), 'u:local:css-profile'); tx.oncomplete = res; }; }));
  await p.goto('about:blank');
}
await seed();
const wait = (ms) => p.waitForTimeout(ms);
// 1 Accueil
await p.goto(base + '/#/'); await wait(9000); console.log('shot'); await p.screenshot({ path: `${OUT}/1-accueil.png` });
// 2 panel advanced
for (let k = 0; k < 10 && !(await p.getByTestId('coach-panel').isVisible()); k++) { await p.getByTestId('coach-ui-toggle').dispatchEvent('click', {}, { timeout: 3000 }).catch(() => {}); await wait(1000); }
await wait(800); console.log('shot'); await p.screenshot({ path: `${OUT}/2-panneau.png` });
await p.getByTestId('cp-advanced').click({ timeout: 10000 }); await wait(600);
await p.getByTestId('cp-advanced-body').scrollIntoViewIfNeeded(); await wait(400);
console.log('shot'); await p.screenshot({ path: `${OUT}/3-panneau-avance.png` });
// 4 /coach
await p.goto(base + '/#/coach'); await wait(12000); console.log('shot'); await p.screenshot({ path: `${OUT}/4-ecran-coach.png` });
// 5 Reglages mon coach
await p.goto(base + '/#/reglages/coach'); await wait(3000); console.log('shot'); await p.screenshot({ path: `${OUT}/5-reglages.png`, fullPage: true });
// 6 Compte
await p.goto(base + '/#/profil'); await wait(3000); console.log('shot'); await p.screenshot({ path: `${OUT}/6-compte.png` });
await b.close();
