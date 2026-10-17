import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/** Menu themes: Clair / Sombre / Automatique, remembered, live system switching, no flash, white studio. */
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
  expect(await bodyBg(page)).toBe('rgb(16, 17, 22)');
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

for (const pref of ['Clair', 'Sombre'] as const) {
  test(`le studio d’entraînement reste blanc en thème ${pref}`, async ({ page }) => {
    await seed(page);
    await page.goto('/#/reglages');
    await page.getByRole('radio', { name: pref }).click();
    await page.goto('about:blank');
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    const tr = page.locator('.training');
    await expect(tr).toBeVisible();
    expect(await tr.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#ffffff');
  });
}
