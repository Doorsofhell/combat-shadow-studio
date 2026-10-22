import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { Seed, open, seed, view } from './progress-seed';
import { menuCommand } from './nav-helpers';

/**
 * Progrès: dashboard over a period compared with the previous one of the same length, one screen
 * without vertical scrolling. Sessions are seeded relative to today (local time), so the 7-day
 * period holds days 0..6 and the previous one days 7..13.
 */
test('1. rise in activity: time up with its percentage and its absolute difference', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 9, sec: 600 },
      { daysAgo: 1, sec: 600 },
      { daysAgo: 2, sec: 600 },
    ],
    view({}),
  );
  await open(page);
  await expect(page.getByTestId('total-time')).toHaveText('20 min 00');
  await expect(page.getByTestId('total-time-delta')).toHaveAttribute('data-trend', 'up');
  await expect(page.getByTestId('total-time-delta')).toContainText('+100 %');
  await page.getByTestId('open-comparison').click();
  await expect(page.getByTestId('comparison-table')).toContainText('+100 % (+10 min 00)');
  await expect(page.getByText('Une baisse de temps n’indique pas une baisse de niveau technique', { exact: false })).toBeVisible();
});

test('2. drop in activity: time down, described as volume', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 8, sec: 1800 },
      { daysAgo: 1, sec: 900 },
    ],
    view({}),
  );
  await open(page);
  await expect(page.getByTestId('total-time-delta')).toHaveAttribute('data-trend', 'down');
  await expect(page.getByTestId('total-time-delta')).toContainText('−50 %');
});

test('3. identical periods read as stable', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 8, sec: 600, reps: 10 },
      { daysAgo: 1, sec: 600, reps: 10 },
    ],
    view({}),
  );
  await open(page);
  for (const id of ['total-time-delta', 'kpi-sessions-delta', 'kpi-reps-delta']) {
    await expect(page.getByTestId(id)).toHaveAttribute('data-trend', 'flat');
    await expect(page.getByTestId(id)).toContainText('stable');
  }
});

test('4. previous period empty: "Nouvelle activité", never a percentage from zero', async ({ page }) => {
  await seed(page, [{ daysAgo: 1, sec: 600, reps: 5 }], view({}));
  await open(page);
  await expect(page.getByTestId('total-time-delta')).toHaveText(/Nouvelle activité/);
  await expect(page.getByTestId('kpi-reps-delta')).toHaveText(/Nouvelle activité/);
  await expect(page.getByTestId('progress-dashboard')).not.toContainText(/Infinity|NaN/);
});

test('5. current period empty: zero values, an empty state, the history kept', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 9, sec: 600 },
      { daysAgo: 40, sec: 300 },
    ],
    view({ tab: 'historique' }),
  );
  await open(page);
  await expect(page.getByTestId('total-time')).toHaveText('0 s');
  await expect(page.getByTestId('total-time-delta')).toHaveAttribute('data-trend', 'down');
  await expect(page.getByTestId('ppanel-historique')).toContainText('Aucune séance sur la période');
  await page.getByTestId('period-90j').click();
  await expect(page.getByTestId('total-time')).toHaveText('15 min 00');
});

test('6. custom period with start and end dates, compared with the same number of days before', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 20, sec: 300 },
      { daysAgo: 21, sec: 300 },
      { daysAgo: 23, sec: 300 },
    ],
    view({}),
  );
  await open(page);
  const key = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  await page.getByTestId('period-perso').click();
  await page.getByTestId('custom-from').fill(key(21));
  await page.getByTestId('custom-to').fill(key(20));
  await page.getByTestId('custom-apply').click();
  await expect(page.getByTestId('period-perso')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('total-time')).toHaveText('10 min 00');
  // previous period = the 2 days before: only day 22 and 23, so 5 min
  await expect(page.getByTestId('total-time-delta')).toContainText('+100 %');
  // an end before the start cannot be applied
  await page.getByTestId('period-perso').click();
  await page.getByTestId('custom-from').fill(key(2));
  await page.getByTestId('custom-to').fill(key(5));
  await expect(page.getByTestId('custom-apply')).toBeDisabled();
});

test('7. changing discipline keeps the period and never mixes disciplines', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 1, sec: 600 },
      { daysAgo: 2, sec: 1200, discipline: 'judo' },
      { daysAgo: 40, sec: 900, discipline: 'judo' },
    ],
    view({ preset: '30j' }),
  );
  await open(page);
  await expect(page.getByTestId('total-time')).toHaveText('30 min 00');
  await page.getByTestId('disc-judo').click();
  await expect(page.getByTestId('total-time')).toHaveText('20 min 00');
  await expect(page.getByTestId('period-30j')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('total-time-delta')).toContainText('+33 %');
  await page.getByTestId('disc-boxe').click();
  await expect(page.getByTestId('total-time')).toHaveText('10 min 00');
  await expect(page.getByTestId('total-time-delta')).toHaveText(/Nouvelle activité/);
  // the course gauge follows the discipline
  await expect(page.getByTestId('course-gauge')).toHaveAttribute('aria-label', /Parcours Boxe/);
  await page.getByTestId('period-7j').click();
  await expect(page.getByTestId('disc-boxe')).toHaveAttribute('aria-selected', 'true');
});

test('8. tab change: levels, categories, exercises and history with session details', async ({ page }) => {
  await seed(
    page,
    [
      { daysAgo: 1, sec: 600, reps: 12 },
      { daysAgo: 2, sec: 300, level: 'expert', reps: 4 },
      { daysAgo: 8, sec: 200 },
    ],
    view({}),
  );
  await open(page);
  await page.getByTestId('ptab-niveaux').click();
  await expect(page.getByTestId('row-debutant')).toContainText('10 min 00');
  await expect(page.getByTestId('row-expert')).toContainText('5 min 00');
  await page.getByTestId('ptab-categories').click();
  await expect(page.getByTestId('ppanel-categories')).toContainText(/min/);
  await page.getByTestId('ptab-exercices').click();
  await expect(page.getByTestId('ex-boxe-debutant-01')).toContainText('12 rép.');
  await page.getByTestId('ptab-historique').click();
  await expect(page.getByTestId('session-row')).toHaveCount(2);
  await page.getByTestId('session-row').first().click();
  await expect(page.getByTestId('session-detail')).toContainText('pauses ne sont pas comptées');
  await page.keyboard.press('Escape');
  // the chosen tab is remembered
  await page.reload();
  await expect(page.getByTestId('ptab-historique')).toHaveAttribute('aria-selected', 'true');
  // filters: one level only
  await page.getByTestId('progress-filters').click();
  await page.getByTestId('flevel-expert').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('total-time')).toHaveText('5 min 00');
  await expect(page.getByTestId('period-caption')).toContainText('Expert');
});

test('9. existing data, goals and favourites are preserved', async ({ page }) => {
  const goals = {
    'u:local:css-goals': {
      state: {
        goals: { weeklyMinutes: 90, weeklySessions: 3 },
        favTechniques: ['jab'],
        favExercises: [],
      },
      version: 0,
    },
  };
  const data = [
    { daysAgo: 1, sec: 600 },
    { daysAgo: 100, sec: 300 },
    { daysAgo: 400, sec: 120 },
  ];
  await seed(page, data, goals);
  await open(page);
  await page.getByTestId('period-90j').click();
  await page.getByTestId('disc-judo').click();
  await page.getByTestId('ptab-historique').click();
  const stored = await page.evaluate(
    () =>
      new Promise<string>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const q = r.result.transaction('keyval').objectStore('keyval').get('u:local:css-stats');
          q.onsuccess = () => res(q.result);
        };
      }),
  );
  expect(JSON.parse(stored).state.sessions).toHaveLength(3);
  // v0.32: Objectifs is a command of the Menu (« Sur cet écran »)
  await menuCommand(page, 'goals-link');
  await expect(page.getByTestId('goals-page')).toContainText('90 min');
  await expect(page.getByTestId('goals-page')).toContainText('Jab');
  await expect(page.getByTestId('edit-goals')).toBeVisible();
  await page.goto('/#/historique');
  await expect(page.locator('.list-row')).toHaveCount(3);
});

for (const scheme of ['dark', 'light'] as const)
  for (const [w, h] of [
    [360, 640],
    [360, 740],
    [412, 915],
  ])
    test(`10. no vertical scroll on Android ${w}×${h} (${scheme})`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.emulateMedia({ colorScheme: scheme });
      const xs: Seed[] = [];
      for (let i = 0; i < 28; i++)
        xs.push({
          daysAgo: i,
          sec: 300 + ((i * 97) % 900),
          reps: 10,
          level: ['debutant', 'intermediaire', 'avance', 'expert'][i % 4],
          at: i,
        });
      await seed(page, xs, view({ preset: '30j' }));
      await open(page);
      for (const tab of ['activite', 'niveaux', 'categories', 'exercices', 'historique']) {
        await page.getByTestId(`ptab-${tab}`).click();
        await page.waitForTimeout(150);
        const m = await page.evaluate(() => ({
          sh: document.scrollingElement!.scrollHeight,
          ih: window.innerHeight,
          sw: document.scrollingElement!.scrollWidth,
          iw: window.innerWidth,
        }));
        expect(m.sh, `${tab}: page height ${m.sh} > ${m.ih}`).toBeLessThanOrEqual(m.ih);
        expect(m.sw).toBeLessThanOrEqual(m.iw);
        // the chart area stays above the navigation bar
        const body = await page.getByTestId(`ppanel-${tab}`).boundingBox();
        const nav = await page.locator('.nav').boundingBox();
        expect(body!.y + body!.height).toBeLessThanOrEqual(nav!.y + 1);
        if (process.env.PROGRESS_SHOTS)
          await page.screenshot({
            path: `${process.env.PROGRESS_SHOTS}/progres-${w}x${h}-${scheme}-${tab}.png`,
          });
      }
    });

for (const scheme of ['dark', 'light'] as const)
  test(`text contrast with data, every tab (${scheme})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.emulateMedia({ colorScheme: scheme });
    await seed(
      page,
      [
        { daysAgo: 1, sec: 600, reps: 12 },
        { daysAgo: 2, sec: 300, level: 'expert', reps: 4 },
        { daysAgo: 9, sec: 800 },
        { daysAgo: 10, sec: 100 },
      ],
      view({}),
    );
    await open(page);
    const bad: string[] = [];
    for (const tab of ['activite', 'niveaux', 'categories', 'exercices', 'historique']) {
      await page.getByTestId(`ptab-${tab}`).click();
      await page.waitForTimeout(150);
      const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      bad.push(...r.violations.flatMap((v) => v.nodes.map((n) => `${tab} ${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`)));
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
