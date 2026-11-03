// v0.32 navigation: screenshots of every screen with its bar, and of the sheets (scripts/dev/shot-nav.mjs OUTDIR [PORT] [theme])
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'captures/navigation';
const port = process.argv[3] ?? '5173';
const theme = process.argv[4] ?? 'dark';
const base = `http://localhost:${port}/`;
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, colorScheme: theme });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(base);
await page.waitForLoadState('networkidle');
// the default profile of the app, completed (vite dev serves the source modules)
await page.evaluate(async () => {
  const { DEFAULT_PROFILE } = await import('/src/store/profile.ts');
  const profile = { ...DEFAULT_PROFILE, completed: true, coach: 'homme' };
  await new Promise((res) => {
    const r = indexedDB.open('keyval-store');
    r.onupgradeneeded = () => r.result.createObjectStore('keyval');
    r.onsuccess = () => {
      const tx = r.result.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
      tx.oncomplete = () => res();
    };
  });
});
await page.goto('about:blank');
const screens = (process.env.SCREENS ?? '/,/entrainer,/entrainement?ex=boxe-debutant-02&mode=technique,/techniques,/techniques/jab?d=boxe,/stats,/champions,/profil,/reglages').split(',');
for (const s of screens) {
  await page.goto(base + '#' + s);
  await page.waitForTimeout(s.startsWith('/entrainement') || s.startsWith('/techniques/') || s === '/' ? 9000 : 2500);
  const name = s.replace(/[/?=&#]+/g, '_').replace(/^_+|_+$/g, '') || 'accueil';
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('shot', name);
}
await page.goto(base + '#/');
await page.waitForTimeout(3000);
await page.getByTestId('nav-menu').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/menu.png` });
await page.getByTestId('menu-nouveautes').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/nouveautes.png` });
await browser.close();
