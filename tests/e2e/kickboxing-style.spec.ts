import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/** Kick-boxing in its three rule sets (K1, low kick, full contact), chosen once and kept in the settings. */
async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, look }) => {
      const put = (k: string, v: unknown) =>
        new Promise<void>((res, rej) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify(v), k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          };
        });
      await put('u:local:css-profile', { state: { profile }, version: 0 });
      await put('u:local:css-fighters', { state: { fighters: [{ id: 'f1', name: 'Test', look, createdAt: '', updatedAt: '' }], activeId: 'f1' }, version: 0 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme', disciplines: ['kickboxing'] }, look: defaultLook('homme') },
  );
  await page.goto('about:blank');
}

test('kick-boxing : le style choisi filtre les techniques et reste choisi d’un écran à l’autre', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques?d=kickboxing');
  const card = (id: string) => page.locator(`a.tech-card[href*="/techniques/${id}?"]`);
  await expect(page.getByTestId('kb-style')).toBeVisible();
  // all styles: the knee is listed, marked with the only style that allows it
  await expect(card('genou-direct-arriere')).toBeVisible();
  await expect(page.getByTestId('kb-only-genou-direct-arriere')).toHaveText('K1 seulement');
  await expect(page.getByTestId('kb-only-low-kick-arriere')).toHaveText('K1, Low kick seulement');

  await page.getByTestId('kb-style-full-contact').click();
  await expect(page.getByTestId('kb-style-summary')).toContainText('Full contact');
  await expect(page.getByTestId('kb-style-summary')).toContainText('Ontario');
  await expect(card('low-kick-arriere')).toHaveCount(0);
  await expect(card('genou-direct-arriere')).toHaveCount(0);
  await expect(card('middle-kick-arriere')).toBeVisible();
  await expect(page.locator('[data-testid^="kb-only-"]')).toHaveCount(0);

  await page.getByTestId('kb-style-low-kick').click();
  await expect(card('low-kick-arriere')).toBeVisible();
  await expect(card('genou-direct-arriere')).toHaveCount(0);

  await page.getByTestId('kb-style-k1').click();
  await expect(card('genou-direct-arriere')).toBeVisible();

  // the choice is saved: the discipline page opens on K1 and lists the knee exercises
  await page.goto('/#/discipline/kickboxing?niveau=debutant');
  // 1.1.0 (« trois menus »): the style is a chip of the filter line, its menu says the rules
  await expect(page.getByTestId('kb-style-chip')).toContainText('K1');
  await page.getByTestId('kb-style-chip').click();
  await expect(page.getByTestId('kb-style-k1')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('kb-style-chip-menu')).toContainText('Source');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('kb-style-chip-menu')).toHaveCount(0);
  await expect(page.getByTestId('ex-kickboxing-debutant-12')).toBeVisible();
  await page.getByTestId('kb-style-chip').click();
  await page.getByTestId('kb-style-full-contact').click();
  await expect(page.getByTestId('kb-style-chip')).toContainText('Full contact');
  await expect(page.getByTestId('ex-kickboxing-debutant-12')).toHaveCount(0);
  await expect(page.getByTestId('ex-kickboxing-debutant-05')).toHaveCount(0); // low kick
  await expect(page.getByTestId('ex-kickboxing-debutant-06')).toBeVisible(); // middle kick
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('kick-boxing : la fiche d’une technique dit ce que chaque règlement autorise, avec sa source', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques/genou-direct-arriere?d=kickboxing');
  const rules = page.getByTestId('kb-rules');
  await expect(rules).toBeVisible();
  await expect(page.getByTestId('kb-rule-k1')).toContainText('Autorisé');
  await expect(page.getByTestId('kb-rule-low-kick')).toContainText('Interdit');
  await expect(page.getByTestId('kb-rule-full-contact')).toContainText('Interdit');
  await expect(rules).toContainText('Source');
  // a technique the three styles allow without remark has no such card
  await page.goto('/#/techniques/jab?d=kickboxing');
  await expect(page.locator('h3', { hasText: 'Consignes du coach' })).toBeVisible();
  await expect(page.getByTestId('kb-rules')).toHaveCount(0);
});
