import { expect, test, type Page } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// v0.49 (Youssef, 2026-10-27: « on améliore le moteur de Shadow avec tout ce qu'il est bon de prendre dans CME »):
// the light of the CME-3D lab as an option of the realistic coaches. 1.0.0 (Youssef, 2026-10-27 19:55 « Lumière
// vive OK »): Vive is the default; a saved choice is kept.

const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const q = r.result.transaction('keyval').objectStore('keyval').get('css-settings');
          q.onsuccess = () => res(String(q.result ?? ''));
        };
      }),
  );

test('Réglages > Affichage : « Lumière du coach » Vive par défaut (fond sombre à l’entraînement), Studio choisi gardé au rechargement', async ({ page }) => {
  test.setTimeout(90_000);
  await seedProfile(page);
  await page.goto('/#/reglages/affichage');
  const light = page.getByRole('radiogroup', { name: 'Lumière du coach' });
  await expect(light.getByRole('radio', { name: 'Vive (fond sombre)' })).toHaveAttribute('aria-checked', 'true');
  // the default Vive: a dark background under the coach during training
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  const stage = page.locator('canvas').first().locator('xpath=../..');
  await expect(stage).toHaveCSS('background-color', 'rgb(29, 39, 51)', { timeout: 20_000 });
  // Studio
  await page.goto('/#/reglages/affichage');
  await light.getByRole('radio', { name: 'Studio' }).click();
  await expect(light.getByRole('radio', { name: 'Studio' })).toHaveAttribute('aria-checked', 'true');
  // the choice is written to IndexedDB asynchronously: reload once it is stored (an immediate reload could cut the
  // write, 1 run in 3 on this machine)
  await expect.poll(() => stored(page)).toContain('"coachLight":"studio"');
  await page.reload();
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' }).getByRole('radio', { name: 'Studio' })).toHaveAttribute('aria-checked', 'true');
  // the studio: the training stage shows the theme behind the coach
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  await expect(page.locator('canvas').first().locator('xpath=../..')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: 20_000 });
});

test('préférences existantes : Studio enregistré reste Studio ; une sauvegarde d’avant 0.49 passe en Vive', async ({ page }) => {
  await seedProfile(page, {}, { coachStyle: 'realiste', coachRender: 'premium', coachLight: 'studio' });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' }).getByRole('radio', { name: 'Studio' })).toHaveAttribute('aria-checked', 'true');
  await page.goto('about:blank');
  await seedProfile(page, {}, { coachStyle: 'realiste', coachRender: 'premium' });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' }).getByRole('radio', { name: 'Vive (fond sombre)' })).toHaveAttribute('aria-checked', 'true');
});

test('le rendu Anime n’a pas d’option de lumière (son ombrage dessine les formes)', async ({ page }) => {
  await seedProfile(page, {}, { coachStyle: 'encre' });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' })).toHaveCount(0);
});
