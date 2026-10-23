import { expect, Page, test } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

// 0.33 (Youssef, 2026-10-22 « Refonte premium de l'écran Entraîner »): trois espaces, carte de reprise réelle
// (§5-6, §21) : la séance reprend après fermeture, à la bonne place et au bon chronomètre, jamais depuis zéro

const SESSION = '/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=60&rest=30&rounds=3';
const toSec = (t: string | null) => {
  const [m, s] = (t ?? '0:0').split(':').map(Number);
  return m * 60 + s;
};

async function startAndPause(page: Page, workMs: number) {
  await page.goto(SESSION);
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  const place2 = bar(page).locator('[data-slot="2"]');
  await place2.click();
  await expect(page.getByTestId('phase')).toHaveText(/Round 1\/3/, { timeout: 15_000 });
  await page.waitForTimeout(workMs);
  await place2.click();
  await expect(place2).toHaveAttribute('data-testid', 'resume');
  return toSec(await page.getByTestId('session-time').textContent());
}

test.describe('Entraîner : trois espaces', () => {
  test('Séances par défaut, Disciplines et Programmes ; le dernier espace est retenu', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/entrainer');
    const tabs = page.getByRole('tablist', { name: 'Espaces d’entraînement' });
    await expect(tabs.getByRole('tab')).toHaveCount(3);
    await expect(page.getByTestId('space-seances')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('resume-card')).toHaveAttribute('data-state', 'premiere');
    await expect(page.getByTestId('resume-card').getByRole('heading')).toHaveText('Commence ton premier entraînement');
    await page.getByTestId('space-disciplines').click();
    for (const d of ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo']) await expect(page.getByTestId(`disc-${d}`)).toBeVisible();
    // clavier : flèche droite vers Programmes
    await page.getByTestId('space-disciplines').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('space-programmes')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.prog-card')).toHaveCount(49); // 0.41: 49 programmes (10 before)
    // the choice is written to IndexedDB asynchronously: the app is closed a moment later, as a person would
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.getByTestId('space-programmes')).toHaveAttribute('aria-selected', 'true');
    // une seule barre de navigation, aucun bouton flottant
    await expect(page.locator('nav.nav-bottom')).toHaveCount(1);
    await expect(page.locator('.coach-bubble, .action-pill')).toHaveCount(0);
  });

  // 0.41 (Youssef, « Enrichissement des programmes » §6): « Filtres » quitte le contenu pour la barre inférieure
  test('Programmes : filtres combinables et réinitialisables, dans la barre', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/entrainer?espace=programmes');
    await expect(page.getByTestId('prog-count')).toHaveText('49 programmes sur 49');
    // no filter button in the content any more
    await expect(page.getByTestId('pf-more')).toHaveCount(0);
    await page.getByTestId('pf-d-muaythai').click();
    await expect(page.locator('.prog-card')).toHaveCount(8);
    // level, duration, objective and equipment are in the panel opened from the bar
    await expect(page.getByTestId('pf-t-moyen')).toBeHidden();
    const filters = bar(page).getByTestId('nav-prog-filters');
    await expect(filters).toHaveText(/Filtrer/);
    await filters.click();
    const panel = page.getByTestId('prog-filters-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId('pp-d-muaythai')).toHaveAttribute('aria-pressed', 'true');
    await panel.getByTestId('pf-t-moyen').click();
    await expect(panel.getByTestId('pp-close')).toHaveText('Voir les résultats (5)');
    await panel.getByTestId('pf-o-defense').click();
    await expect(panel.getByTestId('pp-close')).toHaveText('Voir les résultats (1)');
    await panel.getByTestId('pp-close').click();
    await expect(panel).toBeHidden();
    await expect(page.locator('.prog-card')).toHaveCount(1);
    await expect(page.getByTestId('prog-muay-defense-intermediaire')).toBeVisible();
    await expect(filters).toHaveAttribute('aria-pressed', 'true');
    await filters.click();
    await panel.getByTestId('pf-o-cardio').click();
    await expect(panel.getByTestId('pp-close')).toHaveText('Voir les résultats (0)');
    await panel.getByTestId('pp-close').click();
    await expect(page.getByText('Aucun programme pour ces filtres')).toBeVisible();
    // kept while moving around the app
    await page.goto('/#/techniques');
    await page.goto('/#/entrainer?espace=programmes');
    await expect(page.getByText('Aucun programme pour ces filtres')).toBeVisible();
    await page.getByTestId('pf-reset').click();
    await expect(page.locator('.prog-card')).toHaveCount(49);
    await filters.click();
    await panel.getByTestId('pf-m-tapis').click();
    await expect(panel.getByTestId('pp-close')).toHaveText('Voir les résultats (22)');
    await panel.getByTestId('pp-reset').click();
    await expect(panel.getByTestId('pp-close')).toHaveText('Voir les résultats (49)');
  });

  test('Programmes : fiche complète, planning par semaine, séance de la semaine lancée', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/programmes/boxe-defense-deplacements-debutant');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bouger et se protéger');
    await expect(page.getByTestId('prog-description')).toBeVisible();
    await expect(page.getByTestId('prog-progress')).toContainText('0 séance faite sur 8') // 2 séances par semaine pendant 4 semaines;
    for (const w of [1, 2, 3, 4]) await expect(page.getByTestId(`prog-week-${w}`)).toBeVisible();
    await expect(page.getByTestId('prog-origin')).toContainText('Programme original');
    await expect(page.getByTestId('prog-sources').getByRole('link').first()).toBeVisible();
    await page.getByTestId('start-program').click();
    await expect(page).toHaveURL(/prog=boxe-defense-deplacements-debutant&s=1/);
    await expect(page.getByTestId('exercise-name')).toBeVisible();
  });

  test('reprise : pause, fermeture, réouverture, « Reprendre » revient au même exercice et au même temps', async ({ page }) => {
    await seedProfile(page);
    const done = await startAndPause(page, 6000);
    expect(done).toBeGreaterThanOrEqual(5);
    const remaining = await page.getByTestId('phase-time').textContent().catch(() => null);
    // fermeture de l’application : on recharge une page vide puis l’écran Entraîner
    await page.goto('about:blank');
    await page.goto('/#/entrainer');
    await page.getByTestId('space-seances').click();
    const card = page.getByTestId('resume-card');
    await expect(card).toHaveAttribute('data-state', 'reprendre');
    await expect(card.getByRole('heading')).toHaveText('Reprendre mon entraînement');
    await expect(page.getByTestId('resume-name')).toHaveText(/Jab/);
    await expect(page.getByTestId('resume-progress')).toBeVisible();
    // double appui : une seule ouverture
    await page.getByTestId('resume-action').dblclick();
    await expect(page).toHaveURL(/reprise=1/);
    await expect(page.getByTestId('exercise-name')).toContainText('Jab');
    await expect(page.getByTestId('phase')).toHaveText('Pause');
    const place2 = bar(page).locator('[data-slot="2"]');
    await expect(place2).toHaveAttribute('data-testid', 'resume');
    const t0 = toSec(await page.getByTestId('session-time').textContent());
    expect(t0).toBe(done);
    if (remaining) await expect(page.getByTestId('phase-time')).toHaveText(remaining);
    await place2.click();
    await expect(page.getByTestId('phase')).toHaveText(/Round 1\/3/);
    // the clock goes on from the saved time (the software 3D of the test browser can hold the display a few seconds)
    await expect.poll(async () => toSec(await page.getByTestId('session-time').textContent()), { timeout: 20_000 }).toBeGreaterThan(t0);
    // sortie contrôlée : la carte propose toujours la reprise, avec plus de temps
    await bar(page).locator('[data-slot="1"]').click();
    await page.getByRole('dialog', { name: 'Quitter la séance ?' }).getByRole('button', { name: 'Quitter' }).click();
    await page.goto('/#/entrainer');
    await expect(page.getByTestId('resume-card')).toHaveAttribute('data-state', 'reprendre');
    expect(toSec(await page.getByTestId('resume-done').textContent().then((t) => (t ?? '').replace(/(\d+) min (\d+)/, '$1:$2').replace(/(\d+) s/, '0:$1')))).toBeGreaterThan(t0);
  });

  test('reprise impossible (sauvegarde supprimée) : proposition de recommencer, sans plantage', async ({ page }) => {
    await seedProfile(page);
    await page.goto(`${SESSION}&reprise=1`);
    const dlg = page.getByRole('dialog', { name: 'Reprise impossible' });
    await expect(dlg).toBeVisible();
    await dlg.getByRole('button', { name: 'Recommencer' }).click();
    await expect(page.getByTestId('exercise-name')).toContainText('Jab');
    await expect(bar(page).locator('[data-slot="2"]')).toHaveAttribute('data-testid', 'start');
  });

  test('aucun contenu sous la barre inférieure (360×640)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await seedProfile(page);
    for (const s of ['seances', 'disciplines', 'programmes']) {
      await page.goto(`/#/entrainer?espace=${s}`);
      await expect(page.locator('.train-panel a, .train-panel button').first()).toBeVisible();
      await page.waitForTimeout(300);
      // scrolled to the very end, the last control of the space sits above the bar
      const r = await page.evaluate(async () => {
        const items = [...document.querySelectorAll('.train-panel a, .train-panel button')].filter((e) => e.getBoundingClientRect().height > 0);
        const last = items[items.length - 1];
        last.scrollIntoView({ block: 'end' });
        for (let el: Element | null = last; el; el = el.parentElement) if (el.scrollHeight > el.clientHeight + 1) el.scrollTop = el.scrollHeight;
        window.scrollTo(0, document.scrollingElement!.scrollHeight);
        await new Promise((res) => setTimeout(res, 250));
        const nav = document.querySelector('nav.nav-bottom')!.getBoundingClientRect();
        return { navTop: nav.top, last: last.getBoundingClientRect().bottom, overflow: document.scrollingElement!.scrollWidth - innerWidth };
      });
      expect(r.last, s).toBeLessThanOrEqual(r.navTop);
      expect(r.overflow, s).toBeLessThanOrEqual(0);
    }
  });
});
