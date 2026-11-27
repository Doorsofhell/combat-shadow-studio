import { expect, test, type Page } from '@playwright/test';
import { seedProfile, showCoachTools } from './nav-helpers';

/**
 * 2.7 (Youssef, 2026-11-24: « c'est compliqué de choisir le coach et de le visualiser, je veux que ça soit plus
 * simple », option A « Un seul sélecteur, partout »). Before: four places, three presentations (names only, folded in
 * « Options avancées »; the former picker in Réglages and Bienvenue; a strip without names). Now one row of faces and
 * names (CoachRow), reached in one touch from the home.
 */
test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

const IDS = ['mma-kadir', 'nael', 'victor', 'mma-amara', 'inaya', 'kanya'];
const NAMES = ['Kadir', 'Naël', 'Victor', 'Amara', 'Inaya', 'Kanya'];

async function faceShown(page: Page, sel: string) {
  // the face of the card is drawn: its portrait is loaded and fills more than the card
  return page.locator(sel).evaluateAll((els) =>
    els.map((e) => {
      const img = e.querySelector('.crow-face img') as HTMLImageElement | null;
      const box = e.querySelector('.crow-face')!.getBoundingClientRect();
      return { ok: !!img && img.complete && img.naturalWidth > 0, w: box.width, h: box.height, name: (e.querySelector('.crow-name') as HTMLElement | null)?.innerText ?? '' };
    }),
  );
}

// 2.8.1 (Youssef, 2026-11-24 17:49): « Changer » of the home opens the big coach screen directly
test('Accueil : « Changer » ouvre directement le grand écran du coach ; le choix revient sur l’Accueil', async ({ page }) => {
  await seedProfile(page, { coach: 'homme', champion: 'mma-kadir' }, { stageFsHintSeen: true });
  await page.goto('/');
  await expect(page.getByTestId('fighter-name')).toHaveText('Kadir');
  const change = page.getByTestId('home-change-coach');
  await expect(change).toBeVisible();
  await expect(change).toHaveAccessibleName('Changer de coach (Kadir)');
  await change.click();
  await expect(page).toHaveURL(/#\/coach$/);
  await expect(page.getByTestId('coach-panel')).toHaveCount(0);
  await expect(page.locator('.star-thumb')).toHaveCount(6);
  await expect(page.getByTestId('coach-homme')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('coach-inaya').click();
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Inaya');
  await expect(page.getByTestId('home-change-coach')).toHaveAccessibleName('Changer de coach (Inaya)');
});

// 2.7 (option A): the coach's panel of the home (a tap on the coach) shows « Ton coach » first, six faces with their name
test('Accueil : le panneau du coach montre « Ton coach », six visages avec leur nom, le coach change aussitôt', async ({ page }) => {
  await seedProfile(page, { coach: 'homme', champion: 'mma-kadir' }, { stageFsHintSeen: true });
  await page.goto('/');
  await expect(page.getByTestId('fighter-name')).toHaveText('Kadir');
  // (2.8.1: « Changer » now opens the big screen; the panel is opened by a tap on the coach)
  await showCoachTools(page);
  const sec = page.getByTestId('cp-coach');
  await expect(sec).toBeVisible();
  // not folded: « Options avancées » stays closed and no longer holds the coach
  await expect(page.getByTestId('cp-advanced')).toHaveAttribute('aria-expanded', 'false');
  // first section of the panel on the home
  const first = await page.locator('.cpn-body > .cpn-sec').first().getAttribute('data-section');
  expect(first).toBe('coach');
  for (const id of IDS) await expect(page.getByTestId(`cp-coach-${id}`)).toBeVisible();
  const cards = await faceShown(page, '[data-testid=cp-coach] .crow-card');
  expect(cards.map((c) => c.name)).toEqual(NAMES);
  for (const c of cards) {
    expect(c.ok).toBe(true);
    // a face big enough to tell the coaches apart (the former panel had none)
    expect(c.w).toBeGreaterThanOrEqual(44);
    expect(c.h).toBeGreaterThan(c.w);
  }
  await expect(page.getByTestId('cp-coach-mma-kadir')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('cp-coach-inaya').click();
  await expect(page.getByTestId('cp-coach-inaya')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cp-coach-mma-kadir')).toHaveAttribute('aria-checked', 'false');
  // the panel stays open, the coach behind it is already the new one
  await expect(page.getByTestId('coach-panel')).toBeVisible();
  await expect(page.getByTestId('fighter-name')).toHaveText('Inaya');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-panel')).toHaveCount(0);
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Inaya');
  await expect(page.getByTestId('home-change-coach')).toHaveAccessibleName('Changer de coach (Inaya)');
});

test('Accueil : un toucher sur le coach ouvre toujours le panneau, avec « Ton coach »', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/');
  await expect(async () => {
    if (!(await page.getByTestId('coach-panel').isVisible())) await page.getByTestId('coach-ui-toggle').dispatchEvent('click');
    await expect(page.getByTestId('coach-panel')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByTestId('cp-coach')).toBeVisible();
});

test('Fiche : « Ton coach » est visible avant les options avancées, sans les déplier', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/techniques/jab?d=boxe');
  await expect(page.getByTestId('technique-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  await expect(async () => {
    if (!(await page.getByTestId('coach-panel').isVisible())) await page.getByTestId('coach-ui-toggle').dispatchEvent('click');
    await expect(page.getByTestId('coach-panel')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 30_000 });
  const order = await page.locator('.cpn-body > .cpn-sec').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')));
  // learning and camera stay on top on the sheet; the coach comes right before the advanced options
  expect(order.indexOf('coach')).toBeGreaterThan(order.indexOf('camera'));
  expect(order.indexOf('coach')).toBe(order.indexOf('advanced') - 1);
  await page.getByTestId('cp-advanced').click();
  await expect(page.getByTestId('cp-advanced-body').getByRole('radio', { name: /Kadir|Amara/ })).toHaveCount(0);
});

test('Réglages › Mon coach et premier lancement : la même rangée de visages et de noms', async ({ page }) => {
  await seedProfile(page, { coach: 'homme', champion: 'mma-kadir' }, { stageFsHintSeen: true });
  await page.goto('/#/reglages/coach');
  const row = page.locator('.coach-sel .crow-card');
  await expect(row).toHaveCount(6);
  expect((await faceShown(page, '.coach-sel .crow-card')).map((c) => c.name)).toEqual(NAMES);
  // the former big portrait and the bars are gone, the real facts stay
  await expect(page.locator('.coach-sheet > img, .coach-sheet .bar')).toHaveCount(0);
  await expect(page.getByTestId('coach-details-mma-kadir')).toContainText('91 kg');
  await page.getByTestId('coach-nael').click();
  await expect(page.getByTestId('coach-nael')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('coach-details-nael')).toContainText('Le Faucon');

  // first launch
  await page.evaluate(() => indexedDB.deleteDatabase('keyval-store'));
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.locator('.coach-sel .crow-card')).toHaveCount(6);
  await expect(page.getByTestId('coach-details-none')).toBeVisible();
});

test('Écran Coach : chaque vignette porte le nom du coach', async ({ page }) => {
  await seedProfile(page, { coach: 'homme', champion: 'mma-kadir' }, { stageFsHintSeen: true });
  await page.goto('/#/coach');
  await expect(page.locator('.star-thumb')).toHaveCount(6);
  expect(await page.locator('.star-thumb .star-thumb-name').allInnerTexts()).toEqual(NAMES);
});
