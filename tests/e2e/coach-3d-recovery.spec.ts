import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * v0.29 (Youssef, 2026-10-21: « le coach apparaît, s'anime brièvement puis disparaît… fermer et rouvrir ne
 * règle rien »). Cause reproduced with scripts/dev/gpucrash.mjs: after graphics resets the browser refuses 3D
 * to the site for a while and the app never tried again. These scenes check that the coach always comes back
 * by itself, on one canvas, without a reload, and that the journal tells what happened.
 */
async function seed(page: Page, coach: 'homme' | 'femme' = 'homme') {
  await page.goto('/icons/icon.svg');
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
    localStorage.removeItem('css-3d-diag');
    localStorage.removeItem('css-3d-level');
  }, { ...DEFAULT_PROFILE, completed: true, coach, mainDiscipline: 'mma' });
}

const journal = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('css-3d-diag') ?? '[]') as { kind: string; msg: string }[]);
const kinds = async (page: Page) => (await journal(page)).map((e) => e.kind);
/** the coach model is ready on a live canvas */
async function coachShown(page: Page, timeout = 60_000) {
  await expect(page.locator('canvas')).toHaveCount(1, { timeout });
  await expect.poll(async () => (await journal(page)).filter((e) => e.kind === 'modele').length, { timeout }).toBeGreaterThan(0);
  expect(await page.locator('canvas').evaluate((c: HTMLCanvasElement) => !(c.getContext('webgl2') ?? c.getContext('webgl'))?.isContextLost())).toBe(true);
}
/** asks the browser to drop the coach's graphics context (as a phone does after a graphics reset) */
const loseContext = (page: Page, restoreAfter: number | null) =>
  page.locator('canvas').evaluate((c: HTMLCanvasElement, ms) => {
    const gl = c.getContext('webgl2') ?? c.getContext('webgl');
    const ext = gl!.getExtension('WEBGL_lose_context')!;
    ext.loseContext();
    if (ms !== null) setTimeout(() => ext.restoreContext(), ms);
  }, restoreAfter);

test.describe.configure({ mode: 'serial' });

test('contexte perdu puis rendu : le même canvas repart, qualité allégée notée', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.goto('/#/');
  await coachShown(page);
  await loseContext(page, 1000);
  await expect.poll(() => kinds(page), { timeout: 15_000 }).toContain('contexte-restaure');
  await coachShown(page);
  await expect(page.getByTestId('stage-failed')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('css-3d-level')!).level)).toBe(1);
});

test('contexte perdu sans retour : un nouveau coach est créé tout seul, sans recharger', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page, 'femme');
  await page.goto('/#/');
  await coachShown(page);
  await page.evaluate(() => ((window as unknown as { __mark: number }).__mark = 1));
  await loseContext(page, null);
  await expect.poll(() => kinds(page), { timeout: 30_000 }).toContain('recuperation');
  await coachShown(page);
  // same page (no reload) and never more than one canvas
  expect(await page.evaluate(() => (window as unknown as { __mark?: number }).__mark)).toBe(1);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('3D refusée au lancement : message d’attente, puis le coach arrive sans recharger', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  // the browser refuses WebGL for the first 8 s, like Chrome after graphics resets (« Web page caused context
  // loss and was blocked »)
  await page.addInitScript(() => {
    const until = Date.now() + 8000;
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
      if (/webgl/.test(type) && Date.now() < until) {
        this.dispatchEvent(Object.assign(new Event('webglcontextcreationerror'), { statusMessage: 'Web page caused context loss and was blocked' }));
        return null;
      }
      return (get as (...x: unknown[]) => unknown).call(this, type, ...a);
    } as typeof get;
  });
  await page.goto('/#/');
  await expect(page.getByTestId('stage-wait')).toBeVisible({ timeout: 20_000 });
  // the message and its button are not inside the hidden decorative layer
  await expect(page.getByRole('button', { name: 'Réessayer maintenant' })).toBeVisible();
  await coachShown(page);
  await expect(page.getByTestId('stage-wait')).toHaveCount(0);
  expect((await journal(page)).some((e) => e.kind === 'echec' && /Web page caused context loss and was blocked/.test(e.msg))).toBe(true);
});

test('fiche technique et entraînement : même reprise après une perte de contexte', async ({ page }) => {
  test.setTimeout(180_000);
  await seed(page);
  for (const path of ['/#/techniques/jab', '/#/entrainement?ex=boxe-debutant-01&mode=technique']) {
    await page.goto('about:blank');
    await page.goto(path);
    await coachShown(page);
    await page.evaluate(() => localStorage.removeItem('css-3d-diag'));
    await loseContext(page, null);
    await expect.poll(() => kinds(page), { timeout: 30_000 }).toContain('recuperation');
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 60_000 });
    await expect.poll(() => kinds(page), { timeout: 60_000 }).toContain('modele');
  }
});

test('arrière-plan : rendu en pause puis repris, le coach reste', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page);
  await page.goto('/#/');
  await coachShown(page);
  const setHidden = (h: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
      document.dispatchEvent(new Event('visibilitychange'));
    }, h);
  await setHidden(true);
  await expect.poll(async () => (await journal(page)).some((e) => /rendu en pause/.test(e.msg))).toBe(true);
  await setHidden(false);
  await expect.poll(async () => (await journal(page)).some((e) => /rendu repris/.test(e.msg))).toBe(true);
  await coachShown(page);
});

test('Réglages › Affichage 3D : journal lisible et retour à la qualité choisie', async ({ page }) => {
  test.setTimeout(60_000);
  await seed(page);
  await page.evaluate(() => {
    localStorage.setItem('css-3d-level', JSON.stringify({ level: 2, at: Date.now() }));
    localStorage.setItem('css-3d-diag', JSON.stringify([{ t: new Date().toISOString(), kind: 'contexte-perdu', msg: 'qualité abaissée au niveau 2' }]));
  });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByText(/Qualité allégée \(niveau 2\)/)).toBeVisible();
  await page.getByTestId('diag3d').locator('summary').click();
  await expect(page.getByTestId('diag3d')).toContainText('contexte-perdu : qualité abaissée au niveau 2');
  await page.getByRole('button', { name: 'Rétablir la qualité choisie' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('css-3d-level')!).level)).toBe(0);
});
