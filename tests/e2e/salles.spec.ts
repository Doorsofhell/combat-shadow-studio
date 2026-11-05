import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 1.23 Salles immersives (Youssef, 2026-11-05): each discipline trains in its own room on the training screen; the
 * setting « Salle immersive » brings the plain background back. Other screens keep their stage.
 */
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

/** the saved settings (IndexedDB): the switch writes them asynchronously, a navigation too early would cut the write */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const q = r.result.transaction('keyval').objectStore('keyval').get('css-settings');
          q.onsuccess = () => res(String(q.result ?? ''));
        };
      }),
  );

async function training(page: Page, ex: string) {
  await page.goto('about:blank');
  await page.goto(`/#/entrainement?ex=${ex}&mode=technique`);
  await page.getByTestId('start').waitFor();
}

test('chaque discipline dans sa salle, et l’interrupteur ramène le fond uni', async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page);
  await training(page, 'boxe-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'boxe');
  await page.waitForFunction(() => (window as unknown as { __cssRoom?: { id: string } }).__cssRoom?.id === 'boxe', null, { timeout: 90_000 });
  const boxe = await page.evaluate(() => (window as unknown as { __cssRoom: { props: number } }).__cssRoom);
  expect(boxe.props).toBeGreaterThan(0);

  await training(page, 'mma-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'mma');
  await page.waitForFunction(() => (window as unknown as { __cssRoom?: { id: string } }).__cssRoom?.id === 'mma', null, { timeout: 90_000 });

  // the setting: off → the plain background, nothing of the room is loaded
  await page.goto('/#/reglages/affichage');
  const sw = page.getByRole('switch', { name: /Salle immersive/ });
  await expect(sw).toBeChecked();
  await sw.click({ force: true });
  await expect(sw).not.toBeChecked();
  await expect.poll(() => stored(page)).toContain('"salleImmersive":false');
  await training(page, 'boxe-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'aucune');
  expect(await page.evaluate(() => (window as unknown as { __cssRoom?: unknown }).__cssRoom)).toBeUndefined();
});

test('les autres écrans gardent leur scène sans salle (accueil)', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.goto('/#/');
  const stage = page.locator('[data-room]');
  if (await stage.count()) await expect(stage.first()).toHaveAttribute('data-room', 'aucune');
});
