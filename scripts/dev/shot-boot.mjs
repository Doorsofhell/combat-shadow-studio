import { chromium } from 'playwright';
// 1.25: captures of the start screen (chrono du round) against vite preview :4173 — CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/dev/shot-boot.mjs <dir>
const out = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.route(/\/(coaches|salles)\//, async (r) => { await new Promise((x) => setTimeout(x, 250)); await r.continue(); });
await page.goto('http://localhost:4173/');
const boot = page.getByTestId('boot-screen');
await boot.waitFor();
const targets = [0.08, 0.45, 0.85];
for (const t of targets) {
  while (Number(await boot.getAttribute('data-ratio')) < t) await page.waitForTimeout(100);
  await page.screenshot({ path: `${out}/demarrage-${Math.round(t * 100)}.png` });
}
await page.unroute(/\/(coaches|salles)\//);
await page.getByTestId('boot-round').filter({ hasText: 'DING' }).waitFor({ timeout: 120000 });
await page.screenshot({ path: `${out}/demarrage-ding.png` });
await b.close();
