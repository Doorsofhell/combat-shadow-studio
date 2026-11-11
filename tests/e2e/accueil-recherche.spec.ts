import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.0.0 (refonte ergonomique, lot 3; maquette v4 validée par Youssef le 2026-10-27): the home keeps what serves to
 * start (« Reprendre » and the discipline, the coach, three tiles, the weekly goal, one line of suggestions, the big
 * button Reprendre), and « Rechercher ou demander au coach » replaces the Coach IA bubble on every screen.
 */

const session = { id: 's1', start: '2026-10-26T18:00:00.000Z', discipline: 'boxe', level: 'debutant', exerciseId: 'boxe-debutant-01', exerciseName: 'Jab en garde', mode: 'technique', activeSec: 600, reps: 10 };

async function seedSession(page: Page) {
  await page.goto('/');
  await page.evaluate(
    (s) =>
      new Promise<void>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { sessions: [s] }, version: 0 }), 'u:local:css-stats');
          tx.objectStore('keyval').put(JSON.stringify({ state: { goals: { weeklyMinutes: 60, weeklySessions: 0 }, favTechniques: [], favExercises: [], mastery: {} }, version: 0 }), 'u:local:css-goals');
          tx.oncomplete = () => res();
        };
      }),
    session,
  );
  await page.goto('about:blank');
}

test.use({ viewport: { width: 393, height: 851 } });

test('Accueil sans historique : « Commencer », trois tuiles, objectif à fixer, ni progression ni favoris répétés', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await expect(bar(page)).toHaveAttribute('data-screen', 'accueil');
  // 1.30.0 (nouvelle ergonomie, lot 2): « Commencer » is in the coach's card (it opens the recommended session, the
  // former tile « Séance rapide »), the bar keeps only its places
  const cta = page.getByTestId('home-cta');
  await expect(cta).toHaveAttribute('data-action', 'start');
  await expect(cta).toHaveText('Commencer');
  await expect(bar(page).locator('.nav-primary')).toHaveCount(0);
  await expect(page.getByTestId('resume-last')).toContainText('Ta discipline');
  await expect(page.locator('.home-row')).toHaveCount(2);
  await expect(page.getByTestId('tile-daily')).toContainText('Technique du jour');
  await expect(page.getByTestId('tile-chrono')).toContainText('Chrono');
  // no goal: the round says so to screen readers and shows no figure, no gauge
  await expect(page.getByTestId('home-goal')).toHaveAccessibleName(/aucun objectif fixé/);
  await expect(page.getByTestId('home-goal')).toHaveText('Objectif');
  await expect(page.getByTestId('home-goal').getByRole('progressbar')).toHaveCount(0);
  // nothing to review yet: no round « À revoir »
  await expect(page.getByTestId('home-review')).toHaveCount(0);
  // the former blocks are elsewhere (Progrès, Entraîner › Favoris), not repeated here
  await expect(page.getByRole('heading', { name: 'Ta progression' })).toHaveCount(0);
  // the tiles lead where they say
  await page.getByTestId('tile-chrono').click();
  await expect(page).toHaveURL(/#\/chrono$/);
  await page.goBack();
  await page.getByTestId('tile-daily').click();
  await expect(page).toHaveURL(/#\/techniques\/[a-z0-9-]+\?d=boxe$/);
  await page.goBack();
  await page.getByTestId('home-goal').click();
  await expect(page).toHaveURL(/#\/objectifs$/);
  await page.goBack();
  await page.getByTestId('home-create').click();
  await expect(page).toHaveURL(/#\/createur$/);
  await page.goBack();
  await page.getByTestId('home-coach-ia').click();
  await expect(page).toHaveURL(/#\/coach-ia$/);
  await page.goBack();
  // « Commencer » opens the recommended session of the discipline
  await page.getByTestId('home-cta').click();
  await expect(page).toHaveURL(/#\/discipline\/boxe\?niveau=[a-z]+&ex=boxe-/);
});

test('Accueil avec une séance : « Reprendre » relance la dernière séance, la jauge montre les vrais chiffres', async ({ page }) => {
  await seedProfile(page);
  await seedSession(page);
  await page.goto('/#/');
  await expect(page.getByTestId('resume-last')).toContainText('Reprendre');
  await expect(page.getByTestId('resume-last')).toContainText('Jab en garde');
  // the session is from 2026-10-26: counted only if it is this week, so the figure is read, never assumed
  await expect(page.getByTestId('home-goal')).toContainText(/\d+ \/ 60 min/);
  await expect(page.getByTestId('home-goal').getByRole('progressbar')).toBeVisible();
  // 1.30.0: « Reprendre ta séance » is the first shortcut of the page, « Commencer » stays in the coach's card
  await expect(page.getByTestId('home-cta')).toHaveText('Commencer');
  await page.getByTestId('resume-last').click();
  await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-debutant-01&mode=technique$/);
});

test('Accueil : toucher la discipline la change parmi les six, sans rien effacer', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  // 1.30.0: the six disciplines are tabs at the top of the home (the former sheet « Choisir la discipline »), one
  // touch changes it; no sheet any more, so nothing for Android back to close
  const picker = page.getByTestId('disc-tabs');
  await expect(picker.locator('.home-dtab')).toHaveCount(6);
  await expect(picker.getByTestId('pick-boxe')).toHaveAttribute('aria-pressed', 'true');
  await picker.getByTestId('pick-judo').click();
  await expect(picker.getByTestId('pick-judo')).toHaveAttribute('aria-pressed', 'true');
  await expect(picker.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByTestId('resume-last')).toHaveAttribute('data-disc', 'judo');
  await expect(page.getByTestId('resume-last')).toContainText('Judo');
  await page.reload();
  await expect(page.getByTestId('resume-last')).toHaveAttribute('data-disc', 'judo');
  await expect(page.getByTestId('pick-judo')).toHaveAttribute('aria-pressed', 'true');
  // the tab of the discipline is inside the screen
  const box = await page.getByTestId('pick-judo').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(393);
  await expect(page.getByTestId('disc-picker')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});

test('Rechercher : une place de la barre sur chaque écran, dans « Plus » en séance ; trouve et ouvre', async ({ page }) => {
  await seedProfile(page);
  // 1.29.0 (barre flottante): « Rechercher » is the magnifier at the top right of every screen with the places
  // 1.30.0: on the home it is the big bar « Que veux-tu travailler ? » of the page, not repeated at the top right
  await page.goto('/#/');
  await expect(page.locator('.page.home').getByTestId('app-search')).toContainText('Que veux-tu travailler ?');
  await expect(page.getByTestId('app-search')).toHaveCount(1);
  await expect(bar(page).locator('.nav-tab')).toHaveCount(4);
  for (const path of ['/entrainer', '/profil', '/techniques/jab?d=boxe', '/techniques?d=boxe', '/stats']) {
    await page.goto(`/#${path}`);
    await expect(bar(page).getByTestId('app-search'), path).toBeVisible();
    await expect(bar(page).locator('.nav-topright').getByTestId('app-search'), path).toHaveCount(1);
    await expect(bar(page).locator('.nav-tab'), path).toHaveCount(4);
  }
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainement');
  await expect(page.getByTestId('app-search')).toHaveCount(0);
  // in the session, « Rechercher » is in « Plus »
  await bar(page).locator('[data-action="menu"]').click();
  await page.getByTestId('cmd-search').click();
  await expect(page.getByTestId('search-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);

  await page.goto('/#/');
  await page.getByTestId('app-search').click();
  const sheet = page.getByTestId('search-sheet');
  await expect(sheet).toBeVisible();
  await expect(page.getByTestId('search-input')).toBeFocused();
  await page.getByTestId('search-input').fill('jab');
  await expect(sheet.getByRole('region', { name: 'Techniques' }).getByTestId('search-hit').first()).toHaveAttribute('data-to', '/techniques/jab');
  await sheet.getByRole('region', { name: 'Techniques' }).getByTestId('search-hit').first().click();
  await expect(sheet).toHaveCount(0);
  await expect(page).toHaveURL(/#\/techniques\/jab$/);
  // a setting by an everyday word
  await page.getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('volume');
  await page.locator('[data-testid="search-hit"][data-to="/reglages/voix"]').click();
  await expect(page).toHaveURL(/#\/reglages\/voix$/);
  // Android back closes the sheet, the page stays
  await page.getByTestId('app-search').click();
  await expect(page.getByTestId('search-sheet')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/reglages\/voix$/);
});

test('Rechercher ou demander : la question va au Coach IA, qui répond hors ligne', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/techniques/jab?d=boxe');
  await page.getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('comment corriger mon jab quand je fatigue');
  await expect(page.getByTestId('search-sheet')).toContainText('Rien de ce nom dans l’app');
  // 1.7.0 (proposition A): a question gets the coach's answer at the top of the search, at once
  await expect(page.getByTestId('search-coach-text')).not.toBeEmpty();
  await expect(page.getByTestId('search-ask')).toHaveCount(0);
  await page.getByTestId('search-coach-open').click();
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  const panel = page.getByTestId('coach-bubble-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('coach-answer')).not.toHaveClass(/placeholder/);
  await expect(panel).toContainText('comment corriger mon jab quand je fatigue');
  // no floating bubble anywhere
  await expect(page.locator('[data-testid="coach-bubble"]')).toHaveCount(0);
});

for (const theme of ['clair', 'sombre'] as const) {
  test(`thème ${theme === 'clair' ? 'Jour' : 'Nuit'} : accueil et recherche sans défaut de contraste, rien hors de l’écran (360×640)`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.addInitScript((t) => localStorage.setItem('css-theme', t), theme);
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.locator('.home-row')).toHaveCount(2);
    // the six discipline tabs are all inside the small screen, none cut at the edge
    const tabs = await page.locator('.home-dtab').evaluateAll((bs) => bs.map((b) => [b.getBoundingClientRect().left, b.getBoundingClientRect().right]));
    expect(tabs).toHaveLength(6);
    for (const [l, r] of tabs) {
      expect(l).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(360);
    }
    const g = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, theme: document.documentElement.dataset.theme }));
    expect(g.overflow).toBeLessThanOrEqual(0);
    expect(g.theme).toBe(theme === 'clair' ? 'light' : 'dark');
    // the last element of the page ends above the bottom once scrolled down
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight));
    const r = await page.evaluate(() => ({ navTop: document.querySelector('.nav-bottom')!.getBoundingClientRect().top, last: [...document.querySelectorAll('.page.home > *')].at(-1)!.getBoundingClientRect().bottom }));
    expect(r.last).toBeLessThanOrEqual(r.navTop + 1);
    const home = await new AxeBuilder({ page }).include('.page.home').include('[data-testid="bottom-bar"]').exclude('.hero-stage').withRules(['color-contrast']).analyze();
    expect(home.violations).toEqual([]);
    await page.getByTestId('app-search').click();
    await page.getByTestId('search-input').fill('ga');
    await expect(page.getByTestId('search-hit').first()).toBeVisible();
    // 1.2.0: the colours are read once the sheet has finished sliding up (axe read a sheet still moving, 1 run in 2)
    await page.getByTestId('search-sheet').evaluate((e) => Promise.all(e.parentElement!.getAnimations({ subtree: true }).map((a) => a.finished)));
    const sheet = await new AxeBuilder({ page }).include('[data-testid="search-sheet"]').withRules(['color-contrast']).analyze();
    expect(sheet.violations).toEqual([]);
    // 1.7.0: the coach's answer at the top, and the line « Demander au coach »
    await page.getByTestId('search-input').fill('Comment corriger mon jab ?');
    await expect(page.getByTestId('search-coach')).toBeVisible();
    const card = await new AxeBuilder({ page }).include('[data-testid="search-sheet"]').withRules(['color-contrast']).analyze();
    expect(card.violations).toEqual([]);
    await page.getByTestId('search-input').fill('garde');
    await expect(page.getByTestId('search-ask')).toBeVisible();
    const row = await new AxeBuilder({ page }).include('[data-testid="search-sheet"]').withRules(['color-contrast']).analyze();
    expect(row.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}
