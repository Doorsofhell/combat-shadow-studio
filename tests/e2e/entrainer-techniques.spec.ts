import { expect, Page, test } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// 0.36 (Youssef, 2026-10-22 18:47 « Entraîner / Techniques »): Entraîner, Séances = reprise (si possible), carte
// « Crée tes propres enchaînements », Mes enchaînements, Démarrage rapide ; Techniques = Techniques, Combinaisons,
// Légendes, Favoris ; les anciens liens du Créateur et des Programmes mènent au bon endroit

async function seedCombo(page: Page) {
  await page.goto('/');
  await page.evaluate(
    () =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          const combos = [{ id: 'e2e-combo', name: 'Mon un-deux', discipline: 'boxe', sequence: ['jab', 'direct'], createdAt: '2026-10-22' }];
          tx.objectStore('keyval').put(JSON.stringify({ state: { combos }, version: 0 }), 'u:local:css-custom');
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
      }),
  );
  await page.goto('about:blank');
}

test('Séances : carte du Créateur avant Mes enchaînements, état vide compact, ordre des blocs', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainer');
  const card = page.getByTestId('creator-card');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading')).toHaveText('Crée tes propres enchaînements');
  await expect(card).toContainText('Choisis tes techniques, organise tes mouvements et regarde ton combattant 3D exécuter tes enchaînements.');
  await expect(page.getByTestId('combos-empty')).toBeVisible();
  // one button only to create, and never the « combat » wording
  await expect(page.getByRole('link', { name: 'Créer un enchaînement' })).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(/Créer un combat/i);
  // order: creator card, my combos, quick start (the first-session card is in Démarrage rapide)
  const tops = await page.evaluate(() =>
    ['creator-card', 'my-combos', 'resume-card'].map((id) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect().top),
  );
  expect(tops[0]).toBeLessThan(tops[1]);
  expect(tops[1]).toBeLessThan(tops[2]);
  // 0.38 (Créateur V2): the card opens the editor of a new sequence; the list is « Gérer »
  await page.getByTestId('create-combo').click();
  await expect(page).toHaveURL(/#\/createur\/nouveau$/);
});

test('Mes enchaînements : un enchaînement enregistré se lance et « Gérer » ouvre le Créateur', async ({ page }) => {
  await seedProfile(page);
  await seedCombo(page);
  await page.goto('/#/entrainer');
  await expect(page.getByTestId('combos-empty')).toHaveCount(0);
  await expect(page.getByTestId('combo-e2e-combo')).toContainText('Mon un-deux');
  await page.getByTestId('manage-combos').click();
  await expect(page).toHaveURL(/#\/createur/);
  await page.goto('/#/entrainer');
  await page.getByTestId('combo-e2e-combo').click();
  await expect(page).toHaveURL(/#\/entrainement\?perso=e2e-combo/);
  await expect(page.getByTestId('exercise-name')).toBeVisible();
});

test('Techniques : deux sections, plus de Créateur ni de Programmes, anciens liens redirigés', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/techniques');
  const sections = page.getByRole('tablist', { name: 'Sections' }).getByRole('tab');
  // 1.0.0 (lot 2): Légendes is a tab of Apprendre, Favoris a tab of Entraîner
  await expect(sections).toHaveText(['Techniques', 'Combinaisons']);
  await page.goto('about:blank');
  await page.goto('/#/techniques?tab=createur&d=muaythai');
  await expect(page).toHaveURL(/#\/createur\?d=muaythai$/);
  await page.goto('about:blank');
  await page.goto('/#/techniques?tab=programmes');
  await expect(page).toHaveURL(/#\/programmes$/);
  await page.goto('about:blank');
  // 1.0.0: the old Légendes tab of the library leads to Apprendre › Légendes; the favourite legend combinations
  // are in Entraîner › Favoris
  await page.goto('/#/techniques?tab=legendes');
  await expect(page).toHaveURL(/#\/champions$/);
  await page.goto('/#/favoris');
  await page.getByTestId('legends-favorites').click();
  await expect(page).toHaveURL(/#\/champions\?vue=favoris$/);
});
