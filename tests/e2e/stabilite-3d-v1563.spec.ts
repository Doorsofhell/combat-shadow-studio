import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/**
 * 1.56.3 (Youssef, 2026-11-15 : « J'ai souvent ce message par rapport à la stabilité 3D »). Constat : en quittant un
 * écran avec coach, la bibliothèque 3D rend volontairement son contexte graphique (forceContextLoss). Le navigateur
 * annonce alors « contexte perdu » sur le canvas qui disparaît, et l'application le comptait comme un incident :
 * qualité allégée niveau 1 puis 2 après deux changements d'écran, sans aucun incident réel.
 */
async function seed(page: Page) {
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
    localStorage.removeItem('css-3d-fix-1563');
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'homme', mainDiscipline: 'mma' });
}
const journal = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('css-3d-diag') ?? '[]') as { kind: string; msg: string }[]);
const level = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('css-3d-level') ?? '{"level":0}').level as number);
async function coachShown(page: Page) {
  await expect(page.locator('canvas')).toHaveCount(1, { timeout: 60_000 });
  await expect.poll(async () => (await journal(page)).filter((e) => e.kind === 'modele').length, { timeout: 60_000 }).toBeGreaterThan(0);
}

test('quitter un écran avec coach n’est pas un incident graphique', async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page);
  await page.goto('/#/stats');
  for (const path of ['/#/', '/#/techniques/jab', '/#/entrainement?ex=boxe-debutant-01&mode=technique']) {
    await page.evaluate((p) => (location.hash = p.slice(1)), path);
    await coachShown(page);
    await page.evaluate(() => {
      const w = window as unknown as { __n: number };
      w.__n = (w.__n ?? 0) + 1;
    });
    // un écran sans 3D : le coach précédent est démonté
    await page.evaluate(() => (location.hash = '#/stats'));
    await expect(page.locator('canvas')).toHaveCount(0, { timeout: 20_000 });
    await page.waitForTimeout(1500);
  }
  // pas de rechargement de la page entre les écrans
  expect(await page.evaluate(() => (window as unknown as { __n: number }).__n)).toBe(3);
  const kinds = (await journal(page)).map((e) => e.kind);
  expect(kinds).not.toContain('contexte-perdu');
  expect(await level(page)).toBe(0);
  // Réglages : pas de qualité allégée, et le journal dit qu'il n'y a aucun incident
  await page.evaluate(() => (location.hash = '#/reglages/affichage'));
  await expect(page.getByText('Qualité choisie appliquée, aucun incident graphique récent.')).toBeVisible();
  await expect(page.getByText(/dont aucun incident/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rétablir la qualité choisie' })).toHaveCount(0);
});

test('un niveau allégé laissé par une version précédente est remis à 0 à la mise à jour', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => {
    localStorage.removeItem('css-3d-fix-1563');
    localStorage.setItem('css-3d-level', JSON.stringify({ level: 2, at: Date.now() }));
  });
  await page.goto('/#/reglages/affichage');
  await expect(page.getByText('Qualité choisie appliquée, aucun incident graphique récent.')).toBeVisible();
  await page.getByTestId('diag3d').locator('summary').click();
  await expect(page.getByTestId('diag3d')).toContainText('niveau 2 remis à 0');
});
