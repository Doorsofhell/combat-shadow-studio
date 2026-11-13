import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 1.23 Salles immersives (Youssef, 2026-11-05): each discipline trains in its own room on the training screen; the
 * setting « Salle immersive » brings the plain background back. Other screens keep their stage.
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

/** the saved settings (IndexedDB): the switch writes them asynchronously, a navigation too early would cut the write */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const q = r.result.transaction('keyval').objectStore('keyval').get('css-settings');
          q.onsuccess = () => res(String(q.result ?? ''));
        };
      }),
  );

async function training(page: Page, ex: string) {
  await page.goto('about:blank');
  await page.goto(`/#/entrainement?ex=${ex}&mode=technique`);
  await page.getByTestId('start').waitFor();
}

test('chaque discipline dans sa salle, et l’interrupteur ramène le fond uni', async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page);
  await training(page, 'boxe-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'boxe');
  await page.waitForFunction(() => (window as unknown as { __cssRoom?: { id: string } }).__cssRoom?.id === 'boxe', null, { timeout: 90_000 });
  const boxe = await page.evaluate(() => (window as unknown as { __cssRoom: { props: number } }).__cssRoom);
  expect(boxe.props).toBeGreaterThan(0);

  await training(page, 'mma-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'mma');
  await page.waitForFunction(() => (window as unknown as { __cssRoom?: { id: string } }).__cssRoom?.id === 'mma', null, { timeout: 90_000 });

  // the setting: off → the plain background, nothing of the room is loaded
  await page.goto('/#/reglages/affichage');
  const sw = page.getByRole('switch', { name: /Salle immersive/ });
  await expect(sw).toBeChecked();
  await sw.click({ force: true });
  await expect(sw).not.toBeChecked();
  await expect.poll(() => stored(page)).toContain('"salleImmersive":false');
  await training(page, 'boxe-debutant-01');
  await expect(page.locator('[data-room]').first()).toHaveAttribute('data-room', 'aucune');
  expect(await page.evaluate(() => (window as unknown as { __cssRoom?: unknown }).__cssRoom)).toBeUndefined();
});

test('les autres écrans gardent leur scène sans salle (accueil)', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.goto('/#/');
  const stage = page.locator('[data-room]');
  if (await stage.count()) await expect(stage.first()).toHaveAttribute('data-room', 'aucune');
});

test('le coach apparaît avec sa salle, jamais avant elle (1.25.1)', async ({ page }) => {
  // Youssef, 2026-11-06, on his phone: « le coach s'est affiché en premier puis est apparu la salle »
  test.setTimeout(240_000);
  await seed(page);
  for (const ex of ['boxe-debutant-01', 'judo-debutant-01']) {
    await training(page, ex);
    await page.waitForFunction(() => {
      const s = (window as unknown as { __cssStage?: { roomAt?: number; coachAt?: number } }).__cssStage;
      return !!s?.roomAt && !!s?.coachAt;
    }, null, { timeout: 120_000 });
    const s = await page.evaluate(() => (window as unknown as { __cssStage: { roomAt: number; coachAt: number } }).__cssStage);
    expect(s.coachAt, ex).toBeGreaterThanOrEqual(s.roomAt);
  }
});

// 1.40 (Youssef 13/11 18:35: « interdire dans les salles de sport les rotations haut et bas, juste droite gauche comme
// dans l'écran coach »): the room is a photograph around the coach; seen from above or below it stretches
test('dans une salle, la caméra tourne à gauche et à droite, jamais en haut ni en bas', async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page);
  await training(page, 'mma-debutant-01');
  await page.waitForFunction(() => (window as unknown as { __cssRoom?: { id: string } }).__cssRoom?.id === 'mma', null, { timeout: 90_000 });
  const cam = () => page.evaluate(() => (window as unknown as { __cssCamera?: { az: number; el: number } }).__cssCamera ?? null);
  await expect.poll(cam, { timeout: 90_000 }).not.toBeNull();
  const box = (await page.locator('canvas').first().boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height * 0.45;
  const drag = async (dx: number, dy: number) => {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  };
  const before = (await cam())!;
  await drag(0, -140);
  const afterUp = (await cam())!;
  expect(Math.abs(afterUp.el - before.el), 'pas de bascule vers le haut').toBeLessThan(1);
  await drag(0, 140);
  await drag(0, 140);
  const afterDown = (await cam())!;
  expect(Math.abs(afterDown.el - before.el), 'pas de bascule vers le bas').toBeLessThan(1);
  await drag(160, 0);
  const afterH = (await cam())!;
  expect(Math.abs(afterH.az - afterDown.az), 'rotation gauche-droite').toBeGreaterThan(10);
  expect(Math.abs(afterH.el - before.el)).toBeLessThan(1);
});
