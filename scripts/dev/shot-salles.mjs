// 1.23 Salles immersives: the training screen of each discipline, with or without its room (before/after captures).
// Usage: PORT=5173 OUT=dir node scripts/dev/shot-salles.mjs [boxe mma ...]   SALLE=0 for the plain background (before)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const PORT = process.env.PORT ?? '5173';
const OUT = process.env.OUT ?? 'docs/v1230/captures';
const SALLE = process.env.SALLE !== '0';
const W = Number(process.env.W ?? 393);
const H = Number(process.env.H ?? 851);
const list = process.argv.slice(2).length ? process.argv.slice(2) : ['boxe', 'kickboxing', 'mma', 'muaythai', 'judo', 'bjj'];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
page.on('pageerror', (e) => console.log('pageerror', e.message));
const base = `http://localhost:${PORT}/`;
await page.goto(base);
await page.waitForLoadState('networkidle');
await page.evaluate(async (salle) => {
  const put = (k, v) =>
    new Promise((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(v, k);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      };
    });
  const { DEFAULT_PROFILE } = await import('/src/store/profile.ts');
  const { DEFAULT_SETTINGS } = await import('/src/store/settings.ts');
  await put('u:local:css-profile', JSON.stringify({ state: { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme' } }, version: 0 }));
  await put('u:local:css-settings', JSON.stringify({ state: { settings: { ...DEFAULT_SETTINGS, salleImmersive: salle } }, version: 3 }));
}, SALLE).catch((e) => console.log('seed', e.message));
// the setting through its switch (what a person does), so the saved settings stay in the store's own format
await page.goto("about:blank");
await page.goto(`${base}#/reglages/affichage`);
const sw = page.getByRole('switch', { name: /Salle immersive/ });
await sw.waitFor({ state: 'attached', timeout: 60_000 });
if ((await sw.isChecked()) !== SALLE) await sw.click({ force: true });
await page.waitForTimeout(800);
for (const d of list) {
  await page.goto('about:blank');
  await page.goto(`${base}#/entrainement?ex=${d}-debutant-01&mode=technique`);
  await page.getByTestId('start').waitFor({ timeout: 120_000 });
  if (SALLE) await page.waitForFunction(() => window.__cssRoom, null, { timeout: 120_000 }).catch(() => console.log('pas de salle', d));
  await page.waitForTimeout(Number(process.env.WAIT ?? 6000));
  const room = await page.evaluate(() => document.querySelector('canvas')?.closest('[data-room]')?.getAttribute('data-room'));
  await page.screenshot({ path: `${OUT}/${d}-${SALLE ? 'salle' : 'avant'}.png`, timeout: 180_000 });
  console.log('ok', d, room);
}
await browser.close();
