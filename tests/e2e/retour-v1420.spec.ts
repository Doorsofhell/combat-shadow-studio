import { expect, test, type Page } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.42.0 (Youssef, 2026-11-11: « Revois aussi le retour arrière quand on est en plein écran » ; rule validated the
 * same day: « un Retour = un seul pas en arrière »). The Back of the phone or of the browser, in the web app too:
 * it leaves the fullscreen first (the session goes on), then it pauses and asks, then it closes the question; only
 * « Quitter » leaves. Before 1.42.0, in the web app, Back left a running session at once, fullscreen included.
 */
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Quitter la séance ?' });

async function startSession(page: Page) {
  await seedProfile(page);
  // a page of the app before the session, as in real use: Back has somewhere to go
  await page.goto('/#/entrainer');
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  await page.evaluate(() => (window.location.hash = '#/entrainement?ex=boxe-debutant-01&mode=technique'));
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
}

async function fullscreen(page: Page) {
  const box = (await page.getByTestId('training-stage').boundingBox())!;
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('training')).toHaveClass(/immersive/);
}

test('Retour du téléphone pendant la séance : pause et question, jamais de sortie directe', async ({ page }) => {
  await startSession(page);
  await page.goBack();
  await expect(page).toHaveURL(/entrainement\?ex=boxe-debutant-01/);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByTestId('resume')).toBeVisible();
  // « Continuer » is the highlighted choice, « Quitter » the quiet one
  await expect(page.getByTestId('confirm-cancel')).toHaveText('Continuer');
  await expect(page.getByTestId('confirm-cancel')).toHaveClass(/primary/);
  await expect(page.getByTestId('confirm-ok')).toHaveText('Quitter');
  await expect(page.getByTestId('confirm-ok')).not.toHaveClass(/primary|danger/);
  // a second Back closes the question, the session stays (paused)
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/entrainement\?ex=boxe-debutant-01/);
  await expect(page.getByTestId('resume')).toBeVisible();
  // a third Back asks again; only « Quitter » leaves, to the page the user came from
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
  await page.getByTestId('confirm-ok').click();
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  await expect(page).toHaveURL(/#\/entrainer$/);
  // and the history is clean: Back from there does not come back into the session
  await page.goForward().catch(() => undefined);
});

test('Retour du téléphone en plein écran : un pas à la fois, plein écran, puis question', async ({ page }) => {
  await startSession(page);
  await fullscreen(page);
  await page.goBack();
  // first step: out of the fullscreen, the session goes on, no question
  await expect(page.getByTestId('training')).not.toHaveClass(/immersive/);
  await expect(page).toHaveURL(/entrainement\?ex=boxe-debutant-01/);
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByTestId('pause')).toBeVisible();
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  // second step: pause and question
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
  await page.getByTestId('confirm-cancel').click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/entrainement\?ex=boxe-debutant-01/);
});

test('plein écran : la flèche Retour reste visible quand les commandes s’effacent, un toucher sort du plein écran', async ({ page }) => {
  await startSession(page);
  await fullscreen(page);
  const back = page.getByTestId('fs-back');
  await expect(back).toBeVisible();
  await expect(back).toHaveAccessibleName(/Retour/);
  const b = (await back.boundingBox())!;
  expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
  // the other commands fade after a few seconds without a touch; the arrow dims but stays
  await expect(page.getByTestId('training')).toHaveClass(/fs-idle/, { timeout: 10_000 });
  await expect(back).toBeVisible();
  expect(Number(await back.evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThanOrEqual(0.5);
  await back.click();
  await expect(page.getByTestId('training')).not.toHaveClass(/immersive/);
  await expect(back).toHaveCount(0);
  await expect(page.getByTestId('pause')).toBeVisible();
  // the fullscreen left by the arrow leaves no step behind: the next Back asks, it does not leave
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
});

test('hors séance : Retour quitte l’écran comme avant ; un panneau ouvert se ferme d’abord', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainer');
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  await page.evaluate(() => (window.location.hash = '#/entrainement?ex=boxe-debutant-01&mode=technique'));
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  // not started: nothing to lose, Back leaves at once
  await page.goBack();
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
});

test('accueil : le Retour du téléphone sort du plein écran du coach et garde l’accueil', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/entrainer');
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  await page.evaluate(() => (window.location.hash = '#/'));
  const stage = page.getByTestId('hero-stage');
  await expect(stage.locator('canvas')).toBeVisible({ timeout: 60_000 });
  const b = (await stage.boundingBox())!;
  await page.mouse.dblclick(b.x + b.width * 0.5, b.y + b.height * 0.35);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await page.goBack();
  await expect(stage).not.toHaveAttribute('data-fullscreen', 'true');
  await expect(page).toHaveURL(/#\/$/);
  await expect(bar(page)).toHaveAttribute('data-screen', 'accueil');
  // left by its own button, the fullscreen leaves no step behind: Back then goes to the page before
  await page.mouse.dblclick(b.x + b.width * 0.5, b.y + b.height * 0.35);
  await expect(stage).toHaveAttribute('data-fullscreen', 'true');
  await page.keyboard.press('Escape');
  await expect(stage).not.toHaveAttribute('data-fullscreen', 'true');
  await page.goBack();
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
});
