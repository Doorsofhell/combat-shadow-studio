import { expect, Page, test } from '@playwright/test';
import { DISCIPLINE_ART } from '../../src/domain/disciplineArt';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * Each discipline has ONE official picture (src/domain/disciplineArt.ts). Every screen that shows
 * disciplines displays it through DisciplineArtwork, loaded from the registry and never stretched.
 */
const OFFICIAL = new Set(Object.values(DISCIPLINE_ART).flatMap((a) => a.sources.map((s) => s.src.replace(/^\.\//, '/'))));

async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const sessions = (['boxe', 'kickboxing', 'mma', 'muaythai'] as const).map((d, i) => ({
    id: `s${i}`,
    start: new Date(Date.now() - i * 86400000).toISOString(),
    discipline: d,
    level: 'debutant',
    exerciseId: `${d}-debutant-01`,
    exerciseName: 'Exercice',
    mode: 'technique',
    activeSec: 120,
    reps: 10,
  }));
  await page.evaluate(
    async ({ profile, look, sessions }) => {
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
      await put('u:local:css-fighters', { state: { fighters: [{ id: 'f1', name: 'Test', look, createdAt: '', updatedAt: '' }], activeId: 'f1' }, version: 0 });
      await put('u:local:css-stats', { state: { sessions, perExercise: {} }, version: 0 });
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme', disciplines: ['boxe', 'kickboxing', 'mma', 'muaythai'] }, look: defaultLook('homme'), sessions },
  );
}

const SCREENS: [string, string, number][] = [
  ['Accueil', '/#/', 4],
  ['Entraîner', '/#/entrainer', 4],
  ['Page discipline', '/#/discipline/mma', 1],
  ['Techniques', '/#/techniques', 4],
  ['Créateur d’enchaînements', '/#/createur', 4],
  ['Légendes', '/#/champions', 4],
  ['Légendes > champions', '/#/champions?vue=champions&d=muaythai', 4],
  ['Programmes', '/#/programmes', 1],
  ['Progrès', '/#/stats', 4],
  ['Profil', '/#/profil', 4],
];

for (const [name, path, min] of SCREENS)
  test(`illustrations officielles : ${name}`, async ({ page }) => {
    await seed(page);
    await page.goto('about:blank');
    await page.goto(path);
    const imgs = page.locator('img[data-discipline-art]');
    await expect.poll(() => imgs.count(), { message: name }).toBeGreaterThanOrEqual(min);
    // lazy images: bring each one into view, then check it loaded from the registry, undistorted
    const n = await imgs.count();
    for (let i = 0; i < n; i++) await imgs.nth(i).scrollIntoViewIfNeeded().catch(() => {});
    await expect
      .poll(() => imgs.evaluateAll((els) => els.filter((e) => !(e as HTMLImageElement).complete || !(e as HTMLImageElement).naturalWidth).length), { message: `${name} : images chargées` })
      .toBe(0);
    const r = await imgs.evaluateAll((els) =>
      els.map((e) => {
        const img = e as HTMLImageElement;
        return { src: new URL(img.currentSrc).pathname, fit: getComputedStyle(img).objectFit, id: img.dataset.disciplineArt };
      }),
    );
    for (const x of r) {
      expect(OFFICIAL.has(x.src), `${name} : ${x.src} vient du référentiel`).toBe(true);
      expect(x.src).toContain(`/${x.id}-`);
      expect(x.fit, `${name} : pas de déformation`).toBe('cover');
    }
    // no other picture pretends to be a discipline
    const stray = await page.evaluate(() => [...document.images].filter((i) => /discipline/i.test(i.src) && !i.dataset.disciplineArt).map((i) => i.src));
    expect(stray).toEqual([]);
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
