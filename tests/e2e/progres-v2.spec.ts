import { expect, test } from '@playwright/test';
import { seed, view } from './progress-seed';
import { bar, barSlots } from './nav-helpers';

// 0.39 (Youssef, 2026-10-22, « Refonte premium de l'espace Progrès », docs/design/progres/): one big ring, three
// figures, details on tap; only recorded data, never a percentage without its total

test('vue d’ensemble : un anneau avec son total, trois chiffres, les détails au toucher', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 0, sec: 600 },
      { daysAgo: 1, sec: 900 },
      { daysAgo: 2, sec: 300 },
      { daysAgo: 20, sec: 1200 },
    ],
    view({ preset: '7j' }),
  );
  await page.goto('about:blank');
  await page.goto('/#/stats');
  await expect(page.getByTestId('progress-overview')).toBeVisible();
  // 1.0.0: the Progrès tab is a root (no Retour); 1.1.0: its actions are in the ⋮ at the top right
  await expect(await barSlots(page)).toEqual([]);
  await page.getByTestId('nav-menu').click();
  await expect(page.getByTestId('nav-menu-sheet').locator('.nav-menuitem[data-action] span:not(.nav-menucheck)')).toHaveText(['Période', 'Statistiques', 'Historique']);
  await page.keyboard.press('Escape');
  // no goal: the course, written as « n / total »
  await expect(page.getByTestId('main-ring-value')).toHaveText(/^\d+ \/ \d+$/);
  await expect(page.getByTestId('main-ring')).toHaveAttribute('aria-label', /Parcours : \d+ \/ \d+ techniques étudiées/);
  await expect(page.getByTestId('total-time')).toHaveText('30 min 00');
  await expect(page.getByTestId('kpi-sessions')).toContainText('3');
  await expect(page.getByTestId('kpi-streak')).toContainText('3 j');
  // the period changes every figure
  await page.getByTestId('period-30j').click();
  await expect(page.getByTestId('total-time')).toHaveText('50 min 00');
  await expect(page.getByTestId('kpi-sessions')).toContainText('4');
  // never a bare figure without a stated total, no invented measure
  await expect(page.locator('body')).not.toContainText(/kcal|calorie|fréquence cardiaque|intensité|condition physique|coups/i);
  // each detail on tap
  await page.getByTestId('go-techniques').click();
  await expect(page.getByTestId('p2-techniques')).toBeVisible();
  await expect(page.getByTestId('tech-ring')).toHaveAttribute('aria-label', /\d+ techniques assimilées sur \d+/);
  await page.goBack();
  await page.getByTestId('go-disciplines').click();
  await expect(page.getByTestId('p2-disc-boxe')).toContainText('techniques étudiées');
  await page.getByTestId('p2-disc-boxe').click();
  await expect(page).toHaveURL(/#\/stats\/techniques\?d=boxe$/);
  await page.goto('/#/stats');
  await page.getByTestId('go-enchainements').click();
  await expect(page.getByTestId('p2-combos')).toContainText('Aucun enchaînement créé');
  await page.goto('/#/stats');
  await page.getByTestId('kpi-time').click();
  await expect(page).toHaveURL(/#\/stats\/activite$/);
  await expect(page.getByTestId('progress-dashboard')).toBeVisible();
});

test('objectif défini : l’anneau suit l’objectif de la semaine, et le mène aux objectifs', async ({ page }) => {
  await seed(page, [{ daysAgo: 0, sec: 600 }], {
    ...view({}),
    'u:local:css-goals': { state: { goals: { weeklyMinutes: 0, weeklySessions: 4 }, favTechniques: [], favExercises: [], mastery: {} }, version: 0 },
  });
  await page.goto('about:blank');
  await page.goto('/#/stats');
  await expect(page.getByTestId('main-ring-value')).toHaveText('1 / 4');
  await expect(page.getByTestId('main-ring')).toHaveAttribute('aria-label', 'Objectif de la semaine : 1 / 4 jours d’entraînement');
  await page.getByTestId('main-ring-link').click();
  await expect(page).toHaveURL(/#\/objectifs$/);
});

test('aucune séance : zéros, état vide, et les détails restent accessibles', async ({ page }) => {
  await seed(page, [], view({}));
  await page.goto('about:blank');
  await page.goto('/#/stats');
  await expect(page.getByTestId('total-time')).toHaveText('0 s');
  await expect(page.getByTestId('kpi-streak')).toContainText('aucune en cours');
  await expect(page.getByTestId('p2-empty')).toBeVisible();
  await expect(page.getByTestId('main-ring')).toHaveAttribute('data-value', '0');
  await page.getByTestId('go-historique').click();
  await expect(page).toHaveURL(/#\/historique$/);
});

test('détail : la barre ramène à la vue d’ensemble ; petit écran sans défilement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seed(page, [{ daysAgo: 1, sec: 600 }], view({}));
  await page.goto('about:blank');
  await page.goto('/#/stats/disciplines');
  // 1.0.0: « Vue d’ensemble » leads to /stats, the Progrès tab itself (and Retour): the dock does not repeat a tab
  await expect(await barSlots(page)).toEqual([['back', 'Retour']]);
  await page.getByTestId('nav-menu').click();
  await expect(page.getByTestId('nav-menu-sheet').locator('.nav-menuitem[data-action] span:not(.nav-menucheck)')).toHaveText(['Période', 'Historique']);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('nav-stats')).toBeVisible();
  for (const path of ['/#/stats', '/#/stats/techniques', '/#/stats/disciplines', '/#/stats/enchainements']) {
    await page.goto(path);
    await page.waitForTimeout(400);
    const over = await page.evaluate(() => document.scrollingElement!.scrollWidth - window.innerWidth);
    expect(over, path).toBeLessThanOrEqual(0);
  }
  // back to the overview: the Progrès tab (1.0.0), and Retour
  await page.goto('/#/stats/disciplines');
  await page.getByTestId('nav-stats').click();
  await expect(page).toHaveURL(/#\/stats$/);
  await page.goto('/#/stats/disciplines');
  await bar(page).locator('[data-action="back"]').click();
  await expect(page).toHaveURL(/#\/stats$/);
});
