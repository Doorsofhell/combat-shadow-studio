import { expect, Page } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * v0.32 navigation (PROMPT MAÎTRE, Youssef 2026-10-22): the one bottom bar and the « Navigation générale » sheet.
 * What used to be in the action pill or the Coach IA bubble is now a bar place or a command of the Menu
 * (« Sur cet écran »); these helpers reach them the way a person does.
 */
export async function seedProfile(page: Page, extra: Record<string, unknown> = {}, settings?: Record<string, unknown>) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, settings }) => {
      const put = (k: string, v: unknown) =>
        new Promise<void>((res, rej) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify(v), k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          };
        });
      await put('u:local:css-profile', { state: { profile }, version: 0 });
      // 0.49: the settings are a device key (src/store/storage.ts DEVICE_KEYS), not a user key
      if (settings) await put('css-settings', { state: { settings }, version: 2 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'], ...extra }, settings: settings ?? null },
  );
  await page.goto('about:blank');
}

export const bar = (page: Page) => page.getByTestId('bottom-bar');

/** opens « Plus » (1.0.0; formerly the Menu), 1.1.0: the ⋮ at the top right out of the session: the commands of the screen */
export async function openMenu(page: Page) {
  // 1.0.0 (lot 4): a running session is hands-free, « Plus » comes back with the pause
  if ((await bar(page).getAttribute('data-screen')) === 'entrainement' && (await page.getByTestId('pause').isVisible())) await page.getByTestId('pause').click();
  await bar(page).locator('[data-action="menu"]').click();
  await expect(page.getByTestId('nav-menu-sheet')).toBeVisible();
}

/** runs a command of « Sur cet écran » (the Menu closes first, then the command runs) */
export async function menuCommand(page: Page, testId: string) {
  await openMenu(page);
  await page.getByTestId(testId).click();
  await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
}

/** the Coach IA panel, opened from the search (the former bubble) */
export async function openCoachIA(page: Page) {
  // 1.1.0 (loupe A): « Rechercher » is a place of the bar; in the session and the chronometer it is in « Plus »
  await expect(bar(page)).toBeVisible();
  if ((await bar(page).getByTestId('app-search').count()) === 0) await menuCommand(page, 'cmd-search');
  else await page.getByTestId('app-search').click();
  await page.getByTestId('search-ask').click();
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
}

/** an action of the screen by its action id (or `#testid`) */
const sel = (key: string) => (key.startsWith('#') ? `[data-testid="${key.slice(1)}"]` : `[data-action="${key}"]`);

/**
 * 1.1.0 (proposition A « Android »): an action of the screen is in the row (session, chronometer, the big button)
 * or in the ⋮ menu at the top right; this taps it wherever it is, like a person does
 */
export async function tapAction(page: Page, key: string) {
  const inBar = bar(page).locator(sel(key));
  if ((await inBar.count()) > 0 && (await inBar.first().isVisible())) return inBar.first().click();
  await openMenu(page);
  await page.getByTestId('nav-menu-sheet').locator(sel(key)).click();
  await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
}

/** opens the ⋮ menu and gives the item of an action (close it with closeMenu) */
export async function menuItem(page: Page, key: string) {
  await openMenu(page);
  return page.getByTestId('nav-menu-sheet').locator(sel(key));
}

export async function closeMenu(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
}

/** whether a toggle of the ⋮ menu is on (menuitemcheckbox) */
export async function expectChecked(page: Page, key: string, on: boolean) {
  const it = await menuItem(page, key);
  await expect(it).toHaveAttribute('aria-checked', String(on));
  await closeMenu(page);
}

/** the five places: icon and word */
export async function barSlots(page: Page) {
  await expect(bar(page)).toBeVisible();
  return bar(page)
    .locator('button.nav-btn')
    .evaluateAll((bs) => bs.map((b) => [b.getAttribute('data-icon'), (b.querySelector('small')?.textContent ?? '').trim()]));
}

/**
 * 1.2.0 (Youssef, 2026-10-28, proposition B « Groupes Android »): Mes infos and Réglages are lists whose rows open in
 * place; opens the row `id` (testid set-<id>) the way a person does, unless it is already open
 */
export async function openSetting(page: Page, id: string) {
  const row = page.getByTestId(`set-${id}`);
  await row.scrollIntoViewIfNeeded();
  if ((await row.getAttribute('aria-expanded')) !== 'true') await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
}
