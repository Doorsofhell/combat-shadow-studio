import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 0.27 (Youssef, 2026-10-20 21:59: « Permet d'agrandir la fenêtre ia et de la réduire. Rends la stylé »): the Coach IA
 * panel has three sizes (réduit, normal, agrandi) chosen with its header buttons or its grab handle, remembered
 * after a reload, from the action pill as on the training screen.
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
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

// sizes are measured once settled: the short spring of a size change is turned off (prefers-reduced-motion)
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const panel = (page: Page) => page.getByTestId('coach-ask-panel');
const shrink = (page: Page) => page.getByTestId('coach-shrink');
const expand = (page: Page) => page.getByTestId('coach-expand');
/** the settings are written to IndexedDB asynchronously: wait until the size is saved before reloading */
const savedSize = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          // settings may be kept per user or app-wide: read both keys
          const st = r.result.transaction('keyval').objectStore('keyval');
          const a = st.get('u:local:css-settings');
          const b = st.get('css-settings');
          b.onsuccess = () => res(String(a.result ?? '') + String(b.result ?? ''));
          b.onerror = () => res(String(a.result ?? ''));
        };
        r.onerror = () => res('');
      }),
  );
const box = (page: Page) => panel(page).evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height, left: r.left, right: r.right }; });

test('depuis la pilule : réduit, normal, agrandi ; mémorisé après rechargement', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await seed(page);
  await page.goto('/#/');
  await page.getByTestId('pill-coach').click();
  await expect(panel(page)).toHaveAttribute('data-size', 'normal');
  await expect(expand(page)).toHaveAttribute('aria-label', 'Agrandir la fenêtre du coach');
  await expect(shrink(page)).toHaveAttribute('aria-label', 'Réduire la fenêtre du coach');
  await expect(expand(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(expand(page).locator('svg[data-icon="panelExpand"]')).toHaveCount(1);
  await expect(shrink(page).locator('svg[data-icon="panelShrink"]')).toHaveCount(1);
  await page.getByTestId('coach-suggestion').filter({ hasText: 'Comment fonctionne l’application ?' }).click();
  await expect(page.getByTestId('coach-answer')).toContainText('cinq onglets');
  const normal = await box(page);

  // réduit: the first line of the answer and the field, no suggestions
  await shrink(page).click();
  await expect(panel(page)).toHaveAttribute('data-size', 'reduit');
  await expect(shrink(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(shrink(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('coach-suggestions')).toHaveCount(0);
  await expect(page.getByTestId('coach-input')).toBeVisible();
  const ans = await page.getByTestId('coach-answer').evaluate((e) => ({ h: e.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(e).lineHeight) }));
  expect(ans.h).toBeLessThan(ans.lh * 2 + 16);
  const small = await box(page);
  expect(small.h).toBeLessThan(normal.h - 60);
  // still answering in réduit
  await page.getByTestId('coach-input').fill('Comment changer de coach ?');
  await page.getByTestId('coach-send').click();
  await expect(page.getByTestId('coach-answer')).toContainText('Kadir');

  // agrandi: nearly the whole screen above the navigation
  await expect(expand(page)).toBeEnabled();
  await expand(page).click();
  await expect(panel(page)).toHaveAttribute('data-size', 'normal');
  await expand(page).click();
  await expect(panel(page)).toHaveAttribute('data-size', 'agrandi');
  await expect(expand(page)).toHaveAttribute('aria-expanded', 'true');
  const big = await box(page);
  const navTop = await page.evaluate(() => document.querySelector('.nav')!.getBoundingClientRect().top);
  expect(big.top).toBeLessThan(40);
  expect(big.bottom).toBeLessThanOrEqual(navTop);
  expect(big.h).toBeGreaterThan(851 * 0.7);
  await expect(page.getByTestId('coach-suggestions')).toBeVisible();

  // remembered after a reload, and on a screen with the bubble
  await expect.poll(() => savedSize(page)).toContain('"coachPanelSize":"agrandi"');
  await page.reload();
  await page.getByTestId('pill-coach').click();
  await expect(panel(page)).toHaveAttribute('data-size', 'agrandi');
  await page.keyboard.press('Escape');
  await page.goto('/#/reglages');
  await page.getByTestId('coach-bubble').click();
  await expect(panel(page)).toHaveAttribute('data-size', 'agrandi');
  await shrink(page).click();
  await expect(panel(page)).toHaveAttribute('data-size', 'normal');
});

test('au clavier et à la poignée : boutons focusables, glisser vers le haut agrandit, vers le bas réduit', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await seed(page);
  await page.goto('/#/reglages');
  await page.getByTestId('coach-bubble').click();
  await expand(page).focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveAttribute('data-size', 'agrandi');
  // at the end of the scale the button stays focusable (aria-disabled) and does nothing
  await expect(expand(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveAttribute('data-size', 'agrandi');
  await page.keyboard.press('Shift+Tab');
  await expect(shrink(page)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(panel(page)).toHaveAttribute('data-size', 'normal');
  const outline = await shrink(page).evaluate((e) => getComputedStyle(e).outlineStyle);
  expect(outline).not.toBe('none');
  // the grab handle
  const g = (await page.getByTestId('coach-grab').boundingBox())!;
  const drag = async (dy: number) => {
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
    await page.mouse.down();
    await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + dy, { steps: 4 });
    await page.mouse.up();
  };
  await drag(80);
  await expect(panel(page)).toHaveAttribute('data-size', 'reduit');
  // the panel animates to its new size: measure the handle once it has stopped moving
  let last = -1;
  await expect
    .poll(async () => {
      const y = (await page.getByTestId('coach-grab').boundingBox())!.y;
      const still = Math.abs(y - last) < 0.5;
      last = y;
      return still;
    })
    .toBe(true);
  const g2 = (await page.getByTestId('coach-grab').boundingBox())!;
  await page.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
  await page.mouse.down();
  await page.mouse.move(g2.x + g2.width / 2, g2.y - 60, { steps: 4 });
  await page.mouse.up();
  await expect(panel(page)).toHaveAttribute('data-size', 'normal');
});

test('360×640 : aucun débordement, quelle que soit la taille', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await seed(page);
  await page.goto('/#/');
  await page.getByTestId('pill-coach').click();
  await page.getByTestId('coach-suggestion').first().click();
  for (const size of ['normal', 'reduit', 'agrandi'] as const) {
    if (size === 'reduit') await shrink(page).click();
    if (size === 'agrandi') {
      await expand(page).click();
      await expand(page).click();
    }
    await expect(panel(page)).toHaveAttribute('data-size', size);
    const r = await page.evaluate(() => {
      const p = document.querySelector('[data-testid="coach-ask-panel"]')!;
      const b = p.getBoundingClientRect();
      const head = p.querySelector('.cai-head')!;
      const wide = [...p.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > b.right + 1 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.cai-suggest')).length;
      return { l: b.left, r: b.right, t: b.top, bt: b.bottom, vw: innerWidth, vh: innerHeight, headOver: head.scrollWidth - head.clientWidth, wide, scroll: document.scrollingElement!.scrollWidth - innerWidth };
    });
    expect(r.l, size).toBeGreaterThanOrEqual(0);
    expect(r.r, size).toBeLessThanOrEqual(r.vw);
    expect(r.t, size).toBeGreaterThanOrEqual(0);
    expect(r.bt, size).toBeLessThanOrEqual(r.vh);
    expect(r.headOver, `${size} en-tête`).toBeLessThanOrEqual(0);
    expect(r.wide, `${size} éléments hors du panneau`).toBe(0);
    expect(r.scroll, size).toBeLessThanOrEqual(0);
  }
});

test('à l’entraînement : réduit et normal ne couvrent ni consignes ni commandes, agrandi couvre la scène en pause', async ({ page }) => {
  for (const [w, h] of [
    [360, 640],
    [393, 851],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await seed(page);
    await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
    await page.getByTestId('start').click();
    await page.getByTestId('coach-bubble').click();
    await expect(page.getByTestId('phase')).toHaveText('Pause');
    await page.getByTestId('coach-suggestion').first().click();
    for (const size of ['normal', 'reduit', 'agrandi'] as const) {
      if (size === 'reduit') await shrink(page).click();
      if (size === 'agrandi') {
        await expand(page).click();
        await expand(page).click();
      }
      await expect(panel(page)).toHaveAttribute('data-size', size);
      const r = await page.evaluate(() => {
        const p = document.querySelector('[data-testid=coach-ask-panel]')!.getBoundingClientRect();
        const stage = document.querySelector('.tr-stage')!.getBoundingClientRect();
        const info = document.querySelector('.tr-info')!.getBoundingClientRect();
        const ctrls = [...document.querySelectorAll('.tr-bottom button, .tr-controls button')].map((b) => b.getBoundingClientRect());
        const over = (a: DOMRect) => !(p.bottom <= a.top + 1 || p.top >= a.bottom - 1 || p.right <= a.left + 1 || p.left >= a.right - 1);
        return { p: [p.top, p.bottom], i: [info.top, info.bottom], scroll: document.scrollingElement!.scrollHeight - innerHeight, info: over(info), ctrls: ctrls.filter(over).length, inStage: p.top >= stage.top - 1 && p.bottom <= stage.bottom + 1, h: p.height, stageH: stage.height };
      });
      expect(r.scroll, `${w}x${h} ${size}`).toBeLessThanOrEqual(0);
      expect(r.info, `${w}x${h} ${size} consignes ${JSON.stringify(r)}`).toBe(false);
      expect(r.ctrls, `${w}x${h} ${size} commandes`).toBe(0);
      expect(r.inStage, `${w}x${h} ${size} dans la scène`).toBe(true);
      if (size === 'reduit') expect(r.h, `${w}x${h} réduit : le coach reste visible`).toBeLessThan(r.stageH * 0.45);
      if (size === 'agrandi') expect(r.h).toBeGreaterThan(r.stageH * 0.85);
    }
    await expect(page.getByTestId('resume')).toBeVisible();
    await shrink(page).click();
    // the size is remembered: let it be back to normal (and saved) before the next viewport reloads the page
    await expect(panel(page)).toHaveAttribute('data-size', 'normal');
    await page.waitForTimeout(500);
  }
});
