import { expect, test, type Page } from '@playwright/test';
import { openCoachIA, seedProfile } from './nav-helpers';

/**
 * 2.7 (Youssef, 2026-11-24: « je veux ce type de panneau partout dans l'application quand on ouvre des options »):
 * every options sheet in the glass of the « Options du coach » panel, closed by the same rules: tap outside (nothing
 * behind reacts), swipe down from the grip, the round close button, Échap, Back (and Back stays on the page).
 */
test.use({ viewport: { width: 360, height: 780 }, hasTouch: true });

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Options du chrono' });

async function openChronoOptions(page: Page) {
  await seedProfile(page);
  await page.goto('/#/chrono');
  await page.getByTestId('chrono-options-open').click();
  await expect(sheet(page)).toBeVisible();
}

test('Options du chrono : verre, poignée et bouton rond', async ({ page }) => {
  await openChronoOptions(page);
  const style = await sheet(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderTopLeftRadius, bottomRadius: s.borderBottomLeftRadius, bg: s.backgroundColor, blur: s.backdropFilter || (s as unknown as Record<string, string>).webkitBackdropFilter };
  });
  // a floating card: every corner rounded, a translucent glass with a blur (or a nearly opaque plain one in .lite)
  expect(style.radius).toBe('26px');
  expect(style.bottomRadius).toBe('26px');
  expect(style.bg).toMatch(/rgba\(20, 25, 33, 0\.(8|95)\)/);
  await expect(page.getByTestId('sheet-grip').locator('.grab')).toBeVisible();
  await expect(sheet(page).getByTestId('sheet-close')).toBeVisible();
  // it floats: a margin under it and on its sides (measured once its short rise is over)
  await page.waitForTimeout(400);
  const box = (await sheet(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(10);
  expect(box.y + box.height).toBeLessThanOrEqual(780 - 10);
});

test('Retour ferme le panneau et reste sur la page', async ({ page }) => {
  await openChronoOptions(page);
  await page.waitForTimeout(150); // the history entry of the sheet is pushed right after it shows
  await page.goBack();
  await expect(sheet(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/chrono$/);
  await expect(page.getByTestId('chrono-options-open')).toBeVisible();
});

test('Échap et le bouton rond ferment le panneau, sans entrée d’historique en trop', async ({ page }) => {
  await openChronoOptions(page);
  await page.waitForTimeout(150);
  const before = await page.evaluate(() => history.length);
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveCount(0);
  await page.getByTestId('chrono-options-open').click();
  await page.waitForTimeout(150);
  await sheet(page).getByTestId('sheet-close').click();
  await expect(sheet(page)).toHaveCount(0);
  // the sheet's entry is removed when it closes: Back now leaves the chronometer as before
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => history.length)).toBeLessThanOrEqual(before);
  await expect(page).toHaveURL(/#\/chrono$/);
});

test('un toucher en dehors ferme le panneau sans rien déclencher derrière', async ({ page }) => {
  await openChronoOptions(page);
  // the « Démarrer » / settings controls of the page are behind the scrim: a tap there only closes the sheet
  await page.evaluate(() => {
    (window as unknown as { __behind: number }).__behind = 0;
    document.addEventListener('click', (e) => !(e.target as Element).closest('.ds-backdrop') && (window as unknown as { __behind: number }).__behind++, true);
  });
  await page.mouse.click(180, 40);
  await expect(sheet(page)).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __behind: number }).__behind)).toBe(0);
  await expect(page).toHaveURL(/#\/chrono$/);
});

test('glisser la poignée vers le bas ferme le panneau ; un petit glissé le laisse revenir', async ({ page }) => {
  await openChronoOptions(page);
  const grip = (await page.getByTestId('sheet-grip').locator('.grab').boundingBox())!;
  const x = grip.x + grip.width / 2;
  const y = grip.y + grip.height / 2;
  // a short move: the sheet comes back
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 15, { steps: 6 });
  await page.mouse.up();
  await expect(sheet(page)).toBeVisible();
  // a long one: it closes
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160, { steps: 12 });
  await page.mouse.up();
  await expect(sheet(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/chrono$/);
});

test('une confirmation : Retour la ferme, « Annuler » ne quitte pas la page', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/reglages/donnees');
  await page.getByRole('button', { name: /Tout effacer/ }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Tout effacer ?' });
  await expect(dlg).toBeVisible();
  await page.waitForTimeout(150);
  await page.goBack();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#\/reglages\/donnees$/);
  await page.getByRole('button', { name: /Tout effacer/ }).first().click();
  await expect(dlg).toBeVisible();
  await page.getByTestId('confirm-cancel').click();
  await expect(dlg).toHaveCount(0);
  await expect(page).toHaveURL(/#\/reglages\/donnees$/);
});

test('fiche d’exercice : « S’entraîner » ouvre la séance, Retour ne repasse pas par le panneau', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/discipline/boxe');
  await page.locator('[data-testid^="ex-"]').first().click();
  await expect(page.getByTestId('go-training')).toBeVisible();
  await page.waitForTimeout(150);
  await page.getByTestId('go-training').click();
  await expect(page).toHaveURL(/#\/entrainement\?/);
  // Back from the session comes to the discipline (the sheet opened there is in its address, as before 2.7), and
  // not to a copy of the page left by the sheet's own history entry
  await page.goBack();
  await expect(page).toHaveURL(/#\/discipline\/boxe\?ex=/);
  await expect(page.getByTestId('go-training')).toBeVisible();
  await page.waitForTimeout(150);
  // one Back = one step: the sheet closes first, the page stays
  await page.goBack();
  await expect(page.getByTestId('go-training')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/discipline\/boxe$/);
});

test('menu « Plus » et recherche : même verre, Retour les ferme', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/chrono');
  await page.getByTestId('app-search').first().click();
  const search = page.getByTestId('search-sheet');
  await expect(search).toBeVisible();
  await expect(search.getByTestId('panel-close')).toHaveClass(/glass-x/);
  await page.goBack();
  await expect(search).toHaveCount(0);
  await expect(page).toHaveURL(/#\/chrono$/);
});

test('Coach IA : panneau en verre, Retour le ferme et reste sur la page', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/techniques');
  await page.waitForLoadState('networkidle');
  await openCoachIA(page);
  const ia = page.getByTestId('coach-bubble-panel');
  await expect(ia).toBeVisible();
  const radius = await ia.locator('.cai-panel').evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(radius).toBe('26px');
  await page.waitForTimeout(200);
  await page.goBack();
  await expect(ia).toHaveCount(0);
  await expect(page).toHaveURL(/#\/techniques$/);
});
