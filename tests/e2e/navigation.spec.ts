import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { bar, barSlots, menuCommand, openCoachIA, openMenu, seedProfile } from './nav-helpers';

/**
 * v0.32 (Youssef, 2026-10-22, « PROMPT MAÎTRE — Refonte intégrale de la navigation dynamique premium »): one fixed
 * bar of five places that changes with the screen, Retour in place 1 (except on Accueil), Menu always in place 5,
 * the « Navigation générale » sheet with its eight entries, and the Nouveautés centre. The words and icons are the
 * ones of the mockup docs/design/navigation-dynamique-reference.html (the unit test nav.test.ts compares the
 * configuration with the mockup's code; here the real screens are checked).
 */
const RETOUR = ['back', 'Retour'];
const MENU = ['grid', 'Menu'];
const SCREENS: [string, string, string[][]][] = [
  // 0.34: Progrès right after Entraîner (Youssef, 2026-10-22)
  ['/', 'accueil', [['dumbbell', 'Entraîner'], ['chart', 'Progrès'], ['layers', 'Techniques'], ['user', 'Profil'], MENU]],
  ['/entrainement?ex=boxe-debutant-01&mode=technique', 'entrainement', [RETOUR, ['play', 'Démarrer'], ['scan', 'Décomposer'], ['camera', 'Caméra'], MENU]],
  ['/techniques?d=boxe', 'techniques', [RETOUR, ['search', 'Rechercher'], ['filter', 'Filtres'], ['play', 'Technique'], MENU]],
  ['/techniques/jab?d=boxe', 'fiche', [RETOUR, ['play', 'S’entraîner'], ['speed', 'Ralenti'], ['check', 'Maîtrise'], MENU]],
  ['/stats', 'progres', [RETOUR, ['calendar', 'Période'], ['chart', 'Statistiques'], ['history', 'Historique'], MENU]],
  ['/champions', 'legendes', [RETOUR, ['search', 'Rechercher'], ['filter', 'Disciplines'], ['star', 'Légende'], MENU]],
  ['/profil', 'profil', [RETOUR, ['chart', 'Activité'], ['coach', 'Coach'], ['settings', 'Réglages'], MENU]],
  ['/reglages', 'parametres', [RETOUR, ['user', 'Profil'], ['options', 'Affichage'], ['camera', 'Caméra'], MENU]],
];

test.describe('393×851', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  for (const [path, screen, slots] of SCREENS) {
    test(`barre de « ${screen} » : cinq places de la maquette`, async ({ page }) => {
      await seedProfile(page);
      await page.goto(`/#${path}`);
      await expect(bar(page)).toHaveAttribute('data-screen', screen);
      expect(await barSlots(page)).toEqual(slots);
      // one bar, nothing of the former navigation: no tab bar, no floating pill or bubble, no back button at the top
      await expect(page.locator('.nav-bottom')).toHaveCount(1);
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
    });
  }

  test('Menu « Navigation générale » : 8 entrées dans l’ordre ; se ferme au fond, à Échap et au Retour du navigateur', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/stats');
    await expect(bar(page)).toBeVisible();
    const url = page.url();
    await openMenu(page);
    await expect(bar(page).locator('[data-action="menu"]')).toHaveAttribute('aria-expanded', 'true');
    const items = await page.getByTestId('nav-menu-grid').locator('button').evaluateAll((bs) => bs.map((b) => [b.getAttribute('data-go'), b.querySelector('span')?.textContent]));
    expect(items).toEqual([
      ['accueil', 'Accueil'],
      ['entrainer', 'Entraîner'],
      // 0.34: Progrès right after Entraîner (Youssef, 2026-10-22)
      ['progres', 'Progrès'],
      ['techniques', 'Techniques'],
      ['legendes', 'Légendes'],
      ['profil', 'Profil'],
      ['parametres', 'Paramètres'],
      ['nouveautes', 'Nouveautés'],
    ]);
    // a modal sheet: focus inside, the page behind under a scrim
    await expect(page.getByRole('dialog', { name: 'Navigation générale' })).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid="nav-menu-sheet"]'))).toBe(true);
    // the scrim
    await page.getByTestId('nav-scrim').click({ position: { x: 20, y: 20 } });
    await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
    expect(page.url()).toBe(url);
    // Escape, and the focus goes back to Menu
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

  test('Menu : chaque entrée ouvre sa page', async ({ page }) => {
    await seedProfile(page);
    const go: [string, RegExp, string][] = [
      ['accueil', /#\/$/, 'accueil'],
      ['entrainer', /#\/entrainer$/, 'entrainer'],
      ['techniques', /#\/techniques/, 'techniques'],
      ['progres', /#\/stats$/, 'progres'],
      ['legendes', /#\/champions/, 'legendes'],
      ['profil', /#\/profil$/, 'profil'],
      ['parametres', /#\/reglages$/, 'parametres'],
    ];
    await page.goto('/#/reglages');
    for (const [id, re, screen] of go) {
      await openMenu(page);
      await page.getByTestId(`menu-${id}`).click();
      await expect(page).toHaveURL(re);
      await expect(bar(page)).toHaveAttribute('data-screen', screen);
      await expect(page.getByTestId('nav-menu-sheet')).toHaveCount(0);
    }
  });

  test('Nouveautés : pastilles tant que la version n’est pas ouverte, notes réelles, mémorisé après rechargement', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('menu-dot')).toBeVisible();
    await expect(bar(page).locator('[data-action="menu"]')).toHaveAttribute('aria-label', 'Menu, nouvelle version à découvrir');
    // no popup on its own
    await expect(page.getByTestId('news-sheet')).toHaveCount(0);
    await openMenu(page);
    await expect(page.getByTestId('news-dot')).toBeVisible();
    await page.getByTestId('menu-nouveautes').click();
    const news = page.getByTestId('news-sheet');
    await expect(news).toBeVisible();
    const versions = await news.locator('[data-version]').evaluateAll((a) => a.map((x) => x.getAttribute('data-version')));
    expect(versions[0]).toBe('0.38.0');
    expect(versions).toContain('0.34.0');
    expect(versions).toContain('0.33.0');
    expect(versions).toContain('0.32.0');
    expect(versions).toContain('0.31.0');
    await expect(news.locator('[data-version="0.38.0"]')).toContainText('Version 0.38.0 · la plus récente');
    await expect(news).not.toContainText('fictive');
    // seen: the dots go away at once
    await expect(page.getByTestId('menu-dot')).toHaveCount(0);
    await page.getByTestId('news-close').click();
    await expect(news).toHaveCount(0);
    await page.reload();
    await expect(bar(page)).toBeVisible();
    await expect(page.getByTestId('menu-dot')).toHaveCount(0);
    await openMenu(page);
    await expect(page.getByTestId('news-dot')).toHaveCount(0);
    // a link of a version note closes the sheet and opens its page
    await page.getByTestId('menu-nouveautes').click();
    const link = page.getByTestId('news-sheet').locator('.nav-version-links button').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByTestId('news-sheet')).toHaveCount(0);
      await expect(bar(page)).not.toHaveAttribute('data-screen', 'accueil');
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
    for (const id of ['cmd-restart', 'cmd-prev', 'cmd-next', 'how-to', 'slow', 'options', 'cmd-coach-ia']) await expect(page.getByTestId(id)).toHaveCount(1);
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
    const tech = bar(page).locator('[data-action="open-selected"]');
    // nothing chosen yet: Technique does not launch an arbitrary technique
    await expect(tech).toBeDisabled();
    // search, any discipline
    await bar(page).locator('[data-action="search"]').click();
    await page.getByTestId('search-input').fill('crochet');
    await expect(page.getByTestId('search-results').locator('button').first()).toBeVisible();
    await page.getByTestId('search-results').locator('button').first().click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Retour: the catalogue as it was
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'techniques');
    await expect(page).toHaveURL(/d=boxe/);
    // the technique opened last is the selection
    await expect(tech).toBeEnabled();
    await expect(tech).toHaveAttribute('aria-label', /^Technique : ouvrir /);
    await expect(page.locator('.tech-card.selected')).toHaveCount(1);
    // filters: discipline kept in the URL, Retour from a sheet comes back to these filters
    await bar(page).locator('[data-action="filters"]').click();
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
    const slow = bar(page).locator('[data-action="slow"]');
    await slow.click();
    await expect(slow).toHaveAttribute('aria-pressed', 'true');
    await slow.click();
    await expect(slow).toHaveAttribute('aria-pressed', 'false');
    const mastery = bar(page).locator('[data-action="mastery"]');
    await mastery.click();
    await expect(mastery).toHaveAttribute('aria-pressed', 'true');
    await mastery.click();
    await expect(mastery).toHaveAttribute('aria-pressed', 'false');
    // the Coach IA is in the Menu
    await openCoachIA(page);
    await page.keyboard.press('Escape');
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'techniques');
  });

  test('Légendes : la légende ouverte devient « Légende », Parcours, Techniques et Favoris sur sa fiche', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/champions?vue=champions');
    await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
    const legend = bar(page).locator('[data-action="open-selected"]');
    await expect(legend).toBeDisabled();
    await page.locator('a.champ-card').first().click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche-legende');
    const fav = page.getByTestId('legend-fav');
    await fav.click();
    await expect(fav).toHaveAttribute('aria-pressed', 'true');
    await bar(page).locator('[data-action="career"]').click();
    await expect(page.getByTestId('legend-career')).toBeInViewport();
    await bar(page).locator('[data-action="techniques"]').click();
    await expect(page.getByTestId('legend-techniques')).toBeInViewport();
    await bar(page).locator('[data-slot="1"]').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
    await expect(legend).toBeEnabled();
    // the favourite is kept (Favoris view of the Légendes)
    await page.goto('/#/champions?vue=favoris');
    await expect(page.getByTestId('fav-legends')).toBeVisible();
  });

  test('Progrès : Statistiques et Historique ; Objectifs dans le Menu', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/stats');
    // Historique and Statistiques switch the dashboard's view (same page, same period)
    const history = bar(page).locator('[data-action="history"]');
    await history.click();
    await expect(history).toHaveAttribute('aria-pressed', 'true');
    await expect(bar(page).locator('[data-action="stats"]')).toHaveAttribute('aria-pressed', 'false');
    await bar(page).locator('[data-action="stats"]').click();
    await expect(history).toHaveAttribute('aria-pressed', 'false');
    // the whole history is a command of the Menu
    await menuCommand(page, 'cmd-historique-complet');
    await expect(page).toHaveURL(/#\/historique/);
    await page.goBack();
    await menuCommand(page, 'goals-link');
    await expect(page).toHaveURL(/#\/objectifs/);
  });

  test('Profil et Paramètres : Réglages, Affichage, Caméra', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/profil');
    await bar(page).locator('[data-action="nav:/reglages"]').click();
    await expect(page).toHaveURL(/#\/reglages$/);
    await bar(page).locator('[data-action="nav:/reglages/affichage?focus=camera"]').click();
    await expect(page.getByTestId('settings-camera')).toBeInViewport();
  });

  test('Menu « Sur cet écran » : les actions de l’ancienne pilule sont toujours là', async ({ page }) => {
    await seedProfile(page);
    // Accueil: Séance rapide, Technique du jour (Reprendre only after a past session), Coach IA
    await page.goto('/#/');
    await openMenu(page);
    const cmds = () => page.getByTestId('nav-commands').locator('button').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-testid')));
    expect(await cmds()).toEqual(['cmd-seance-rapide', 'cmd-technique-du-jour', 'cmd-coach-ia']);
    await page.getByTestId('cmd-technique-du-jour').click();
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Techniques: Au hasard opens a technique of the list
    await page.goto('/#/techniques?d=boxe');
    await menuCommand(page, 'cmd-au-hasard');
    await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
    // Séance rapide opens the recommended exercise of the main discipline
    await page.goto('/#/');
    await menuCommand(page, 'cmd-seance-rapide');
    await expect(bar(page)).toHaveAttribute('data-screen', /^(discipline|entrainer)$/);
  });

  test('au clavier : vrais boutons, focus visible, Entrée lance l’action', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/');
    const btn = bar(page).locator('[data-slot="2"]');
    await btn.focus();
    const outline = await btn.evaluate((b) => getComputedStyle(b).outlineStyle + getComputedStyle(b).boxShadow);
    expect(outline).not.toBe('nonenone');
    await page.keyboard.press('Enter');
    // 0.34: place 2 of the home bar is Progrès
    await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
  });

  test('mouvement réduit : pas d’animation de la barre ni du Menu', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedProfile(page);
    await page.goto('/#/');
    await openMenu(page);
    const d = await page.evaluate(() => [...document.querySelectorAll('.nav-sheet, .nav-ico, .nav-bar')].map((e) => parseFloat(getComputedStyle(e).animationDuration) || 0));
    for (const x of d) expect(x).toBeLessThanOrEqual(0.01);
  });
});

for (const vp of [
  { width: 360, height: 640 },
  { width: 851, height: 393 },
]) {
  test(`${vp.width}×${vp.height} : la barre tient, rien ne déborde, le Menu reste lisible`, async ({ page }) => {
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
  test(`thème ${scheme === 'light' ? 'clair' : 'sombre'} : barre et Menu sans défaut de contraste`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    // theme « auto » (default) follows the system
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
