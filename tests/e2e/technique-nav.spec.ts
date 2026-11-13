import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.25 (Youssef, 2026-10-20 12:30): « quand je rentre dans une technique, il faudrait que je puisse aller
 * à la technique d'après ou d'avant sans devoir sortir de l'écran ». The sheet follows the list the
 * user came from (discipline, category filter, « À revoir »), Back returns to that list.
 */
test.use({ hasTouch: true });

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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

const tiles = (page: Page) => page.locator('a.tech-card.tile');
const tileNames = async (page: Page) => (await tiles(page).locator('.title').allTextContents()).map((s) => s.trim());
const title = (page: Page) => page.getByRole('heading', { level: 1 });

/** a horizontal finger swipe starting on `sel` */
async function swipe(page: Page, sel: string, dx: number) {
  // in the middle of the screen, away from the bottom bar
  await page.locator(sel).first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
  const box = (await page.locator(sel).first().boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const y = box.y + Math.min(box.height / 2, 20);
  const x0 = dx < 0 ? box.x + box.width - 20 : box.x + 20;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / 10, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

test('fiche technique : précédente / suivante dans l’ordre du catalogue, Retour revient au catalogue', async ({ page }) => {
  await seed(page);
  await page.goto('/#/');
  await page.goto('/#/techniques?d=boxe');
  await expect(tiles(page).first()).toBeVisible();
  const names = await tileNames(page);
  expect(names.length).toBeGreaterThan(3);
  await tiles(page).first().click();
  await expect(title(page)).toHaveText(names[0]);
  await expect(page.getByTestId('technique-position')).toHaveText(`1 / ${names.length}`);
  await expect(page.getByTestId('technique-prev')).toBeDisabled();
  await expect(page.getByTestId('technique-next')).toHaveAttribute('aria-label', `Technique suivante : ${names[1]}`);

  await page.getByTestId('technique-next').click();
  await expect(title(page)).toHaveText(names[1]);
  await expect(page.getByTestId('technique-position')).toHaveText(`2 / ${names.length}`);
  await expect(page.getByTestId('technique-prev')).toHaveAttribute('aria-label', `Technique précédente : ${names[0]}`);
  await page.getByTestId('technique-next').click();
  await expect(title(page)).toHaveText(names[2]);
  await page.getByTestId('technique-prev').click();
  await expect(title(page)).toHaveText(names[1]);
  // the mastery switch and favourites are still there
  await expect(page.getByTestId('mastery-switch')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajouter aux favoris' })).toBeVisible();

  // swipe on the page body: left = next, right = previous
  await swipe(page, '[data-testid=technique-page] > p', -200);
  await expect(title(page)).toHaveText(names[2]);
  await swipe(page, '[data-testid=technique-page] > p', 200);
  await expect(title(page)).toHaveText(names[1]);
  // a drag on the 3D stage turns the coach, it never changes the technique
  await swipe(page, '.preview-stage', -200);
  await page.waitForTimeout(300);
  await expect(title(page)).toHaveText(names[1]);

  // Back: straight to the catalogue, not through each technique seen
  await page.goBack();
  await expect(page).toHaveURL(/#\/techniques\?d=boxe$/);
  await expect(tiles(page).first()).toBeVisible();
});

test('fiche technique : la liste filtrée (catégorie, « À revoir ») est suivie', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques?d=boxe');
  // a category of the catalogue: the tiles carry it to the sheet
  await expect(tiles(page).first()).toBeVisible();
  // the first category with at least two techniques
  const chips = page.getByRole('radiogroup', { name: 'Catégorie' }).getByRole('radio');
  let names: string[] = [];
  for (let i = 1; i < (await chips.count()) && names.length < 2; i++) {
    await chips.nth(i).click();
    // the checked chip and its tiles come in the same render
    await expect(chips.nth(i)).toHaveAttribute('aria-checked', 'true');
    names = await tileNames(page);
  }
  expect(names.length).toBeGreaterThan(1);
  await expect(page).toHaveURL(/cat=/);
  const cat = new URL(page.url().replace('#/', '')).searchParams.get('cat');
  expect(await tiles(page).first().getAttribute('href')).toContain(`&cat=${cat}`);
  await tiles(page).nth(1).click();
  await expect(title(page)).toHaveText(names[1]);
  await expect(page.getByTestId('technique-position')).toHaveText(`2 / ${names.length}`);
  await page.getByTestId('technique-prev').click();
  await expect(title(page)).toHaveText(names[0]);
  // Back finds the filtered catalogue again
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`cat=${cat}`));
  expect(await tileNames(page)).toEqual(names);

  // « À revoir »: two techniques marked, the sheet goes from one to the other only
  await page.goto('/#/techniques?d=boxe');
  await expect(tiles(page).first()).toBeVisible();
  const all = await tileNames(page);
  for (const i of [1, 3]) {
    await tiles(page).nth(i).click();
    await page.getByTestId('mastery-a-revoir').click();
    await expect(page.getByTestId('mastery-a-revoir')).toHaveAttribute('aria-pressed', 'true');
    await page.goBack();
  }
  await page.getByRole('radio', { name: 'À revoir (2)' }).click();
  await expect(page.getByRole('radio', { name: 'À revoir (2)' })).toHaveAttribute('aria-checked', 'true');
  expect(await tileNames(page)).toEqual([all[1], all[3]]);
  await tiles(page).first().click();
  await expect(page).toHaveURL(/cat=a-revoir/);
  await expect(page.getByTestId('technique-position')).toHaveText('1 / 2');
  await expect(page.getByTestId('technique-next')).toHaveAttribute('aria-label', `Technique suivante : ${all[3]}`);
  // marked « acquise » on the way: the sheet keeps its list, the next one is still reachable
  await page.getByTestId('mastery-acquise').click();
  await page.getByTestId('technique-next').click();
  await expect(title(page)).toHaveText(all[3]);
});
