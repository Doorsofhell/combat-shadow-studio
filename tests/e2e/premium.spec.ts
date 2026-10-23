import { expect, test } from '@playwright/test';
import { openMenu, seedProfile } from './nav-helpers';

// v0.40 (Youssef, 2026-10-22, « Préparation Freemium et Premium à vie » §11): statut Free. The diamonds are visible,
// they open the Premium page, and every feature stays open; no payment is possible and no payment service is called.
// The Premium status itself is tested in src/monetization/__tests__/rights.test.tsx (nothing in the app can grant it).

const combo = { id: 'c1', name: 'Jab → Direct', discipline: 'boxe', sequence: ['jab', 'direct'], createdAt: '2026-10-20T10:00:00Z' };

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
  await page.goto('/');
  await page.evaluate(
    ({ combo }) =>
      new Promise<void>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { combos: [combo] }, version: 0 }), 'u:local:css-custom');
          tx.objectStore('keyval').put(JSON.stringify({ state: { goals: { weeklyMinutes: 0, weeklySessions: 0 }, favTechniques: ['jab'], favExercises: [], mastery: {} }, version: 0 }), 'u:local:css-goals');
          tx.oncomplete = () => res();
        };
      }),
    { combo },
  );
  await page.goto('about:blank');
});

test('Menu « Premium à vie » : la page, le prix indicatif, aucun paiement possible', async ({ page }) => {
  const payCalls: string[] = [];
  page.on('request', (r) => {
    if (/stripe|billing|play\.google|paypal|checkout/i.test(r.url())) payCalls.push(r.url());
  });
  await page.goto('/#/');
  await openMenu(page);
  await page.getByTestId('menu-premium').click();
  await expect(page).toHaveURL(/#\/premium$/);
  const p = page.getByTestId('premium-page');
  await expect(p.getByRole('heading', { name: 'Combat Shadow Studio Premium' })).toBeVisible();
  await expect(p).toContainText('« Tous tes entraînements. Sans limites. »');
  for (const t of ['Achat unique', 'Accès Premium à vie', 'Aucun abonnement', 'Aucun renouvellement automatique']) await expect(page.getByTestId('premium-terms')).toContainText(t);
  await expect(page.getByTestId('premium-price')).toContainText('39,99 € TTC');
  await expect(page.getByTestId('premium-price')).toContainText('Prix de lancement indicatif');
  await expect(page.getByTestId('premium-benefits').locator('li')).toHaveCount(8);
  await expect(page.getByTestId('premium-benefits').locator('li[data-available="false"]')).toHaveCount(2);
  const pay = page.getByTestId('premium-pay');
  await expect(pay).toBeDisabled();
  await expect(pay).toHaveText('Paiement bientôt disponible');
  await pay.click({ force: true });
  await expect(page.getByTestId('premium-active')).toHaveCount(0);
  await expect(p).toContainText('Aucun paiement n’est possible pour le moment.');
  await expect(page.locator('input[autocomplete^="cc-"], input[name*="card" i]')).toHaveCount(0);
  expect(payCalls).toEqual([]);
  // Android back: Retour comes back where Menu was opened
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
});

test('les diamants sont visibles et les fonctions restent ouvertes', async ({ page }) => {
  // Créateur: the list carries one diamond, « Créer » none; the sequence still opens and stays editable
  await page.goto('/#/createur');
  await expect(page.getByTestId('premium-unlimited_combos')).toHaveCount(1);
  await expect(page.locator('.bottom-bar [data-premium], [data-testid="bottom-bar"] [data-premium]')).toHaveCount(0);
  await page.goto('/#/createur/c1');
  await expect(page.getByTestId('premium-advanced_combo_builder')).toBeVisible();
  await page.goto('/#/createur/c1/modifier');
  await expect(page.locator('input').first()).toBeEditable();
  // advanced levels only
  await page.goto('/#/discipline/boxe?niveau=debutant');
  await expect(page.getByTestId('premium-advanced_techniques')).toHaveCount(0);
  await page.goto('/#/discipline/boxe?niveau=expert');
  await expect(page.getByTestId('premium-advanced_techniques')).toBeVisible();
  // programmes: one diamond on the title, the programmes still open
  await page.goto('/#/programmes');
  await expect(page.getByTestId('premium-all_programs')).toHaveCount(1);
  await page.locator('a.ex-card').first().click();
  await expect(page.getByTestId('start-program')).toBeEnabled();
  // legends, favourites, history, voice
  await page.goto('/#/champions');
  await expect(page.getByTestId('premium-legends_collection')).toBeVisible();
  await page.goto('/#/techniques?tab=favoris');
  await expect(page.getByTestId('premium-unlimited_favorites')).toHaveCount(1);
  await page.goto('/#/historique');
  await expect(page.getByTestId('premium-full_history')).toBeVisible();
  await page.goto('/#/stats/activite');
  await expect(page.getByTestId('premium-advanced_statistics')).toBeVisible();
  await page.goto('/#/reglages/voix');
  const tips = page.locator('label.panel-row', { hasText: 'Conseils techniques' });
  const box = tips.locator('input[role="switch"]');
  const before = await box.isChecked();
  // the diamond opens the Premium page without switching the setting
  await tips.getByTestId('premium-advanced_voice').click();
  await expect(page).toHaveURL(/#\/premium\?f=advanced_voice$/);
  await page.goBack();
  await expect(page.locator('label.panel-row', { hasText: 'Conseils techniques' }).locator('input[role="switch"]')).toBeChecked({ checked: before });
  // the setting itself still works
  await page.locator('label.panel-row', { hasText: 'Conseils techniques' }).locator('.grow').click();
  await expect(page.locator('label.panel-row', { hasText: 'Conseils techniques' }).locator('input[role="switch"]')).toBeChecked({ checked: !before });
});

test('un diamant ouvre la page Premium sans déclencher la carte autour', async ({ page }) => {
  await page.goto('/#/createur');
  await page.getByTestId('premium-unlimited_combos').click();
  await expect(page).toHaveURL(/#\/premium\?f=unlimited_combos$/);
  await expect(page.getByTestId('premium-page')).toBeVisible();
});
