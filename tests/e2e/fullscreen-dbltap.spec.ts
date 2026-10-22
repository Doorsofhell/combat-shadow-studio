import { expect, Locator, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { openCoachIA } from './nav-helpers';

/**
 * 0.27 (Youssef, 2026-10-20 22:09: « Un double clique sur la fenêtre du coach permet un plein écran total, étudie et
 * fait le intelligemment et de manière user friendly »): a quick double tap on a 3D coach view shows it alone on the
 * whole screen; the exit button, Échap or a new double tap bring it back; a drag still turns the camera without
 * toggling; on the training screen the session keeps running. Double tap on the Coach IA header: normal / agrandi.
 */
async function seed(page: Page, settings?: Record<string, unknown>) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, settings }) => {
      const put = (k: string, v: unknown) =>
        new Promise<void>((res, rej) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify(v), k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          };
        });
      await put('u:local:css-profile', { state: { profile }, version: 0 });
      if (settings) await put('u:local:css-settings', { state: { settings }, version: 1 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] }, settings: settings ?? null },
  );
  await page.goto('about:blank');
}

/** fullscreen through the API, or the fixed layer where the API is missing */
const isFull = (page: Page, sel: string) => page.evaluate((s) => !!document.fullscreenElement || !!document.querySelector(s)?.matches('.stage-fs, .immersive'), sel);

/** a quick double tap at a point of the view (top third: the coach, away from the overlays) */
/**
 * the exit button. Reached with the keyboard: focusing it brings the faded controls back, and a mouse click is not
 * reliable here because the software renderer of the tests takes longer than the 2.5 s fade between two frames
 */
async function exitByButton(page: Page) {
  const exit = page.getByTestId('fs-exit');
  await exit.focus();
  await expect(exit).toBeFocused();
  await page.keyboard.press('Enter');
}

async function dbl(page: Page, el: Locator, fx = 0.5, fy = 0.35) {
  const b = (await el.boundingBox())!;
  await page.mouse.dblclick(b.x + b.width * fx, b.y + b.height * fy);
}

test.use({ viewport: { width: 393, height: 851 } });
// the fade of the controls is measured once settled (prefers-reduced-motion turns the 0.25 s fade off)
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('accueil : double tap = plein écran total ; commandes masquées puis réaffichées ; sortie par bouton, Échap, double tap', async ({ page }) => {
  await seed(page, { stageFsHintSeen: true });
  await page.goto('/#/');
  const stage = page.getByTestId('hero-stage');
  await expect(stage.locator('canvas')).toBeVisible();
  await dbl(page, stage);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  expect(await isFull(page, '[data-testid=hero-stage]')).toBe(true);
  // the whole screen: the bottom bar is under it
  const r = await stage.evaluate((e) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, vw: innerWidth, vh: innerHeight }; });
  expect(r.w).toBeGreaterThanOrEqual(r.vw - 1);
  expect(r.h).toBeGreaterThanOrEqual(r.vh - 1);
  const exit = page.getByTestId('fs-exit');
  await expect(exit).toBeVisible();
  await expect(exit).toHaveAttribute('aria-label', 'Quitter le plein écran');
  // the controls fade after 2.5 s, a single tap brings them back
  await expect.poll(() => stage.getAttribute('class'), { timeout: 15_000, intervals: [500] }).toMatch(/fs-idle/);
  expect(await exit.evaluate((e) => [getComputedStyle(e).opacity, getComputedStyle(e).pointerEvents].join(' '))).toBe('0 none');
  const b = (await stage.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.4);
  await expect(stage).not.toHaveClass(/fs-idle/);
  await expect(exit).toHaveCSS('opacity', '1');
  await exitByButton(page);
  await expect(stage).toHaveAttribute('data-fullscreen', 'false');
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  await expect(page.getByTestId('bottom-bar')).toBeVisible();
  // Échap
  await dbl(page, stage);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await page.keyboard.press('Escape');
  await expect(stage).toHaveAttribute('data-fullscreen', 'false');
  // a new double tap
  await dbl(page, stage);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await page.waitForTimeout(400);
  await dbl(page, stage, 0.5, 0.5);
  await expect(stage).toHaveAttribute('data-fullscreen', 'false');
});

test('un glisser tourne la caméra sans basculer en plein écran ; deux appuis lents non plus', async ({ page }) => {
  await seed(page, { stageFsHintSeen: true });
  await page.goto('/#/techniques/jab?d=boxe');
  const stage = page.getByTestId('technique-stage');
  await expect(stage.locator('canvas')).toBeVisible();
  const b = (await stage.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height * 0.4;
  for (let i = 0; i < 2; i++) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 80, y, { steps: 6 });
    await page.mouse.up();
  }
  await page.waitForTimeout(300);
  await expect(stage).toHaveAttribute('data-fullscreen', 'false');
  // the sheet stays the same (the stage's drag is not the sheet's swipe)
  await expect(page).toHaveURL(/#\/techniques\/jab\?d=boxe$/);
  await page.mouse.click(x, y);
  await page.waitForTimeout(450);
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  await expect(stage).toHaveAttribute('data-fullscreen', 'false');
  // a real double tap does switch it
  await page.waitForTimeout(600);
  await dbl(page, stage);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await exitByButton(page);
  await expect(page).toHaveURL(/#\/techniques\/jab\?d=boxe$/);
});

for (const vp of [
  { width: 360, height: 640 },
  { width: 740, height: 360 },
])
  test(`entraînement ${vp.width}×${vp.height} : le double tap passe en plein écran total, la séance continue, la mise en page revient intacte`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seed(page, { stageFsHintSeen: true });
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
    await expect(page.getByTestId('start')).toBeVisible();
    await page.getByTestId('start').click();
    const stage = page.getByTestId('training-stage');
    await dbl(page, stage, 0.4, 0.45);
    await expect(page.getByTestId('training')).toHaveClass(/immersive/);
    const r = await stage.evaluate((e) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, vw: innerWidth, vh: innerHeight }; });
    expect(r.w).toBeGreaterThanOrEqual(r.vw - 1);
    expect(r.h).toBeGreaterThanOrEqual(r.vh - 1);
    // the session keeps running, its main control (v0.32: the bottom bar, Pause in place 2) floats over the stage,
    // then fades
    await expect(page.getByTestId('phase')).not.toHaveText('Pause');
    await expect(page.getByTestId('pause')).toBeVisible();
    await expect.poll(() => page.getByTestId('training').getAttribute('class'), { timeout: 15_000, intervals: [500] }).toMatch(/fs-idle/);
    await expect.poll(() => page.getByTestId('pause').evaluate((e) => getComputedStyle(e.closest('.nav-bottom')!).opacity)).toBe('0');
    await expect(page.getByTestId('phase')).not.toHaveText('Pause');
    const b = (await stage.boundingBox())!;
    await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.45);
    await expect(page.getByTestId('training')).not.toHaveClass(/fs-idle/);
    // out by a new double tap
    await page.waitForTimeout(400);
    await dbl(page, stage, 0.4, 0.45);
    await expect(page.getByTestId('training')).not.toHaveClass(/immersive/);
    await expect(page.getByTestId('phase')).not.toHaveText('Pause');
    // the usual layout is back: title, stage, instructions, controls, nothing over another, no scrolling
    const after = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      // v0.32: the session's controls are the bottom bar (below the instructions), .tr-bottom holds nothing any more
      return { scroll: document.scrollingElement!.scrollHeight - innerHeight, top: r('.tr-top').height, stage: r('.tr-stage'), info: r('.tr-info'), bottom: r('[data-testid=bottom-bar]'), pos: getComputedStyle(document.querySelector('[data-testid=bottom-bar]')!).position, land: innerWidth > innerHeight };
    });
    expect(after.scroll).toBeLessThanOrEqual(0);
    expect(after.top).toBeGreaterThan(20);
    expect(after.pos).toBe('fixed');
    // the bar comes back (its fade back runs over the next frames)
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=bottom-bar]')!).opacity)).toBe('1');
    expect(after.stage.height).toBeGreaterThan(150);
    expect(after.info.height).toBeGreaterThan(20);
    if (!after.land) {
      expect(Math.abs(after.info.top - after.stage.bottom)).toBeLessThanOrEqual(1);
      expect(after.bottom.top).toBeGreaterThanOrEqual(after.info.bottom - 1);
    }
    // the button does the same, and its twin exits
    await page.getByTestId('fullscreen').click();
    await expect(page.getByTestId('training')).toHaveClass(/immersive/);
    // a tap shows the controls if they have faded, then the exit button
    await exitByButton(page);
    await expect(page.getByTestId('training')).not.toHaveClass(/immersive/);
  });

test('astuce unique : affichée une fois, fermée pour de bon', async ({ page }) => {
  await seed(page);
  await page.goto('/#/');
  const hint = page.getByTestId('fs-hint');
  await expect(hint).toHaveText('Astuce : touche deux fois le coach pour le plein écran');
  await hint.getByRole('button', { name: 'Fermer l’astuce' }).click();
  await expect(hint).toHaveCount(0);
  // the settings are written to the device asynchronously
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId('hero-stage').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('fs-hint')).toHaveCount(0);
  await page.goto('/#/techniques/jab?d=boxe');
  await expect(page.getByTestId('fs-hint')).toHaveCount(0);
});

test('l’astuce disparaît aussi dès le premier double tap', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques/jab?d=boxe');
  await expect(page.getByTestId('fs-hint')).toBeVisible();
  const stage = page.getByTestId('technique-stage');
  await expect(stage.locator('canvas')).toBeVisible();
  await dbl(page, stage, 0.5, 0.6);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('fs-hint')).toHaveCount(0);
});

test('Coach IA : double tap sur l’en-tête, normal ↔ agrandi', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page);
  await page.goto('/#/reglages');
  await openCoachIA(page);
  const panel = page.getByTestId('coach-ask-panel');
  await expect(panel).toHaveAttribute('data-size', 'normal');
  await panel.locator('.cai-head h2').dblclick();
  await expect(panel).toHaveAttribute('data-size', 'agrandi');
  await panel.locator('.cai-head h2').dblclick();
  await expect(panel).toHaveAttribute('data-size', 'normal');
  // a double tap on a header button stays that button's
  await page.getByTestId('coach-expand').dblclick();
  await expect(panel).toHaveAttribute('data-size', 'agrandi');
});
