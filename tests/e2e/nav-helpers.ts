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

/** opens « Plus » (1.0.0; formerly the Menu): the commands of the screen */
export async function openMenu(page: Page) {
  await bar(page).locator('[data-action="menu"]').click();
  await expect(page.getByTestId('nav-menu-sheet')).toBeVisible();
}

/** runs a command of « Sur cet écran » (the Menu closes first, then the command runs) */
export async function menuCommand(page: Page, testId: string) {
  await openMenu(page);
  await page.getByTestId(testId).click();
  await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
}

/** the Coach IA panel, opened from the Menu (the former bubble) */
export async function openCoachIA(page: Page) {
  // 1.0.0 (lot 3): « Rechercher ou demander au coach » on every screen; « Plus » during a session
  if ((await bar(page).getAttribute('data-screen')) === 'entrainement' || (await bar(page).getByTestId('app-search').count()) === 0) await menuCommand(page, 'cmd-coach-ia');
  else {
    await page.getByTestId('app-search').click();
    await page.getByTestId('search-ask').click();
  }
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
}

/** the five places: icon and word */
export async function barSlots(page: Page) {
  await expect(bar(page)).toBeVisible();
  return bar(page)
    .locator('button.nav-btn')
    .evaluateAll((bs) => bs.map((b) => [b.getAttribute('data-icon'), (b.querySelector('small')?.textContent ?? '').trim()]));
}
