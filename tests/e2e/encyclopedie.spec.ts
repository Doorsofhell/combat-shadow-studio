import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

// v0.46 (Youssef, 2026-10-23, « Création de l'Encyclopédie du combat — Version 1.0 » §17): access from the Menu, the
// eight families, filters, search, A–Z, favourites kept after a reload, Retour keeps the filters, links both ways with
// the techniques of the app, pictures with a size and an honest « to make » box, light and dark, small screens, axe.

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
});

const results = (page: Page) => page.getByTestId('enc-results').getByTestId('enc-row');

test('Apprendre ouvre l’Encyclopédie (onglet, 1.0.0 ; formerly in the Menu), sans Premium', async ({ page }) => {
  await page.goto('/#/');
  await page.getByTestId('nav-techniques').click();
  const entry = page.getByTestId('tab-encyclopedie');
  await expect(entry).toHaveText('Encyclopédie');
  await entry.click();
  await expect(page.getByTestId('encyclopedia-home')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Encyclopédie du combat' })).toBeVisible();
  await expect(page.getByText('Techniques, équipements, règles et culture des 6 disciplines')).toBeVisible();
  // the actions: Classement | A–Z | Favoris | Plus (1.0.0: the first page of a tab of Apprendre has no Retour)
  await expect(bar(page)).toHaveAttribute('data-screen', 'encyclopedie');
  const labels = await bar(page).locator('[data-action]').evaluateAll((els) => els.map((e) => e.getAttribute('data-action')));
  expect(labels).toEqual(['ency-classement', 'ency-az', 'ency-favoris', 'menu']);
  await expect(page.getByTestId('nav-ency-classement')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('premium-lock')).toHaveCount(0);
  // a deeper page of the encyclopedia keeps Retour
  await page.getByTestId('nav-ency-az').click();
  await expect(page).toHaveURL(/#\/encyclopedie\/az/);
  await expect(bar(page).locator('.nav-backchip [data-action="back"]')).toBeVisible();
});

test('huit familles distinctes, chacune ouvre sa liste filtrée', async ({ page }) => {
  await page.goto('/#/encyclopedie');
  const cards = page.getByTestId('enc-families').locator('a');
  await expect(cards).toHaveCount(8);
  const names = await cards.locator('.enc-family-name').allInnerTexts();
  expect(new Set(names).size).toBe(8);
  await page.getByTestId('enc-family-equipements').click();
  await expect(page.getByTestId('encyclopedia-list')).toHaveAttribute('data-family', 'equipements');
  await expect(results(page).first()).toBeVisible();
  // equipment is never a technique
  await expect(results(page).filter({ hasText: 'Jab' })).toHaveCount(0);
});

test('filtres combinés : sous-catégorie, discipline et recherche ; aucun résultat dit clairement', async ({ page }) => {
  await page.goto('/#/encyclopedie/liste?f=techniques');
  await expect(results(page).first()).toBeVisible();
  const all = await results(page).count();
  await page.getByTestId('enc-sub').selectOption('pieds');
  const feet = await results(page).count();
  expect(feet).toBeGreaterThan(0);
  expect(feet).toBeLessThan(all);
  await page.getByTestId('enc-d-muaythai').click();
  await expect(page.getByTestId('enc-d-muaythai')).toHaveAttribute('aria-checked', 'true');
  await expect(page).toHaveURL(/f=techniques/);
  await expect(page).toHaveURL(/s=pieds/);
  await expect(page).toHaveURL(/d=muaythai/);
  await expect(results(page).filter({ hasText: 'Teep' })).toHaveCount(1);
  await page.getByTestId('enc-list-search').fill('zzzz');
  await expect(page.getByTestId('enc-no-result')).toBeVisible();
});

test('recherche : nom international, synonyme, accents et tirets', async ({ page }) => {
  await page.goto('/#/encyclopedie');
  const search = page.getByTestId('enc-search');
  for (const [q, id] of [
    ['cross', 'direct'],
    ['southpaw', 'gaucher'],
    ['ECHAUFFEMENT', 'echauffement'],
    ['kouchi gari', 'ko-uchi-gari'],
    ['mata leão', 'etranglement-arriere'],
  ]) {
    await search.fill(q);
    await expect(results(page).first(), q).toHaveAttribute('data-term', id);
  }
});

test('Retour depuis une fiche revient sur la même liste, filtres gardés', async ({ page }) => {
  await page.goto('/#/encyclopedie/liste?f=techniques&s=poings&d=boxe');
  await results(page).filter({ hasText: 'Jab' }).click();
  await expect(page.getByTestId('encyclopedia-term')).toHaveAttribute('data-term', 'jab');
  await bar(page).locator('[data-action="back"]').click();
  await expect(page.getByTestId('encyclopedia-list')).toBeVisible();
  await expect(page).toHaveURL(/f=techniques&s=poings&d=boxe/);
  await expect(page.getByTestId('enc-sub')).toHaveValue('poings');
  await expect(page.getByTestId('enc-d-boxe')).toHaveAttribute('aria-checked', 'true');
});

test('fiche : image dimensionnée, onglets, sources datées, provenance de l’image, lien vers la technique et retour', async ({ page }) => {
  await page.goto('/#/encyclopedie/terme/jab');
  const img = page.getByTestId('enc-figure').getByTestId('enc-img');
  await expect(img).toHaveAttribute('width', '720');
  await expect(img).toHaveAttribute('height', '400');
  await expect(img).toHaveJSProperty('complete', true);
  expect(await img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByTestId('enc-definition')).not.toBeEmpty();
  await page.getByTestId('enc-tab-src').click();
  await expect(page.getByTestId('enc-sources').locator('a').first()).toHaveAttribute('href', /^https:\/\//);
  await expect(page.getByTestId('enc-sources')).toContainText('Consultée le');
  await expect(page.getByTestId('enc-validation')).toContainText('Relecture par un expert : à venir');
  await expect(page.getByTestId('enc-image-origin')).toContainText('Kadir');
  await page.getByTestId('enc-tab-def').click();
  await page.getByTestId('enc-app-link').first().click();
  await expect(page).toHaveURL(/#\/techniques\/jab/);
  // and back: « Comprendre ce terme » on the technique sheet
  await page.getByTestId('understand-term').click();
  await expect(page.getByTestId('encyclopedia-term')).toHaveAttribute('data-term', 'jab');
});

test('une illustration pas encore produite est annoncée, jamais remplacée par un pictogramme muet', async ({ page }) => {
  await page.goto('/#/encyclopedie/terme/kesa-gatame');
  const missing = page.getByTestId('enc-figure').getByTestId('enc-img-missing');
  await expect(missing).toBeVisible();
  await expect(missing).toContainText('Illustration à produire');
  await expect(missing).toHaveAttribute('aria-label', /illustration à produire/);
  await page.getByTestId('enc-tab-src').click();
  await expect(page.getByTestId('enc-image-origin')).toContainText('à produire');
});

test('A–Z : lettres sans terme désactivées, alias menant à la fiche', async ({ page }) => {
  await page.goto('/#/encyclopedie');
  await page.getByTestId('nav-ency-az').click();
  await expect(page.getByTestId('encyclopedia-az')).toBeVisible();
  await expect(page.getByTestId('nav-ency-az')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('enc-letter-C').click();
  const cross = page.getByTestId('enc-az-list').getByTestId('enc-az-item').filter({ hasText: /^Cross/ });
  await expect(cross).toContainText('→ Direct');
  await cross.click();
  await expect(page.getByTestId('encyclopedia-term')).toHaveAttribute('data-term', 'direct');
  await page.goto('/#/encyclopedie/az');
  const disabled = page.getByTestId('enc-letters').locator('button:disabled');
  for (const b of await disabled.all()) await expect(b).toHaveAttribute('aria-label', /aucun terme/);
});

test('favoris : ajoutés depuis la fiche, gardés après rechargement, retirés', async ({ page }) => {
  await page.goto('/#/encyclopedie/terme/teep');
  await page.getByTestId('enc-fav').click();
  await expect(page.getByTestId('enc-fav')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(400); // persisted store write
  await page.reload();
  await expect(page.getByTestId('enc-fav')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('nav-ency-favoris').click();
  await expect(page.getByTestId('encyclopedia-favorites')).toBeVisible();
  await expect(results(page)).toHaveCount(1);
  await expect(results(page).first()).toHaveAttribute('data-term', 'teep');
  await results(page).first().click();
  await page.getByTestId('enc-fav').click();
  await page.getByTestId('nav-ency-favoris').click();
  await expect(page.getByTestId('enc-no-favorite')).toBeVisible();
});

for (const scheme of ['light', 'dark'] as const) {
  test(`360 × 640, ${scheme} : rien ne déborde, axe sans violation grave`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 360, height: 640 });
    for (const path of ['/#/encyclopedie', '/#/encyclopedie/liste?f=regles', '/#/encyclopedie/terme/cage', '/#/encyclopedie/az?l=S']) {
      await page.goto(path);
      await expect(page.locator('.enc-page')).toBeVisible();
      // the page's entry transition fades its text in: measure the contrast once it has finished
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
      const axe = await new AxeBuilder({ page }).include('.enc-page').analyze();
      const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`), `${path} ${scheme}`).toEqual([]);
    }
  });
}

test('« The Octagon » n’est pas un terme générique', async ({ page }) => {
  await page.goto('/#/encyclopedie/terme/cage');
  await expect(page.getByTestId('enc-definition')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cage');
  await page.getByRole('tab', { name: /Octagon/ }).click();
  await expect(page.getByTestId('enc-tabpanel')).toContainText('marque déposée de l’UFC');
});
