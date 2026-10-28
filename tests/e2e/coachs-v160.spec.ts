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
