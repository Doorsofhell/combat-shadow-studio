import { expect, test, type Page } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.0.0 (refonte ergonomique, lot 5): the control promised in the validated plan (« Où va chaque contenu », Youssef,
 * 2026-10-27: « Aucune perte de contenu »): every line of the table, a screen or a block of v0.47–0.49, is found at
 * its new place, reached by taps from the bottom bar (never by typing an address), and shows its content.
 */

test.use({ viewport: { width: 393, height: 851 } });
// long journeys through the whole app (the 3D coach loads on several screens)
test.describe.configure({ timeout: 300_000 });

const tab = (page: Page, id: string) => page.getByTestId(`tab-${id}`).click();
const PLACE: Record<string, string> = { accueil: 'accueil', entrainer: 'entrainer', techniques: 'apprendre', stats: 'progres', profil: 'profil' };
/** one of the five places of the bar (by its place, not its test id: a screen action may share it) */
const place = (page: Page, id: string) => bar(page).locator(`.nav-tab[data-tab="${PLACE[id]}"]`).click();

test('plan, lignes 1 à 7 : l’ancien accueil (Reprendre, raccourcis, objectif, progression, Pour toi, favoris, légendes, programmes)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  // Reprendre: the big button of the home, and the « Reprendre » card with the discipline
  await expect(bar(page).getByTestId('home-cta')).toBeVisible();
  await expect(page.getByTestId('resume-last')).toBeVisible();
  // Séance rapide, Technique du jour (and Chrono seul): the shortcuts; Programme recommandé and Pour toi: under them
  for (const id of ['tile-quick', 'tile-daily', 'tile-chrono', 'home-prog', 'home-foryou']) await expect(page.getByTestId(id), id).toBeVisible();
  // Objectif de la semaine: on the home, its detail in Progrès > Objectifs
  await page.getByTestId('home-goal').click();
  await expect(page).toHaveURL(/#\/objectifs$/);
  // Ta progression (séances, temps cumulé): Progrès > Tableau
  await place(page, 'stats');
  for (const id of ['kpi-sessions', 'total-time']) await expect(page.getByTestId(id), id).toBeVisible();
  // Favoris, Combinaisons favorites: Entraîner > Favoris
  await place(page, 'entrainer');
  await tab(page, 'favoris');
  await expect(page.getByTestId('favorites-page')).toBeVisible();
  await expect(page.getByTestId('legends-favorites')).toBeVisible();
  // Légendes: Apprendre > Légendes; Programmes: Entraîner > Programmes
  await place(page, 'techniques');
  await tab(page, 'legendes');
  await expect(page).toHaveURL(/#\/champions$/);
  await place(page, 'entrainer');
  await tab(page, 'programmes');
  await expect(page).toHaveURL(/#\/programmes$/);
});

test('plan, lignes 8 à 13 : Entraîner (démarrage rapide, discipline, programmes, enchaînements, chrono, séance)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await place(page, 'entrainer');
  // Démarrage rapide, in the lead
  await expect(page.locator('[data-testid^="quick-"]').first()).toBeVisible();
  // the sheet of a discipline (Séance tab, « Disciplines » space): modes, exercises, start
  await page.getByTestId('space-disciplines').click();
  await page.getByTestId('disc-boxe').click();
  await expect(page).toHaveURL(/#\/discipline\/boxe/);
  await page.locator('[data-testid^="ex-"]').first().click();
  await expect(page.locator('[data-testid^="mode-"]').first()).toBeVisible();
  await expect(page.getByTestId('go-training')).toBeVisible();
  // the exercise sheet covers the bar: closed first
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('go-training')).toHaveCount(0);
  // Programmes and the sheet of a programme
  await place(page, 'entrainer');
  await tab(page, 'programmes');
  await page.locator('a[href*="#/programmes/"]').first().click();
  await expect(page).toHaveURL(/#\/programmes\/[^/]+$/);
  await expect(page.getByTestId('prog-plan')).toBeVisible();
  await expect(page.getByTestId('start-program')).toBeVisible();
  // Mes enchaînements: list and editor
  await place(page, 'entrainer');
  await tab(page, 'enchainements');
  await expect(page).toHaveURL(/#\/createur$/);
  await page.getByTestId('create-combo').first().click();
  await expect(page).toHaveURL(/#\/createur\/nouveau/);
  // Chrono seul: Entraîner > Chrono
  await place(page, 'entrainer');
  await tab(page, 'chrono');
  await expect(page).toHaveURL(/#\/chrono$/);
  // the session: Démarrer, Pause, then Décomposer, Caméra and Ralenti (in « Plus »)
  await place(page, 'entrainer');
  await page.getByTestId('space-disciplines').click();
  await page.getByTestId('disc-boxe').click();
  await page.locator('[data-testid^="ex-"]').first().click();
  await page.getByTestId('go-training').click();
  await expect(page).toHaveURL(/#\/entrainement/);
  await page.getByTestId('start').click();
  await page.getByTestId('pause').click();
  await expect(page.getByTestId('resume')).toBeVisible();
  for (const a of ['decompose', 'camera']) await expect(bar(page).locator(`[data-action="${a}"]`), a).toBeVisible();
  await bar(page).locator('[data-action="menu"]').click();
  for (const id of ['slow', 'options', 'cmd-restart']) await expect(page.getByTestId(id), id).toBeVisible();
});

test('plan, lignes 14 à 17 : Apprendre (techniques, maîtrise et à revoir, fiches, partenaire, légendes, encyclopédie)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await place(page, 'techniques');
  await expect(page).toHaveURL(/#\/techniques/);
  // Rechercher and Filtres: actions of the screen
  for (const a of ['nav-search', 'nav-filters']) await expect(bar(page).getByTestId(a), a).toBeVisible();
  // a sheet of technique, its Maîtrise switch; « À revoir » comes back in the catalogue
  await page.locator('a[href*="#/techniques/"]').first().click();
  await expect(page.getByTestId('technique-page')).toBeVisible();
  await page.getByRole('button', { name: /Encore du mal/ }).first().click();
  await place(page, 'techniques');
  await expect(page.getByText(/À revoir \(1\)/).first()).toBeVisible();
  // the sheet of a technique with a partner
  await page.getByRole('tablist', { name: 'Discipline' }).getByRole('tab', { name: /Judo/ }).click();
  await expect(page.getByTestId('partner-section')).toBeVisible();
  await page.locator('a[href*="#/partenaire/"]').first().click();
  await expect(page.getByTestId('partner-page')).toBeVisible();
  // Légendes: the sheet of a champion and of a combination
  await place(page, 'techniques');
  await tab(page, 'legendes');
  await page.getByRole('group', { name: 'Légendes par discipline' }).getByRole('link', { name: 'Boxe anglaise' }).click();
  await page.locator('a[href*="#/champions/c/"]').first().click();
  await expect(page).toHaveURL(/#\/champions\/c\//);
  await place(page, 'techniques');
  await tab(page, 'legendes');
  await page.locator('a[href*="#/champions/"]:not([href*="/c/"])').first().click();
  await expect(page).toHaveURL(/#\/champions\/[^c][^/]*$/);
  // Encyclopédie: home, list, term, A–Z, favourites
  await place(page, 'techniques');
  await tab(page, 'encyclopedie');
  await page.locator('[data-testid^="enc-family-"]').first().click();
  await expect(page).toHaveURL(/#\/encyclopedie\/liste/);
  await page.getByTestId('enc-row').first().click();
  await expect(page).toHaveURL(/#\/encyclopedie\/terme\//);
  await place(page, 'techniques');
  await tab(page, 'encyclopedie');
  await bar(page).locator('[data-action="ency-az"]').click();
  await expect(page).toHaveURL(/#\/encyclopedie\/az$/);
  await bar(page).locator('[data-action="ency-favoris"]').click();
  await expect(page).toHaveURL(/#\/encyclopedie\/favoris$/);
});

test('plan, lignes 18 et 19 : Progrès (tableau et ses détails, historique, objectifs)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await place(page, 'stats');
  await expect(page.getByTestId('progress-overview')).toBeVisible();
  for (const [id, re] of [
    ['go-activite', /#\/stats\/activite/],
    ['go-techniques', /#\/stats\/techniques/],
    ['go-disciplines', /#\/stats\/disciplines/],
    ['go-enchainements', /#\/stats\/enchainements/],
  ] as const) {
    await place(page, 'stats');
    await page.getByTestId(id).first().click();
    await expect(page, id).toHaveURL(re);
  }
  await place(page, 'stats');
  await tab(page, 'historique');
  await expect(page).toHaveURL(/#\/historique$/);
  await tab(page, 'objectifs');
  await expect(page).toHaveURL(/#\/objectifs$/);
});

test('plan, lignes 20 à 27 : Profil (photo, IMC, connexion, coach, Coach IA, réglages, confidentialité, Premium, Nouveautés)', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await place(page, 'profil');
  // Profil: photo, IMC, Connexion, Confidentialité
  await expect(page.getByTestId('photo-open')).toBeVisible();
  await expect(page.getByText(/IMC/).first()).toBeVisible();
  await page.getByRole('link', { name: /Politique de confidentialité/ }).click();
  await expect(page).toHaveURL(/#\/confidentialite$/);
  // Connexion: as in v0.49, the link shows only when online accounts are on in the build; otherwise the guest mode
  await place(page, 'profil');
  const signIn = page.getByRole('link', { name: /Créer un compte ou se connecter/ });
  if (await signIn.count()) {
    await signIn.click();
    await expect(page).toHaveURL(/#\/connexion$/);
  } else await expect(page.getByText('Mode invité', { exact: true })).toBeVisible();
  // Mon coach: Kadir and Amara
  await place(page, 'profil');
  await tab(page, 'coach');
  for (const id of ['coach-homme', 'coach-femme']) await expect(page.getByTestId(id), id).toBeVisible();
  // Coach IA: the bar « Rechercher ou demander au coach », and Profil > Coach IA (the history)
  await tab(page, 'coach-ia');
  await expect(page).toHaveURL(/#\/coach-ia$/);
  await place(page, 'accueil');
  await page.getByTestId('app-search').click();
  await expect(page.getByTestId('search-ask')).toBeVisible();
  await page.keyboard.press('Escape');
  // Réglages: the same sections
  await place(page, 'profil');
  await tab(page, 'reglages');
  for (const [name, re] of [
    [/Voix et sons/, /#\/reglages\/voix$/],
    [/Rounds par défaut/, /#\/reglages\/rounds$/],
    [/Affichage 3D/, /#\/reglages\/affichage$/],
    [/Exporter, importer, effacer/, /#\/reglages\/donnees$/],
  ] as const) {
    await page.getByRole('link', { name }).first().click();
    await expect(page).toHaveURL(re);
    await page.goBack();
    await expect(page).toHaveURL(/#\/reglages$/);
  }
  // Premium à vie: Avantages, FAQ, Restaurer
  await page.getByTestId('reglages-premium').click();
  await expect(page.getByTestId('premium-benefits')).toBeVisible();
  for (const a of ['benefits', 'faq', 'restore']) await expect(bar(page).locator(`[data-action="${a}"]`).or(page.getByRole('button', { name: new RegExp(a === 'faq' ? 'FAQ' : a === 'restore' ? 'Restaurer' : 'Avantages') })).first(), a).toBeVisible();
  // Nouveautés: a tile of Réglages, with the real notes
  await place(page, 'profil');
  await tab(page, 'reglages');
  await page.getByTestId('reglages-nouveautes').click();
  await expect(page.getByTestId('news-sheet')).toBeVisible();
  await expect(page.getByTestId('news-list')).not.toBeEmpty();
});

test('plan, ligne 28 : Bienvenue, une seule fois à la première ouverture', async ({ page }) => {
  await page.goto('/#/');
  await expect(page).toHaveURL(/#\/bienvenue/);
  await seedProfile(page);
  await page.goto('/#/');
  await expect(page).toHaveURL(/#\/$/);
});
