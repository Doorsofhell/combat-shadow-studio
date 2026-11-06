import { expect, type Page, test } from '@playwright/test';
import { ALL_COACHES } from '../../src/domain/coaches/catalog';
import { seedProfile } from './nav-helpers';

/**
 * 1.25 chargement au démarrage (Youssef, 2026-11-06): « le chrono du round » with the CS logo, real progress and
 * fight-gym messages while every coach, their outfits and the six rooms are downloaded; then no wait when a coach
 * is chosen (« aucune latence lors du choix des coachs »). The next launches download nothing.
 */
const MESSAGES = /Ouverture des salles|Allumage des projecteurs|Nettoyage du ring|Mise en place des tatamis|Les coachs s’échauffent|Laçage des gants|Bandage des mains|Ceinture bien nouée|Pesée officielle|Le coach t’attend/;
const DISCIPLINES = ['boxe', 'kickboxing', 'muaythai', 'mma', 'judo', 'bjj'];

/** what the app keeps on the phone (its cache of models and pictures) */
const kept = (page: Page) => page.evaluate(async () => (await (await caches.open('css-modeles')).keys()).map((r) => new URL(r.url).pathname));

test.describe('sans service worker (le réseau vu par la page)', () => {
  // the page's own requests and resource timings tell a download from a kept copy only without the service worker
  // in between
  test.use({ serviceWorkers: 'block' });

  test('première ouverture : chrono du round, vrai avancement, tout est téléchargé et gardé, puis l’accueil', async ({ page }) => {
    test.setTimeout(180_000);
    await seedProfile(page);
    // a first launch: nothing kept yet
    await page.goto('/#/');
    await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 120_000 });
    await page.evaluate(() => caches.delete('css-modeles'));
    await page.goto('about:blank');
    const got = new Set<string>();
    page.on('requestfinished', (r) => got.add(new URL(r.url()).pathname));
    // a slow line: each model or picture arrives after a short wait, so the chrono is seen filling
    await page.route(/\/(coaches|salles)\//, async (route) => {
      await new Promise((r) => setTimeout(r, 60));
      await route.continue();
    });
    await page.goto('/#/');
    const boot = page.getByTestId('boot-screen');
    await expect(page.getByTestId('boot-round')).toHaveText('ROUND 1');
    await expect(page.getByTestId('boot-message')).toHaveText(MESSAGES);
    await expect(boot.locator('img.boot-logo')).toBeVisible();
    // the bar moves forward with the bytes
    await expect.poll(async () => Number(await boot.getAttribute('data-ratio')), { timeout: 60_000 }).toBeGreaterThan(0.05);
    const seen = new Set<string>();
    const t0 = Date.now();
    while (Date.now() - t0 < 120_000 && (await boot.count())) {
      const m = await page
        .getByTestId('boot-message')
        .textContent()
        .catch(() => null);
      if (m) seen.add(m);
      await page.waitForTimeout(150);
    }
    await expect(boot).toHaveCount(0);
    expect(seen.size).toBeGreaterThan(2);
    // the home screen once it is all there
    await expect(page.getByTestId('bottom-bar')).toBeVisible();
    for (const c of ALL_COACHES) expect([...got].some((p) => p.endsWith(`/coaches/${c.id}/photo.glb`)), c.id).toBe(true);
    for (const d of DISCIPLINES) expect([...got].some((p) => p.endsWith(`/salles/${d}/fond-2k.webp`)), d).toBe(true);
    expect([...got].filter((p) => p.includes('/tenues/') && p.endsWith('.glb')).length).toBeGreaterThanOrEqual(ALL_COACHES.length * 7);
    // all kept on the phone
    const k = await kept(page);
    for (const c of ALL_COACHES) expect(k.some((p) => p.endsWith(`/coaches/${c.id}/photo.glb`)), c.id).toBe(true);
    for (const d of DISCIPLINES) expect(k.some((p) => p.endsWith(`/salles/${d}/profondeur.png`)), d).toBe(true);
  });

  test('ouverture suivante : rien n’est retéléchargé et l’app s’ouvre sans chrono', async ({ page }) => {
    test.setTimeout(180_000);
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 120_000 });
    await page.goto('about:blank');
    const asked: string[] = [];
    page.on('request', (r) => {
      const p = new URL(r.url()).pathname;
      if (/\/(coaches|salles)\//.test(p)) asked.push(p);
    });
    await page.goto('/#/');
    await expect(page.getByTestId('bottom-bar')).toBeVisible();
    await expect(page.getByTestId('boot-round')).toHaveCount(0);
    // only what the home screen itself draws may be read, from the kept copy; the start screen asks for nothing
    expect(asked.filter((p) => p.includes('/tenues/') && !p.includes('/mma-amara/') && !p.includes('/mma-kadir/'))).toEqual([]);
  });

});

test('hors ligne pour les modèles : le chrono va au bout et l’app s’ouvre quand même', async ({ page }) => {
  test.setTimeout(120_000);
  await seedProfile(page);
  await page.context().route(/\/(coaches|salles)\//, (route) => route.abort('internetdisconnected'));
  await page.goto('/#/');
  await page.evaluate(() => caches.delete('css-modeles'));
  await page.goto('about:blank');
  await page.goto('/#/');
  await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('boot-screen')).toHaveCount(0);
});

test('après le démarrage, choisir un autre coach ne télécharge rien et ne remontre pas le chrono', async ({ page }) => {
  test.setTimeout(180_000);
  await seedProfile(page);
  await page.goto('/#/');
  await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId('boot-screen')).toHaveCount(0);
  // from now on the service worker answers from the kept copies: anything it still asks the network for is a download
  const net: string[] = [];
  page.context().on('request', (r) => {
    if (r.serviceWorker() && /\/coaches\/.*\.glb$/.test(r.url())) net.push(new URL(r.url()).pathname);
  });
  await page.goto('about:blank');
  await page.goto('/#/coach');
  await page.getByTestId('coach-axel').click();
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('boot-screen')).toHaveCount(0);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(page.locator('.tr-stage canvas')).toBeVisible();
  await expect(page.getByTestId('boot-screen')).toHaveCount(0);
  // Axel drawn in his boxing outfit, from the phone
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /coaches\/axel\/(photo|tenues\/boxe)\.glb$/.test(e.name)).length), { timeout: 60_000 }).toBeGreaterThanOrEqual(2);
  expect(net).toEqual([]);
});
