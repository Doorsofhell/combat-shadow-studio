import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { showCoachTools } from './nav-helpers';

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
  // 2.4: « Mon apprentissage » in the coach's panel (a tap on the coach): Acquis, Encore du mal, En apprentissage
  await page.goto('/#/techniques/jab?d=boxe');
  await showCoachTools(page);
  const ok = page.getByTestId('cp-learn-acquise');
  const again = page.getByTestId('cp-learn-a-revoir');
  const none = page.getByTestId('cp-learn-aucun');
  await expect(none).toHaveAttribute('aria-checked', 'true');
  await ok.click();
  await expect(ok).toHaveAttribute('aria-checked', 'true');
  // the states are never active together; « En apprentissage » clears the mark
  await again.click();
  await expect(again).toHaveAttribute('aria-checked', 'true');
  await expect(ok).toHaveAttribute('aria-checked', 'false');
  await none.click();
  await expect(none).toHaveAttribute('aria-checked', 'true');
  await expect(again).toHaveAttribute('aria-checked', 'false');
  await again.click();
  // no validation button: the panel stays open and the choice is already saved
  await expect(page.getByTestId('coach-panel')).toBeVisible();

  await page.goto('/#/techniques/direct?d=boxe');
  await showCoachTools(page);
  await page.getByTestId('cp-learn-acquise').click();

  // catalogue: coloured edge on the tiles, "À revoir" filter
  await page.goto('/#/techniques?d=boxe');
  await expect(page.locator('a.tech-card[href*="/techniques/jab?"] [data-testid="mastery-edge"]')).toHaveAttribute('aria-label', 'Encore du mal');
  await expect(page.locator('a.tech-card[href*="/techniques/direct?"] [data-testid="mastery-edge"]')).toHaveAttribute('aria-label', 'Assimilée');
  await page.getByRole('radio', { name: 'À revoir (1)' }).or(page.getByRole('button', { name: 'À revoir (1)' })).click();
  await expect(page.locator('a.tech-card')).toHaveCount(1);

  // kept after a reload, counted in Progrès
  await page.reload();
  // 0.39 (refonte Progrès): the mastery count is in the Techniques detail screen
  await page.goto('/#/stats');
  await page.getByTestId('go-techniques').click();
  await expect(page.getByTestId('mastery-ok')).toContainText('1');
  await expect(page.getByTestId('mastery-again')).toContainText('1');
  await expect(page.getByTestId('mastery-panel').getByRole('link', { name: /Jab/ })).toBeVisible();
});
