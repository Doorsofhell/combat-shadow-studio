import { expect, test } from '@playwright/test';

/**
 * 1.6.0 (Youssef 2026-10-28): Axel and Kaila joined Kadir and Amara; « Quand je clique sur changer de coach, je ne veux
 * voir que la liste des coachs, rien d'autre. » 1.37 (Youssef, 2026-11-12): Axel and Kaila (MakeHuman) are removed,
 * the four Microsoft Rocketbox coaches remain (Kadir, Naël, Amara, Inaya).
 */
test('quatre coachs : Amara choisie au premier lancement, Naël depuis « Changer de coach » (liste seule)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('next').click();
  for (const id of ['coach-homme', 'coach-nael', 'coach-femme', 'coach-inaya']) await expect(page.getByTestId(id), id).toBeVisible();
  await expect(page.getByTestId('coach-axel')).toHaveCount(0);
  await expect(page.getByTestId('coach-kaila')).toHaveCount(0);
  await page.getByTestId('coach-femme').click();
  await expect(page.getByTestId('coach-femme')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('next').click();
  for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Amara');
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Amara');

  await page.getByRole('link', { name: /Changer de coach/ }).click();
  await expect(page).toHaveURL(/#\/coach$/);
  // only the coaches and the button to confirm; 1.32.0 (« La vedette »): the coach looked at in 3D, the strip of four
  await expect(page.locator('.star-thumb')).toHaveCount(4);
  await expect(page.getByTestId('settings-coach-look')).toHaveCount(0);
  await expect(page.locator('.page p, .page select, .page input')).toHaveCount(0);
  await expect(page.getByTestId('coach-femme')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('coach-nael').click();
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('fighter-name')).toHaveText('Naël');
  await page.reload();
  await expect(page.getByTestId('fighter-name')).toHaveText('Naël');
});

/** 1.37: a profile saved with Axel or Kaila opens with Kadir or Amara (same body type), the rest of the profile kept */
test('1.37 : un profil qui avait choisi Axel ou Kaila retrouve Kadir ou Amara', async ({ page }) => {
  for (const [old, sex, name] of [
    ['axel', 'homme', 'Kadir'],
    ['kaila', 'femme', 'Amara'],
  ] as const) {
    await page.goto('/');
    await page.evaluate(
      ([champion, coach]) =>
        new Promise<void>((res) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, champion, mainDiscipline: 'boxe', pseudo: 'Testeur' } }, version: 0 }), 'u:local:css-profile');
            tx.oncomplete = () => res();
          };
        }),
      [old, sex],
    );
    await page.reload();
    await expect(page.getByTestId('fighter-name')).toHaveText(name);
    await page.goto('/#/coach');
    await expect(page.locator('.star-thumb')).toHaveCount(4);
    await expect(page.getByTestId(`coach-${sex}`)).toHaveAttribute('aria-checked', 'true');
  }
});

/**
 * 1.9 (Youssef 2026-10-29: « diminue la taille des fiches coach pour que cela tienne sur une page dans choisi ton
 * coach »), 1.13 (Youssef 2026-11-04, option B: the turning cards became a selection screen, the chosen coach's sheet
 * with bars under the row of the coaches; « un appui retourne la fiche » became « un appui montre sa fiche »)
 */
for (const [w, h] of [
  [400, 820],
  [360, 640],
])
  test(`écran de choix ${w}x${h} : les quatre, la fiche et « Valider » tiennent sur un écran, un appui montre la fiche`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByTestId('next').click();
    await page.getByTestId('coach-nael').click();
    await page.getByTestId('next').click();
    for (let i = 0; i < 4; i++) await page.getByTestId('next').click();
    await page.getByTestId('finish').click();
    await page.goto('/#/coach');
    await expect(page.locator('.star-thumb')).toHaveCount(4);
    await expect(page.getByTestId('star-mine')).toHaveText('Ton coach');
    // no page scroll: every coach, the sheet and the button inside the screen, above the bottom bar
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(h);
    const bar = await page.getByTestId('bottom-bar').boundingBox();
    for (const id of ['coach-homme', 'coach-nael', 'coach-femme', 'coach-inaya', 'coach-details-nael', 'coach-valider']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b.y + b.height, id).toBeLessThanOrEqual(bar ? bar.y + 1 : h);
    }
    // only measured facts: Naël's height and the weight measured on his model
    await expect(page.getByTestId('star-facts')).toHaveText('1,80 m · 87 kg');
    await expect(page.getByTestId('coach-valider')).toHaveText(/Garder Naël/i);
    await expect(page.getByTestId('coach-details-inaya')).toHaveCount(0);
    await page.getByTestId('coach-inaya').click();
    await expect(page.getByTestId('coach-inaya')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('coach-nael')).toHaveAttribute('aria-checked', 'false');
    const details = page.getByTestId('coach-details-inaya');
    // 1.32.0 (Youssef, 2026-11-11): only real facts, the style, the strengths of the catalogue and the measured height;
    // the estimated bars « profil de style sur 10 » are gone
    for (const t of ['La Panthère', 'Explosive, coups de pied à distance', 'Coups de pied', 'Gestion de la distance', 'Explosivité', '1,73 m']) await expect(details).toContainText(t);
    await expect(details).not.toContainText('Profil de style');
    await expect(page.locator('.coach-star .cells, .coach-star .skill')).toHaveCount(0);
    await expect(page.getByTestId('star-mine')).toHaveCount(0);
    await expect(page.getByTestId('coach-valider')).toHaveText(/Choisir Inaya/i);
    // the arrows go round the four coaches (Inaya is the last one: « suivant » comes back to Kadir)
    await page.getByTestId('star-next').click();
    await expect(page.getByTestId('coach-homme')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('star-prev').click();
    await expect(page.getByTestId('coach-inaya')).toHaveAttribute('aria-checked', 'true');
    // « Le voir bouger » is an icon (no text), pressed while the coach shows the move
    const move = page.getByTestId('star-move');
    await expect(move).toHaveAccessibleName(/Le voir bouger/);
    await expect(move).toHaveText('');
    await expect(move).toBeEnabled({ timeout: 90_000 });
    await move.click();
    await expect(move).toHaveAttribute('aria-pressed', 'true');
    await expect(move).toHaveAccessibleName('Revenir en garde');
    // looking at a coach changes nothing: the stored coach is still Naël
    expect(await page.evaluate(() => new Promise<string>((res) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => { const g = r.result.transaction('keyval').objectStore('keyval').get('u:local:css-profile'); g.onsuccess = () => res(String(g.result)); }; }))).toContain('"champion":"nael"');
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

/**
 * 1.37 (Youssef, 2026-11-12): the portraits of the coach choice share the width of the screen on one row, whatever the
 * number of coaches, without taking room from the big stage (same height as before); on that stage the finger turns
 * the coach left and right only, never up or down.
 */
for (const [w, h] of [
  [360, 640],
  [412, 915],
])
  test(`1.37 choix du coach ${w}x${h} : vignettes sur une ligne à largeur partagée, rotation gauche-droite seulement`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.evaluate(
      () =>
        new Promise<void>((res) => {
          const r = indexedDB.open('keyval-store');
          r.onupgradeneeded = () => r.result.createObjectStore('keyval');
          r.onsuccess = () => {
            const tx = r.result.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach: 'homme', champion: 'mma-kadir', mainDiscipline: 'boxe', pseudo: 'Test' } }, version: 0 }), 'u:local:css-profile');
            tx.oncomplete = () => res();
          };
        }),
    );
    await page.goto('/#/coach');
    const thumbs = page.locator('.star-thumb');
    await expect(thumbs).toHaveCount(4);
    const boxes = await thumbs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
    const strip = (await page.locator('.star-strip').boundingBox())!;
    // one row, equal widths, inside the screen
    for (const b of boxes) {
      expect(Math.abs(b.y - boxes[0].y)).toBeLessThan(1);
      expect(Math.abs(b.width - boxes[0].width)).toBeLessThan(1);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(w);
    }
    // the share of the width: four portraits fill the strip (at most 120 px each), far wider than the 48 px of six
    const share = Math.min(120, (strip.width - 16 - 3 * 6) / 4);
    expect(boxes[0].width).toBeGreaterThan(share - 2);
    expect(boxes[0].width).toBeGreaterThan(60);
    // the height of 1.32: the big stage keeps its room
    expect(boxes[0].height).toBe(h <= 700 ? 50 : 56);

    // the big stage: a vertical drag does not tilt the camera, a horizontal one turns it
    const stage = (await page.getByTestId('star-stage').boundingBox())!;
    const cam = () => page.evaluate(() => (window as unknown as { __cssCamera?: { az: number; el: number } }).__cssCamera ?? null);
    await expect.poll(cam, { timeout: 90_000 }).not.toBeNull();
    const cx = stage.x + stage.width / 2;
    const cy = stage.y + stage.height * 0.45;
    const drag = async (dx: number, dy: number) => {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + dx, cy + dy, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(400);
    };
    const before = (await cam())!;
    await drag(0, -120);
    const afterV = (await cam())!;
    expect(Math.abs(afterV.el - before.el), 'pas de bascule haut-bas').toBeLessThan(1);
    await drag(140, 0);
    const afterH = (await cam())!;
    expect(Math.abs(afterH.az - afterV.az), 'rotation gauche-droite').toBeGreaterThan(10);
    expect(Math.abs(afterH.el - before.el)).toBeLessThan(1);
  });
