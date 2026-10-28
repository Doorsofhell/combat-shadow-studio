import { expect, test, type Page } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// 1.3.1 « Visuels studio » (Youssef, 2026-10-28: « ambiance par discipline, génération automatique, partout, même
// encyclopédie »): the pictures of the coach come from scripts/visuels. Each one is really loaded, at the size the
// generator writes, on the dark ground of the studio (no white frame left around a card picture), and judo and BJJ
// have their discipline artwork like the four others.

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
});

const loaded = (page: Page, selector: string) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll<HTMLImageElement>(sel)].slice(0, 6).map((e) => {
        e.scrollIntoView({ block: 'center' });
        return e.complete ? `${e.naturalWidth}x${e.naturalHeight}` : 'chargement';
      }),
    selector,
  );

test('vignettes des techniques : 240 x 300, sur le fond sombre du studio', async ({ page }) => {
  await page.goto('/#/techniques');
  await expect.poll(() => page.locator('.tech-thumb img').count()).toBeGreaterThanOrEqual(6);
  await expect.poll(() => loaded(page, '.tech-thumb img')).toEqual(Array(6).fill('240x300'));
  const bg = await page.locator('.tech-thumb').first().evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).not.toBe('rgb(255, 255, 255)');
});

for (const d of ['judo', 'bjj'])
  test(`bannière ${d} : le visuel officiel de la discipline est là`, async ({ page }) => {
    await page.goto(`/#/discipline/${d}`);
    const img = page.locator(`.disc-card.banner img[data-discipline-art="${d}"]`);
    await expect.poll(() => img.evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
    expect(await img.getAttribute('alt')).not.toBeNull();
  });

test('encyclopédie : illustration de coach et d’objet chargées dans l’ambiance studio', async ({ page }) => {
  for (const term of ['jab', 'judogi']) {
    await page.goto('about:blank');
    await page.goto(`/#/encyclopedie/terme/${term}`);
    const img = page.getByTestId('enc-figure').getByTestId('enc-img');
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate((i: HTMLImageElement) => `${i.naturalWidth}x${i.naturalHeight}`), term).toBe('720x400');
  }
  // the provenance of the picture is on the Sources tab of the sheet
  await page.getByTestId('enc-tab-src').click();
  await expect(page.getByTestId('enc-image-origin')).toContainText('salle d’ambiance');
});
