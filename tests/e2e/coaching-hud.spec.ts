import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { menuCommand } from './nav-helpers';
import { TECHNIQUE_BY_ID } from '../../src/domain/techniques';

/**
 * 0.35 coaching HUD (Youssef, 2026-10-22): a compact chronometer on top, and under the coach a band that shows only the
 * move being played, from the start of its motion to its end. The band is read at every frame of the page
 * (requestAnimationFrame), as a person would see it.
 */
async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (profile) => {
    await new Promise<void>((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      };
    });
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme' });
}

async function open(page: Page, path: string) {
  await page.goto('about:blank');
  await page.goto(path);
  await page.getByTestId('start').waitFor();
}

/** what the band shows at every frame for `ms`: the names (in order, repeats collapsed) and the most shown at once */
async function watchBand(page: Page, ms: number) {
  return page.evaluate(
    (ms) =>
      new Promise<{ seq: string[]; maxAtOnce: number; empty: number; frames: number }>((res) => {
        const seq: string[] = [];
        let maxAtOnce = 0;
        let empty = 0;
        let frames = 0;
        const t0 = performance.now();
        const step = () => {
          const names = [...document.querySelectorAll('[data-testid=move-band] .band-name')].map((e) => e.textContent ?? '');
          maxAtOnce = Math.max(maxAtOnce, names.length);
          frames++;
          const now = names[0] ?? '';
          if (!now) empty++;
          if (seq[seq.length - 1] !== now) seq.push(now);
          if (performance.now() - t0 < ms) requestAnimationFrame(step);
          else res({ seq, maxAtOnce, empty, frames });
        };
        requestAnimationFrame(step);
      }),
    ms,
  );
}

test('Jab → Direct arrière → Low kick droit : chaque nom pendant son coup, rien en garde, jamais deux à la fois', async ({ page }) => {
  test.setTimeout(150_000);
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=technique');
  // ready: the full combination is named once in the info (not in the HUD), the band shows no move
  await expect(page.getByTestId('hud')).not.toContainText('Low kick');
  await expect(page.getByTestId('exercise-name')).toHaveText('Jab → Direct arrière → Low kick droit');
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', '');
  const h0 = (await page.getByTestId('move-band').boundingBox())!.height;
  await page.getByTestId('start').click();
  // the countdown: still no move
  await expect(page.getByTestId('phase')).toHaveText('Prépare-toi');
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', '');
  await expect(page.getByTestId('phase')).not.toHaveText('Prépare-toi', { timeout: 10_000 });
  // (the browser of the tests draws few frames per second: the motions take longer in real time, never shorter)
  const r = await watchBand(page, 30_000);
  const names = r.seq.filter(Boolean);
  // the order of the combination, each move once per repetition, with the band empty between two repetitions
  expect(names.slice(0, 4)).toEqual(['Jab', 'Direct arrière', 'Low kick droit', 'Jab']);
  const i = r.seq.indexOf('Low kick droit');
  expect(r.seq[i + 1], 'après le low kick, la garde : bandeau vide').toBe('');
  expect(r.maxAtOnce).toBe(1);
  expect(r.empty).toBeGreaterThan(0);
  // the full combination is no longer shown while the coach works, and the band never changes height
  await expect(page.getByTestId('exercise-name')).toHaveCount(0);
  expect((await page.getByTestId('move-band').boundingBox())!.height).toBe(h0);
});

test('pause au milieu d’un coup : le nom reste figé avec le coach ; reprise : il finit puis laisse la place', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=technique');
  await page.getByTestId('start').click();
  // countdown, then the first move (the test browser draws few frames: allow for a slow start)
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', /.+/, { timeout: 45_000 });
  await page.getByTestId('pause').click();
  const frozen = await page.getByTestId('move-band').getAttribute('data-move');
  const t0 = await page.getByTestId('session-time').textContent();
  const r = await watchBand(page, 2500);
  expect(new Set(r.seq).size, 'aucun changement pendant la pause').toBe(1);
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await expect(page.getByTestId('session-time'), 'le chrono est arrêté').toHaveText(t0!);
  await page.getByTestId('resume').click();
  // after resuming, the same move first (if it was shown), then the band moves on
  const after = await watchBand(page, 6000);
  if (frozen) expect(after.seq.filter(Boolean)[0]).toBe(TECHNIQUE_BY_ID.get(frozen)!.name);
  expect(after.seq.filter(Boolean).length).toBeGreaterThan(1);
});

test('vitesse ×0,25 (ralenti) : mêmes coups, toujours un seul nom', async ({ page }) => {
  test.setTimeout(150_000);
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=technique');
  await menuCommand(page, 'slow');
  await page.getByTestId('start').click();
  // at a quarter of the speed every motion lasts four times longer, the guard before the first move too
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', /.+/, { timeout: 60_000 });
  await expect(page.getByTestId('current-move')).toHaveText('Jab');
  const r = await watchBand(page, 9000);
  expect(r.seq.filter(Boolean)[0]).toBe('Jab');
  expect(r.maxAtOnce).toBe(1);
});

test('Décomposer : le bandeau nomme la technique étudiée ; le « i » ouvre ses consignes complètes', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=technique');
  await page.getByTestId('decompose').click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  await expect(page.getByTestId('current-move')).toHaveText('Jab');
  await page.getByTestId('band-info').click();
  await expect(page.getByRole('dialog')).toContainText('Jab');
});

test('HUD : rounds avec leur temps restant, repos plus visible, pas de round en mode libre', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=rounds&round=6&rest=20&rounds=2');
  await page.getByTestId('start').click();
  // 0.47 (« Chronomètre intégré au coach 3D » §4): « COMBAT — ROUND 2/5 — 02:34 »
  await expect(page.getByTestId('phase')).toHaveText('Combat · Round 1/2', { timeout: 10_000 });
  await expect(page.getByTestId('phase-time')).toHaveText(/^00:0\d$/);
  await expect(page.getByTestId('phase')).toHaveText('Repos', { timeout: 15_000 });
  await expect(page.getByTestId('phase-time')).toHaveText(/^00:[12]\d$/);
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', '', { timeout: 5000 });
  // session, cumulated time and repetitions stay separate measures, under the band
  await expect(page.getByTestId('timer-row')).toContainText('Séance');
  await expect(page.getByTestId('timer-row')).toContainText('Cumul');
  const m = await page.evaluate(() => ({ sh: document.scrollingElement!.scrollHeight, ih: innerHeight }));
  expect(m.sh).toBeLessThanOrEqual(m.ih);
  await open(page, '/#/entrainement?ex=kickboxing-debutant-10&mode=libre');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('phase')).toHaveText('Libre', { timeout: 10_000 });
  await expect(page.getByTestId('hud')).not.toContainText('Round');
  // 0.47 §5: Libre shows the time done (counted up), never a countdown
  await expect(page.getByTestId('phase-time')).toHaveAttribute('aria-label', /^Temps écoulé/);
  const t1 = await page.getByTestId('phase-time').textContent();
  await expect(page.getByTestId('phase-time')).not.toHaveText(t1!, { timeout: 4000 });
});
