import { expect, Page, test } from '@playwright/test';
import { bar, barSlots, closeMenu, openMenu, seedProfile, tapAction } from './nav-helpers';

// 0.38 (Youssef, 2026-10-22, « Créateur d'enchaînements V2 », plaquette 4 écrans): liste en tuiles, fiche détaillée,
// éditeur, bibliothèque de pictogrammes neutres, analyse locale (jamais une note inventée)

const OLD = { id: 'ancien', name: 'Mon un-deux', discipline: 'boxe', sequence: ['jab', 'direct'], createdAt: '2026-10-01T10:00:00.000Z' };
const KB = { id: 'kb', name: 'Low middle', discipline: 'kickboxing', sequence: ['low-kick-arriere', 'middle-kick-avant', 'pas-arriere'], createdAt: '2026-10-05T10:00:00.000Z' };

async function seed(page: Page, combos: object[], sessions: object[] = []) {
  await seedProfile(page);
  await page.goto('/');
  await page.evaluate(
    ({ combos, sessions }) =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { combos }, version: 0 }), 'u:local:css-custom');
          if (sessions.length) tx.objectStore('keyval').put(JSON.stringify({ state: { sessions, perExercise: {} }, version: 0 }), 'u:local:css-stats');
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
      }),
    { combos, sessions },
  );
  await page.goto('about:blank');
}

const session = (exerciseId: string, start: string) => ({ id: `${start}#1`, start, discipline: 'boxe', level: 'debutant', exerciseId, exerciseName: 'Mon un-deux', mode: 'libre', activeSec: 60, reps: 4 });

test('liste : tuiles avec pictogrammes, dates réelles, « Non analysé » pour un enchaînement d’avant, barre de l’écran', async ({ page }) => {
  await seed(page, [OLD, KB], [session('perso-ancien', '2026-10-20T18:00:00.000Z'), session('perso-ancien', '2026-10-21T18:00:00.000Z')]);
  await page.goto('/#/createur');
  // 1.0.0 (lot 2): Enchaînements is a tab of Entraîner, reached from its tabs (no Retour)
  await expect(page.getByTestId('tab-enchainements')).toHaveAttribute('aria-current', 'page');
  // 1.1.0 (loupe A): no row of actions; Filtrer and Créer in the ⋮ at the top right, « Rechercher » in the bar
  await expect(await barSlots(page)).toEqual([]);
  await openMenu(page);
  await expect(page.getByTestId('nav-menu-sheet').locator('.nav-menuitem[data-action] span:not(.nav-menucheck)')).toHaveText(['Filtrer', 'Créer']);
  await closeMenu(page);
  const tile = page.getByTestId('tile-ancien');
  await expect(tile).toContainText('Mon un-deux');
  await expect(tile).toContainText('Boxe anglaise');
  await expect(tile).toContainText('2 mouvements');
  await expect(tile.locator('[data-picto]')).toHaveCount(2);
  await expect(tile.getByTestId('tile-count')).toHaveText('2 entraînements');
  await expect(tile.getByTestId('tile-last')).toContainText('21 oct. 2026');
  // saved before 0.38: no score is made up
  await expect(tile.getByTestId('score-ring')).toHaveAttribute('data-state', 'none');
  await expect(tile.getByTestId('score-ring')).toHaveText('Non analysé');
  await expect(page.getByTestId('tile-kb').getByTestId('tile-last')).toHaveText('Jamais utilisé');
  // the most recent first
  const order = await page.getByTestId('combo-tiles').locator('> li').evaluateAll((ls) => ls.map((l) => l.getAttribute('data-testid')));
  expect(order).toEqual(['tile-kb', 'tile-ancien']);
  // filters: discipline chips on the page, sort and status in the bar
  await page.getByTestId('filter-d-boxe').click();
  await expect(page.getByTestId('combo-tiles').locator('> li')).toHaveCount(1);
  await page.getByTestId('filter-d-toutes').click();
  await tapAction(page, 'filters');
  await page.getByTestId('sort-utilises').click();
  await page.getByTestId('filters-close').click();
  const used = await page.getByTestId('combo-tiles').locator('> li').evaluateAll((ls) => ls.map((l) => l.getAttribute('data-testid')));
  expect(used).toEqual(['tile-ancien', 'tile-kb']);
  // 1.1.0: « Rechercher » (bar) filters the list of the screen with Entrée; the words stay as a chip to clear
  await bar(page).getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('middle');
  await expect(page.getByTestId('search-apply')).toBeVisible();
  await page.getByTestId('search-input').press('Enter');
  await expect(page.getByTestId('active-filters')).toContainText('Recherche : « middle »');
  await expect(page.getByTestId('combo-tiles').locator('> li')).toHaveCount(1);
  await expect(page.getByTestId('tile-kb')).toBeVisible();
});

test('création : sélecteur de pictogrammes, analyse locale enregistrée, fiche avec mouvements cliquables', async ({ page }) => {
  await seed(page, []);
  await page.goto('/#/createur');
  await tapAction(page, 'nav:/createur/nouveau');
  await expect(page).toHaveURL(/#\/createur\/nouveau/);
  // 1.0.0: Enregistrer is the big button, under the row of the other actions
  // 1.1.0: Retour and the big button in the bar, Ajouter and Annuler in the ⋮
  await expect.poll(() => barSlots(page)).toEqual([
    ['back', 'Retour'],
    ['save', 'Enregistrer'],
  ]);
  await page.getByTestId('combo-name-input').fill('Un-deux-crochet');
  await tapAction(page, 'add');
  const picker = page.getByTestId('move-picker');
  await expect(picker.locator('[data-picto]').first()).toBeVisible();
  await page.getByTestId('add-jab').click();
  await page.getByTestId('add-direct').click();
  await page.getByTestId('add-crochet-avant').click();
  await page.getByTestId('picker-done').click();
  await expect(page.getByTestId('builder-seq').locator('li')).toHaveCount(3);
  // reorder: crochet up, then back down
  await page.getByRole('button', { name: 'Monter Crochet gauche' }).click();
  await expect(page.getByTestId('builder-seq').locator('li').nth(1)).toContainText('Crochet');
  await page.getByRole('button', { name: 'Descendre Crochet gauche' }).click();
  await tapAction(page, 'save');
  await expect(page).toHaveURL(/#\/createur\/[a-z0-9]+$/);
  await expect(page.getByTestId('combo-name')).toHaveText('Un-deux-crochet');
  await expect.poll(() => barSlots(page)).toEqual([
    ['back', 'Retour'],
    ['play', 'Exécuter'],
  ]);
  const analysis = page.getByTestId('combo-analysis');
  await expect(analysis).toContainText('Calcul local');
  await expect(analysis.getByTestId('analysis-criteria').locator('li')).toHaveCount(5);
  await expect(analysis.getByTestId('analysis-limits')).toHaveCount(1);
  await expect(analysis.getByTestId('analysis-recos').locator('li').first()).toBeVisible();
  await expect(page.getByTestId('combo-info')).toContainText('Jamais modifié');
  await expect(page.getByTestId('info-last')).toHaveText('Jamais utilisé');
  await expect(page.getByTestId('info-count')).toHaveText('0');
  await expect(page.getByTestId('combo-moves').locator('li')).toHaveCount(3);
  await page.getByTestId('combo-moves').getByRole('link', { name: /1\. Jab/ }).click();
  await expect(page).toHaveURL(/#\/techniques\/jab\?d=boxe/);
});

test('modification : même enchaînement, « modifié le », statut gardé ; analyse de l’ancien sur demande', async ({ page }) => {
  await seed(page, [OLD]);
  await page.goto('/#/createur/ancien');
  await expect(page.getByTestId('analysis-missing')).toContainText('Non analysé');
  await page.getByTestId('status-acquis').click();
  await expect(page.getByTestId('status-acquis')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('analyse-now').click();
  await expect(page.getByTestId('analysis-criteria')).toBeVisible();
  await expect(page.getByTestId('combo-info')).toContainText('Jamais modifié');
  await tapAction(page, 'edit');
  await expect(page).toHaveURL(/#\/createur\/ancien\/modifier$/);
  await page.getByTestId('add-move').click();
  await page.getByTestId('add-esquive-droite').click();
  await page.getByTestId('picker-done').click();
  await page.getByTestId('save-combo').click();
  await expect(page).toHaveURL(/#\/createur\/ancien$/);
  await expect(page.getByTestId('combo-moves').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('combo-info')).not.toContainText('Jamais modifié');
  await expect(page.getByTestId('status-acquis')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#/createur');
  await expect(page.getByTestId('tile-ancien').getByTestId('combo-mastery')).toHaveText('Acquis');
  await expect(page.getByTestId('tile-ancien').getByTestId('score-ring')).toHaveAttribute('data-state', 'ok');
});

test('annuler une modification demande confirmation et ne change rien', async ({ page }) => {
  await seed(page, [OLD]);
  await page.goto('/#/createur/ancien/modifier');
  await page.getByRole('button', { name: 'Retirer Direct' }).click();
  await tapAction(page, 'cancel');
  await expect(page.getByRole('dialog')).toContainText('Abandonner les modifications ?');
  await page.getByRole('dialog').getByRole('button', { name: 'Abandonner' }).click();
  await expect(page).toHaveURL(/#\/createur\/ancien$/);
  await expect(page.getByTestId('combo-moves').locator('li')).toHaveCount(2);
});

test('dupliquer puis supprimer avec confirmation ; l’historique reste', async ({ page }) => {
  await seed(page, [OLD], [session('perso-ancien', '2026-10-20T18:00:00.000Z')]);
  await page.goto('/#/createur/ancien');
  await page.getByTestId('combo-duplicate').click();
  await expect(page.getByTestId('combo-name')).toHaveText('Mon un-deux (copie)');
  await expect(page.getByTestId('info-count')).toHaveText('0');
  await page.goto('/#/createur');
  await expect(page.getByTestId('combo-tiles').locator('> li')).toHaveCount(2);
  await page.getByTestId('delete-ancien').click();
  await expect(page.getByRole('dialog')).toContainText('Supprimer définitivement cet enchaînement ?');
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByTestId('combo-tiles').locator('> li')).toHaveCount(2);
  await page.getByTestId('delete-ancien').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByTestId('combo-tiles').locator('> li')).toHaveCount(1);
  await expect(page.getByTestId('tile-ancien')).toHaveCount(0);
  // the training history of the deleted sequence is kept
  await page.goto('/#/historique');
  await expect(page.locator('body')).toContainText('Mon un-deux');
  await page.goto('/#/createur/ancien');
  await expect(page.getByTestId('combo-missing')).toBeVisible();
});
