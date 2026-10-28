import { expect, test, type Page } from '@playwright/test';
import { bar, openSetting, seedProfile } from './nav-helpers';

/**
 * 1.2.0 (Youssef, 2026-10-28: « lorsqu'on clique sur la tête en haut à droite, 2 onglets glissants : Mes infos &
 * Réglages avec tout le reste dans Réglages : une page avec toutes les options en liste bien présentées qui se
 * déploient quand on clique dessus », « pareil dans Mes infos », proposition B « Groupes Android »; « Aucune perte de
 * contenu », « n'oublie pas le mode jour/nuit »): every former block of Mes infos, Mon coach, Coach IA and Réglages
 * is a row of one of the two lists, reached by taps from the photo, and shows its content once opened.
 */

test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

const avatar = (page: Page) => bar(page).locator('.nav-avatar').click();

test('la photo ouvre deux onglets seulement : Mes infos et Réglages', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await avatar(page);
  await expect(page).toHaveURL(/#\/profil$/);
  await expect(page.getByTestId('tab-infos')).toBeVisible();
  await expect(page.getByTestId('tab-reglages')).toBeVisible();
  await expect(page.getByTestId('tab-coach')).toHaveCount(0);
  await expect(page.getByTestId('tab-coach-ia')).toHaveCount(0);
  await page.getByTestId('tab-reglages').click();
  await expect(page).toHaveURL(/#\/reglages$/);
  await expect(page.getByTestId('reglages-list')).toBeVisible();
});

test('Mes infos : chaque ligne se déploie et montre son contenu, une seule à la fois', async ({ page }) => {
  await seedProfile(page, { heightCm: 178, weightKg: 75 });
  await page.goto('/#/profil');
  await expect(page.getByTestId('infos-list')).toBeVisible();
  // closed rows show only their summary
  await expect(page.getByTestId('pseudo-input')).toHaveCount(0);
  const rows: [string, string][] = [
    ['identite', 'pseudo-input'],
    ['corps', 'bmi-card'],
    ['disciplines', 'pf-disc-boxe'],
    ['objectifs', 'pf-goal-coordination'],
    ['limitations', 'show-limitations'],
    ['activite', 'pf-total'],
  ];
  for (const [id, inside] of rows) {
    await openSetting(page, id);
    await expect(page.getByTestId(inside), `${id} → ${inside}`).toBeVisible();
    await expect(page.locator('.set-item[data-open="true"]'), id).toHaveCount(1);
  }
  for (const id of ['garde', 'rythme', 'favoris', 'compte']) {
    await openSetting(page, id);
    await expect(page.locator(`[data-set-item="${id}"] .set-body`), id).toBeVisible();
  }
});

test('Réglages : tout l’ancien contenu (Réglages, Mon coach, Coach IA, données) est dans la liste', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/reglages');
  await expect(page.getByTestId('reglages-premium')).toBeVisible();
  await expect(page.getByTestId('reglages-nouveautes')).toBeVisible();
  await openSetting(page, 'coach');
  for (const id of ['coach-homme', 'coach-femme', 'settings-coach-look']) await expect(page.getByTestId(id), id).toBeVisible();
  await openSetting(page, 'voix');
  await expect(page.getByRole('button', { name: 'Tester la voix' })).toBeVisible();
  await openSetting(page, 'rounds');
  await expect(page.getByText('Durée du round')).toBeVisible();
  await openSetting(page, 'coach-ia');
  await expect(page.getByText('M’appeler par mon pseudo')).toBeVisible();
  await expect(page.getByText('Longueur des réponses')).toBeVisible();
  await expect(page.getByTestId('reglages-coach-ia-history')).toBeVisible();
  await openSetting(page, 'questionnaire');
  await expect(page.getByTestId('reglages-questionnaire')).toBeVisible();
  await openSetting(page, 'apparence');
  for (const n of ['Nuit', 'Jour', 'Auto', 'Normale', 'Grande']) await expect(page.getByRole('radio', { name: n, exact: true }), n).toBeVisible();
  await expect(page.getByText('Réduire les animations')).toBeVisible();
  await openSetting(page, 'affichage');
  await expect(page.getByTestId('settings-camera')).toBeAttached();
  await expect(page.getByTestId('diag3d')).toBeVisible();
  await openSetting(page, 'donnees');
  for (const id of ['export-my-data', 'delete-my-data']) await expect(page.getByTestId(id), id).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importer' })).toBeVisible();
  await openSetting(page, 'a-propos');
  await expect(page.locator('.settings-version')).toBeVisible();
  // the history of the Coach IA keeps its page
  await openSetting(page, 'coach-ia');
  await page.getByTestId('reglages-coach-ia-history').click();
  await expect(page).toHaveURL(/#\/coach-ia$/);
});

test('Retour Android referme d’abord la ligne ouverte, puis quitte la page', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await avatar(page);
  await page.getByTestId('tab-reglages').click();
  await expect(page).toHaveURL(/#\/reglages$/);
  await openSetting(page, 'voix');
  await openSetting(page, 'rounds');
  await page.goBack();
  await expect(page.getByTestId('set-rounds')).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#\/reglages$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/#\/reglages$/);
});

test('une ancienne adresse (/reglages/voix) ouvre la liste sur sa ligne', async ({ page }) => {
  await seedProfile(page);
  for (const id of ['voix', 'rounds', 'affichage', 'donnees', 'coach']) {
    await page.goto(`/#/reglages/${id}`);
    await expect(page.getByTestId(`set-${id}`), id).toHaveAttribute('aria-expanded', 'true');
  }
});

test('mode jour et mode nuit : les deux listes restent lisibles', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/reglages');
  await openSetting(page, 'apparence');
  for (const [label, theme] of [
    ['Jour', 'light'],
    ['Nuit', 'dark'],
  ] as const) {
    await page.getByRole('radio', { name: label, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const path of ['/reglages', '/profil']) {
      await page.goto(`/#${path}`);
      const row = page.locator('.set-row').first();
      await expect(row).toBeVisible();
      // the text of a row and its block are not the same colour
      const [fg, bg] = await row.evaluate((e) => [getComputedStyle(e.querySelector('b')!).color, getComputedStyle(e.closest('.set-card')!).backgroundColor]);
      expect(fg, `${label} ${path}`).not.toBe(bg);
    }
    await page.goto('/#/reglages');
    await openSetting(page, 'apparence');
  }
});
