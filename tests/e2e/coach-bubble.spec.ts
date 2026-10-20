import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/** 0.24 (Youssef, 2026-10-20 10:52): the AI coach is a bubble at the bottom right; Légendes has its own tab. */
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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

test('bulle Coach IA : un appui ouvre, un autre masque, Échap masque aussi', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques');
  const bubble = page.getByTestId('coach-bubble');
  await expect(bubble).toHaveAttribute('aria-expanded', 'false');
  await bubble.click();
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
  await bubble.click();
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await bubble.click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  // no bubble on the training screen: it has its own Coach button
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  await expect(page.getByTestId('coach-bubble')).toHaveCount(0);
});

test('onglet Légendes dans la barre du bas', async ({ page }) => {
  await seed(page);
  await page.goto('/#/');
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Légendes' }).click();
  await expect(page).toHaveURL(/#\/champions/);
});
