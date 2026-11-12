import { expect, Page, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';
import { menuCommand } from './nav-helpers';

/**
 * Coach render: since 1.9 one look only (Ultra-réaliste; the Anime / Encre look is removed at Youssef's
 * request), saved older looks migrated, and the studio framing in the free part of the stage.
 */
async function seed(page: Page, settings?: Record<string, unknown>) {
  await page.goto('/icons/icon.svg');
  await page.evaluate(
    async ({ profile, look, settings }) => {
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
      await put('u:local:css-fighters', {
        state: { fighters: [{ id: 'f1', name: 'Test', look: { ...look, outfit: { ...look.outfit, top: 'tshirt' } }, createdAt: '', updatedAt: '' }], activeId: 'f1' },
        version: 0,
      });
      if (settings) for (const k of ['css-settings', 'u:local:css-settings']) await put(k, { state: { settings }, version: 1 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme' }, look: defaultLook('homme'), settings: settings ?? null },
  );
}

async function open(page: Page, path: string) {
  await page.goto('about:blank');
  await page.goto(path);
}

const savedSettings = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ coachStyle: string; coachRender: string }>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          // the settings belong to the device (not to a user scope)
          const st = r.result.transaction('keyval').objectStore('keyval');
          const q = st.get('css-settings');
          q.onsuccess = () => {
            if (q.result) return res(JSON.parse(q.result).state.settings);
            const q2 = st.get('u:local:css-settings');
            q2.onsuccess = () => res(q2.result ? JSON.parse(q2.result).state.settings : { coachStyle: '', coachRender: '' });
          };
        };
      }),
  );

const checked = (page: Page, testId: string) => page.getByTestId(testId).locator('[role="radio"][aria-checked="true"]');

// 1.9 (Youssef, 2026-10-29: « supprime définitivement le rendu Anime »): the look choice is gone. The three
// tests of the choice (picker in three places and remembered, the saved Anime look kept, switching the look
// during a session) are replaced by the two below: no choice anywhere, and a saved Anime / Manga look opens
// in Ultra-réaliste with the other settings kept.
test('1.9: no look choice in the settings, the studio or the training options', async ({ page }) => {
  await seed(page);
  await open(page, '/#/reglages/coach');
  await expect(page.getByText('Ton coach montre chaque mouvement')).toBeVisible();
  await expect(page.getByText('Rendu des combattants')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Anime' })).toHaveCount(0);
  await expect(page.getByText(/Ultra-réaliste/).first()).toBeVisible();

  await open(page, '/#/combattant');
  await expect(page.getByRole('radio', { name: 'Anime' })).toHaveCount(0);
  await expect(page.getByText('Passer au style Encre')).toHaveCount(0);

  await open(page, '/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await menuCommand(page, 'options');
  await expect(page.getByRole('dialog', { name: 'Options d’entraînement' })).toBeVisible();
  await expect(page.getByTestId('training-coach-look')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'Anime' })).toHaveCount(0);
});

for (const old of ['encre', 'manga'])
  test(`1.9: a device that saved the ${old} look opens in Ultra-réaliste, other settings kept`, async ({ page }) => {
    await seed(page, { coachStyle: old, coachRender: 'premium', voice: false });
    await open(page, '/#/reglages/coach');
    await expect(page.getByText(/Ultra-réaliste/).first()).toBeVisible();
    await expect.poll(async () => (await savedSettings(page)).coachStyle).toBe('realiste');
    expect((await savedSettings(page)).coachRender).toBe('premium');
    expect(((await savedSettings(page)) as unknown as { voice: boolean }).voice).toBe(false);
  });

/** pixels of the coach on the studio stage: the backgrounds are made transparent for the capture */
async function coachBox(page: Page) {
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.cs-stage')!;
    // the stage, what it contains and everything behind it (page backgrounds)
    for (let e: HTMLElement | null = stage; e; e = e.parentElement) e.style.background = 'transparent';
    stage.querySelectorAll<HTMLElement>('*').forEach((e) => (e.style.background = 'transparent'));
    document.querySelectorAll<HTMLElement>('.cs-parts, .cs-views, .cs-anim, .cs-free-tag').forEach((e) => (e.style.visibility = 'hidden'));
  });
  await page.waitForTimeout(400);
  const stage = page.locator('.cs-stage');
  const png = await stage.screenshot({ omitBackground: true });
  if (process.env.RENDER_SHOTS) writeFileSync(`${process.env.RENDER_SHOTS}/studio-mask.png`, png);
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.cs-parts, .cs-views, .cs-anim, .cs-free-tag').forEach((e) => (e.style.visibility = ''));
  });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        // the coach: opaque and not the soft floor shadow (dark, half transparent)
        if (d[(y * c.width + x) * 4 + 3] < 250) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    return { x0: x0 / c.width, x1: x1 / c.width, y0: y0 / c.height, y1: y1 / c.height };
  }, png.toString('base64'));
}

test('studio: the whole fighter is large and never under the buttons; face, chest and legs close-ups', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await seed(page);
  await open(page, '/#/combattant');
  await expect(page.getByTestId('editor-panel')).toBeVisible();
  await page.getByTestId('anim-play').click(); // still guard, for a stable measure
  await page.waitForTimeout(4000);
  const r = await page.locator('.cs-stage').boundingBox();
  const views = await page.locator('.cs-views').boundingBox();
  const bar = await page.locator('.cs-anim').boundingBox();
  const parts = await page.locator('.cs-parts').boundingBox();
  if (process.env.RENDER_SHOTS) await page.locator('.cs-preview').screenshot({ path: `${process.env.RENDER_SHOTS}/studio-corps.png` });
  const b = await coachBox(page);
  // fractions of the stage
  const free = { right: (views!.x - r!.x) / r!.width, bottom: (bar!.y - r!.y) / r!.height, top: (parts!.y + parts!.height - r!.y) / r!.height };
  expect(b.x1, 'under the view buttons').toBeLessThanOrEqual(free.right + 0.01);
  expect(b.y1, 'under the animation bar').toBeLessThanOrEqual(free.bottom + 0.01);
  expect(b.y0, 'under the framing buttons').toBeGreaterThanOrEqual(free.top - 0.01);
  // large: at least 80 % of the free height
  expect(b.y1 - b.y0).toBeGreaterThan((free.bottom - free.top) * 0.8);

  const dist = () => page.evaluate(() => (window as unknown as { __cssCamera: { dist: number } }).__cssCamera.dist);
  const full = await dist();
  for (const part of ['face-zoom', 'part-buste', 'part-jambes']) {
    await page.getByTestId(part).click();
    await expect(page.getByTestId(part)).toHaveAttribute('aria-checked', 'true');
    await expect.poll(dist, { timeout: 8000 }).toBeLessThan(full * 0.75);
    if (process.env.RENDER_SHOTS) {
      await page.waitForTimeout(1500);
      await page.locator('.cs-preview').screenshot({ path: `${process.env.RENDER_SHOTS}/studio-${part}.png` });
    }
  }
  await page.getByTestId('part-corps').click();
  await expect.poll(dist, { timeout: 8000 }).toBeGreaterThan(full * 0.9);
});

// 1.9: the test « Encre 0.23 has no screen-space hatching » is removed with the Encre / Anime look itself.
