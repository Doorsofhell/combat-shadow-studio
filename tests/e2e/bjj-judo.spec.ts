import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/** BJJ and judo: solo techniques are animated, partner techniques are explained only, with their mode shown. */
async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, look }) => {
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
      await put('u:local:css-fighters', { state: { fighters: [{ id: 'f1', name: 'Test', look }], activeId: 'f1' }, version: 0 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme', mainDiscipline: 'judo' }, look: defaultLook('homme') },
  );
  await page.goto('about:blank');
}

test('Entraîner : 6 disciplines, dont BJJ et judo', async ({ page }) => {
  await seed(page);
  await page.goto('/#/entrainer');
  for (const n of ['Boxe anglaise', 'Kick-boxing', 'MMA', 'Muay-thaï', 'Jiu-jitsu brésilien', 'Judo']) await expect(page.locator('.disc-card .name', { hasText: n }).first()).toBeVisible();
});

for (const d of ['bjj', 'judo'])
  test(`page discipline ${d} : 4 niveaux d’exercices solo`, async ({ page }) => {
    await seed(page);
    await page.goto(`/#/discipline/${d}`);
    await expect(page.locator('.ex-card').first()).toBeVisible();
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

test('Techniques judo : solo animées, puis section partenaire réel', async ({ page }) => {
  await seed(page);
  await page.goto('/#/techniques?d=judo');
  await expect(page.locator('.tech-card', { hasText: 'Tai-sabaki' }).first()).toBeVisible();
  const sec = page.getByTestId('partner-section');
  await expect(sec).toBeVisible();
  await expect(sec.getByTestId('partner-o-soto-gari')).toBeVisible();
  await expect(sec.getByTestId('mode-badge').first()).toHaveText('Partenaire réel requis');
  // striking disciplines have no partner section
  await page.goto('/#/techniques?d=boxe');
  await expect(page.locator('.tech-card').first()).toBeVisible();
  await expect(page.getByTestId('partner-section')).toHaveCount(0);
});

test('fiche partenaire : sécurité, étapes, aucun exercice ni animation', async ({ page }) => {
  await seed(page);
  await page.goto('/#/partenaire/o-soto-gari');
  await expect(page.getByTestId('partner-page')).toBeVisible();
  await expect(page.getByTestId('mode-badge')).toHaveAttribute('data-mode', 'partenaire');
  // honest state of the two-person animation
  await expect(page.getByTestId('animation-status')).toHaveAttribute('data-status', 'non-implementee');
  await expect(page.getByTestId('partner-safety')).toContainText('enseignant');
  await expect(page.getByTestId('partner-phases').locator('li')).toHaveCount(4);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /lancer|démarrer|commencer/i })).toHaveCount(0);
  const r = await new AxeBuilder({ page }).include('[data-testid=partner-page]').withRules(['color-contrast']).analyze();
  expect(r.violations).toEqual([]);
});

test('fiche partenaire : la préparation solo ouvre une vraie technique animée', async ({ page }) => {
  await seed(page);
  await page.goto('/#/partenaire/seoi-nage');
  await page.getByTestId('partner-prep').click();
  await expect(page).toHaveURL(/techniques\/uchikomi-seoi/);
  await expect(page.getByTestId('mode-badge')).toHaveAttribute('data-mode', 'solo');
  await expect(page.getByTestId('animation-status')).toHaveText('Animation : contrôlée automatiquement');
  await expect(page.locator('canvas')).toHaveCount(1, { timeout: 20000 });
});

test('soumission BJJ : principes seulement, avertissement visible', async ({ page }) => {
  await seed(page);
  await page.goto('/#/partenaire/cle-de-bras-garde');
  await expect(page.getByTestId('partner-safety')).toContainText('Jamais sans un enseignant');
  await expect(page.getByTestId('partner-safety')).toContainText('tape');
});
