import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { closeMenu, expectChecked, menuItem, openMenu, seedProfile, tapAction } from './nav-helpers';

// v0.45 (Youssef, 2026-10-23, « Refonte page Premium à vie » §10 and the definitive mockup): no main scroll at
// several phone heights, nothing hidden behind the bar, the four panels (one at a time, cross, Back), the accordions,
// the restore without fake success, accessibility, light and dark.

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
});

/** the blocks of the page, measured against the top of the bar */
async function fit(page: Page) {
  return page.evaluate(() => {
    const bar = document.querySelector('[data-testid="bottom-bar"]')!.getBoundingClientRect().top;
    const blocks = [...document.querySelectorAll('[data-testid="premium-page"] > *')].map((e) => e.getBoundingClientRect());
    const sc = document.scrollingElement!;
    return { bar, bottom: Math.max(...blocks.map((r) => r.bottom)), top: Math.min(...blocks.map((r) => r.top)), scroll: Math.max(sc.scrollHeight, document.body.scrollHeight) - innerHeight };
  });
}

for (const [w, h] of [
  [360, 640],
  [393, 740],
  [393, 851],
  [412, 915],
]) {
  test(`${w} × ${h} : tout tient au-dessus de la barre, sans défilement`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/premium');
    await expect(page.getByTestId('premium-page')).toBeVisible();
    const f = await fit(page);
    expect(f.scroll).toBeLessThanOrEqual(0);
    expect(f.top).toBeGreaterThanOrEqual(0);
    expect(f.bottom).toBeLessThanOrEqual(f.bar);
    await expect(page.getByTestId('premium-discover')).toBeInViewport({ ratio: 1 });
  });
}

test('Avantages, FAQ, Restaurer : un panneau à la fois, au-dessus de la page, fermés par la croix ou Retour', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/#/premium');
  const bar = page.getByTestId('bottom-bar');
  const before = await page.getByTestId('premium-page').boundingBox();

  // 1.1.0: Avantages, FAQ and Restaurer are in the ⋮ at the top right, the panel shown checked
  await tapAction(page, 'benefits');
  const benefits = page.getByTestId('premium-panel-benefits');
  await expect(benefits.getByRole('heading', { name: 'Détails des avantages' })).toBeVisible();
  await expect(bar).toBeVisible();
  // accordions: open as in the mockup, a tap folds one line
  const row = benefits.getByTestId('benefit-disciplines');
  await expect(row).toContainText('Boxe anglaise, kick-boxing, MMA, muay-thaï, jiu-jitsu brésilien et judo.');
  await row.getByRole('button').click();
  await expect(row.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  await expect(row.locator('p')).toBeHidden();
  await row.getByRole('button').click();
  await expect(row.locator('p')).toBeVisible();

  // the panel shown is checked in the ⋮ (opening the menu and closing it keeps the panel)
  await expectChecked(page, 'benefits', true);
  await expect(benefits).toBeVisible();
  // FAQ replaces Avantages: only one panel, only one active action
  await tapAction(page, 'faq');
  await expect(benefits).toHaveCount(0);
  const faq = page.getByTestId('premium-panel-faq');
  await expect(faq.locator('.premium-fold')).toHaveCount(4);
  await expect(faq).toContainText('S’agit-il d’un abonnement ?');
  await menuItem(page, 'faq');
  await expect(page.getByTestId('nav-menu-sheet').locator('[aria-checked="true"]')).toHaveCount(1);
  await closeMenu(page);
  await faq.getByTestId('faq-0').getByRole('button').click();
  await expect(faq.getByTestId('faq-0').locator('p')).toBeHidden();
  // the cross closes it and the page is exactly as before
  await faq.getByTestId('panel-close').click();
  await expect(faq).toHaveCount(0);
  expect(await page.getByTestId('premium-page').boundingBox()).toEqual(before);

  // Restaurer: the real entry point, which says no purchase system is wired
  await tapAction(page, 'restore');
  const restore = page.getByTestId('premium-panel-restore');
  await restore.getByTestId('restore-now').click();
  await expect(restore.getByTestId('restore-result')).toHaveAttribute('data-kind', 'indisponible');
  await expect(restore.getByTestId('restore-result')).toContainText('pas encore disponible');
  await expect(page.getByTestId('premium-active')).toHaveCount(0);
  // Back (Android, PWA) closes the panel and stays on the page
  await page.goBack();
  await expect(restore).toHaveCount(0);
  await expect(page).toHaveURL(/#\/premium$/);
  // pressing the active action again closes its panel
  await tapAction(page, 'faq');
  await tapAction(page, 'faq');
  await expect(page.getByTestId('premium-panel-faq')).toHaveCount(0);
  // the ⋮ still opens the commands of the screen (1.0.0 « Plus », formerly Menu)
  await openMenu(page);
  await expect(page.getByTestId('nav-menu-sheet')).toBeVisible();
});

for (const scheme of ['light', 'dark'] as const) {
  test(`accessibilité (${scheme}) : page et panneau Offre`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#/premium');
    await expect(page.getByTestId('premium-page')).toBeVisible();
    const page1 = await new AxeBuilder({ page }).include('[data-testid="premium-page"]').analyze();
    expect(page1.violations.map((v) => v.id)).toEqual([]);
    await page.getByTestId('premium-discover').click();
    await expect(page.getByTestId('premium-panel-offer')).toBeVisible();
    await page.waitForTimeout(300);
    const panel = await new AxeBuilder({ page }).include('[data-testid="premium-panel-offer"]').analyze();
    expect(panel.violations.map((v) => v.id)).toEqual([]);
  });
}
