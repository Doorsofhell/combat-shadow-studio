import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * Catalogue validé (Youssef, 2026-11-06 : « que des combinaisons d'entraînement vérifiées et validées par les fédérations » ;
 * « garder, validées en premier » ; « bien les classer et bien préciser » ; « je ne veux pas quelque chose de brouillon »).
 * Les fiches de programme fédéral sont en tête de la bibliothèque, isolées par « Validées », et chaque fiche dit d'où
 * elle vient (organisme, document, page, exercice, enchaînement tel qu'il est écrit). Les fiches inspirées restent.
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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

test.use({ viewport: { width: 393, height: 851 } });

test('bibliothèque : les fiches de programme fédéral en tête, le bouton « Validées » les isole', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions');
  const card = page.getByTestId('cat-programs');
  await expect(card).toContainText('Programmes des fédérations');
  await expect(page.getByTestId('cat-programs-ffboxe-boxe')).toContainText('23 fiches · gant blanc à rouge');
  await expect(page.getByTestId('cat-programs-ffkmda-muaythai')).toContainText('7 fiches · prajeet jaune à vert');
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/catalogue-valide/captures/legendes-programmes.png' });
  expect((await new AxeBuilder({ page }).include('[data-testid="cat-programs"]').analyze()).violations.map((v) => v.id)).toEqual([]);

  await page.goto('/#/champions?vue=explorer&d=boxe');
  const first = page.locator('a[data-testid^="cat-boxe-"]').first();
  await expect(first).toContainText('Programme fédéral');
  await expect(first).toContainText('FFBoxe · Gant blanc');
  await expect(page.getByText(/^\d+ fiches$/)).toBeVisible();
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/catalogue-valide/captures/bibliotheque-boxe.png' });

  await page.getByTestId('cat-validated').click();
  await expect(page.getByTestId('cat-validated')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('23 fiches', { exact: true })).toBeVisible();
  await expect(page.locator('a[data-testid^="cat-boxe-"]', { hasText: 'Inspirée' })).toHaveCount(0);
  await page.goto('/#/champions?vue=explorer&d=muaythai&valide=1');
  await expect(page.getByText('7 fiches', { exact: true })).toBeVisible();
  await expect(page.locator('a[data-testid^="cat-muaythai-"]').first()).toContainText('FFKMDA · Prajeet jaune');
  await page.locator('a[data-testid^="cat-muaythai-"]').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/catalogue-valide/captures/validees-muaythai.png' });
});

test('fiche de programme : organisme, document et page, exercice, enchaînement tel qu’il est écrit, travail seul', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions/boxe-ffboxe-gj-01');
  const status = page.getByTestId('cat-status');
  await expect(status).toContainText('Statut : Programme fédéral.');
  await expect(status).toContainText('inspiré du programme officiel');
  const src = page.getByTestId('cat-program');
  await expect(src).toContainText('Fédération française de boxe (FFBoxe), Gant jaune');
  await expect(src).toContainText('page 16');
  await expect(src).toContainText('Parade Avant-Bras + Direct Arr Face + Crochet Av Face + Direct Arr Face');
  await expect(src.getByRole('link')).toHaveAttribute('href', /^https:\/\/www\.ffboxe\.com\/.+GANT-JAUNE\.pdf$/);
  await expect(page.getByTestId('cat-train')).toBeEnabled();
  await src.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/catalogue-valide/captures/fiche-programme.png' });
  const axe = await new AxeBuilder({ page }).include('[data-testid="cat-status"]').analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('non-régression : une fiche inspirée reste marquée « Inspirée », sans encart de programme', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions/boxe-tyson-0001');
  await expect(page.getByTestId('cat-status')).toContainText('Statut : Inspirée.');
  await expect(page.getByTestId('cat-program')).toHaveCount(0);
});
