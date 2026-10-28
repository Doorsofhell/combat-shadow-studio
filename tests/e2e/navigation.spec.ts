import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { RELEASES } from '../../src/domain/releases';
import { bar, barSlots, closeMenu, expectChecked, menuCommand, menuItem, openCoachIA, openMenu, openSetting, seedProfile, tapAction } from './nav-helpers';

/**
 * 1.0.0 (refonte ergonomique, Youssef 2026-10-27, maquette v4 validée): the five places of the app fixed at the
 * bottom (Accueil, Entraîner, Apprendre, Progrès, Profil), the actions of the screen just above them with one big
 * button, Retour as a chip at the top left on the detail screens, and « Plus » for the commands of the screen. The
 * former Menu places are the five places, the tabs of each space, the links of Profil and the tiles of Réglages.
 * (v0.32–0.49: one bar of five places that changed with the screen, and a Menu; the actions per screen are kept,
 * see src/ui/nav/__tests__/refonte.test.ts.)
 * 1.1.0 (Youssef, 2026-10-27, loupe A): « Rechercher » in place of Profil in the bar, the photo of the profile and
 * the ⋮ of the screen's options at the top right; the row of actions stays only in the session and the chronometer.
 */
const RETOUR = ['back', 'Retour'];
const PLUS = ['grid', 'Plus'];
const TAB_LABELS = ['Accueil', 'Entraîner', 'Apprendre', 'Progrès', 'Rechercher'];
// path, screen, the buttons in the bar in reading order, the options of the ⋮ (null: no ⋮), the big button, the place
// lit (Profil: the photo at the top right), Retour (chip, row or none)
const SCREENS: [string, string, string[][], string[] | null, string | null, string | null, 'chip' | 'row' | null][] = [
  // 1.0.0 (lot 3): the big button « Reprendre » (« Commencer » before the first session); Chrono is a tile of the page
  ['/', 'accueil', [['play', 'Commencer']], null, 'resume', 'Accueil', null],
  ['/entrainement?ex=boxe-debutant-01&mode=technique', 'entrainement', [RETOUR, ['scan', 'Décomposer'], ['camera', 'Caméra'], ['play', 'Démarrer'], PLUS], null, 'toggle', null, 'row'],
  ['/techniques?d=boxe', 'techniques', [], ['Filtres', 'Technique'], null, 'Apprendre', null],
  ['/techniques/jab?d=boxe', 'fiche', [RETOUR, ['play', 'S’entraîner']], ['Ralenti', 'Maîtrise'], 'train', 'Apprendre', 'chip'],
  ['/stats', 'progres', [], ['Période', 'Statistiques', 'Historique'], null, 'Progrès', null],
  ['/champions', 'legendes', [], ['Disciplines', 'Légende'], null, 'Apprendre', null],
  // 1.0.0 (lot 2): Mon coach and Réglages are tabs of Profil at the top of the screen, not repeated
  // 1.2.0: Mon coach is a row of Réglages, no longer a tab: « Coach » of the bar is in the ⋮ (it opens that row)
  // 1.3.0 (Youssef, 2026-10-28: « Retire les … en haut à droite car tous les menus proposés sont déjà dans les pages
  // principales Mes infos et Réglages »): no ⋮ on Mes infos and Réglages
  ['/profil', 'profil', [], null, null, 'Profil', null],
  // 1.1.0: « Caméra » left Réglages (it opened the same page as Affichage)
  ['/reglages', 'parametres', [], null, null, 'Profil', null],
  // 1.1.1 (Youssef, 2026-10-28: « Plus si uniquement rechercher le retirer car en doublon »): the magnifier is in the
  // bar here, so no « Plus » holding only « Rechercher »
  ['/chrono', 'chrono', [RETOUR, ['options', 'Réglages'], ['play', 'Démarrer']], null, 'toggle', 'Entraîner', 'row'],
];

test.describe('393×851', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  for (const [path, screen, slots, options, primary, lit, back] of SCREENS) {
    test(`« ${screen} » : cinq places fixes, actions de l’écran et gros bouton`, async ({ page }) => {
      await seedProfile(page);
      await page.goto(`/#${path}`);
      await expect(bar(page)).toHaveAttribute('data-screen', screen);
      expect(await barSlots(page)).toEqual(slots);
      // the ⋮ at the top right holds the other actions of the screen, in their order
      if (options) {
        await openMenu(page);
        const words = await page.getByTestId('nav-menu-sheet').locator('.nav-menuitem[data-action] span:not(.nav-menucheck)').allTextContents();
        expect(words).toEqual(options);
        await closeMenu(page);
      } else await expect(bar(page).locator('.nav-kebab')).toHaveCount(0);
      // the photo of the profile at the top right, out of the full-screen session and chronometer
      await expect(bar(page).getByTestId('nav-profil')).toHaveCount(back === 'row' ? 0 : 1);
      // the five places, the same everywhere except the hands-free session
      const tabs = bar(page).locator('.nav-tab');
      if (screen === 'entrainement') await expect(tabs).toHaveCount(0);
      else await expect(tabs.locator('small')).toHaveText(TAB_LABELS);
      if (lit === 'Profil') await expect(bar(page).getByTestId('nav-profil')).toHaveAttribute('aria-current', 'page');
      else if (lit) await expect(bar(page).locator('.nav-tab[aria-current="page"] small')).toHaveText(lit);
      // one big button at most, the main action of the screen
      const big = bar(page).locator('.nav-primary');
      await expect(big).toHaveCount(primary ? 1 : 0);
      if (primary) await expect(big).toHaveAttribute('data-action', primary);
      // Retour: a chip at the top left on a detail screen, in the row on full-screen screens, none on the places
      await expect(bar(page).locator('.nav-backchip')).toHaveCount(back === 'chip' ? 1 : 0);
      await expect(bar(page).locator('[data-action="back"]')).toHaveCount(back ? 1 : 0);
      // nothing of the former navigation: no floating pill or bubble, no back button of the page itself
      await expect(page.locator('.nav:not(.nav-bottom), .action-pill, [data-testid="action-pill"], [data-testid="coach-bubble"]')).toHaveCount(0);
      await expect(page.locator('.page-head .back, [data-testid="back"], [aria-label^="Retour"]:not(.nav-btn)')).toHaveCount(0);
      // fixed at the bottom of the screen, 48 dp touch targets, nothing outside the screen
      const g = await bar(page).evaluate((b) => {
        const r = b.getBoundingClientRect();
        return { bottom: Math.round(r.bottom), vh: innerHeight, pos: getComputedStyle(b).position, btns: [...b.querySelectorAll('button')].map((x) => [x.getBoundingClientRect().width, x.getBoundingClientRect().height]), overflow: document.documentElement.scrollWidth - innerWidth };
      });
      expect(g.pos).toBe('fixed');
      expect(g.bottom).toBe(g.vh);
      for (const [w, h] of g.btns) expect(Math.min(w, h)).toBeGreaterThanOrEqual(48);
      expect(g.overflow).toBeLessThanOrEqual(0);
      // the pages keep their end above the bottom: --nav-h is the real height of the bottom
      const navH = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')));
      const barH = await bar(page).evaluate((b) => b.getBoundingClientRect().height);
      expect(Math.abs(navH - barH)).toBeLessThanOrEqual(2);
    });
  }

  test('le gros bouton porte la couleur de la discipline principale', async ({ page }) => {
    await seedProfile(page, { mainDiscipline: 'mma', disciplines: ['mma'] });
    await page.goto('/#/techniques/jab');
    await expect(bar(page).locator('.nav-primary')).toHaveCSS('background-color', 'rgb(255, 225, 77)');
    await expect(bar(page).locator('.nav-primary')).toHaveCSS('color', 'rgb(11, 15, 20)');
  });

  test('« Plus » : les commandes de l’écran ; se ferme au fond, à Échap et au Retour du navigateur', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/stats');
    await expect(bar(page)).toBeVisible();
    const url = page.url();
    await openMenu(page);
    await expect(bar(page).locator('[data-action="menu"]')).toHaveAttribute('aria-expanded', 'true');
    // the former Menu places are gone from it: they are the places, tabs, Profil links and Réglages tiles
    await expect(page.getByTestId('nav-menu-grid')).toHaveCount(0);
    // 1.1.0: the Coach IA is reached from « Rechercher », no longer from here; the options of the screen are
    await expect(page.getByTestId('cmd-coach-ia')).toHaveCount(0);
    await expect(page.getByTestId('nav-menu-sheet').locator('[data-action="period"]')).toBeVisible();
    // a modal sheet: focus inside, the page behind under a scrim
    await expect(page.getByRole('dialog', { name: 'Sur cet écran' })).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid="nav-menu-sheet"]'))).toBe(true);
    // the scrim
    await page.getByTestId('nav-scrim').click({ position: { x: 20, y: 20 } });
    await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
    expect(page.url()).toBe(url);
    // Escape, and the focus goes back to Plus
    await openMenu(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
    await expect(bar(page).locator('[data-action="menu"]')).toBeFocused();
    expect(page.url()).toBe(url);
    // the browser's (or Android's) back: the sheet closes, the page stays
    await openMenu(page);
    await page.goBack();
    await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
    await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
  });

  test('aucune perte : chaque ancienne entrée du Menu s’ouvre toujours, en un ou deux gestes', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/reglages');
    // the five places
    const places: [string, RegExp, string][] = [
      ['nav-accueil', /#\/$/, 'accueil'],
      ['nav-entrainer', /#\/entrainer$/, 'entrainer'],
      ['nav-techniques', /#\/techniques$/, 'techniques'],
      ['nav-stats', /#\/stats$/, 'progres'],
      ['nav-profil', /#\/profil$/, 'profil'],
    ];
    // 1.1.0: Profil is the photo at the top right, « Rechercher » the fifth place
    for (const [id, re, screen] of places) {
      await bar(page).getByTestId(id).click();
      await expect(page).toHaveURL(re);
      await expect(bar(page)).toHaveAttribute('data-screen', screen);
    }
    // Légendes and Encyclopédie: tabs of Apprendre
    await bar(page).getByTestId('nav-techniques').click();
    await expect(page.getByTestId('section-tabs').locator('button')).toHaveText(['Techniques', 'Légendes', 'Encyclopédie']);
    await page.getByTestId('tab-legendes').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
    await expect(page.getByTestId('tab-legendes')).toHaveAttribute('aria-current', 'page');
    await page.getByTestId('tab-encyclopedie').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'encyclopedie');
    // Objectifs and Historique: tabs of Progrès
    await bar(page).getByTestId('nav-stats').click();
    await page.getByTestId('tab-objectifs').click();
    await expect(page).toHaveURL(/#\/objectifs$/);
    await page.getByTestId('tab-historique').click();
    await expect(page).toHaveURL(/#\/historique$/);
    // Paramètres (Réglages): tab of Profil (lot 2); 1.2.0: Mon coach and Coach IA are rows of Réglages; Premium: a row
    await bar(page).getByTestId('nav-profil').click();
    await expect(page.getByTestId('section-tabs').locator('button')).toHaveText(['Mes infos', 'Réglages']);
    await page.getByTestId('tab-reglages').click();
    await expect(page).toHaveURL(/#\/reglages$/);
    await openSetting(page, 'coach');
    await expect(page.getByTestId('coach-homme')).toBeVisible();
    await openSetting(page, 'coach-ia');
    await page.getByTestId('reglages-coach-ia-history').click();
    await expect(page).toHaveURL(/#\/coach-ia$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/reglages$/);
    await page.getByTestId('reglages-premium').click();
    await expect(page).toHaveURL(/#\/premium$/);
    await expect(bar(page).getByTestId('nav-profil')).toHaveAttribute('aria-current', 'page');
  });

  test('Nouveautés : pastilles tant que la version n’est pas ouverte, notes réelles, mémorisé après rechargement', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/');
    // the dot is on Profil (Réglages lives there)
    await expect(page.getByTestId('menu-dot')).toBeVisible();
    await expect(bar(page).getByTestId('nav-profil')).toHaveAttribute('aria-label', 'Profil, nouvelle version à découvrir');
    // no popup on its own
    await expect(page.getByTestId('news-sheet')).toHaveCount(0);
    await bar(page).getByTestId('nav-profil').click();
    await expect(page.getByTestId('reglages-dot')).toBeVisible();
    await page.getByTestId('tab-reglages').click();
    await expect(page.getByTestId('news-dot')).toBeVisible();
    await page.getByTestId('reglages-nouveautes').click();
    const news = page.getByTestId('news-sheet');
    await expect(news).toBeVisible();
    const versions = await news.locator('[data-version]').evaluateAll((a) => a.map((x) => x.getAttribute('data-version')));
    expect(versions[0]).toBe('1.4.0');
    expect(versions).toContain('1.3.1');
    expect(versions).toContain('1.3.0');
    expect(versions).toContain('1.2.0');
    expect(versions).toContain('0.49.0');
    expect(versions).toContain('0.34.0');
    expect(versions).toContain('0.33.0');
    expect(versions).toContain('0.32.0');
    expect(versions).toContain('0.31.0');
    expect(versions).toContain('1.0.0');
    await expect(news.locator('[data-version="1.4.0"]')).toContainText('Version 1.4.0 · la plus récente');
    await expect(news).not.toContainText('fictive');
    // seen: the dots go away at once
    await expect(page.getByTestId('menu-dot')).toHaveCount(0);
    await page.getByTestId('news-close').click();
    await expect(news).toHaveCount(0);
    await expect(page.getByTestId('news-dot')).toHaveCount(0);
    await page.reload();
    await expect(bar(page)).toBeVisible();
    await expect(page.getByTestId('menu-dot')).toHaveCount(0);
    await expect(page.getByTestId('news-dot')).toHaveCount(0);
    // a link of a version note closes the sheet and opens its page (the first link of the latest version)
    await page.getByTestId('reglages-nouveautes').click();
    const link = page.getByTestId('news-sheet').locator('.nav-version-links button').first();
    const target = RELEASES[0].links[0]?.to;
    if (target) {
      await expect(link).toHaveText(RELEASES[0].links[0].label);
      await link.click();
      await expect(page.getByTestId('news-sheet')).toHaveCount(0);
      expect(decodeURIComponent(new URL(page.url()).hash)).toBe(`#${target}`);
    }
  });

  test('séance : Démarrer → Pause → Reprendre à la même place ; Retour demande avant de quitter', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    await expect(page.getByTestId('exercise-name')).toBeVisible();
    const place2 = bar(page).locator('[data-slot="2"]');
    await expect(place2).toHaveAttribute('data-testid', 'start');
    await place2.click();
    await expect(place2).toHaveAttribute('data-testid', 'pause');
    await expect(place2).toHaveAttribute('data-icon', 'pause');
    await expect(place2.locator('small')).toHaveText('Pause');
    await place2.click();
    await expect(place2).toHaveAttribute('data-testid', 'resume');
    await expect(place2.locator('small')).toHaveText('Reprendre');
    await place2.click();
    await expect(place2).toHaveAttribute('data-testid', 'pause');
    // Retour during the session: it pauses and asks
    await bar(page).locator('[data-slot="1"]').click();
    const dlg = page.getByRole('dialog', { name: 'Quitter la séance ?' });
    await expect(dlg).toBeVisible();
    await expect(place2).toHaveAttribute('data-testid', 'resume');
    await dlg.getByRole('button', { name: 'Annuler' }).click();
    await expect(dlg).toHaveCount(0);
    await expect(page).toHaveURL(/entrainement/);
    await bar(page).locator('[data-slot="1"]').click();
    // paused, it still asks: leaving ends the session
    await page.getByRole('dialog', { name: 'Quitter la séance ?' }).getByRole('button', { name: 'Quitter' }).click();
    // opened directly (no page of the app before it): Retour goes to its parent, Entraîner
    await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  });

  test('séance : Décomposer, Caméra et les commandes du Menu (Recommencer, Ralenti, Options)', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    await expect(page.getByTestId('exercise-name')).toBeVisible();
    await bar(page).locator('[data-action="camera"]').click();
    await expect(bar(page).locator('[data-action="camera"]')).toHaveAttribute('aria-pressed', 'true');
    await bar(page).locator('[data-action="camera"]').click();
    await expect(bar(page).locator('[data-action="camera"]')).toHaveAttribute('aria-pressed', 'false');
    await openMenu(page);
    // 1.1.0: the Coach IA through « Rechercher », which stays in « Plus » during the session
    for (const id of ['cmd-restart', 'cmd-prev', 'cmd-next', 'how-to', 'slow', 'options', 'cmd-search']) await expect(page.getByTestId(id)).toHaveCount(1);
    await page.getByTestId('options').click();
    const opts = page.getByRole('dialog', { name: 'Options d’entraînement' });
    await expect(opts).toBeVisible();
    // a modal sheet of the session is never under the bar: its last button can be reached, the bar comes back after
    await expect(bar(page)).toBeHidden();
    await opts.getByRole('button', { name: 'Fermer' }).click();
    await expect(opts).toHaveCount(0);
    await expect(bar(page)).toBeVisible();
  });

  test('catalogue : Rechercher, Filtres, Technique (la technique sélectionnée) et retour intelligent', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/techniques?d=boxe');
    // nothing chosen yet: Technique does not launch an arbitrary technique
    await expect(await menuItem(page, 'open-selected')).toBeDisabled();
    await closeMenu(page);
    // search (1.1.0: the place « Rechercher » of the bar, the techniques of the screen first)
    await bar(page).getByTestId('app-search').click();
    await page.getByTestId('search-input').fill('crochet');
    await expect(page.getByTestId('search-own-hit').first()).toBeVisible();
    await page.getByTestId('search-own-hit').first().click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Retour: the catalogue as it was
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'techniques');
    await expect(page).toHaveURL(/d=boxe/);
    // the technique opened last is the selection
    const tech = await menuItem(page, 'open-selected');
    await expect(tech).toBeEnabled();
    await expect(tech).toHaveAttribute('aria-label', /^Technique : ouvrir /);
    await closeMenu(page);
    await expect(page.locator('.tech-card.selected')).toHaveCount(1);
    // filters: discipline kept in the URL, Retour from a sheet comes back to these filters
    await tapAction(page, 'filters');
    await page.getByTestId('filter-d-muaythai').click();
    await page.getByTestId('filters-close').click();
    await expect(page.getByTestId('filters-panel')).toHaveCount(0);
    await expect(page).toHaveURL(/d=muaythai/);
    // scroll kept: open a technique far down the list, come back
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(200);
    const y = await page.evaluate(() => scrollY);
    expect(y).toBeGreaterThan(300);
    const card = page.locator('a.tech-card').filter({ has: page.locator(':scope') }).nth(8);
    await card.click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    await bar(page).locator('[data-slot="1"]').click();
    await expect(page).toHaveURL(/d=muaythai/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y - 120);
  });

  test('fiche ouverte directement : Retour mène au catalogue ; Ralenti et Maîtrise basculent', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/techniques/jab?d=boxe');
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    await expect(page.getByTestId('technique-page')).toBeVisible();
    // 1.1.0: Ralenti and Maîtrise are toggles of the ⋮ menu (checked or not)
    for (const a of ['slow', 'mastery']) {
      await tapAction(page, a);
      await expectChecked(page, a, true);
      await tapAction(page, a);
      await expectChecked(page, a, false);
    }
    // the Coach IA through « Rechercher »
    await openCoachIA(page);
    await page.keyboard.press('Escape');
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'techniques');
  });

  test('Légendes : la légende ouverte devient « Légende », Parcours, Techniques et Favoris sur sa fiche', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/champions?vue=champions');
    await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
    await expect(await menuItem(page, 'open-selected')).toBeDisabled();
    await closeMenu(page);
    await page.locator('a.champ-card').first().click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche-legende');
    // 1.1.0: Favoris, Parcours and Techniques are in the ⋮ of the legend
    await tapAction(page, 'favorite');
    await expectChecked(page, 'favorite', true);
    await tapAction(page, 'career');
    await expect(page.getByTestId('legend-career')).toBeInViewport();
    await tapAction(page, 'techniques');
    await expect(page.getByTestId('legend-techniques')).toBeInViewport();
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
    await expect(await menuItem(page, 'open-selected')).toBeEnabled();
    await closeMenu(page);
    // the favourite is kept (Favoris view of the Légendes)
    await page.goto('/#/champions?vue=favoris');
    await expect(page.getByTestId('fav-legends')).toBeVisible();
  });

  test('Progrès : Statistiques et Historique ; Objectifs dans « Plus »', async ({ page }) => {
    await seedProfile(page);
    // 0.39 (refonte Progrès): on the overview, Statistiques opens Activité and Historique the history
    await page.goto('/#/stats');
    await tapAction(page, 'history');
    await expect(page).toHaveURL(/#\/historique$/);
    await page.goto('/#/stats');
    await tapAction(page, 'stats');
    await expect(page).toHaveURL(/#\/stats\/activite$/);
    // in Activité, Historique and Statistiques switch the view (same page, same period)
    await tapAction(page, 'history');
    await expectChecked(page, 'history', true);
    await expectChecked(page, 'stats', false);
    await tapAction(page, 'stats');
    await expectChecked(page, 'history', false);
    // the whole history is a command of the Menu
    await menuCommand(page, 'cmd-historique-complet');
    await expect(page).toHaveURL(/#\/historique/);
    await page.goBack();
    await menuCommand(page, 'goals-link');
    await expect(page).toHaveURL(/#\/objectifs/);
  });

  test('Profil et Paramètres : Réglages, Affichage (la caméra y est)', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/profil');
    // 1.0.0 (lot 2): Réglages is a tab of Profil
    await page.getByTestId('tab-reglages').click();
    await expect(page).toHaveURL(/#\/reglages$/);
    // 1.1.0: « Caméra » left Réglages; the camera settings are on the page « Affichage »
    // 1.3.0: no ⋮ on Réglages any more: Affichage is its row (the address /reglages/affichage still opens it)
    await openSetting(page, 'affichage');
    await expect(page.getByTestId('settings-camera')).toHaveCount(1);
    await page.goto('/#/reglages/affichage');
    await expect(page.getByTestId('settings-camera')).toHaveCount(1);
  });

  test('Menu « Sur cet écran » : les actions de l’ancienne pilule sont toujours là', async ({ page }) => {
    await seedProfile(page);
    // Accueil (1.0.0, lot 3): Séance rapide and Technique du jour are tiles of the page, Reprendre the big button;
    // 1.1.0: no ⋮ on the home (its Coach IA command went to « Rechercher »)
    await page.goto('/#/');
    await expect(bar(page)).toBeVisible();
    await expect(bar(page).locator('.nav-kebab')).toHaveCount(0);
    await page.getByTestId('tile-daily').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Techniques: Au hasard opens a technique of the list
    await page.goto('/#/techniques?d=boxe');
    await menuCommand(page, 'cmd-au-hasard');
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Séance rapide opens the recommended exercise of the main discipline
    await page.goto('/#/');
    await page.getByTestId('tile-quick').click();
    await expect(bar(page)).toHaveAttribute('data-screen', /^(discipline|entrainer)$/);
  });

  test('au clavier : vrais boutons, focus visible, Entrée lance l’action', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/');
    // a place of the bar (1.0.0: Progrès is the fourth place)
    const btn = bar(page).getByTestId('nav-stats');
    await btn.focus();
    const outline = await btn.evaluate((b) => getComputedStyle(b).outlineStyle + getComputedStyle(b).boxShadow);
    expect(outline).not.toBe('nonenone');
    await page.keyboard.press('Enter');
    await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
    // the ⋮ of the screen's options (1.1.0)
    const kebab = bar(page).getByTestId('nav-menu');
    await kebab.focus();
    expect(await kebab.evaluate((b) => getComputedStyle(b).outlineStyle + getComputedStyle(b).boxShadow)).not.toBe('nonenone');
  });

  test('mouvement réduit : pas d’animation de la barre ni de « Plus »', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedProfile(page);
    await page.goto('/#/stats');
    await openMenu(page);
    const d = await page.evaluate(() => [...document.querySelectorAll('.nav-sheet, .nav-ico, .nav-dock')].map((e) => parseFloat(getComputedStyle(e).animationDuration) || 0));
    for (const x of d) expect(x).toBeLessThanOrEqual(0.01);
  });
});

for (const vp of [
  { width: 360, height: 640 },
  { width: 851, height: 393 },
]) {
  test(`${vp.width}×${vp.height} : la barre tient, rien ne déborde, « Plus » reste lisible`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seedProfile(page);
    for (const p of ['/', '/techniques?d=boxe', '/stats']) {
      await page.goto(`/#${p}`);
      await expect(bar(page)).toBeVisible();
      const spill = await bar(page).evaluate((b) => [...b.querySelectorAll('small')].filter((s) => s.scrollWidth > s.clientWidth + 1).length);
      expect(spill).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
    await openMenu(page);
    const r = await page.getByTestId('nav-menu-sheet').evaluate((s) => ({ top: s.getBoundingClientRect().top, h: innerHeight }));
    expect(r.top).toBeGreaterThanOrEqual(0);
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`thème ${scheme === 'light' ? 'Jour' : 'Nuit'} : barre et « Plus » sans défaut de contraste`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    // theme Auto follows the system (1.0.0: Nuit is the default of a new install)
    await page.addInitScript(() => localStorage.setItem('css-theme', 'auto'));
    await seedProfile(page);
    await page.goto('/#/stats');
    await expect(bar(page)).toBeVisible();
    const r1 = await new AxeBuilder({ page }).include('[data-testid="bottom-bar"]').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(r1.violations.map((v) => v.id)).toEqual([]);
    await openMenu(page);
    await page.waitForTimeout(300);
    const r2 = await new AxeBuilder({ page }).include('[data-testid="nav-menu-sheet"]').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(r2.violations.map((v) => v.id)).toEqual([]);
  });
}
