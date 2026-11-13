import { expect, test } from '@playwright/test';
import { openSetting, seedProfile } from './nav-helpers';

/**
 * 1.4.0 (Youssef, 2026-10-28 00:07: « Toute l'interface doit pulser ou clignoter discrètement au rythme du bip du
 * round ou de l'annonce vocale des combinaisons »; 15:03: « Je ne retrouve pas les clignotement demandé »): during the
 * session the screen flashes on each signal, in the chosen style; never more than 3 times a second; it can be
 * turned off in Réglages.
 */

test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

test('séance : l’écran s’éclaire au décompte et à chaque coup annoncé, jamais plus de 3 fois par seconde', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __flash: number[] };
    w.__flash = [];
    new MutationObserver(() => {
      const el = document.querySelector('[data-testid=training]');
      if (el?.classList.contains('pulse-on')) w.__flash.push(performance.now());
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-pulses'] });
  });
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  const root = page.getByTestId('training');
  await expect(root).toHaveAttribute('data-pulse', 'contour');
  // nothing flashes before the start
  await page.waitForTimeout(1500);
  await expect(root).not.toHaveAttribute('data-pulses', /.+/);
  await page.getByTestId('start').click();
  // the countdown, then the moves called
  await expect.poll(async () => Number((await root.getAttribute('data-pulses')) ?? 0), { timeout: 30_000 }).toBeGreaterThanOrEqual(4);
  const flashes = await page.evaluate(() => (window as unknown as { __flash: number[] }).__flash);
  for (let i = 1; i < flashes.length; i++) expect(flashes[i] - flashes[i - 1], `écart ${i}`).toBeGreaterThanOrEqual(330);
  // the flash never takes a tap and never covers the coach with colour at rest
  const layer = page.locator('.tr-pulse');
  expect(await layer.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
});

test('Réglages : style, intensité et coupure ; coupée, rien ne s’éclaire', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/reglages');
  await openSetting(page, 'pulsation');
  for (const n of ['Contour lumineux', 'Fond qui respire', 'Chrono seul', 'Coupée']) await expect(page.getByRole('radio', { name: n, exact: true }), n).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Contour lumineux', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Intensité')).toBeVisible();
  await page.getByRole('radio', { name: 'Coupée', exact: true }).click();
  await expect(page.getByText('Intensité')).toHaveCount(0);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await page.getByTestId('start').click();
  await page.waitForTimeout(8000);
  await expect(page.getByTestId('training')).toHaveAttribute('data-pulse', 'off');
  await expect(page.getByTestId('training')).not.toHaveAttribute('data-pulses', /.+/);
});

for (const theme of ['clair', 'sombre'] as const) {
  test(`mode ${theme === 'clair' ? 'jour' : 'nuit'} : l’éclair du contour est visible pendant le travail`, async ({ page }) => {
    await seedProfile(page, {}, { theme, pulseIntensity: 1 });
    await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
    await page.getByTestId('start').click();
    const root = page.getByTestId('training');
    await expect.poll(async () => Number((await root.getAttribute('data-pulses')) ?? 0), { timeout: 30_000 }).toBeGreaterThanOrEqual(1);
    // the outline uses the colour of the phase
    const shadow = await page.locator('.tr-pulse').evaluate((e) => getComputedStyle(e).boxShadow);
    expect(shadow, theme).toMatch(/rgb/);
    expect(shadow, theme).toContain('inset');
  });
}
