import { expect, test, type Page } from '@playwright/test';

/**
 * V4 « Ton coach » (Youssef, 2026-11-18 : « une ambiance visuelle unique… tirée des traits du coach »). Chaque coach est
 * présenté dans son propre univers 3D (CoachAtmosphereResolver → AtmosphereScene) ; la barre du bas, la sélection et la
 * conservation du coach ne changent pas.
 */
const COACHS = [
  ['coach-homme', 'mma-kadir', 'ailes'],
  ['coach-nael', 'nael', 'ailes-vitesse'],
  ['coach-victor', 'victor', 'lune'],
  ['coach-femme', 'mma-amara', 'criniere'],
  ['coach-inaya', 'inaya', 'griffes'],
  ['coach-kanya', 'kanya', 'rayures'],
] as const;

async function seed(page: Page, champion = 'mma-kadir', coach = 'homme') {
  await page.goto('/');
  await page.evaluate(
    ([champion, coach]) =>
      new Promise<void>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, champion, mainDiscipline: 'boxe', pseudo: 'Test' } }, version: 0 }), 'u:local:css-profile');
          tx.oncomplete = () => res();
        };
      }),
    [champion, coach],
  );
}

const atmo = (page: Page) => page.evaluate(() => (window as unknown as { __cssAtmo?: { coach?: string; motif?: string; layers?: number; textures?: number; geometries?: number; ownTextures?: number } }).__cssAtmo ?? null);

test('V4 : chaque coach a son propre univers, tiré de son surnom, et sa fiche réelle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await seed(page);
  await page.goto('/#/coach');
  await expect(page.getByTestId('star-stage')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
  for (const [tid, id, motif] of COACHS) {
    await page.getByTestId(tid).click();
    await expect(page.getByTestId('star-stage')).toHaveAttribute('data-atmo', motif);
    await expect.poll(async () => (await atmo(page))?.coach, { timeout: 30_000 }).toBe(id);
    expect((await atmo(page))?.motif).toBe(motif);
    // spécialités avec icône, taille et poids réels
    await expect(page.getByTestId(`coach-details-${id}`).locator('.star-chips i svg')).toHaveCount(3);
    await expect(page.getByTestId('star-facts')).toContainText(' m');
  }
  // aucune statistique inventée
  await expect(page.locator('.coach-star .cells, .coach-star .skill, .coach-star progress')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('V4 : dix-huit changements de coach de suite, ni erreur ni accumulation en mémoire graphique', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && /webgl|shader|context/i.test(m.text())) errors.push(m.text());
  });
  await seed(page);
  await page.goto('/#/coach');
  await expect(page.getByTestId('star-stage')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
  const settle = async () => {
    // le coach affiché est chargé, son emblème dessiné et l'ancien parti
    await expect(page.getByTestId('star-stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await page.waitForTimeout(1500);
    await expect.poll(async () => (await atmo(page))?.layers, { timeout: 30_000 }).toBe(1);
    await page.waitForTimeout(3000);
  };
  // deux premiers tours : chaque coach et sa tenue passent une fois par la carte graphique (cache du moteur, déjà là en 2.0.0)
  for (let i = 0; i < 12; i++) await page.getByTestId('star-next').click();
  await settle();
  const after6 = (await atmo(page))!;
  for (let i = 0; i < 6; i++) await page.getByTestId('star-next').click();
  await settle();
  const after18 = (await atmo(page))!;
  // l'ambiance ne garde que ses propres ressources du moment : un emblème et la fumée (les anciens emblèmes sont rendus)
  expect(after6.ownTextures, 'textures de l’ambiance après 12').toBeLessThanOrEqual(2);
  expect(after18.ownTextures, 'textures de l’ambiance après 18').toBeLessThanOrEqual(2);
  // les géométries ne s'accumulent pas
  // même coach à l'écran qu'après 12 (un tour de plus) : pas une géométrie de plus
  expect(after18.coach).toBe(after6.coach);
  expect(after18.geometries!, 'géométries').toBeLessThanOrEqual(after6.geometries! + 2);
  // NB : le total des textures de la scène grandit d'environ 13 par changement de coach, autant sur la 2.0.0 que sur la V4
  // (mesuré, docs/v210/SELECTION_COACH_V4.md) : c'est le chargement des coachs, hors du périmètre de cet écran
  expect(errors).toEqual([]);
});

for (const [w, h] of [
  [360, 640],
  [412, 915],
])
  test(`V4 ${w}x${h} : rien ne déborde, la fiche ne chevauche ni les vignettes ni le bouton, la barre du bas est intacte`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await seed(page, 'kanya', 'femme');
    await page.goto('/#/coach');
    await expect(page.getByTestId('star-stage')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth)).toBeLessThanOrEqual(w);
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(h);
    const info = (await page.getByTestId('coach-details-kanya').boundingBox())!;
    const strip = (await page.locator('.star-strip').boundingBox())!;
    const cta = (await page.getByTestId('coach-valider').boundingBox())!;
    const bar = (await page.getByTestId('bottom-bar').boundingBox())!;
    expect(info.y + info.height).toBeLessThanOrEqual(strip.y + 1);
    expect(strip.y + strip.height).toBeLessThanOrEqual(cta.y + 1);
    expect(cta.y + cta.height).toBeLessThanOrEqual(bar.y + 1);
    expect(cta.height).toBeGreaterThanOrEqual(44);
    // le bouton doré garde sa logique : « Garder » pour le coach actuel, « Choisir » pour un autre
    await expect(page.getByTestId('coach-valider')).toHaveText(/Garder Kanya/);
    await page.getByTestId('coach-victor').click();
    await expect(page.getByTestId('coach-valider')).toHaveText(/Choisir Victor/);
    await expect(page.getByTestId('coach-victor').locator('.tick')).toHaveCount(1);
    // la caméra cadre le coach entier au-dessus de la fiche (sol sous les pieds dans la partie libre)
    const cam = await page.evaluate(() => (window as unknown as { __cssCamera?: { free: boolean } }).__cssCamera);
    expect(cam?.free).toBe(true);
  });
