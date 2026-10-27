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
  const cta = page.getByTestId('home-cta');
  await expect(cta).toHaveAttribute('data-action', 'resume');
  await expect(cta).toHaveText('Commencer');
  await expect(cta).toHaveClass(/nav-primary/);
  await expect(page.getByTestId('resume-last')).toContainText('Ta discipline');
  await expect(page.locator('.home-tile')).toHaveCount(3);
  await expect(page.getByTestId('tile-quick')).toContainText('Séance rapide');
  await expect(page.getByTestId('tile-daily')).toContainText('Technique du jour');
  await expect(page.getByTestId('tile-chrono')).toContainText('Chrono');
  await expect(page.getByTestId('home-goal')).toContainText('Aucun objectif fixé');
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
  const cta = page.getByTestId('home-cta');
  await expect(cta).toHaveText('Reprendre');
  await cta.click();
  await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-debutant-01&mode=technique$/);
});

test('Accueil : toucher la discipline la change parmi les six, sans rien effacer', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await page.getByTestId('resume-last').click();
  const picker = page.getByTestId('disc-picker');
  await expect(picker.locator('.home-disc')).toHaveCount(6);
  await expect(picker.getByTestId('pick-boxe')).toHaveAttribute('aria-pressed', 'true');
  await picker.getByTestId('pick-judo').click();
  await expect(picker).toHaveCount(0);
  await expect(page.locator('.home-resume-disc')).toHaveAttribute('data-disc', 'judo');
  await page.reload();
  await expect(page.locator('.home-resume-disc')).toHaveAttribute('data-disc', 'judo');
  // Android back closes the picker first
  await page.getByTestId('resume-last').click();
  await expect(page.getByTestId('disc-picker')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('disc-picker')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});

test('Rechercher ou demander : sur chaque place, jamais en séance ; trouve et ouvre', async ({ page }) => {
  await seedProfile(page);
  for (const path of ['/', '/entrainer', '/profil', '/techniques/jab?d=boxe']) {
    await page.goto(`/#${path}`);
    await expect(bar(page).getByTestId('app-search'), path).toBeVisible();
  }
  // three actions of the screen or more (Techniques, Progrès): no room in the row, « Rechercher » opens « Plus » first
  for (const path of ['/techniques?d=boxe', '/stats']) {
    await page.goto(`/#${path}`);
    await expect(bar(page).locator('.nav-row > .nav-btn.nav-secondary')).toHaveCount(3);
    await expect(bar(page).getByTestId('app-search'), path).toHaveCount(0);
    await bar(page).locator('[data-action="menu"]').click();
    await expect(page.getByTestId('nav-commands').locator('button').first()).toHaveAttribute('data-testid', 'cmd-app-search');
    await page.getByTestId('cmd-app-search').click();
    await expect(page.getByTestId('search-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  }
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainement');
  await expect(page.getByTestId('app-search')).toHaveCount(0);

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
  await expect(page.getByTestId('search-ask')).toContainText('Demander au Coach IA : « comment corriger mon jab quand je fatigue »');
  await page.getByTestId('search-ask').click();
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
    await expect(page.locator('.home-tile')).toHaveCount(3);
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
    const sheet = await new AxeBuilder({ page }).include('[data-testid="search-sheet"]').withRules(['color-contrast']).analyze();
    expect(sheet.violations).toEqual([]);
  });
}
