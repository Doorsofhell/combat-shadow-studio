// 2.7 « panneaux d'options en verre »: real screenshots of every options sheet of the app, the same for « avant » and
// « après ». Usage: node scripts/dev/shot-sheets.mjs OUTDIR [PORT] — needs `npx vite --port PORT` (dev server: the
// script imports the app's modules to seed the profile and open the menus). Env: SIZES=360x780,412x915 THEMES=dark,light
// ONLY=menu,search… (names below).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'captures/panneaux-verre';
const port = process.argv[3] ?? '5173';
const base = `http://localhost:${port}/`;
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';
const sizes = (process.env.SIZES ?? '360x780').split(',').map((s) => s.split('x').map(Number));
const themes = (process.env.THEMES ?? 'dark,light').split(',');
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
mkdirSync(out, { recursive: true });

const SHOTS = [
  {
    name: 'menu-plus',
    at: '/',
    wait: 5000,
    open: async (p) => p.evaluate(async () => (await import('/src/ui/nav/BottomBar.tsx')).openMenu()),
  },
  {
    name: 'recherche',
    at: '/',
    wait: 3000,
    open: async (p) => p.evaluate(async () => (await import('/src/ui/nav/BottomBar.tsx')).openSearch()),
  },
  {
    name: 'coach-ia',
    at: '/techniques',
    wait: 3000,
    open: async (p) => p.evaluate(async () => (await import('/src/ui/coach-ai/coachHost.ts')).useCoachBubble.getState().setOpen(true)),
  },
  {
    name: 'progres-filtres',
    at: '/stats/activite',
    wait: 3000,
    open: async (p) => p.getByTestId('progress-filters').click(),
  },
  {
    name: 'progres-parcours',
    at: '/stats/activite',
    wait: 3000,
    open: async (p) => p.getByTestId('course-gauge').click(),
  },
  {
    name: 'chrono-options',
    at: '/chrono',
    wait: 3000,
    open: async (p) => p.getByTestId('chrono-options-open').click(),
  },
  {
    name: 'discipline-exercice',
    at: '/discipline/boxe',
    wait: 3000,
    open: async (p) => p.locator('[data-testid^="ex-"]').first().click(),
  },
  {
    name: 'objectifs',
    at: '/objectifs',
    wait: 3000,
    open: async (p) => p.getByTestId('edit-goals').first().click(),
  },
  {
    name: 'profil-photo',
    at: '/profil',
    wait: 3000,
    open: async (p) => p.getByTestId('avatar-edit').click(),
  },
  {
    name: 'confirmation',
    at: '/reglages/donnees',
    wait: 3000,
    open: async (p) =>
      p
        .getByRole('button', { name: /Tout effacer/ })
        .first()
        .click(),
  },
  {
    name: 'seance-enchainement',
    at: '/entrainement?ex=boxe-debutant-02&mode=technique',
    wait: 12000,
    open: async (p) => {
      await p.evaluate(async () => (await import('/src/ui/nav/BottomBar.tsx')).openMenu());
      await p.waitForTimeout(500);
      await p.getByTestId('cmd-sequence').click();
    },
  },
];

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const theme of themes) {
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      colorScheme: theme,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async (theme) => {
      const { DEFAULT_PROFILE } = await import('/src/store/profile.ts');
      const profile = { ...DEFAULT_PROFILE, completed: true, coach: 'homme' };
      localStorage.setItem('css-theme', theme === 'light' ? 'clair' : 'sombre');
      await new Promise((res) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
          tx.oncomplete = () => res();
        };
      });
    }, theme);
    await page.goto('about:blank');
    for (const s of SHOTS) {
      if (only && !only.includes(s.name)) continue;
      const file = `${out}/${theme === 'light' ? 'jour' : 'nuit'}-${w}-${s.name}.png`;
      try {
        await page.goto(base + '#' + s.at);
        await page.waitForTimeout(s.wait);
        await s.open(page);
        await page.waitForTimeout(700);
        await page.screenshot({ path: file });
        console.log('shot', file);
      } catch (e) {
        console.log('FAILED', file, String(e).split('\n')[0]);
      }
      await page.goto('about:blank');
    }
    await ctx.close();
  }
}
await browser.close();
