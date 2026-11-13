import { expect, test, type Page } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.0.0 (refonte ergonomique, lot 4; maquette v4 « Séance » validée par Youssef le 2026-10-27): the phone is put down
 * in front of the user. While the session runs, only Retour and Pause stay; Décomposer, Caméra and « Plus » come back
 * with the pause; vibrations mark the start, the pause and the rounds; a horizontal swipe changes the tab of a space.
 * 1.4.0 (Youssef, 2026-10-28, option A of the coach screen: « un toucher montre les commandes sans pause, le toucher
 * suivant les cache »): a tap on the stage no longer pauses (1.0.0); it shows the commands of the coach, Pause among
 * them, and the next tap hides them.
 */

async function recordVibrations(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vib: unknown[] };
    w.__vib = [];
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (p: unknown) => (w.__vib.push(p), true) });
  });
}
const vibrations = (page: Page) => page.evaluate(() => (window as unknown as { __vib: unknown[] }).__vib);

test('séance : mains libres, toucher la scène montre les commandes sans pause, les outils reviennent à la pause', async ({ page }) => {
  await recordVibrations(page);
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  // before the start: every tool is there
  for (const a of ['decompose', 'camera', 'menu']) await expect(bar(page).locator(`[data-action="${a}"]`), a).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  // running: Retour and Pause only
  for (const a of ['decompose', 'camera', 'menu']) await expect(bar(page).locator(`[data-action="${a}"]`), a).toBeHidden();
  await expect(bar(page).locator('[data-action="back"]')).toBeVisible();
  expect(await vibrations(page)).toContainEqual([60, 40, 90]);
  // one tap on the stage: the commands of the coach, the session goes on (once the time for a double tap has passed)
  const stage = page.getByTestId('training-stage');
  const box = (await stage.boundingBox())!;
  await expect(page.getByTestId('coach-tools')).toHaveCount(0);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('coach-tools')).toBeVisible();
  await expect(stage).toHaveAttribute('data-ui', 'on');
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  // the next tap hides them
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('coach-tools')).toHaveCount(0);
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  // the pause of the commands
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.getByTestId('coach-pause').click();
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await expect(page.getByTestId('resume')).toBeVisible();
  expect(await vibrations(page)).toContainEqual([30, 40, 30]);
  for (const a of ['decompose', 'camera', 'menu']) await expect(bar(page).locator(`[data-action="${a}"]`), a).toBeVisible();
  // a tap during the pause does not restart the session: Reprendre does
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  for (const a of ['decompose', 'camera', 'menu']) await expect(bar(page).locator(`[data-action="${a}"]`), a).toBeHidden();
});

test('séance : un double toucher passe en plein écran sans mettre en pause', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  const stage = page.getByTestId('training-stage');
  const box = (await stage.boundingBox())!;
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('training')).toHaveClass(/immersive/);
  await page.waitForTimeout(600);
  await expect(page.getByTestId('pause')).toBeVisible();
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
});

for (const width of [360, 393]) {
  test(`séance ${width} px : « Démarrer » et « Reprendre » tiennent en entier dans le gros bouton, « Pause » reste lisible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await seedProfile(page);
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    const whole = (id: string) =>
      page.getByTestId(id).evaluate((b) => {
        const label = b.querySelector('small')!;
        const r = label.getBoundingClientRect();
        const box = b.getBoundingClientRect();
        return label.scrollWidth <= label.clientWidth + 1 && r.left >= box.left && r.right <= box.right + 0.5;
      });
    await expect(page.getByTestId('start')).toBeVisible();
    expect(await whole('start'), 'Démarrer').toBe(true);
    const ink = (id: string) => page.getByTestId(id).evaluate((b) => getComputedStyle(b.querySelector('small')!).color);
    const dark = await ink('start');
    await page.getByTestId('start').click();
    // « Pause », the action in use, keeps the dark word of the big button
    await expect.poll(() => ink('pause')).toBe(dark);
    await page.getByTestId('pause').click();
    await expect(page.getByTestId('resume')).toBeVisible();
    expect(await whole('resume'), 'Reprendre').toBe(true);
  });
}

test.describe('glisser au doigt', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 393, height: 851 } });

  async function swipe(page: Page, from: number, to: number, y = 420) {
    await page.evaluate(
      ([from, to, y]) => {
        const el = document.querySelector('.page') ?? document.body;
        const t = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t(from)], changedTouches: [t(from)] }));
        el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [t(to)] }));
      },
      [from, to, y],
    );
  }

  test('vers la gauche : onglet suivant ; vers la droite : onglet précédent ; rien aux bouts', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/#/stats');
    await expect(page.getByTestId('tab-tableau')).toHaveAttribute('aria-current', 'page');
    await swipe(page, 320, 100);
    await expect(page).toHaveURL(/#\/historique$/);
    await swipe(page, 320, 100);
    await expect(page).toHaveURL(/#\/objectifs$/);
    // the last tab: nothing further
    await swipe(page, 320, 100);
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/#\/objectifs$/);
    await swipe(page, 100, 320);
    await expect(page).toHaveURL(/#\/historique$/);
    // a short move is not a swipe
    await swipe(page, 200, 160);
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/#\/historique$/);
  });
});
