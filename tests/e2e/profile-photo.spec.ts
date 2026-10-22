import { expect, test } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// v0.37 (Youssef, « correctif authentification gratuite à 0 € », 2026-10-22): personal profile photo kept on the
// device (gallery or camera), framed, previewed, replaced or deleted; it never needs an account
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAL0lEQVR4nO3NIQEAMAgAsPMgaPqnIBYVcJitwKKz3oV/sorFYrFYLBaLxWKxeGUAq4oBSiU7uzUAAAAASUVORK5CYII=',
  'base64',
);

test('photo de profil : ajouter, cadrer, garder après rechargement, supprimer', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/profil');
  const avatar = page.locator('.acc-hero .acc-avatar');
  // no 3D fighter in this seed: the initials are shown
  const before = await avatar.getAttribute('data-avatar');
  expect(before).not.toBe('photo');
  await page.getByTestId('avatar-edit').click();
  await expect(page.getByTestId('photo-save')).toBeDisabled();
  // a file that is not a picture is refused with a clear sentence
  await page.getByTestId('photo-file').setInputFiles({ name: 'note.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
  await expect(page.getByRole('alert')).toContainText('Choisis une photo');
  await page.getByTestId('photo-file').setInputFiles({ name: 'moi.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByTestId('photo-preview').locator('img')).toBeVisible();
  await page.getByTestId('photo-zoom').fill('2');
  await page.getByTestId('photo-save').click();
  await expect(avatar).toHaveAttribute('data-avatar', 'photo');
  const src = await avatar.locator('img').getAttribute('src');
  expect(src).toMatch(/^data:image\/(webp|jpeg);base64,/);
  // re-encoded at 320 px: the stored image is small
  expect(src!.length).toBeLessThan(120_000);

  await page.reload();
  await expect(page.locator('.acc-hero .acc-avatar')).toHaveAttribute('data-avatar', 'photo');

  await page.getByTestId('photo-open').click();
  await page.getByTestId('photo-delete').click();
  await expect(page.locator('.acc-hero .acc-avatar')).toHaveAttribute('data-avatar', before!);
  await page.reload();
  await expect(page.locator('.acc-hero .acc-avatar')).toHaveAttribute('data-avatar', before!);
});

test('sans comptes configurés : seul le mode invité est proposé, aucun bouton inactif', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/connexion');
  await expect(page.getByTestId('guest-continue')).toBeVisible();
  await expect(page.getByTestId('accounts-off')).toBeVisible();
  for (const t of [/Google/, /Facebook/, /Instagram/, /Apple/]) await expect(page.getByRole('button', { name: t })).toHaveCount(0);
});
