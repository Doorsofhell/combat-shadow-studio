import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { menuCommand } from './nav-helpers';

/**
 * Coach render: one look only, Ultra-réaliste (the drawn looks are gone since 1.9). 1.37 (Youssef, 2026-11-12: « ne
 * garder que les coachs ultra-réalistes »): no render version either (« Précédente (secours) » removed), no fighter
 * creator (/combattant), and the older saved settings open without these fields. The 1.36 version of this file, with
 * the studio framing test of the creator, is kept in « backup CS/v1.37-ultra-realiste/tests/e2e/ ».
 */
async function seed(page: Page, settings?: Record<string, unknown>) {
  await page.goto('/icons/icon.svg');
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
      if (settings) for (const k of ['css-settings', 'u:local:css-settings']) await put(k, { state: { settings }, version: 1 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme' }, settings: settings ?? null },
  );
}

async function open(page: Page, path: string) {
  await page.goto('about:blank');
  await page.goto(path);
}

const savedSettings = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<Record<string, unknown>>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          // the settings belong to the device (not to a user scope)
          const st = r.result.transaction('keyval').objectStore('keyval');
          const q = st.get('css-settings');
          q.onsuccess = () => {
            if (q.result) return res(JSON.parse(q.result).state.settings);
            const q2 = st.get('u:local:css-settings');
            q2.onsuccess = () => res(q2.result ? JSON.parse(q2.result).state.settings : {});
          };
        };
      }),
  );

test('1.37 : aucun choix de style ni de version de rendu, plus d’écran « Mon combattant »', async ({ page }) => {
  await seed(page);
  await open(page, '/#/reglages/coach');
  await expect(page.getByText('Ton coach montre chaque mouvement')).toBeVisible();
  await expect(page.getByText('Rendu des combattants')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Anime' })).toHaveCount(0);
  await expect(page.getByText(/Ultra-réaliste/).first()).toBeVisible();

  await open(page, '/#/reglages/affichage');
  await expect(page.getByText('Lumière du coach').first()).toBeVisible();
  await expect(page.getByText('Version du rendu 3D')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: /Précédente/ })).toHaveCount(0);

  // the hidden creator route is gone: the app goes back home
  await open(page, '/#/combattant');
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByTestId('editor-panel')).toHaveCount(0);

  await open(page, '/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await menuCommand(page, 'options');
  await expect(page.getByRole('dialog', { name: 'Options d’entraînement' })).toBeVisible();
  await expect(page.getByTestId('training-coach-look')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Anime' })).toHaveCount(0);
});

// the values the older versions really saved: the drawn looks and the « Précédente » render
for (const [style, render] of [
  ['encre', 'premium'],
  ['manga', 'premium'],
  ['realiste', 'precedent'],
])
  test(`1.37 : un appareil qui avait enregistré ${style} / ${render} ouvre le coach ultra-réaliste, autres réglages gardés`, async ({ page }) => {
    await seed(page, { coachStyle: style, coachRender: render, voice: false });
    await open(page, '/#/');
    await expect(page.getByTestId('fighter-name')).toHaveText('Kadir');
    await open(page, '/#/reglages/coach');
    await expect(page.getByText(/Ultra-réaliste/).first()).toBeVisible();
    await expect.poll(async () => 'coachStyle' in (await savedSettings(page))).toBe(false);
    const s = await savedSettings(page);
    expect('coachRender' in s).toBe(false);
    expect(s.voice).toBe(false);
  });
