import { expect, test } from '@playwright/test';
import { seedProfile } from './nav-helpers';

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

// v0.45 (Youssef, 2026-10-23, « Refonte page Premium à vie » + maquette définitive en 5 écrans): one screen, the bar
// Retour / Avantages / FAQ / Restaurer / Menu, four panels over the page; still no payment possible
test('Réglages › Premium : la page v0.45, l’offre et aucun paiement possible', async ({ page }) => {
  const payCalls: string[] = [];
  page.on('request', (r) => {
    if (/stripe|billing|play\.google|paypal|checkout/i.test(r.url())) payCalls.push(r.url());
  });
  await page.goto('/#/');
  // 1.0.0: the tile Premium at the top of Réglages (Profil › Réglages), formerly Menu › Premium à vie
  await page.getByTestId('nav-profil').click();
  await page.getByTestId('tab-reglages').click();
  await page.getByTestId('reglages-premium').click();
  await expect(page).toHaveURL(/#\/premium$/);
  const p = page.getByTestId('premium-page');
  await expect(p.getByRole('heading', { name: 'Premium à vie' })).toBeVisible();
  await expect(p.getByRole('heading', { name: 'Combat Shadow Studio Premium' })).toBeVisible();
  await expect(p).toContainText('Tous tes entraînements. Sans limites.');
  await expect(page.getByTestId('premium-terms')).toHaveText('Un paiement. À vie. Sans abonnement.');
  await expect(page.getByTestId('premium-benefits').locator('.premium-grid li')).toHaveCount(6);
  await expect(page.getByTestId('premium-soon')).toHaveText('Combattants et réglages avancés : à venir');
  // the bar of the page, in the mockup's order
  // 1.1.0: Retour in the bar, Avantages, FAQ and Restaurer in the ⋮ at the top right
  await expect(page.getByTestId('bottom-bar').locator('.nav-btn')).toHaveText(['Retour']);
  await page.getByTestId('nav-menu').click();
  await expect(page.getByTestId('nav-menu-sheet').locator('.nav-menuitem[data-action] span:not(.nav-menucheck)')).toHaveText(['Avantages', 'FAQ', 'Restaurer']);
  await page.keyboard.press('Escape');
  await page.getByTestId('premium-discover').click();
  const offer = page.getByTestId('premium-panel-offer');
  await expect(offer).toBeVisible();
  await expect(offer.getByTestId('premium-price')).toHaveText('39,99 € TTC');
  await expect(offer).toContainText('Prix de lancement indicatif');
  await offer.getByTestId('premium-pay').click();
  await expect(offer.getByTestId('offer-result')).toContainText('Aucune option d’achat n’est disponible pour le moment');
  await expect(page.getByTestId('premium-active')).toHaveCount(0);
  await expect(page.locator('input[autocomplete^="cc-"], input[name*="card" i]')).toHaveCount(0);
  expect(payCalls).toEqual([]);
  // Android back: the panel closes first, then Retour comes back where Premium was opened (1.0.0: Réglages)
  await page.goBack();
  await expect(offer).toHaveCount(0);
  await expect(page).toHaveURL(/#\/premium$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/reglages$/);
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
  await page.locator('a.prog-card').first().click(); // 0.41: the catalogue tiles are the programme cards
  await expect(page.getByTestId('start-program')).toBeEnabled();
  // legends, favourites, history, voice
  await page.goto('/#/champions');
  await expect(page.getByTestId('premium-legends_collection')).toBeVisible();
  await page.goto('/#/favoris'); // 1.0.0: Entraîner › Favoris
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
