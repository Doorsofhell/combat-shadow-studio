import { expect, test, type Page } from '@playwright/test';
import { openSetting, seedProfile } from './nav-helpers';
import { INSTRUCTIONS } from '../../src/domain/instructions';

/**
 * 1.3.0 (Youssef, 2026-10-28: « A avec un enchaînement temporisé des consignes pour gain de place », « mode Enchaîné
 * ==> OK »): during the session the instructions of the move follow one another on the floor under the coach (the
 * main sentence, then each key point, then again), with segments that show the progress; the pause stops them; they
 * stay in fullscreen; the camera keeps the feet of the coach above them. Also: the button « S'entraîner » of a
 * technique sheet is never greyed out and no longer covers the camera angles.
 */

test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

const JAB = INSTRUCTIONS.jab;
type Cam = { insetBottom?: number; floorY?: number };
const camera = (page: Page) => page.evaluate(() => (window as unknown as { __cssCamera?: Cam }).__cssCamera ?? {});

async function startJab(page: Page, settings?: Record<string, unknown>) {
  await seedProfile(page, {}, settings);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('consignes')).toBeVisible({ timeout: 60_000 });
}

test('la consigne principale, puis chaque point clé, une ligne à la fois, avec les segments', async ({ page }) => {
  await startJab(page, { consigneSec: 2.5 });
  const band = page.getByTestId('consignes');
  await expect(band).toHaveAttribute('data-technique', 'jab');
  await expect(page.getByTestId('consigne-line')).toHaveCount(1);
  await expect(band.locator('.cons-segs i')).toHaveCount(JAB.points.length + 1);
  // one line after the other, in the order of the sheet, then again
  const seen: string[] = [];
  for (let i = 0; i < JAB.points.length + 2; i++) {
    const text = (await page.getByTestId('consigne-line').textContent())!;
    if (seen.at(-1) !== text) seen.push(text);
    await page.waitForTimeout(2500);
  }
  const all = [JAB.main, ...JAB.points.map((p) => p.text)];
  const start = all.indexOf(seen[0]);
  expect(start, seen[0]).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < seen.length; i++) expect(seen[i]).toBe(all[(start + i) % all.length]);
  expect(new Set(seen).size).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('consigne-count')).toHaveText(/^\d \/ 6$/);
});

test('la pause arrête l’enchaînement, la reprise le relance', async ({ page }) => {
  await startJab(page, { consigneSec: 2.5 });
  await page.getByTestId('fullscreen').click();
  const band = page.getByTestId('consignes');
  await expect(band).toBeVisible();
  // in fullscreen a tap on the stage shows the controls; the pause is the main control
  await page.getByTestId('training-stage').click({ position: { x: 60, y: 200 } });
  await page.getByTestId('pause').click();
  await expect(band).toHaveAttribute('data-paused', 'true');
  const index = await band.getAttribute('data-index');
  await page.waitForTimeout(6000);
  await expect(band).toHaveAttribute('data-index', index!);
  await page.getByTestId('training-stage').click({ position: { x: 60, y: 200 } });
  await page.getByTestId('resume').click();
  await expect(band).not.toHaveAttribute('data-paused', 'true');
  await expect(band).not.toHaveAttribute('data-index', index!, { timeout: 6000 });
});

test('le texte ne couvre jamais le coach : la caméra garde ses pieds au-dessus de la bande', async ({ page }) => {
  await startJab(page);
  const box = async () => {
    const [stage, band] = await Promise.all([page.getByTestId('training-stage').boundingBox(), page.getByTestId('consignes').boundingBox()]);
    return { stage: stage!, band: band! };
  };
  for (const fs of [false, true]) {
    if (fs) await page.getByTestId('fullscreen').click();
    await expect.poll(async () => (await camera(page)).insetBottom ?? 0, { timeout: 20_000 }).toBeGreaterThan(0.05);
    await page.waitForTimeout(2500);
    const { stage, band } = await box();
    const cam = await camera(page);
    const floor = stage.y + cam.floorY! * stage.height;
    expect(floor, `${fs ? 'plein écran' : 'normal'} : sol ${Math.round(floor)} / bande ${Math.round(band.y)}`).toBeLessThan(band.y);
  }
});

test('mode jour et mode nuit : la consigne est lisible sur le sol sombre de la scène', async ({ page }) => {
  for (const theme of ['clair', 'sombre'] as const) {
    await startJab(page, { theme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'clair' ? 'light' : 'dark');
    // light text on the dark band, in both themes (the floor of the stage is dark by day too)
    const [fg, bg] = await page.getByTestId('consigne-line').evaluate((e) => [getComputedStyle(e).color, getComputedStyle(e.closest('.tr-consignes')!).backgroundImage]);
    expect(fg, theme).toBe('rgb(244, 244, 245)');
    expect(bg, theme).toContain('rgba(10, 14, 20, 0.92)');
  }
});

test('Réglages : « Point du moment » remet la bande d’avant, le temps se choisit entre 2,5, 3,5 et 5 s', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/reglages');
  await openSetting(page, 'consignes');
  for (const n of ['2,5 s', '3,5 s', '5 s']) await expect(page.getByRole('radio', { name: n, exact: true }), n).toBeVisible();
  await expect(page.getByRole('radio', { name: '3,5 s', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Point du moment', exact: true }).click();
  await expect(page.getByRole('radio', { name: '5 s', exact: true })).toHaveCount(0);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('move-band')).toHaveAttribute('data-move', /.+/, { timeout: 60_000 });
  await expect(page.getByTestId('consignes')).toHaveCount(0);
});

test('fiche technique : « S’entraîner » toujours actif, et les angles de caméra visibles au-dessus', async ({ page }) => {
  await seedProfile(page, { disciplines: ['mma'], mainDiscipline: 'mma' });
  // no MMA exercise works the high kick of the front leg: the technique is trained alone
  await page.goto('/#/techniques/high-kick-avant?d=mma');
  const train = page.getByTestId('nav-train');
  await expect(train).toBeEnabled();
  const cam = page.getByRole('radio', { name: 'Face', exact: true });
  await expect(cam).toBeVisible();
  const [c, b] = await Promise.all([cam.boundingBox(), train.boundingBox()]);
  expect(c!.y + c!.height, 'angles au-dessus du bouton').toBeLessThanOrEqual(b!.y);
  await train.click();
  await expect(page).toHaveURL(/#\/entrainement\?tech=high-kick-avant&d=mma/);
  await expect(page.getByTestId('exercise-name')).toContainText('High kick');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('consignes')).toHaveAttribute('data-technique', 'high-kick-avant', { timeout: 60_000 });
});
