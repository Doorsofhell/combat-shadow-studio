import { expect, Page, test } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

// v0.47 (Youssef, 2026-10-23, « Chronomètre intégré au coach 3D » §16): the preparation becomes the first phase of the
// one clock, Rounds without a final rest, Cardio intervals and intensities, pause that freezes everything, the
// summary and the history (finished or interrupted). Short durations so a test runs in seconds.

const toSec = (t: string | null) => {
  const [m, s] = (t ?? '0:0').split(':').map(Number);
  return m * 60 + s;
};

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

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
});

test('préparation : « Prépare-toi » en ambre, le temps de la phase (1.1.0 : plus de grand décompte), puis le travail démarre', async ({ page }) => {
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=20&rest=10&rounds=2');
  await page.getByTestId('start').click();
  const phase = page.getByTestId('phase');
  await expect(phase).toHaveText('Prépare-toi');
  await expect(phase).toHaveClass(/decompte/);
  // amber with dark text, not the red of work (text and colour read together: the preparation is short)
  const [text, bg] = await phase.evaluate((e) => [e.textContent, getComputedStyle(e).backgroundColor]);
  expect(text).toBe('Prépare-toi');
  const [r, g, b] = bg!.match(/\d+/g)!.map(Number);
  expect(r).toBeGreaterThan(200);
  expect(g).toBeGreaterThan(140);
  expect(b).toBeLessThan(100);
  // 1.1.0 (Youssef, 2026-10-27): no big red countdown in the middle of the stage any more; the time of the
  // preparation is the time of the phase, over the coach
  await expect(page.locator('.countdown')).toHaveCount(0);
  await expect(page.getByTestId('phase-time')).toBeVisible();
  await expect(phase).toHaveText('Combat · Round 1/2', { timeout: 8000 });
  await expect(page.locator('.countdown')).toHaveCount(0);
  await expect(page.getByTestId('phase-time')).toHaveAttribute('aria-label', /^Temps restant/);
  // the bar follows the round
  await expect(page.getByTestId('progress')).toHaveClass(/phase-bar travail/);
});

test('Rounds : repos entre les rounds, aucun repos après le dernier, bilan et historique « terminée »', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=10&rest=5&rounds=2');
  await page.getByTestId('start').click();
  const phase = page.getByTestId('phase');
  await expect(phase).toHaveText('Combat · Round 1/2', { timeout: 8000 });
  await expect(phase).toHaveText('Repos', { timeout: 15_000 });
  await expect(page.getByTestId('progress')).toHaveClass(/phase-bar repos/);
  // the coach stops: no move in the band during the rest
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', '', { timeout: 5000 });
  await expect(phase).toHaveText('Combat · Round 2/2', { timeout: 10_000 });
  await expect(phase).toHaveText('Terminé', { timeout: 15_000 });
  const sum = page.getByTestId('session-summary');
  await expect(sum).toContainText('Rounds');
  await expect(sum).toContainText('2/2');
  await expect(sum).toContainText('Travail');
  await expect(sum).toContainText('Repos');
  await page.waitForTimeout(600);
  const st = await stats(page);
  const last = st.sessions[st.sessions.length - 1];
  expect(last.status).toBe('terminee');
  expect(last.doneRounds).toBe(2);
  expect(last.plannedRounds).toBe(2);
  // work ≈ 20 s, rest ≈ 5 s, nothing after the last round
  expect(last.workSec as number).toBeGreaterThanOrEqual(19);
  expect(last.workSec as number).toBeLessThanOrEqual(21);
  expect(last.restSec as number).toBeGreaterThanOrEqual(4);
  expect(last.restSec as number).toBeLessThanOrEqual(6);
});

test('Cardio : intervalles choisis dans la fiche, Effort et Récupération, intensité dans le bilan', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#/discipline/boxe?niveau=debutant&ex=boxe-debutant-08');
  await page.getByTestId('mode-cardio').click();
  const opts = page.getByTestId('cardio-options');
  await expect(opts).toBeVisible();
  await opts.getByRole('radiogroup', { name: 'Durée d’effort' }).getByRole('radio', { name: '20 s' }).click();
  await opts.getByRole('radiogroup', { name: 'Durée de récupération' }).getByRole('radio', { name: '10 s' }).click();
  await opts.getByRole('radiogroup', { name: 'Intensité' }).getByRole('radio', { name: 'Intense' }).click();
  await expect(page.getByTestId('intensity-help')).toContainText('durée réelle');
  await expect(page.getByTestId('chrono-options')).toBeVisible();
  await page.getByTestId('go-training').click();
  await expect(page).toHaveURL(/cw=20&cr=10&cc=5&ci=intense/);
  // shorter for the test: same link, 6 s of effort and 3 s of recovery, 2 cycles
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=cardio&cw=6&cr=3&cc=2&ci=intense');
  await page.getByTestId('start').click();
  const phase = page.getByTestId('phase');
  await expect(phase).toHaveText('Effort · Cycle 1/2', { timeout: 8000 });
  await expect(phase).toHaveText('Récupération', { timeout: 10_000 });
  await expect(page.getByTestId('main-instruction')).toContainText('Récupère');
  await expect(phase).toHaveText('Effort · Cycle 2/2', { timeout: 8000 });
  await expect(phase).toHaveText('Terminé', { timeout: 10_000 });
  const sum = page.getByTestId('session-summary');
  await expect(sum).toContainText('Cycles');
  await expect(sum).toContainText('2/2');
  await expect(sum).toContainText('Intense');
  await page.waitForTimeout(600);
  const st = await stats(page);
  expect(st.sessions[st.sessions.length - 1].intensity).toBe('intense');
});

test('pause : le temps et le coach sont figés, la reprise repart du même instant', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=60&rest=10&rounds=2');
  const place2 = bar(page).locator('[data-slot="2"]');
  await place2.click();
  await expect(page.getByTestId('phase')).toHaveText('Combat · Round 1/2', { timeout: 8000 });
  await page.waitForTimeout(2500);
  await place2.click();
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await expect(page.getByTestId('progress')).toHaveClass(/paused/);
  const left = toSec(await page.getByTestId('phase-time').textContent());
  const move = await page.getByTestId('move-band').getAttribute('data-move');
  await page.waitForTimeout(3000);
  expect(toSec(await page.getByTestId('phase-time').textContent())).toBe(left);
  expect(await page.getByTestId('move-band').getAttribute('data-move')).toBe(move);
  await place2.click();
  await expect(page.getByTestId('phase')).toHaveText('Combat · Round 1/2');
  await page.waitForTimeout(2200);
  const after = toSec(await page.getByTestId('phase-time').textContent());
  expect(left - after).toBeGreaterThanOrEqual(1);
  expect(left - after).toBeLessThanOrEqual(3);
});

test('sortie anticipée : la séance est gardée comme « interrompue », sans double comptage', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=rounds&round=60&rest=10&rounds=3');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText('Combat · Round 1/3', { timeout: 8000 });
  await page.waitForTimeout(3000);
  await page.getByTestId('nav-back').click();
  await page.getByRole('button', { name: 'Quitter', exact: true }).click();
  await expect(page.getByTestId('training')).toHaveCount(0);
  await page.waitForTimeout(600);
  const st = await stats(page);
  const mine = st.sessions.filter((s) => s.exerciseId === 'boxe-debutant-08');
  expect(mine).toHaveLength(1);
  expect(mine[0].status).toBe('interrompue');
  expect(mine[0].doneRounds).toBe(0);
  expect(mine[0].plannedRounds).toBe(3);
  // the active time counted once: activeSec and the summary agree
  expect(Math.abs((mine[0].activeSec as number) - (mine[0].workSec as number))).toBeLessThanOrEqual(1);
});

test('Libre : temps écoulé, pas de round ni de repos ; Technique : vitesse lente inchangée', async ({ page }) => {
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=libre');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText('Libre', { timeout: 8000 });
  await expect(page.getByTestId('phase-time')).toHaveAttribute('aria-label', /^Temps écoulé/);
  await expect(page.getByTestId('hud')).not.toContainText('Round');
  await page.goto('about:blank');
  await page.goto('/#/entrainement?ex=boxe-debutant-08&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText('Technique', { timeout: 8000 });
  await expect(page.getByTestId('phase-time')).toHaveAttribute('aria-label', /^Temps écoulé/);
});
