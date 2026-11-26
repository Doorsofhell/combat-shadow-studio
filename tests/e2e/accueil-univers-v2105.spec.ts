import { expect, test, type Page } from '@playwright/test';

/**
 * 2.10.5 (Youssef, 2026-11-26 : « reprendre dans la fenêtre mon coach de la page d'accueil l'ambiance du choix de coach
 * plein écran… il faudrait réutiliser le même composant »). La carte « Ton coach » de l'Accueil montre le coach dans son
 * univers (src/ui/coach-universe/CoachUniverse.tsx, le composant de l'écran du choix), en thème clair comme en sombre ;
 * « Changer », le son et « Commencer » restent là ; l'univers suit le coach choisi et ne laisse rien en mémoire graphique.
 */
async function seed(page: Page, champion: string, coach: string, theme: 'clair' | 'sombre') {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    ([champion, coach, theme]) =>
      new Promise<void>((res) => {
        localStorage.setItem('css-theme', theme);
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { profile: { completed: true, coach, champion, mainDiscipline: 'muaythai', disciplines: ['muaythai'], pseudo: 'Test' } }, version: 0 }), 'u:local:css-profile');
          tx.oncomplete = () => res();
        };
      }),
    [champion, coach, theme],
  );
  await page.goto('about:blank');
}

const atmo = (page: Page) => page.evaluate(() => (window as unknown as { __cssAtmo?: { coach?: string; motif?: string; layers?: number; ownTextures?: number } }).__cssAtmo ?? null);

/** luminance (0 noir, 255 blanc) d'une couleur CSS rgb()/rgba() */
const lum = (c: string) => {
  const [r, g, b] = (c.match(/[\d.]+/g) ?? ['255', '255', '255']).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

for (const theme of ['clair', 'sombre'] as const)
  test(`2.10.5 thème ${theme} : la carte « Ton coach » montre Naël dans son univers, avec ses commandes`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await seed(page, 'nael', 'homme', theme);
    await page.goto('/#/');
    const card = page.getByTestId('home-universe');
    await expect(card).toHaveAttribute('data-atmo', 'ailes-vitesse');
    // la scène 3D de l'univers est montée pour ce coach (emblème « ailes de vitesse » avec son nom)
    await expect.poll(async () => (await atmo(page))?.coach, { timeout: 90_000 }).toBe('nael');
    expect((await atmo(page))?.motif).toBe('ailes-vitesse');
    // la carte reste sombre quel que soit le thème, comme l'écran du choix
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(lum(bg), `fond de la carte ${bg}`).toBeLessThan(60);
    const name = await page.getByTestId('fighter-name').evaluate((el) => getComputedStyle(el).color);
    expect(lum(name), `nom du coach ${name}`).toBeGreaterThan(200);
    // les commandes de la carte sont toujours là
    await expect(page.getByTestId('home-change-coach')).toBeVisible();
    await expect(page.getByTestId('home-cta')).toBeVisible();
    await expect(page.getByTestId('hero-stage')).toBeVisible();
    expect(errors).toEqual([]);
  });

test('2.10.5 : même univers sur l’Accueil et sur l’écran du choix ; il suit le coach choisi, sans rien laisser en mémoire graphique', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await seed(page, 'nael', 'homme', 'clair');
  await page.goto('/#/');
  await expect.poll(async () => (await atmo(page))?.coach, { timeout: 90_000 }).toBe('nael');
  const homeMotif = await page.getByTestId('home-universe').getAttribute('data-atmo');
  // « Changer » ouvre l'écran du choix : le même univers pour le même coach
  await page.getByTestId('home-change-coach').click();
  await expect(page.getByTestId('star-stage')).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
  await expect(page.getByTestId('star-stage')).toHaveAttribute('data-atmo', homeMotif!);
  // Kadir choisi : l'Accueil prend son univers
  await page.getByTestId('coach-homme').click();
  await expect(page.getByTestId('star-stage')).toHaveAttribute('data-atmo', 'ailes');
  await page.getByTestId('coach-valider').click();
  await expect(page.getByTestId('home-universe')).toHaveAttribute('data-atmo', 'ailes', { timeout: 30_000 });
  await expect.poll(async () => (await atmo(page))?.coach, { timeout: 90_000 }).toBe('mma-kadir');
  // l'univers de l'écran du choix est parti avec lui : seuls l'emblème et la fumée de l'Accueil restent
  await expect.poll(async () => (await atmo(page))?.layers, { timeout: 30_000 }).toBe(1);
  await page.waitForTimeout(2000);
  expect((await atmo(page))!.ownTextures!, 'textures de l’ambiance').toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});
