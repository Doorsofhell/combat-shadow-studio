import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * v0.32 (Youssef, 2026-10-22 10:33: « le combattant apparaît brièvement en sous-vêtements avant que les vêtements
 * et accessoires soient affichés »): the Ultra-réaliste coach is never drawn without its discipline outfit, on the
 * first loading, when the discipline changes, when the coach changes and when coming back to the training.
 * Probe: window.__cssDress (src/three/PhotoCoach.tsx) counts the images drawn with the coach visible, and those
 * where the expected outfit was not on its body.
 */
type Dress = { shown: number; undressed: number; outfit: string | null };

async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (profile) => {
    await new Promise<void>((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      };
    });
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme' });
}

const dress = (page: Page) => page.evaluate(() => (window as unknown as { __cssDress?: Dress }).__cssDress ?? null);

/** waits until the coach has been drawn dressed for a while, then checks no image was drawn undressed */
async function shownDressed(page: Page, outfit: string, label: string) {
  const before = (await dress(page))?.shown ?? 0;
  await expect.poll(async () => (await dress(page))?.outfit, { timeout: 60_000, message: label }).toBe(outfit);
  await expect.poll(async () => ((await dress(page))?.shown ?? 0) - before, { timeout: 90_000, message: label }).toBeGreaterThan(20);
  const d = (await dress(page))!;
  expect(d.undressed, `${label} : images dessinées sans la tenue`).toBe(0);
}

test.describe.configure({ timeout: 300_000 });

test('le coach n’apparaît jamais sans sa tenue : premier chargement, discipline, coach, retour', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('about:blank');
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await shownDressed(page, 'boxe', 'premier chargement (boxe)');

  // discipline change inside the app (no page reload)
  await page.evaluate(() => (location.hash = '#/entrainement?ex=muaythai-expert-02&mode=technique'));
  await shownDressed(page, 'muaythai', 'changement de discipline (muay-thaï)');

  // coach change during the training
  await page.getByTestId('options').click();
  await page.getByRole('button', { name: 'Amara' }).click();
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'femme');
  await shownDressed(page, 'muaythai', 'changement de coach (Amara)');
  await page.keyboard.press('Escape');

  // leaving and coming back to the training
  await page.evaluate(() => (location.hash = '#/'));
  await page.waitForTimeout(1500);
  await page.evaluate(() => (location.hash = '#/entrainement?ex=judo-debutant-01&mode=technique'));
  await shownDressed(page, 'judo', 'retour à l’entraînement (judo)');
});
