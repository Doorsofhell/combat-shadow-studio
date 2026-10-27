import { expect, test } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// v0.49 (Youssef, 2026-10-27: « on améliore le moteur de Shadow avec tout ce qu'il est bon de prendre dans CME »):
// the light of the CME-3D lab as an option of the realistic coaches, the studio light staying the default.

test('Réglages > Affichage : « Lumière du coach » Studio par défaut, Vive met un fond sombre sous le coach à l’entraînement, gardé au rechargement', async ({ page }) => {
  test.setTimeout(90_000);
  await seedProfile(page);
  await page.goto('/#/reglages/affichage');
  const light = page.getByRole('radiogroup', { name: 'Lumière du coach' });
  await expect(light.getByRole('radio', { name: 'Studio' })).toHaveAttribute('aria-checked', 'true');
  // the default studio: the training stage shows the theme behind the coach
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  const stage = page.locator('canvas').first().locator('xpath=../..');
  await expect(stage).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)', { timeout: 20_000 });
  // Vive
  await page.goto('/#/reglages/affichage');
  await light.getByRole('radio', { name: 'Vive (fond sombre)' }).click();
  await expect(light.getByRole('radio', { name: 'Vive (fond sombre)' })).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' }).getByRole('radio', { name: 'Vive (fond sombre)' })).toHaveAttribute('aria-checked', 'true');
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  await expect(page.locator('canvas').first().locator('xpath=../..')).toHaveCSS('background-color', 'rgb(29, 39, 51)', { timeout: 20_000 });
});

test('le rendu Anime n’a pas d’option de lumière (son ombrage dessine les formes)', async ({ page }) => {
  await seedProfile(page, {}, { coachStyle: 'encre' });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByRole('radiogroup', { name: 'Lumière du coach' })).toHaveCount(0);
});
