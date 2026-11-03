import { expect, test } from '@playwright/test';

/**
 * 1.6.0 (Youssef 2026-10-28): Axel and Kaila join Kadir and Amara; « Quand je clique sur changer de coach, je ne veux
 * voir que la liste des coachs, rien d'autre. »
 */
test('quatre coachs : Kaila choisie au premier lancement, Axel depuis « Changer de coach » (liste seule)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('next').click();
  for (const id of ['coach-homme', 'coach-axel', 'coach-femme', 'coach-kaila']) await expect(page.getByTestId(id), id).toBeVisible();
  await page.getByTestId('coach-kaila').click();
  await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('next').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Kaila');
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Kaila');

  await page.getByRole('link', { name: /Changer de coach/ }).click();
  await expect(page).toHaveURL(/#\/coach$/);
  // only the list of the coaches and the button to confirm
  await expect(page.locator('.coach-card')).toHaveCount(4);
  await expect(page.getByTestId('settings-coach-look')).toHaveCount(0);
  await expect(page.locator('.page p, .page select, .page input')).toHaveCount(0);
  await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('coach-axel').click();
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Axel');
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Axel');
});

/**
 * 1.9 (Youssef 2026-10-29: « diminue la taille des fiches coach pour que cela tienne sur une page dans choisi ton
 * coach, un clic sur la fiche doit faire pivoter la fiche sur un mode plus de détails »)
 */
for (const [w, h] of [
  [400, 820],
  [360, 640],
])
  test(`fiches coach ${w}x${h} : les quatre et « Valider » tiennent sur un écran, un appui retourne la fiche`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByTestId('next').click();
    await page.getByTestId('coach-axel').click();
    await page.getByTestId('next').click();
    for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
    await page.getByTestId('finish').click();
    await page.goto('/#/coach');
    await expect(page.locator('.coach-card')).toHaveCount(4);
    // no page scroll: every card and the button inside the screen, above the bottom bar
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(h);
    const bar = await page.getByTestId('bottom-bar').boundingBox();
    for (const id of ['coach-homme', 'coach-axel', 'coach-femme', 'coach-kaila', 'coach-valider']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b.y + b.height, id).toBeLessThanOrEqual(bar ? bar.y + 1 : h);
    }
    // the details are on the back of the card
    const details = page.getByTestId('coach-details-kaila');
    await expect(details).toHaveAttribute('aria-hidden', 'true');
    await page.getByTestId('coach-kaila').click();
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-expanded', 'true');
    await expect(details).toHaveAttribute('aria-hidden', 'false');
    for (const t of ['La Valkyrie', 'Taille', '1,65 m', 'Garde', 'Points forts']) await expect(details).toContainText(t);
    // a second tap turns it back, the coach stays chosen
    await page.getByTestId('coach-kaila').click();
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
  });
