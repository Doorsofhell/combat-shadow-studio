// v0.45 Premium à vie: the page and its four panels (scripts/dev/shot-premium.mjs OUTDIR [PORT] [theme] [WxH])
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'docs/v045-premium/captures';
const port = process.argv[3] ?? '5173';
const theme = process.argv[4] ?? 'light';
const [w, h] = (process.argv[5] ?? '412x915').split('x').map(Number);
const base = `http://localhost:${port}/`;
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(base);
await page.waitForLoadState('networkidle');
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
await page.goto(base + '#/premium');
await page.getByTestId('premium-page').waitFor();
await page.waitForTimeout(1500);
const tag = `${theme}-${w}x${h}`;
const fit = await page.evaluate(() => {
  const bar = document.querySelector('[data-testid="bottom-bar"]').getBoundingClientRect().top;
  const blocks = [...document.querySelectorAll('[data-testid="premium-page"] > *')].map((e) => e.getBoundingClientRect());
  return { scroll: document.scrollingElement.scrollHeight, view: innerHeight, barTop: Math.round(bar), lastBottom: Math.round(Math.max(...blocks.map((r) => r.bottom))), firstTop: Math.round(Math.min(...blocks.map((r) => r.top))) };
});
console.log('fit', tag, JSON.stringify(fit));
await page.screenshot({ path: `${out}/1-page-${tag}.png` });
if (process.env.ONLY_PAGE) process.exit(0);
const shots = [
  ['2-avantages', () => page.getByTestId('nav-benefits').click()],
  ['3-faq', () => page.getByTestId('nav-faq').click()],
  ['4-restaurer', () => page.getByTestId('nav-restore').click()],
];
for (const [name, act] of shots) {
  await act();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-${tag}.png` });
}
await page.getByTestId('restore-now').click();
await page.getByTestId('restore-result').waitFor();
await page.screenshot({ path: `${out}/4b-restaurer-resultat-${tag}.png` });
await page.getByTestId('panel-close').click();
await page.waitForTimeout(300);
await page.getByTestId('premium-discover').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/5-offre-${tag}.png` });
await browser.close();
