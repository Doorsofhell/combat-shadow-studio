import { expect, Page, test } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

// v0.48 « Chrono de combat » (Youssef, 2026-10-23: a configurable timer on its own, reached from the bottom bar in
// place of Techniques; 2026-10-27: maquette B « Plein écran »). Short settings (10 s rounds) so a test runs in seconds.

async function stats(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ sessions: Record<string, unknown>[] }>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const g = r.result.transaction('keyval').objectStore('keyval').get('u:local:css-stats');
          g.onsuccess = () => res(g.result ? JSON.parse(g.result).state : { sessions: [] });
        };
      }),
  );
}

const rgb = (page: Page) => page.getByTestId('chrono-run').evaluate((e) => getComputedStyle(e).backgroundColor.match(/\d+/g)!.map(Number));

/** taps − until the value reads `to` (a button at its bound is disabled, so the count is never guessed) */
async function minusTo(page: Page, id: string, to: string) {
  for (let i = 0; i < 30 && (await page.getByTestId(`chrono-value-${id}`).textContent()) !== to; i++) await page.getByTestId(`chrono-minus-${id}`).click();
}

/** round 10 s, rest 10 s, 2 rounds, from the boxing default (3:00 / 1:00 / 3) */
async function shortSetup(page: Page) {
  await minusTo(page, 'work', '0:10');
  await minusTo(page, 'rest', '0:10');
  await minusTo(page, 'rounds', '2');
  await expect(page.getByTestId('chrono-value-work')).toHaveText('0:10');
  await expect(page.getByTestId('chrono-value-rest')).toHaveText('0:10');
  await expect(page.getByTestId('chrono-value-rounds')).toHaveText('2');
}

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
});

test('« Chrono » : tuile de l’Accueil, onglet d’Entraîner, ouvre le chrono ; Techniques est la place Apprendre', async ({ page }) => {
  await page.goto('/#/');
  await expect(bar(page).locator('[data-action="nav:/techniques"]')).toHaveCount(0);
  // 1.0.0 (lot 3, maquette v4): on the home, Chrono is the tile « Chrono seul » of the page
  await expect(bar(page).locator('[data-action="nav:/chrono"]')).toHaveCount(0);
  await expect(page.getByTestId('tile-chrono')).toContainText('Chrono');
  // 1.0.0 (lot 2): on Entraîner, Chrono is one of its tabs at the top, not repeated above the bar
  await page.goto('/#/entrainer');
  await expect(bar(page).locator('[data-action="nav:/chrono"]')).toHaveCount(0);
  await expect(page.getByTestId('tab-chrono')).toHaveText('Chrono');
  await page.getByTestId('tab-chrono').click();
  await expect(page).toHaveURL(/#\/chrono$/);
  await page.goto('/#/');
  await page.getByTestId('tile-chrono').click();
  await expect(page).toHaveURL(/#\/chrono$/);
  await expect(bar(page)).toHaveAttribute('data-screen', 'chrono');
  await expect(page.getByTestId('chrono-setup-screen')).toBeVisible();
  // 1.0.0: the chronometer belongs to Entraîner, whose place is lit; Techniques is the place Apprendre
  await expect(bar(page).locator('.nav-tab[aria-current="page"]')).toHaveAttribute('data-tab', 'entrainer');
  await expect(bar(page).locator('[data-action="nav:/chrono"]')).toHaveCount(0);
  await expect(bar(page).getByTestId('nav-techniques')).toBeVisible();
});

test('réglages : formats prêts, + et − bornés, total affiché, mémorisés et « Réglage perso » quand on modifie', async ({ page }) => {
  await page.goto('/#/chrono');
  // boxing default
  await expect(page.getByTestId('chrono-value-work')).toHaveText('3:00');
  await expect(page.getByTestId('chrono-value-rest')).toHaveText('1:00');
  await expect(page.getByTestId('chrono-value-rounds')).toHaveText('3');
  await expect(page.getByTestId('chrono-format-boxe')).toHaveAttribute('aria-pressed', 'true');
  // muay-thaï: 5 × 3:00, 2:00 rest
  await page.getByTestId('chrono-format-muaythai').click();
  await expect(page.getByTestId('chrono-value-rest')).toHaveText('2:00');
  await expect(page.getByTestId('chrono-value-rounds')).toHaveText('5');
  // total = prep 3 s (default) + 5×3:00 + 4×2:00 = 23:03
  await expect(page.getByTestId('chrono-total')).toHaveText('23:03');
  // a change makes it a personal setting
  await page.getByTestId('chrono-plus-rounds').click();
  await expect(page.getByTestId('chrono-value-rounds')).toHaveText('6');
  await expect(page.getByTestId('chrono-perso')).toBeVisible();
  await expect(page.getByTestId('chrono-format-muaythai')).toHaveAttribute('aria-pressed', 'false');
  // bounds: rest never below 0, rounds never below 1
  await minusTo(page, 'rest', '0:00');
  await expect(page.getByTestId('chrono-value-rest')).toHaveText('0:00');
  await expect(page.getByTestId('chrono-minus-rest')).toBeDisabled();
  // kept after a reload
  await page.reload();
  await expect(page.getByTestId('chrono-value-rounds')).toHaveText('6');
  await expect(page.getByTestId('chrono-value-rest')).toHaveText('0:00');
});

test('plein écran : ambre « Prépare-toi », rouge « Combat », toucher = pause grise, passer, bleu-vert « Repos »', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#/chrono');
  await shortSetup(page);
  await page.getByTestId('chrono-start').click();
  const run = page.getByTestId('chrono-run');
  await expect(run).toHaveAttribute('data-phase', 'decompte');
  await expect(page.getByTestId('chrono-phase')).toHaveText('Prépare-toi');
  const [r, g, b] = await rgb(page);
  expect(r).toBeGreaterThan(200);
  expect(g).toBeGreaterThan(140);
  expect(b).toBeLessThan(100);
  await expect(run).toHaveAttribute('data-phase', 'travail', { timeout: 15_000 });
  await expect(page.getByTestId('chrono-phase')).toHaveText('Combat');
  await expect(page.getByTestId('chrono-round')).toHaveText('Round 1 / 2');
  await expect.poll(async () => { const [r2, g2] = await rgb(page); return r2 > 150 && g2 < 60; }).toBe(true);
  // the Démarrer place of the bar became Pause
  await expect(bar(page).locator('[data-action="toggle"]')).toContainText('Pause');
  // a tap anywhere pauses: the time freezes
  await page.getByTestId('chrono-tap').click({ position: { x: 30, y: 200 } });
  await expect(run).toHaveAttribute('data-phase', 'pause');
  await expect(page.getByTestId('chrono-phase')).toHaveText('Pause');
  const frozen = await page.getByTestId('chrono-time').textContent();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('chrono-time')).toHaveText(frozen!);
  // skip the round: rest comes, still paused, then resume
  await page.getByTestId('chrono-skip').click();
  await page.getByTestId('chrono-tap').click();
  await expect(run).toHaveAttribute('data-phase', 'repos');
  await expect(page.getByTestId('chrono-phase')).toHaveText('Repos');
  // teal once the 0.35 s colour transition is over
  await expect.poll(async () => { const [r2, g2, b2] = await rgb(page); return g2 > r2 + 60 && b2 > r2 + 60; }).toBe(true);
});

test('fin : aucun repos après le dernier round, bilan, historique « terminée » sans technique', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#/chrono');
  await shortSetup(page);
  await page.getByTestId('chrono-start').click();
  const run = page.getByTestId('chrono-run');
  await expect(run).toHaveAttribute('data-phase', 'travail', { timeout: 15_000 });
  await expect(run).toHaveAttribute('data-phase', 'repos', { timeout: 15_000 });
  await expect(page.getByTestId('chrono-round')).toHaveText('Ensuite : Round 2 / 2');
  await expect(page.getByTestId('chrono-round')).toHaveText('Round 2 / 2', { timeout: 15_000 });
  // the last round ends the session: no rest after it
  await expect(page.getByTestId('chrono-end')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Séance terminée' })).toBeVisible();
  const summary = page.getByTestId('chrono-summary');
  await expect(summary).toContainText('2 / 2');
  await expect(summary).toContainText('Temps de combat');
  await expect(summary.locator('dd').nth(1)).toHaveText(/00:(19|20)/);
  await expect(summary.locator('dd').nth(2)).toHaveText(/00:(09|10)/);
  const s = await stats(page);
  const rec = s.sessions.find((x) => String(x.id).endsWith('#chrono'))!;
  expect(rec).toBeTruthy();
  expect(rec.exerciseId).toBe('chrono-perso');
  expect(rec.status).toBe('terminee');
  expect(rec.doneRounds).toBe(2);
  expect(rec.plannedRounds).toBe(2);
  // only one record, even after leaving the screen
  await bar(page).locator('[data-action="back"]').click();
  await page.goto('/#/');
  expect((await stats(page)).sessions.filter((x) => String(x.id).endsWith('#chrono'))).toHaveLength(1);
});

test('arrêt : en pause, « Arrêter » donne « Séance arrêtée » et l’historique « interrompue » ; le round passé ne compte pas', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#/chrono');
  await shortSetup(page);
  await page.getByTestId('chrono-start').click();
  const run = page.getByTestId('chrono-run');
  await expect(run).toHaveAttribute('data-phase', 'travail', { timeout: 15_000 });
  await page.waitForTimeout(2200);
  // Retour pauses first, then a second Retour stops (no lost session on a wrong tap)
  await bar(page).locator('[data-action="back"]').click();
  await expect(run).toHaveAttribute('data-phase', 'pause');
  await page.getByTestId('chrono-stop').click();
  await expect(page.getByRole('heading', { name: 'Séance arrêtée' })).toBeVisible();
  await expect(page.getByTestId('chrono-summary')).toContainText('0 / 2');
  const rec = (await stats(page)).sessions.find((x) => String(x.id).endsWith('#chrono'))!;
  expect(rec.status).toBe('interrompue');
  expect(rec.doneRounds).toBe(0);
  expect(Number(rec.activeSec)).toBeGreaterThanOrEqual(1);
});
