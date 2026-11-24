import { expect, test, type Page } from '@playwright/test';
import { bar, closeCoachPanel, seedProfile, showCoachTools } from './nav-helpers';

/**
 * 2.4 (Youssef, 2026-11-20, « REFONTE PREMIUM DU PANNEAU D'OPTIONS DU COACH », V6 Floating Glass + V7 Smart Control):
 * one universal panel of the coach on every screen with a 3D coach. Closed: nothing over the coach. A short tap opens
 * it; every choice applies at once, the panel stays open, no « Valider ». It closes by a tap outside (which never
 * reaches what is behind), a swipe down from the grip, Android Back and Échap. The 20 checks of the brief (§ 11) that
 * the other specs do not already cover are here; ecran-coach-v140, mastery, training-layout and consignes-v130 hold the
 * rest (opening on each screen, camera, speed, sound, theme).
 */

test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

const FICHE = '/#/techniques/jab?d=boxe';
const SEANCE = '/#/entrainement?ex=boxe-debutant-02&mode=technique';

/** one short tap on the coach, away from its buttons (the module waits for the time of a double tap) */
async function tapCoach(page: Page, id: string) {
  const b = (await page.getByTestId(id).boundingBox())!;
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.55);
}

/** what is saved on the device for a store key (IndexedDB keyval-store) */
const stored = (page: Page, key: string) =>
  page.evaluate(
    (k) =>
      new Promise<unknown>((res, rej) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const g = r.result.transaction('keyval').objectStore('keyval').get(k);
          g.onsuccess = () => res(g.result ? JSON.parse(g.result as string) : null);
          g.onerror = () => rej(g.error);
        };
      }),
    key,
  );

async function seedGoals(page: Page, mastery: Record<string, string>) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    (m) =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { mastery: m, goals: {}, favTechniques: [], favExercises: [], favTerms: [] }, version: 0 }), 'u:local:css-goals');
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
      }),
    mastery,
  );
  await page.goto('about:blank');
}

async function openFiche(page: Page) {
  await page.goto(FICHE);
  await expect(page.getByTestId('technique-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
}

test('fermeture : Échap, glisser la poignée vers le bas, Retour Android (un Retour = un pas)', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await openFiche(page);
  const url = page.url();
  // Échap
  await showCoachTools(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  expect(page.url()).toBe(url);
  // swipe down from the grip
  await showCoachTools(page);
  const g = (await page.getByTestId('coach-panel-grip').boundingBox())!;
  const x = g.x + g.width / 2;
  const y = g.y + g.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x, y + i * 20);
  await page.mouse.up();
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  expect(page.url()).toBe(url);
  // a short drag of the grip does not close it (the panel comes back in place)
  await showCoachTools(page);
  const g2 = (await page.getByTestId('coach-panel-grip').boundingBox())!;
  await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
  await page.mouse.down();
  await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2 + 10, { steps: 4 });
  await page.waitForTimeout(400);
  await page.mouse.up();
  await expect(page.getByTestId('coach-panel')).toBeVisible();
  // Android Back (the history): closes the panel only, the sheet stays; the next Back leaves the sheet
  await page.goBack();
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  await expect(page.getByTestId('technique-stage')).toBeVisible();
  expect(page.url()).toBe(url);
});

test('aucun clic ne traverse : un toucher à côté ferme le panneau sans toucher l’élément derrière', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto(SEANCE);
  await expect(page.getByTestId('training-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  // the big « Démarrer » of the bar is right behind the scrim: a tap there closes the panel, the session does not start
  await showCoachTools(page);
  const start = (await page.getByTestId('start').boundingBox())!;
  await page.mouse.click(start.x + start.width / 2, start.y + start.height / 2);
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  await expect(page.getByTestId('start')).toBeVisible();
  await expect(page.getByTestId('pause')).toHaveCount(0);
  // the same with a link of the bar: the screen stays
  await showCoachTools(page);
  const home = (await bar(page).getByTestId('nav-accueil').boundingBox())!;
  await page.mouse.click(home.x + home.width / 2, home.y + home.height / 2);
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  await expect(page).toHaveURL(/entrainement/);
  // the background is blocked during the closing animation too: a second tap right after the first one does nothing
  await showCoachTools(page);
  await page.mouse.click(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.click(start.x + start.width / 2, start.y + start.height / 2);
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  await expect(page.getByTestId('pause')).toHaveCount(0);
});

test('séance en cours : ouvrir le panneau ne met pas en pause et ne remet rien à zéro', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto(SEANCE);
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  await page.waitForTimeout(2500);
  const t0 = await page.getByTestId('session-time').textContent();
  await tapCoach(page, 'training-stage');
  await expect(page.getByTestId('coach-panel')).toBeVisible();
  // a choice in the panel (the voice) does not stop the session either
  await page.getByTestId('cp-voice').click();
  await page.waitForTimeout(2500);
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  const t1 = await page.getByTestId('session-time').textContent();
  expect(t1, 'le chrono avance pendant que le panneau est ouvert').not.toBe(t0);
  await expect(page.getByTestId('pause')).toBeVisible();
});

test('persistance : voix, volume, garde et statut gardés après rechargement ; réinitialiser la vue', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await openFiche(page);
  await showCoachTools(page);
  await page.getByTestId('cp-voice').click();
  await expect(page.getByTestId('cp-voice')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('cp-voice').click();
  await page.getByTestId('cp-volume').fill('0.4');
  await page.getByTestId('cp-learn-a-revoir').click();
  await page.getByTestId('cp-advanced').click();
  await page.getByTestId('cp-guard-gaucher').click();
  // reset: back to the angle of the settings
  const profil = page.getByTestId('cp-camera').getByRole('radio', { name: 'Profil', exact: true });
  await profil.click();
  await expect(profil).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('cp-reset').click();
  await expect(profil).toHaveAttribute('aria-checked', 'false');
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId('technique-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  await showCoachTools(page);
  await expect(page.getByTestId('cp-voice')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cp-volume')).toHaveValue('0.4');
  await expect(page.getByTestId('cp-learn-a-revoir')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('cp-advanced').click();
  await expect(page.getByTestId('cp-guard-gaucher')).toHaveAttribute('aria-checked', 'true');
});

test('statuts : anciens statuts gardés, même identifiant entre la fiche et la séance, sans XP', async ({ page }) => {
  // statuses saved before 2.4 (the ✓ / ↻ switch) are read as they are
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await seedGoals(page, { jab: 'acquise', direct: 'a-revoir', 'combo:xyz': 'acquise' });
  await openFiche(page);
  await showCoachTools(page);
  await expect(page.getByTestId('cp-learn-acquise')).toHaveAttribute('aria-checked', 'true');
  await closeCoachPanel(page);
  // the session shows the same status for the same technique id, and a change there is seen on the sheet
  await page.goto(SEANCE);
  await expect(page.getByTestId('training-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  await showCoachTools(page);
  const pick = page.getByTestId('cp-learning').locator('[data-testid^="cp-learn-pick-"]');
  if ((await pick.count()) > 0) await page.getByTestId('cp-learn-pick-jab').click();
  await expect(page.getByTestId('cp-learning')).toContainText('Jab');
  await expect(page.getByTestId('cp-learn-acquise')).toHaveAttribute('aria-checked', 'true');
  const xpBefore = JSON.stringify(await stored(page, 'u:local:css-stats'));
  await page.getByTestId('cp-learn-a-revoir').click();
  await page.waitForTimeout(600);
  const goals = (await stored(page, 'u:local:css-goals')) as { state: { mastery: Record<string, string> } };
  expect(goals.state.mastery).toEqual({ jab: 'a-revoir', direct: 'a-revoir', 'combo:xyz': 'acquise' });
  expect(JSON.stringify(await stored(page, 'u:local:css-stats')), 'aucun XP pour un changement de statut').toBe(xpBefore);
  await openFiche(page);
  await showCoachTools(page);
  await expect(page.getByTestId('cp-learn-a-revoir')).toHaveAttribute('aria-checked', 'true');
});

test('gestes 3D : glisser ou pincer le coach n’ouvre pas le panneau', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await openFiche(page);
  const b = (await page.getByTestId('technique-stage').boundingBox())!;
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(700);
  await expect(page.getByTestId('coach-panel')).toHaveCount(0);
  // a two-finger touch (pinch) is never a tap
  const cdp = await page.context().newCDPSession(page);
  const pts = (d: number) => [
    { x: cx - d, y: cy, id: 1 },
    { x: cx + d, y: cy, id: 2 },
  ];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(30) });
  for (const d of [40, 55, 70]) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
  await expect(page.getByTestId('coach-panel')).toHaveCount(0);
  // while a short tap opens it
  await tapCoach(page, 'technique-stage');
  await expect(page.getByTestId('coach-panel')).toBeVisible();
});

test('petit écran 360×640 : le panneau tient dans l’écran et défile à l’intérieur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto(SEANCE);
  await expect(page.getByTestId('training-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  await showCoachTools(page);
  await page.getByTestId('cp-advanced').click();
  const r = await page.evaluate(() => {
    const p = document.querySelector('[data-testid=coach-panel]')!.getBoundingClientRect();
    const body = document.querySelector('.cpn-body') as HTMLElement;
    return { top: p.top, bottom: p.bottom, left: p.left, right: p.right, scrolls: body.scrollHeight > body.clientHeight, pageScroll: document.scrollingElement!.scrollHeight - innerHeight };
  });
  expect(r.top).toBeGreaterThanOrEqual(0);
  expect(r.bottom).toBeLessThanOrEqual(641);
  expect(r.left).toBeGreaterThanOrEqual(0);
  expect(r.right).toBeLessThanOrEqual(361);
  expect(r.scrolls, 'le contenu défile dans le panneau').toBe(true);
  expect(r.pageScroll).toBeLessThanOrEqual(0);
  // the last control is reachable by scrolling the panel, the close button stays visible
  await page.getByTestId('cp-settings').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('cp-settings')).toBeInViewport();
  await expect(page.getByTestId('coach-panel-close')).toBeInViewport();
});

test('clavier et lecteur d’écran : bouton d’accès, focus piégé dans le panneau, rendu au départ', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await openFiche(page);
  const toggle = page.getByTestId('coach-ui-toggle');
  await expect(toggle).toHaveAccessibleName(/Options du coach/);
  await toggle.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Options du coach' });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('aria-modal', 'true');
  // Tab and Shift+Tab never leave the panel
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=coach-panel]')), `Tab ${i}`).toBe(true);
  }
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=coach-panel]'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  // focus is back on what opened it
  await expect(toggle).toBeFocused();
});

test('aucun bouton de réglage hors du panneau (fiche, séance), mouvement réduit et repli sans flou', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedProfile(page, {}, { stageFsHintSeen: true, quality: 'basse' });
  await openFiche(page);
  for (const id of ['coach-tools', 'coach-angles', 'coach-speed', 'coach-sound', 'mastery-switch', 'fullscreen']) await expect(page.getByTestId(id), id).toHaveCount(0);
  await showCoachTools(page);
  // quality « basse »: the glass has no blur (performance on small phones)
  await expect(page.getByTestId('coach-panel-root')).toHaveClass(/lite/);
  const blur = await page.getByTestId('coach-panel').evaluate((e) => getComputedStyle(e).backdropFilter);
  expect(blur === 'none' || blur === '').toBe(true);
  // reduced motion: no animation on the panel
  const anim = await page.getByTestId('coach-panel').evaluate((e) => getComputedStyle(e).animationName);
  expect(anim).toBe('none');
  await closeCoachPanel(page);
  await page.goto(SEANCE);
  await expect(page.getByTestId('training-stage').locator('canvas')).toBeVisible({ timeout: 60_000 });
  for (const id of ['coach-tools', 'coach-angles', 'coach-speed', 'coach-sound', 'tr-camera']) await expect(page.getByTestId(id), id).toHaveCount(0);
});

test('performance : le panneau ouvert ne fait pas chuter la fluidité du coach', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await openFiche(page);
  await page.waitForTimeout(3000);
  /** median time between two frames over 2 s (ms) */
  const frame = () =>
    page.evaluate(
      () =>
        new Promise<number>((res) => {
          const ts: number[] = [];
          const step = (t: number) => {
            ts.push(t);
            if (t - ts[0] < 2000) requestAnimationFrame(step);
            else {
              const d = ts.slice(1).map((v, i) => v - ts[i]).sort((a, b) => a - b);
              res(d[Math.floor(d.length / 2)]);
            }
          };
          requestAnimationFrame(step);
        }),
    );
  const closed = await frame();
  await showCoachTools(page);
  await page.waitForTimeout(500);
  const opened = await frame();
  test.info().annotations.push({ type: 'frames', description: `fermé ${closed.toFixed(1)} ms, ouvert ${opened.toFixed(1)} ms` });
  // headless Chromium renders with the CPU (SwiftShader): only a strong drop counts, not noise
  expect(opened).toBeLessThan(closed * 1.6 + 8);
});
