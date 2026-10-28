import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.28 (Youssef, 2026-10-20 21:52): « enrichis toutes les disciplines et les légendes. Pour les légendes, retire les
 * rectangles sur le nombre de techniques, sois créatif ». The five count boxes are replaced by a computed « ADN de
 * combat » flower; legend cards get discipline icons and a DNA bar; judo and BJJ have legends.
 * 0.28 (Youssef, 2026-10-20 22:02): « Retire importer. C'est trop technique » — the import view is gone from Légendes.
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

test('page d’un champion : fleur de style au lieu des cases, plus compacte, résumé accessible', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions/c/tyson');
  const dna = page.getByTestId('champ-dna');
  await expect(dna).toBeVisible();
  await expect(page.locator('.stat-tiles')).toHaveCount(0);
  const img = dna.getByRole('img');
  await expect(img).toHaveAttribute('aria-label', /ADN de combat : \d+ fiches\. Poings \d+ %/);
  await expect(dna).toContainText(/\d+ fiches/);
  // 1.1.0 (Youssef, 2026-10-27: « Dans adn de la bibliothèque, retire nombre inspiré et tous jouable en 3d »)
  await expect(dna).not.toContainText('jouables en 3D');
  // the former grid of five boxes was 160 px tall at 393 px wide
  expect((await dna.boundingBox())!.height).toBeLessThan(160);
  await expect(page.getByTestId('champ-focus').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('champ-fact')).toContainText('Le savais-tu ?');
  await expect(page.getByTestId('champ-fact').getByRole('link', { name: /Source/ })).toHaveAttribute('href', /^https:\/\/en\.wikipedia\.org\//);
  const axe = await new AxeBuilder({ page }).include('[data-testid="champ-dna"]').include('[data-testid="champ-focus"]').include('[data-testid="champ-fact"]').analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('liste des légendes : icônes de discipline et barre d’ADN, plus de case « N fiches »', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions?vue=champions&d=muaythai');
  const card = page.getByTestId('champ-stamp');
  await expect(card).toBeVisible();
  await expect(card.locator('.dna-bar[role="img"]')).toHaveAttribute('aria-label', /ADN de combat de Stamp Fairtex/);
  await expect(card.locator('.badge')).toHaveCount(0);
  await expect(card).toContainText('12 fiches');
  const axe = await new AxeBuilder({ page }).include('.champ-card').analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

for (const [d, id, n] of [
  ['judo', 'riner', 9],
  ['bjj', 'marcelo-garcia', 8],
] as const)
  test(`légendes du ${d} : ${n} profils, une page avec ses fiches jouables`, async ({ page }) => {
    await seed(page);
    await page.goto(`/#/champions?vue=champions&d=${d}`);
    await expect(page.locator('.champ-card')).toHaveCount(n);
    await page.getByTestId(`champ-${id}`).click();
    await expect(page).toHaveURL(new RegExp(`/champions/c/${id}`));
    await expect(page.getByTestId('champ-dna')).toContainText('12 fiches');
    await expect(page.getByTestId('champ-dna').getByRole('img')).toHaveAttribute('aria-label', /Lutte, sol et projections \d+ %/);
    await expect(page.getByTestId('champ-quick-train')).toBeVisible();
  });

test('« Importer » retiré des Légendes ; les anciens liens reviennent à l’accueil des Légendes', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions');
  await expect(page.getByRole('tab', { name: 'Explorer' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Importer' })).toHaveCount(0);
  await page.goto('/#/champions?vue=importer');
  await expect(page).toHaveURL(/#\/champions$/);
  await expect(page.getByTestId('cat-import')).toHaveCount(0);
  await expect(page.getByTestId('cat-summary')).toBeVisible();
});
