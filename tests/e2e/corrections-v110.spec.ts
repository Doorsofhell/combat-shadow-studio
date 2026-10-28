import { expect, test } from '@playwright/test';
import { bar, closeMenu, menuItem, seedProfile, showCoachTools } from './nav-helpers';

/**
 * 1.1.0 (Youssef, 2026-10-27/28): the corrections asked on the 1.0.0 — the magnifier in the bar and the photo with
 * the ⋮ at the top right (loupe A), the filters of a discipline on one line (« trois menus »), the screens without
 * scrolling (disciplines, chrono de combat), the speed on the coach, the days of the week, the statuses as a question
 * of the search.
 */
test.use({ viewport: { width: 393, height: 740 } });

test('page d’une discipline : niveau, style et type sur une seule ligne, les explications dans les menus', async ({ page }) => {
  await seedProfile(page, { mainDiscipline: 'kickboxing', disciplines: ['kickboxing'] });
  await page.goto('/#/discipline/kickboxing?niveau=debutant');
  const line = page.getByTestId('filter-line');
  await expect(line).toBeVisible();
  // one line: every chip on the same row, nothing out of the screen
  const tops = await line.locator(':scope > .chip').evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().top)));
  expect(tops.length).toBe(3);
  expect(new Set(tops).size).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  // the four rectangles and the chip rows are gone from the page
  await expect(page.getByTestId('level-sel')).toHaveCount(0);
  await expect(page.getByTestId('kb-style-summary')).toHaveCount(0);
  // level: the menu says what each level is for; a choice changes the address and the list
  await expect(page.getByTestId('level-chip')).toContainText('Débutant');
  await page.getByTestId('level-chip').click();
  const menu = page.getByTestId('level-chip-menu');
  await expect(menu.getByRole('menuitemradio')).toHaveCount(4);
  await expect(page.getByTestId('level-debutant')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('level-intermediaire').click();
  await expect(menu).toHaveCount(0);
  await expect(page).toHaveURL(/niveau=intermediaire/);
  await expect(page.getByTestId('level-chip')).toContainText('Intermédiaire');
  // type: filters the list, the count on the chip
  const all = await page.locator('[data-testid^="ex-"]').count();
  await page.getByTestId('kind-chip').click();
  const kinds = page.getByTestId('kind-chip-menu').getByRole('menuitemradio');
  expect(await kinds.count()).toBeGreaterThan(1);
  await kinds.nth(1).click();
  const some = await page.locator('[data-testid^="ex-"]').count();
  expect(some).toBeGreaterThan(0);
  expect(some).toBeLessThanOrEqual(all);
  await expect(page.getByTestId('kind-chip')).toContainText(`(${some})`);
  // Android back closes an open menu first and stays on the page
  await page.getByTestId('kind-chip').click();
  await expect(page.getByTestId('kind-chip-menu')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('kind-chip-menu')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/discipline\/kickboxing/);
});

test('loupe A : « Rechercher » dans la barre, la photo et le ⋮ en haut à droite sans toucher le titre', async ({ page }) => {
  await seedProfile(page);
  for (const p of ['/stats', '/techniques/jab?d=boxe', '/reglages', '/encyclopedie']) {
    await page.goto(`/#${p}`);
    await expect(bar(page)).toBeVisible();
    await expect(bar(page).getByTestId('app-search')).toBeVisible();
    const avatar = await bar(page).getByTestId('nav-profil').boundingBox();
    expect(avatar!.x + avatar!.width).toBeGreaterThan(393 - 70);
    expect(avatar!.y).toBeLessThan(80);
    // the title of the page never runs under the photo or the ⋮
    const h = page.locator('.page-head h1, .sec-tabs-in').first();
    if (await h.count()) {
      const r = await h.boundingBox();
      const left = (await bar(page).getByTestId('nav-topright').boundingBox())!.x;
      expect(r!.x + r!.width, p).toBeLessThanOrEqual(left + 1);
    }
  }
  // the search of a screen starts with its own content: Encyclopédie › Équipements
  await page.goto('/#/encyclopedie/liste?f=equipements');
  await bar(page).getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('gant');
  await expect(page.getByTestId('search-own-hit').first()).toBeVisible();
  await expect(page.getByTestId('search-apply')).toBeVisible();
});

test('sans défilement : les 6 disciplines et le chrono de combat tiennent dans l’écran', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainer');
  await page.getByTestId('space-disciplines').click();
  await expect(page.locator('[data-testid^="disc-"]')).toHaveCount(6);
  for (const d of await page.locator('[data-testid^="disc-"]').all()) await expect(d).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
  await page.getByTestId('space-chrono').click();
  await expect(page).toHaveURL(/#\/chrono$/);
  await expect(page.getByTestId('chrono-setup-screen')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1);
});

test('séance : la vitesse sur le coach dès le départ, pas de grand compte à rebours', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  // the speed of the exercise (a beginner's exercise may start slower than ×1); 1.4.0: in the commands of the coach,
  // shown by one tap on it
  await showCoachTools(page);
  await expect(page.getByTestId('speed-tool')).toHaveText(/^×[0-9],?[0-9]*$/);
  await page.getByTestId('speed-tool').click();
  await expect(page.getByTestId('speed-choices').getByRole('radio')).toHaveText(['×0,25', '×0,5', '×0,75', '×1', '×1,25', '×1,5']);
  await page.getByTestId('speed-0-5').click();
  await expect(page.getByTestId('speed-tool')).toHaveText('×0,5');
  await page.getByTestId('start').click();
  await expect(page.locator('.countdown')).toHaveCount(0);
  await showCoachTools(page);
  await expect(page.getByTestId('speed-tool')).toBeVisible();
});

test('objectifs : les jours sur une ligne de 7, plusieurs choix, gardés', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/objectifs');
  await page.getByTestId('edit-goals').click();
  const grid = page.getByTestId('day-grid');
  await expect(grid.locator('button')).toHaveCount(7);
  const tops = await grid.locator('button').evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await expect(grid.getByText('Aucun')).toHaveCount(0);
  await page.getByTestId('day-0').click();
  await page.getByTestId('day-2').click();
  await page.getByTestId('day-4').click();
  await expect(page.getByTestId('day-count')).toHaveText('3 jours par semaine');
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByTestId('edit-goals').click();
  await expect(page.getByTestId('day-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('day-count')).toHaveText('3 jours par semaine');
});

test('Légendes : « Que signifient les statuts ? » est une question de la recherche, plus un bloc de l’écran', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/champions');
  await expect(bar(page)).toHaveAttribute('data-screen', 'legendes');
  await expect(page.getByText(/Que signifient les statuts/)).toHaveCount(0);
  await bar(page).getByTestId('app-search').click();
  await expect(page.getByTestId('search-question')).toHaveText(/Que signifient les statuts/);
  await page.getByTestId('search-question').click();
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
  // the options of the screen in the ⋮
  await page.keyboard.press('Escape');
  await expect(await menuItem(page, 'filters')).toBeVisible();
  await closeMenu(page);
});

test('1.1.1 : « Plus » qui ne tiendrait que « Rechercher » est retiré là où la loupe est dans la barre', async ({ page }) => {
  // Youssef, 2026-10-28: « Dans le bouton en bas à droite plus si uniquement rechercher le retirer car en doublon »
  await seedProfile(page);
  await page.goto('/#/chrono');
  await expect(bar(page)).toHaveAttribute('data-screen', 'chrono');
  await expect(bar(page).getByTestId('app-search')).toBeVisible();
  await expect(bar(page).locator('[data-action="menu"]')).toHaveCount(0);
  // in the session the places are hidden: « Rechercher » stays in « Plus », with the other commands
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(bar(page).getByTestId('app-search')).toHaveCount(0);
  await bar(page).locator('[data-action="menu"]').click();
  await expect(page.getByTestId('cmd-search')).toBeVisible();
  await expect(page.getByTestId('cmd-restart')).toBeVisible();
});

test('1.1.1 : le créateur d’enchaînement garde ses icônes de mouvements et sa recherche dans le choix', async ({ page }) => {
  // Youssef, 2026-10-28: « Le créateur d'enchaînement doit garder les icônes »
  await seedProfile(page);
  await page.goto('/#/createur/nouveau?d=boxe');
  await page.getByTestId('add-move').click();
  const picker = page.getByTestId('move-picker');
  await expect(picker.getByTestId('picker-search')).toBeVisible();
  const cells = picker.locator('.picker-cell');
  expect(await cells.count()).toBeGreaterThan(10);
  // every move has its pictogram, drawn (not an empty box)
  const sizes = await cells.evaluateAll((cs) => cs.map((c) => { const s = c.querySelector('svg'); const r = s?.getBoundingClientRect(); return s && r ? Math.min(r.width, r.height) * (s.querySelectorAll('path,line,circle,ellipse,polyline,rect').length > 0 ? 1 : 0) : 0; }));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(32);
  await picker.getByTestId('picker-search').fill('jab');
  await expect(picker.getByTestId('add-jab').locator('svg')).toBeVisible();
});
