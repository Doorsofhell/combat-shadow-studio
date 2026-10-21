import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.27 (Youssef, 2026-10-20 21:45: « Intègre aussi un calcul imc auto avec recommandation et jauge dans le profil »):
 * the IMC card of the profile follows the height and weight as they are typed, with its adult category (WHO),
 * a training tip, a gauge from 15 to 40 and its limits; nothing when a measure is missing.
 */
async function seed(page: Page, extra: Record<string, unknown> = {}) {
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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'], ...extra });
  await page.goto('about:blank');
}

const card = (page: Page) => page.getByTestId('bmi-card');

/** where the marker sits on the bar, from 0 to 1 */
const markerAt = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector('.bmi-bar')!.getBoundingClientRect();
    const m = document.querySelector('[data-testid="bmi-marker"]')!.getBoundingClientRect();
    return (m.left - bar.left) / bar.width;
  });

test.use({ viewport: { width: 393, height: 851 } });

test('180 cm et 75 kg : 23,1, corpulence normale, jauge et conseil ; mis à jour à la saisie', async ({ page }) => {
  await seed(page);
  await page.goto('/#/profil');
  // nothing to compute yet: a hint only
  await expect(page.getByTestId('bmi-hint')).toContainText('Indique ta taille');
  await expect(page.getByTestId('bmi-gauge')).toHaveCount(0);
  await expect(page.getByTestId('bmi-limits')).toContainText('muscle');
  await page.locator('#pf-taille').fill('180');
  await expect(page.getByTestId('bmi-hint')).toBeVisible();
  await page.locator('#pf-poids').fill('75');
  await expect(page.getByTestId('bmi-value')).toHaveText('23,1');
  await expect(page.getByTestId('bmi-category')).toHaveText('Corpulence normale');
  const gauge = page.getByTestId('bmi-gauge');
  await expect(gauge).toHaveAttribute('role', 'meter');
  await expect(gauge).toHaveAttribute('aria-valuenow', '23.1');
  await expect(gauge).toHaveAttribute('aria-valuemin', '15');
  await expect(gauge).toHaveAttribute('aria-valuemax', '40');
  await expect(gauge).toHaveAttribute('aria-valuetext', 'IMC 23,1 : corpulence normale');
  await expect(page.getByTestId('bmi-marker')).toHaveText('23,1');
  expect(await markerAt(page)).toBeCloseTo((23.1 - 15) / 25, 1);
  // the zones are named, not only coloured; the current one is marked
  await expect(card(page).locator('.bmi-legend li')).toHaveText([/Insuffisance pondérale/, /Corpulence normale/, /Surpoids/, /Obésité/]);
  await expect(card(page).locator('.bmi-legend li[aria-current="true"]')).toHaveAttribute('data-zone', 'normale');
  await expect(page.getByTestId('bmi-advice')).toContainText('zone de référence');
  // a new weight updates everything at once
  await page.locator('#pf-poids').fill('90');
  await expect(page.getByTestId('bmi-value')).toHaveText('27,8');
  await expect(page.getByTestId('bmi-category')).toHaveText('Surpoids');
  await expect(card(page).locator('.bmi-legend li[aria-current="true"]')).toHaveAttribute('data-zone', 'surpoids');
  await expect(page.getByTestId('bmi-advice')).toContainText('muscle');
  await expect.poll(() => markerAt(page)).toBeGreaterThan(0.5);
  // kept with the profile (on this device): still there after a reload
  await page.reload();
  await expect(page.getByTestId('bmi-value')).toHaveText('27,8');
  // a measure removed: back to the hint
  await page.locator('#pf-taille').fill('');
  await expect(page.getByTestId('bmi-hint')).toContainText('Indique ta taille');
  await expect(page.getByTestId('bmi-value')).toHaveCount(0);
  // out of the plausible range for the IMC (the field accepts 80 cm): a hint, no number
  await page.locator('#pf-taille').fill('90');
  await expect(page.getByTestId('bmi-hint')).toContainText('Vérifie ta taille');
  await expect(page.getByTestId('bmi-value')).toHaveCount(0);
});

test('moins de 18 ans : l’échelle adulte ne s’applique pas', async ({ page }) => {
  await seed(page, { age: 15, heightCm: 165, weightKg: 55 });
  await page.goto('/#/profil');
  await expect(page.getByTestId('bmi-minor')).toContainText('moins de 18 ans');
  await expect(page.getByTestId('bmi-category')).toHaveCount(0);
  await expect(page.getByTestId('bmi-gauge')).toHaveCount(0);
  await page.locator('#pf-age').fill('25');
  await expect(page.getByTestId('bmi-category')).toHaveText('Corpulence normale');
});

for (const scheme of ['dark', 'light'] as const)
  test(`carte IMC lisible en thème ${scheme} (axe)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const [h, w, cat] of [
      [180, 75, 'Corpulence normale'],
      [170, 52, 'Insuffisance pondérale'],
      [170, 100, 'Obésité (classe I)'],
    ] as const) {
      await seed(page, { heightCm: h, weightKg: w, age: 30 });
      await page.goto('/#/profil');
      await expect(page.getByTestId('bmi-category')).toHaveText(cat);
      await card(page).scrollIntoViewIfNeeded();
      const axe = await new AxeBuilder({ page }).include('[data-testid="bmi-card"]').withRules(['color-contrast', 'aria-meter-name', 'aria-allowed-attr', 'aria-valid-attr-value', 'list', 'listitem']).analyze();
      expect(axe.violations.map((v) => `${cat} ${v.id} ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
    }
  });
