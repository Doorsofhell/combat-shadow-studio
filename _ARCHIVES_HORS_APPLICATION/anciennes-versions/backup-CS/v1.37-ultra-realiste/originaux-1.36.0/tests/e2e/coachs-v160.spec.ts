import { expect, test } from '@playwright/test';

/**
 * 1.6.0 (Youssef 2026-10-28): Axel and Kaila join Kadir and Amara; « Quand je clique sur changer de coach, je ne veux
 * voir que la liste des coachs, rien d'autre. »
 */
test('six coachs : Kaila choisie au premier lancement, Axel depuis « Changer de coach » (liste seule)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('next').click();
  // 1.11: Naël and Inaya join the four others (none replaced)
  for (const id of ['coach-homme', 'coach-axel', 'coach-nael', 'coach-femme', 'coach-kaila', 'coach-inaya']) await expect(page.getByTestId(id), id).toBeVisible();
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
  // only the coaches and the button to confirm; 1.32.0 (« La vedette »): the coach looked at in 3D, the strip of six
  await expect(page.locator('.star-thumb')).toHaveCount(6);
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
 * coach »), 1.13 (Youssef 2026-11-04, option B: the turning cards became a selection screen, the chosen coach's sheet
 * with bars under the row of the six coaches; « un appui retourne la fiche » became « un appui montre sa fiche »)
 */
for (const [w, h] of [
  [400, 820],
  [360, 640],
])
  test(`écran de choix ${w}x${h} : les six, la fiche et « Valider » tiennent sur un écran, un appui montre la fiche`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByTestId('next').click();
    await page.getByTestId('coach-axel').click();
    await page.getByTestId('next').click();
    for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
    await page.getByTestId('finish').click();
    await page.goto('/#/coach');
    await expect(page.locator('.star-thumb')).toHaveCount(6);
    await expect(page.getByTestId('star-mine')).toHaveText('Ton coach');
    // no page scroll: every coach, the sheet and the button inside the screen, above the bottom bar
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(h);
    const bar = await page.getByTestId('bottom-bar').boundingBox();
    for (const id of ['coach-homme', 'coach-axel', 'coach-nael', 'coach-femme', 'coach-kaila', 'coach-inaya', 'coach-details-axel', 'coach-valider']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b.y + b.height, id).toBeLessThanOrEqual(bar ? bar.y + 1 : h);
    }
    // Axel's weight could not be measured on his model: 1.32.0 shows his height alone, never a made-up number
    await expect(page.getByTestId('star-facts')).toHaveText('1,94 m');
    await expect(page.getByTestId('coach-valider')).toHaveText(/Garder Axel/i);
    await expect(page.getByTestId('coach-details-kaila')).toHaveCount(0);
    await page.getByTestId('coach-kaila').click();
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('coach-axel')).toHaveAttribute('aria-checked', 'false');
    const details = page.getByTestId('coach-details-kaila');
    // 1.32.0 (Youssef, 2026-11-11): only real facts, the style, the strengths of the catalogue and the measured height;
    // the estimated bars « profil de style sur 10 » are gone
    for (const t of ['La Valkyrie', 'Puissante et compacte', 'Centre de gravité bas', 'Avancée constante', 'Saisies', '1,65 m']) await expect(details).toContainText(t);
    await expect(details).not.toContainText('Profil de style');
    await expect(page.locator('.coach-star .cells, .coach-star .skill')).toHaveCount(0);
    await expect(page.getByTestId('star-mine')).toHaveCount(0);
    await expect(page.getByTestId('coach-valider')).toHaveText(/Choisir Kaila/i);
    // the arrows go round the six coaches
    await page.getByTestId('star-next').click();
    await expect(page.getByTestId('coach-inaya')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('star-prev').click();
    await expect(page.getByTestId('coach-kaila')).toHaveAttribute('aria-checked', 'true');
    // « Le voir bouger » is an icon (no text), pressed while the coach shows the move
    const move = page.getByTestId('star-move');
    await expect(move).toHaveAccessibleName(/Le voir bouger/);
    await expect(move).toHaveText('');
    await expect(move).toBeEnabled({ timeout: 90_000 });
    await move.click();
    await expect(move).toHaveAttribute('aria-pressed', 'true');
    await expect(move).toHaveAccessibleName('Revenir en garde');
    // looking at a coach changes nothing: the stored coach is still Axel
    expect(await page.evaluate(() => new Promise<string>((res) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => { const g = r.result.transaction('keyval').objectStore('keyval').get('u:local:css-profile'); g.onsuccess = () => res(String(g.result)); }; }))).toContain('"champion":"axel"');
    // a measured weight is shown with its bar (Kadir: 91 kg, volume of his model)
    await page.getByTestId('coach-homme').click();
    await expect(page.getByTestId('coach-details-mma-kadir')).toContainText('91 kg');
  });

/** 1.11 (Youssef 2026-11-03 23:03: « créé 2 joueurs supplémentaires, ne remplace pas les autres »): Naël and Inaya */
test('Naël et Inaya se choisissent comme les autres, leur fiche a leurs propres détails', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('next').click();
  await page.getByTestId('coach-inaya').click();
  await expect(page.getByTestId('coach-inaya')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('coach-details-inaya')).toContainText('La Panthère');
  await page.getByTestId('next').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Inaya');
  await page.goto('/#/coach');
  await page.getByTestId('coach-nael').click();
  await expect(page.getByTestId('coach-details-nael')).toContainText('Le Faucon');
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Naël');
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Naël');
});
