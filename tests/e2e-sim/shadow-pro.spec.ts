import { expect, test, type Page } from '@playwright/test';
import { seedProfile } from '../e2e/nav-helpers';

/**
 * 2.9.0 (Youssef, 2026-11-25, « Shadow Studio — Identification visuelle des contenus Freemium et Premium », §9): the
 * PRO badges and padlocks on the real screens of the preview build, as a free user (also a guest: there is no sign-in
 * in the app), a Premium user and a user whose purchase was refunded (« expiré »).
 */
async function as(page: Page, mode: 'gratuit' | 'premium' | 'expire', theme = 'sombre') {
  await page.addInitScript(([m, t]) => (localStorage.setItem('css-sim-rights', m), localStorage.setItem('css-theme', t)), [mode, theme]);
  await seedProfile(page);
}

for (const mode of ['gratuit', 'expire'] as const)
  test(`${mode} : PRO visibles, cadenas sur les contenus réservés, gratuits ouverts, toucher → Shadow Pro`, async ({ page }) => {
    await as(page, mode);
    await page.goto('/#/programmes');
    const free = page.getByTestId('prog-boxe-initiation-4-semaines');
    const pro = page.getByTestId('prog-boxe-rounds-expert');
    await expect(free.getByTestId('pro-lock')).toHaveCount(0);
    await expect(free.locator('.pro-badge')).toHaveCount(0);
    await expect(pro.locator('.pro-badge')).toHaveText('PRO');
    await expect(pro.getByTestId('pro-lock')).toHaveCount(1);
    // the padlock replaces the arrow, it is not added to it
    await expect(pro.locator('.app-icon')).not.toHaveCount(0);
    await pro.click();
    await expect(page).toHaveURL(/#\/premium\?f=all_programs$/);
    // a typed address of a locked session never starts it
    await page.goto('/#/entrainement?prog=boxe-rounds-expert&s=2');
    await expect(page).toHaveURL(/#\/premium\?f=all_programs$/);
    await page.goto('/#/entrainement?ex=boxe-expert-01');
    await expect(page).toHaveURL(/#\/premium/);
    // the free programme starts
    await page.goto('/#/programmes/boxe-initiation-4-semaines');
    await expect(page.getByTestId('start-program').getByTestId('pro-lock')).toHaveCount(0);
    // exercises: expert locked with PRO, beginner free
    await page.goto('/#/discipline/boxe?niveau=expert');
    await expect(page.locator('.ex-card').first()).toBeVisible();
    const n = await page.locator('.ex-card').count();
    await expect(page.locator('.ex-card .pro-badge')).toHaveCount(n);
    await expect(page.locator('.ex-card [data-testid="pro-lock"]')).toHaveCount(n);
    await page.goto('/#/discipline/boxe?niveau=debutant');
    await expect(page.locator('.ex-card').first()).toBeVisible();
    await expect(page.locator('.ex-card .pro-badge, .ex-card [data-testid="pro-lock"]')).toHaveCount(0);
    // a locked technique sheet is never shown
    await page.goto('/#/techniques/crochet-arriere');
    await expect(page).toHaveURL(/#\/premium\?f=advanced_techniques$/);
    // coaches: the four PRO ones are locked; choosing one opens Shadow Pro, the chosen coach is unchanged
    await page.goto('/#/coach');
    await expect(page.getByTestId('coach-nael').locator('.pro-badge')).toHaveText('PRO');
    await expect(page.getByTestId('coach-nael').getByTestId('pro-lock')).toHaveCount(1);
    await expect(page.getByTestId('coach-homme').getByTestId('pro-lock')).toHaveCount(0);
    // no shield, no « FREE » in the profile
    await page.goto('/#/profil');
    await expect(page.getByTestId('profile-name')).toBeVisible();
    await expect(page.getByTestId('pro-shield')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/\bFREE\b/);
  });

test('mixte : « 3/6 PRO », les séances gratuites restent ouvertes, jamais tout verrouillé', async ({ page }) => {
  await as(page, 'gratuit');
  await page.goto('/#/programmes');
  const mixed = page.getByTestId('prog-apercu-programme-mixte');
  await expect(mixed.locator('.pro-badge')).toHaveText('3/6 PRO');
  await expect(mixed.getByTestId('pro-lock')).toHaveCount(0);
  await mixed.click();
  await expect(page.getByTestId('start-program').getByTestId('pro-lock')).toHaveCount(0);
  for (const w of [1, 2, 3]) await expect(page.getByTestId(`prog-week-${w}`).getByTestId('pro-lock')).toHaveCount(0);
  for (const w of [4, 5, 6]) {
    await expect(page.getByTestId(`prog-week-${w}`).locator('.pro-badge')).toHaveText('PRO');
    await expect(page.getByTestId(`prog-week-${w}`).getByTestId('pro-lock')).toHaveCount(1);
  }
  await page.goto('/#/entrainement?prog=apercu-programme-mixte&s=2');
  await expect(page).toHaveURL(/entrainement/);
  await page.goto('/#/entrainement?prog=apercu-programme-mixte&s=5');
  await expect(page).toHaveURL(/#\/premium/);
});

test('premium : aucun cadenas, les PRO restent, bouclier dans le profil, tout s’ouvre', async ({ page }) => {
  await as(page, 'premium');
  await page.goto('/#/programmes');
  const pro = page.getByTestId('prog-boxe-rounds-expert');
  await expect(pro.locator('.pro-badge')).toHaveText('PRO');
  await expect(page.getByTestId('pro-lock')).toHaveCount(0);
  await pro.click();
  await expect(page).toHaveURL(/#\/programmes\/boxe-rounds-expert$/);
  await page.goto('/#/techniques/crochet-arriere');
  await expect(page.getByTestId('technique-page')).toBeVisible();
  await page.goto('/#/coach');
  await expect(page.getByTestId('coach-nael').locator('.pro-badge')).toHaveText('PRO');
  await expect(page.getByTestId('pro-lock')).toHaveCount(0);
  await page.goto('/#/profil');
  await expect(page.getByTestId('pro-shield')).toBeVisible();
  // no sales prompt on the titles: the badge is not a link to the offer
  await page.goto('/#/createur');
  await expect(page.getByTestId('premium-unlimited_combos')).toHaveJSProperty('tagName', 'SPAN');
});

for (const [theme, vp] of [
  ['clair', { width: 360, height: 640 }],
  ['sombre', { width: 360, height: 640 }],
] as const)
  test(`petit écran ${theme} : le badge ne déborde pas, ne grandit pas les cartes, pas de défilement de côté`, async ({ page }) => {
    await page.setViewportSize(vp);
    await as(page, 'gratuit', theme);
    await page.goto('/#/programmes');
    const card = page.getByTestId('prog-kick-poings-pieds');
    await expect(card).toBeVisible();
    const badge = await card.locator('.pro-badge').boundingBox();
    const box = await card.boundingBox();
    expect(badge!.x + badge!.width).toBeLessThanOrEqual(box!.x + box!.width);
    expect(badge!.height).toBeLessThanOrEqual(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    // readable: the badge colour against the card
    const c = await card.locator('.pro-badge').evaluate((el) => getComputedStyle(el).color);
    expect(c).toBe(theme === 'clair' ? 'rgb(125, 95, 34)' : 'rgb(226, 193, 90)');
  });
