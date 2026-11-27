import { chromium } from '@playwright/test';
const [OUT, PORT, THEME = 'clair', MODE = 'apres'] = process.argv.slice(2);
// VIDE=1 : profil sans taille, poids ni objectifs (points rouges « à compléter »)
const VIDE = !!process.env.VIDE;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto(`http://localhost:${PORT}/`);
await p.evaluate(async ({ THEME, VIDE }) => {
  localStorage.setItem('css-theme', THEME);
  await new Promise((res, rej) => {
    const r = indexedDB.open('keyval-store');
    r.onupgradeneeded = () => r.result.createObjectStore('keyval');
    r.onsuccess = () => {
      const tx = r.result.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach: 'homme', champion: 'kadir', mainDiscipline: 'mma', disciplines: ['mma', 'boxe'], levels: { mma: 'intermediaire', boxe: 'debutant' }, pseudo: 'Youssef', age: 46, ...(VIDE ? { goals: [] } : { heightCm: 178, weightKg: 92, goals: ['technique'] }) } }, version: 0 }), 'u:local:css-profile');
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    };
  });
}, { THEME, VIDE });
const shot = async (name, full = false) => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}-${name}.png`, fullPage: full }); };
await p.goto('about:blank');
await p.goto(`http://localhost:${PORT}/#/profil`);
await p.waitForSelector('[data-testid=profile-name]', { timeout: 60000 });
await p.waitForTimeout(2500);
if (MODE === 'avant') {
  await shot('ecran');
  await shot('complet', true);
} else {
  await shot('moi');
  // a real sideways swipe on the content: Moi → Ma pratique → Mon compte, then back
  const swipe = async (dx) => p.evaluate((dx) => {
    const el = document.querySelector('.acc-panel');
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + 40;
    const t = (cx) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(x)], changedTouches: [t(x)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(x + dx)], bubbles: true }));
  }, dx);
  await swipe(-150); await shot('pratique');
  await swipe(-150); await shot('compte');
  await swipe(150); await p.waitForTimeout(300);
  console.log('après retour :', await p.evaluate(() => document.querySelector('[role=tabpanel]')?.getAttribute('data-testid')));
  await p.getByTestId('set-corps').count() || await p.getByTestId('acc-tab-moi').click();
  await p.getByTestId('acc-tab-moi').click();
  await p.waitForTimeout(500);
  await p.getByTestId('set-corps').click();
  await shot('moi-ouvert');
  // the tabs stay at the top while the page scrolls
  await p.evaluate(() => window.scrollTo(0, 600));
  await shot('moi-defile');
}
if (errors.length) console.log('ERREURS', errors.join('\n'));
await b.close();
