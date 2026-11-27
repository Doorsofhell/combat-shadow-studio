import { expect, test, type Page } from '@playwright/test';
import { openSetting, seedProfile } from './nav-helpers';

/**
 * 2.13.0 (Youssef 2026-11-27): Compte en trois onglets (Moi / Ma pratique / Mon compte) qu'on change en glissant comme
 * sur Progrès ; onglets collés en haut au défilement ; point rouge sur ce qui reste à remplir (à la place de la carte
 * « Complète ton profil ») ; accès rapides sur une rangée ; chiffres d'activité visibles dans Mon compte.
 */
test.use({ viewport: { width: 412, height: 915 }, hasTouch: true });

const FULL = { heightCm: 178, weightKg: 75, goals: ['technique'] };

/** a quick sideways swipe of the finger on the content (the same events as a phone) */
async function swipe(page: Page, dx: number) {
  await page.evaluate((dx) => {
    const el = document.querySelector('.acc-panel') as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + 30;
    const t = (cx: number) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t(x)], changedTouches: [t(x)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(x + dx)], bubbles: true }));
  }, dx);
}

const selected = (page: Page) => page.locator('[data-testid="acc-tabs"] [aria-selected="true"]');

test('trois onglets, un seul groupe à la fois, le glissement change d’onglet dans les deux sens', async ({ page }) => {
  await seedProfile(page, FULL);
  await page.goto('/#/profil');
  await expect(page.getByTestId('acc-tabs').getByRole('tab')).toHaveText(['Moi', 'Ma pratique', 'Mon compte']);
  await expect(selected(page)).toHaveText('Moi');
  await expect(page.getByTestId('set-identite')).toBeVisible();
  await expect(page.getByTestId('set-garde')).toHaveCount(0);
  await swipe(page, -160);
  await expect(selected(page)).toHaveText('Ma pratique');
  await expect(page.getByTestId('set-garde')).toBeVisible();
  await expect(page.getByTestId('compte-goal')).toBeVisible();
  await swipe(page, -160);
  await expect(selected(page)).toHaveText('Mon compte');
  await expect(page.getByTestId('compte-premium')).toBeVisible();
  await expect(page.getByTestId('pf-total')).toBeVisible();
  // at the end of the row nothing happens (no wrap), then back to the right
  await swipe(page, -160);
  await expect(selected(page)).toHaveText('Mon compte');
  await swipe(page, 160);
  await expect(selected(page)).toHaveText('Ma pratique');
  // a short or vertical gesture is not a swipe
  await swipe(page, -30);
  await expect(selected(page)).toHaveText('Ma pratique');
  // the open tab is kept in the address (reload, Back from a page opened from it)
  await page.reload();
  await expect(selected(page)).toHaveText('Ma pratique');
});

test('rien n’est perdu : chaque ligne et chaque carte se trouve dans un onglet', async ({ page }) => {
  await seedProfile(page, FULL);
  await page.goto('/#/profil');
  for (const id of ['identite', 'corps', 'disciplines', 'garde', 'rythme', 'objectifs', 'limitations', 'favoris', 'compte']) {
    await openSetting(page, id);
    await expect(page.locator(`[data-set-item="${id}"] .set-body`), id).toBeVisible();
  }
  for (const id of ['compte-coach', 'compte-reglages', 'compte-coach-ia', 'compte-news']) await expect(page.getByTestId(id), id).toBeVisible();
});

test('un lien vers une ligne ouvre le bon onglet', async ({ page }) => {
  await seedProfile(page, FULL);
  await page.goto('/#/profil?ouvert=objectifs');
  await expect(selected(page)).toHaveText('Ma pratique');
  await expect(page.getByTestId('pf-goal-vitesse')).toBeVisible();
  await page.goto('/#/profil?ouvert=compte');
  await expect(selected(page)).toHaveText('Mon compte');
});

test('les onglets restent en haut quand on défile, à côté de la loupe', async ({ page }) => {
  await seedProfile(page, FULL);
  await page.goto('/#/profil?ouvert=corps');
  await expect(page.getByTestId('bmi-card')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 700));
  const tabs = page.locator('.acc-tabs');
  await expect(tabs).toHaveClass(/stuck/);
  const box = (await page.getByTestId('acc-tabs').boundingBox())!;
  expect(box.y).toBeLessThan(30);
  const loupe = page.locator('.nav-loupe').first();
  if (await loupe.count()) {
    const l = (await loupe.boundingBox())!;
    expect(box.x + box.width, 'les pastilles ne passent pas sous la loupe').toBeLessThanOrEqual(l.x + 1);
  }
});

test('accès rapides sur une seule rangée', async ({ page }) => {
  await seedProfile(page, FULL);
  await page.goto('/#/profil');
  const tops = await Promise.all(['compte-coach', 'compte-reglages', 'compte-coach-ia', 'compte-news'].map(async (id) => (await page.getByTestId(id).boundingBox())!.y));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
  for (const id of ['compte-coach', 'compte-news']) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(48);
});

test('point rouge sur ce qui reste à remplir, caché si la carte avait été fermée pour de bon', async ({ page }) => {
  await seedProfile(page, { heightCm: undefined, weightKg: undefined, goals: [] });
  await page.goto('/#/profil');
  await expect(page.getByTestId('acc-dot-moi')).toBeVisible();
  await expect(page.getByTestId('acc-dot-pratique')).toBeVisible();
  await expect(page.getByTestId('acc-dot-compte')).toHaveCount(0);
  await expect(page.getByTestId('compte-complete')).toHaveCount(0);
  await seedProfile(page, { heightCm: undefined, weightKg: undefined, goals: [] }, { profileCardHidden: true });
  await page.goto('/#/profil');
  await expect(page.getByTestId('acc-tabs')).toBeVisible();
  await expect(page.getByTestId('acc-dot-moi')).toHaveCount(0);
  await expect(page.getByTestId('acc-dot-pratique')).toHaveCount(0);
});
