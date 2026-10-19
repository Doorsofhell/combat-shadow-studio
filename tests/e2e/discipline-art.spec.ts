import { expect, Page, test } from '@playwright/test';
import { DISCIPLINE_ART } from '../../src/domain/disciplineArt';
import { DISCIPLINES } from '../../src/domain/types';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * Each discipline has ONE official icon (src/ui/icons/disciplines.tsx, charter of 19 Oct 2026), shown by
 * DisciplineIcon on every screen that lists disciplines: the same drawing everywhere, square, never
 * stretched. The fighter illustration (src/domain/disciplineArt.ts) stays only on the discipline banner.
 */
const OFFICIAL = new Set(Object.values(DISCIPLINE_ART).flatMap((a) => a.sources.map((s) => s.src.replace(/^\.\//, '/'))));
const IDS = new Set<string>(DISCIPLINES.map((d) => d.id));

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
  ['Accueil', '/#/', 6],
  ['Entraîner', '/#/entrainer', 6],
  ['Page discipline', '/#/discipline/mma', 1],
  ['Techniques', '/#/techniques', 6],
  ['Créateur d’enchaînements', '/#/createur', 6],
  ['Légendes', '/#/champions', 6],
  ['Légendes > champions', '/#/champions?vue=champions&d=muaythai', 4],
  ['Programmes', '/#/programmes', 1],
  ['Progrès', '/#/stats', 6],
  ['Profil', '/#/profil', 4],
];

for (const [name, path, min] of SCREENS)
  test(`icônes officielles des disciplines : ${name}`, async ({ page }) => {
    await seed(page);
    await page.goto('about:blank');
    await page.goto(path);
    const icons = page.locator('svg.discipline-icon[data-discipline]');
    await expect.poll(() => icons.count(), { message: name }).toBeGreaterThanOrEqual(min);
    const r = await icons.evaluateAll((els) =>
      els.map((e) => {
        const b = e.getBoundingClientRect();
        return { id: (e as SVGElement).dataset.discipline!, w: b.width, h: b.height, vb: e.getAttribute('viewBox'), shapes: e.querySelectorAll('path,ellipse,rect').length };
      }),
    );
    for (const x of r) {
      expect(IDS.has(x.id), `${name} : ${x.id} est une discipline officielle`).toBe(true);
      expect(x.vb).toBe('0 0 64 64');
      expect(Math.abs(x.w - x.h), `${name} : ${x.id} pas de déformation`).toBeLessThan(0.5);
      expect(x.shapes, `${name} : ${x.id} dessin présent`).toBeGreaterThan(5);
    }
    // the screens that list every discipline show all six, BJJ and judo included
    if (min >= 6) expect(new Set(r.map((x) => x.id)).size, `${name} : les 6 disciplines`).toBe(6);
    // the only discipline pictures left are the official illustrations, loaded from the registry
    const imgs = await page.evaluate(() => [...document.images].filter((i) => /discipline/i.test(i.src)).map((i) => ({ src: new URL(i.currentSrc || i.src).pathname, art: !!i.dataset.disciplineArt })));
    for (const i of imgs) {
      expect(i.art, `${name} : ${i.src} passe par DisciplineArtwork`).toBe(true);
      expect(OFFICIAL.has(i.src), `${name} : ${i.src} vient du référentiel`).toBe(true);
    }
    expect(await page.evaluate(() => document.scrollingElement!.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

test('bannière de la page discipline : icône et illustration officielle chargée, non déformée', async ({ page }) => {
  await seed(page);
  await page.goto('about:blank');
  await page.goto('/#/discipline/mma');
  await expect(page.locator('.disc-card.banner svg.discipline-icon[data-discipline="mma"]')).toBeVisible();
  const img = page.locator('.disc-card.banner img[data-discipline-art="mma"]');
  await expect.poll(() => img.evaluate((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
  expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe('cover');
});
