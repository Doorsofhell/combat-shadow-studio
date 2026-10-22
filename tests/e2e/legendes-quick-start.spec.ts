import { expect, Locator, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.25 (Youssef, 2026-10-20 12:32): « dans légende, il faut que le mode entraînement soit accessible facilement,
 * là je dois pas mal défiler vers le bas pour le lancer ». The start button sits in the first screen, without scrolling,
 * on the list, on a sheet and on a champion's page, and one tap reaches the training screen with that sheet.
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

/** fully inside the first screen: below the top edge and above the bottom navigation, with nothing scrolled */
async function expectInFirstScreen(page: Page, el: Locator) {
  await expect(el).toBeVisible();
  const box = (await el.boundingBox())!;
  const r = await page.evaluate(() => ({
    navTop: document.querySelector('.nav')!.getBoundingClientRect().top,
    scrolled: Math.max(window.scrollY, ...[...document.querySelectorAll('*')].map((e) => e.scrollTop)),
  }));
  expect(r.scrolled).toBe(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(r.navTop);
  return box;
}

const COMBO = 'kickboxing-hari-0001';
const COMBO_NAME = 'Poings puis pied : jab \u2013 low kick arrière';

for (const vp of [
  { width: 360, height: 640 },
  { width: 393, height: 851 },
]) {
  test.describe(`${vp.width}×${vp.height}`, () => {
    test.use({ viewport: vp });

    test('liste Légendes : « S’entraîner » visible sans défiler, un appui lance le combo du jour', async ({ page }) => {
      await seed(page);
      await page.goto('/#/champions');
      const start = page.getByTestId('cat-quick-train');
      await expectInFirstScreen(page, start);
      const name = (await page.getByTestId('cat-quick-sheet').textContent())!.trim();
      const href = await page.getByTestId('cat-quick-sheet').getAttribute('href');
      const id = href!.split('/').pop()!;
      await start.click();
      await expect(page).toHaveURL(new RegExp(`#/entrainement\\?cat=${id}&mode=libre`));
      await expect(page.getByTestId('exercise-name')).toContainText(name);
    });

    test('fiche : « S’entraîner » visible sans défiler, le mode se change sur place', async ({ page }) => {
      await seed(page);
      await page.goto(`/#/champions/${COMBO}`);
      await expectInFirstScreen(page, page.getByTestId('cat-train'));
      // every mode is still there, one tap away
      await page.getByTestId('cat-mode-toggle').click();
      for (const m of ['libre', 'technique', 'cardio', 'rounds']) await expect(page.getByTestId(`cat-mode-${m}`)).toBeVisible();
      await page.getByTestId('cat-mode-cardio').click();
      await page.getByTestId('cat-train').click();
      await expect(page).toHaveURL(new RegExp(`#/entrainement\\?cat=${COMBO}&mode=cardio`));
      await expect(page.getByTestId('exercise-name')).toContainText(COMBO_NAME);
    });

    test('page d’un champion : « S’entraîner » visible sans défiler', async ({ page }) => {
      await seed(page);
      await page.goto('/#/champions/c/hari');
      await expectInFirstScreen(page, page.getByTestId('champ-quick-train'));
      await page.getByTestId('champ-quick-train').click();
      await expect(page).toHaveURL(/#\/entrainement\?cat=kickboxing-hari-\d+&mode=libre/);
      await expect(page.getByTestId('exercise-name')).toBeVisible();
    });
  });
}

// 0.26 (Youssef's choice of the action pill, mockup C, 2026-10-20 17:45): the sticky « S'entraîner » bar of 0.25 is
// replaced by the pill's « S'entraîner ». v0.32 (navigation, 2026-10-22): it is place 2 of the bottom bar. What this
// test guards is kept: while scrolling a long sheet, « S'entraîner » stays on screen, nothing covers it, and it
// launches the sheet in its chosen mode.
test('fiche longue : « S’entraîner » (barre du bas) reste à portée en défilant', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await seed(page);
  await page.goto(`/#/champions/${COMBO}`);
  await expect(page.getByTestId('cat-train')).toBeVisible();
  await expect(page.getByTestId('cat-train-bar')).toHaveCount(0);
  await page.getByText('Garder cette fiche').scrollIntoViewIfNeeded();
  const bar = page.getByTestId('bottom-bar').locator('[data-action="train"]');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('data-slot', '2');
  const box = (await bar.boundingBox())!;
  // the top element at its centre is the button itself
  const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('data-action'), [box.x + box.width / 2, box.y + box.height / 2]);
  expect(top).toBe('train');
  expect(box.y + box.height).toBeLessThanOrEqual(851);
  await bar.click();
  await expect(page).toHaveURL(new RegExp(`#/entrainement\\?cat=${COMBO}&mode=libre`));
});

test('chaque ligne de fiche a son bouton lecture qui lance l’entraînement', async ({ page }) => {
  await seed(page);
  await page.goto('/#/champions/c/hari');
  const play = page.getByTestId(`cat-play-${COMBO}`);
  await play.scrollIntoViewIfNeeded();
  await play.click();
  await expect(page).toHaveURL(new RegExp(`#/entrainement\\?cat=${COMBO}&mode=libre`));
  await expect(page.getByTestId('exercise-name')).toContainText(COMBO_NAME);
});
