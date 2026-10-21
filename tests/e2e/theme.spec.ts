import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/** Menu themes: Clair / Sombre / Automatique, remembered, live system switching, no flash, a training studio that follows the theme (0.27). */
async function seed(page: Page) {
  await page.goto('/icons/icon.svg');
  await page.evaluate(async (profile) => {
    await new Promise<void>((res) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
        tx.oncomplete = () => res();
      };
    });
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme' });
}

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);
const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

test('Automatique par défaut, suit le système en direct sans redémarrer', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await seed(page);
  await page.goto('/#/reglages');
  await expect(page.getByRole('radio', { name: 'Automatique' })).toHaveAttribute('aria-checked', 'true');
  expect(await theme(page)).toBe('dark');
  expect(await bodyBg(page)).toBe('rgb(11, 15, 20)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => theme(page)).toBe('light');
  expect(await bodyBg(page)).toBe('rgb(244, 245, 247)');
  expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#f4f5f7');
});

test('choix manuel mémorisé, prioritaire sur le système, appliqué avant le premier affichage', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await seed(page);
  await page.goto('/#/reglages');
  await page.getByRole('radio', { name: 'Clair' }).click();
  await expect.poll(() => theme(page)).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await theme(page)).toBe('light');
  // reload: the theme is already set when the HTML is parsed, before the app script runs
  const atParse: string[] = [];
  await page.exposeFunction('reportTheme', (t: string) => atParse.push(t));
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => (window as unknown as { reportTheme: (t?: string) => void }).reportTheme(document.documentElement.dataset.theme)));
  await page.reload();
  await expect.poll(() => atParse[0]).toBe('light');
  await expect(page.getByRole('radio', { name: 'Clair' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Sombre' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => theme(page)).toBe('dark');
  await page.reload();
  expect(await theme(page)).toBe('dark');
});

// 0.27: Youssef chose « Suit le thème » for the training studio (2026-10-20 21:48): it is no longer always white,
// it is anthracite in the dark theme and soft pearl grey in the light theme (status bar included)
const STUDIO = { Clair: { bg: 'rgb(238, 240, 243)', meta: '#eef0f3' }, Sombre: { bg: 'rgb(11, 15, 20)', meta: '#0b0f14' } } as const;
for (const pref of ['Clair', 'Sombre'] as const) {
  test(`le studio d’entraînement suit le thème ${pref}`, async ({ page }) => {
    await seed(page);
    await page.goto('/#/reglages');
    await page.getByRole('radio', { name: pref }).click();
    await page.goto('about:blank');
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    const tr = page.locator('.training');
    await expect(tr).toBeVisible();
    expect(await tr.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(STUDIO[pref].bg);
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe(STUDIO[pref].meta);
    // the 3D canvas is see-through over the stage's own background, so both match
    await expect(page.locator('.tr-stage canvas')).toBeVisible();
    const layers = await page.locator('.tr-stage canvas').evaluate((c) => {
      const out: string[] = [];
      for (let e: Element | null = c; e && !e.classList.contains('tr-stage'); e = e.parentElement) out.push(getComputedStyle(e).backgroundColor);
      return out;
    });
    for (const b of layers) expect(b).toBe('rgba(0, 0, 0, 0)');
    const stageBg = await page.locator('.tr-stage').evaluate((e) => getComputedStyle(e).backgroundImage);
    expect(stageBg).toContain(pref === 'Sombre' ? 'rgb(11, 15, 20)' : 'rgb(227, 230, 234)');
    // a reload on the training screen starts with the right status bar colour (index.html, before the first paint)
    await page.reload();
    await expect(tr).toBeVisible();
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe(STUDIO[pref].meta);
  });
}

// the artifact viewer wraps the page in its own skeleton that styles body (black text, 14px): text must keep the theme
for (const scheme of ['dark', 'light'] as const)
  test(`page hébergée (styles hôte sur body) : textes lisibles en thème ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => {
      const st = document.createElement('style');
      st.textContent = ':root{color-scheme:light}body{margin:0;padding:0;font:14px sans-serif;background:#fff;color:#000}';
      document.documentElement.prepend(st);
    });
    await seed(page);
    await page.goto('/#/champions/kickboxing-hari-0001');
    const h = page.locator('h2', { hasText: 'Séquence' });
    await expect(h).toBeVisible();
    const r = await page.evaluate(() => {
      const ink = getComputedStyle(document.documentElement).color;
      const pick = (s: string) => getComputedStyle(document.querySelector(s)!).color;
      return { ink, body: getComputedStyle(document.body).color, h2: pick('.page h2'), li: pick('.grid2 li'), size: getComputedStyle(document.body).fontSize };
    });
    expect(r.body).toBe(r.ink);
    expect(r.h2).toBe(r.ink);
    expect(r.li).toBe(r.ink);
    expect(r.size).toBe('16px');
  });
