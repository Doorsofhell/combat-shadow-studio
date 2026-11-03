import { expect, Page, test } from '@playwright/test';

async function onboard(page: Page, coach: 'homme' | 'femme') {
  await page.goto('/');
  await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
  await page.getByTestId('next').click();
  // coach choice is mandatory, nothing is preselected
  await expect(page.getByTestId('next')).toBeDisabled();
  await page.getByTestId(`coach-${coach}`).click();
  await expect(page.getByTestId('next')).toBeEnabled();
  await page.getByTestId('next').click();
  // guard, discipline, level, goals (0.24: the "Apparence" step is gone, the coach is Kadir or Amara)
  for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('home-cta')).toBeVisible();
}

test('premier lancement : questionnaire, choix obligatoire du coach, données conservées', async ({ page }) => {
  await onboard(page, 'femme');
  await page.reload();
  await expect(page.getByTestId('home-cta')).toBeVisible();
  // 0.24: the coach chosen is Amara (stored choice 'femme')
  await expect(page.getByTestId('fighter-name')).toHaveText('Amara');
  // bottom navigation (1.0.0 refonte ergonomique): five fixed places, the actions of the screen above them, « Plus »
  await expect(page.getByTestId('bottom-bar').locator('.nav-tab')).toHaveCount(5);
  // 1.1.0 (loupe A): « Rechercher » is the fifth place, the profile is the photo at the top right
  await expect(page.getByTestId('bottom-bar').locator('.nav-tab').nth(4)).toHaveAttribute('data-testid', 'app-search');
  await expect(page.getByTestId('nav-profil')).toBeVisible();
  await page.getByTestId('nav-entrainer').click();
  // 0.33: the disciplines are the second space of Entraîner
  await page.getByTestId('space-disciplines').click();
  await expect(page.getByTestId('disc-boxe')).toBeVisible();
});

test('entraînement : démarrage, pause qui arrête le chronomètre, reprise, statistiques', async ({ page }) => {
  await onboard(page, 'homme');
  await page.getByTestId('nav-entrainer').click();
  await page.getByTestId('space-disciplines').click();
  await page.getByTestId('disc-boxe').click();
  await page.getByTestId('ex-boxe-debutant-08').click();
  await page.getByTestId('go-training').click();
  await expect(page.getByTestId('exercise-name')).toContainText('Jab');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText('Libre', { timeout: 15_000 });
  await expect(page.getByTestId('current-move')).not.toHaveText('Garde', { timeout: 15_000 });
  await page.waitForTimeout(3000);
  await page.getByTestId('pause').click();
  const t1 = await page.getByTestId('session-time').textContent();
  await page.waitForTimeout(2500);
  expect(await page.getByTestId('session-time').textContent()).toBe(t1);
  expect(t1).not.toBe('0:00');
  await page.getByTestId('resume').click();
  await page.waitForTimeout(2200);
  expect(await page.getByTestId('session-time').textContent()).not.toBe(t1);
  await page.getByTestId('pause').click();
  await page.goto('/#/stats');
  await expect(page.getByTestId('total-time')).not.toHaveText('0 s');
});

test('créateur : un enchaînement impossible est bloqué, un enchaînement valide se lance', async ({ page }) => {
  await onboard(page, 'homme');
  // 0.38 (Créateur V2): the editor of a new sequence, moves added from the picker of pictograms
  await page.goto('/#/createur/nouveau?d=mma');
  await page.getByTestId('add-move').click();
  await page.getByTestId('add-jab').click();
  await page.getByTestId('add-releve-technique').click();
  await page.getByTestId('picker-done').click();
  await expect(page.getByTestId('run-custom')).toBeDisabled();
  await page.getByRole('button', { name: /Retirer Relevé/ }).click();
  await page.getByTestId('add-move').click();
  await page.getByTestId('add-descente-sol').click();
  await page.getByTestId('add-releve-technique').click();
  await page.getByTestId('picker-done').click();
  await expect(page.getByTestId('run-custom')).toBeEnabled();
  await page.getByTestId('run-custom').click();
  await expect(page.getByTestId('exercise-name')).toBeVisible();
});

test('programme : les blocs s’enchaînent avec leurs rounds', async ({ page }) => {
  await onboard(page, 'femme');
  await page.goto('/#/programmes/boxe-initiation-4-semaines');
  await page.getByTestId('start-program').click();
  await expect(page.getByTestId('exercise-name')).toContainText('Échauffement');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText(/Round 1\/2/, { timeout: 15_000 });
});

test('réglages et confidentialité accessibles depuis l’accueil', async ({ page }) => {
  await onboard(page, 'homme');
  // 1.0.0 (refonte ergonomique): Profil › Réglages (formerly Menu › Paramètres)
  await page.getByTestId('nav-profil').click();
  await page.getByTestId('tab-reglages').click();
  await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();
  // 1.2.0: Réglages › Données et confidentialité
  await page.getByTestId('set-donnees').click();
  await page.getByRole('link', { name: /Politique de confidentialité/ }).click();
  await expect(page.getByText('Tout reste sur ton appareil.')).toBeVisible();
});

test('images : les cartes de techniques, exercices, programmes et champions montrent le coach choisi', async ({ page }) => {
  await onboard(page, 'femme');
  // every picture on a screen is really loaded, and it shows the coach the user chose
  const checkImages = async (min = 6) => {
    const imgs = page.locator('.tech-thumb img');
    await expect.poll(async () => imgs.count()).toBeGreaterThanOrEqual(min);
    // the lists may re-render while loading: read the pictures again on every poll
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('.tech-thumb img')].slice(0, 6).map((e) => {
            e.scrollIntoView({ block: 'center' });
            return `${/thumbs\/femme\//.test(e.src)}:${e.complete && e.naturalWidth > 0}`;
          }),
        ),
      )
      .toEqual(Array(6).fill('true:true'));
  };
  await page.goto('/#/techniques');
  await checkImages();
  await page.goto('/#/discipline/boxe');
  await checkImages();
  await page.goto('/#/programmes');
  await checkImages();
  await page.goto('/#/champions');
  await page.getByRole('tab', { name: 'Explorer' }).click().catch(() => {});
  await checkImages();
});
