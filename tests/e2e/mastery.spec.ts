import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.24 (Youssef, 2026-10-20, option F): the user marks a technique as assimilated (✓) or still hard
 * (↻); the mark shows in the catalogue, filters it, and is counted in Progrès > Maîtrise.
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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

test('assimilée / encore du mal : fiche, catalogue, filtre et Progrès', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques/jab?d=boxe');
  const ok = page.getByTestId('mastery-acquise');
  const again = page.getByTestId('mastery-a-revoir');
  await ok.click();
  await expect(ok).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('mastery-switch').getByRole('status')).toHaveText('Assimilée');
  // the two states are never active together; a second tap clears
  await again.click();
  await expect(again).toHaveAttribute('aria-pressed', 'true');
  await expect(ok).toHaveAttribute('aria-pressed', 'false');
  await again.click();
  await expect(again).toHaveAttribute('aria-pressed', 'false');
  await again.click();

  await page.goto('/#/techniques/direct?d=boxe');
  await page.getByTestId('mastery-acquise').click();

  // catalogue: coloured edge on the tiles, "À revoir" filter
  await page.goto('/#/techniques?d=boxe');
  await expect(page.locator('a.tech-card[href*="/techniques/jab?"] [data-testid="mastery-edge"]')).toHaveAttribute('aria-label', 'Encore du mal');
  await expect(page.locator('a.tech-card[href*="/techniques/direct?"] [data-testid="mastery-edge"]')).toHaveAttribute('aria-label', 'Assimilée');
  await page.getByRole('radio', { name: 'À revoir (1)' }).or(page.getByRole('button', { name: 'À revoir (1)' })).click();
  await expect(page.locator('a.tech-card')).toHaveCount(1);

  // kept after a reload, counted in Progrès
  await page.reload();
  await page.goto('/#/stats');
  await page.getByTestId('ptab-maitrise').click();
  await expect(page.getByTestId('mastery-ok')).toContainText('1');
  await expect(page.getByTestId('mastery-again')).toContainText('1');
  await expect(page.getByTestId('mastery-panel').getByRole('link', { name: /Jab/ })).toBeVisible();
});
