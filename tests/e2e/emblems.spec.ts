import { expect, Page, test } from '@playwright/test';
import { seedProfile } from './nav-helpers';

// 0.33 (Youssef, 2026-10-22, emblèmes des six disciplines) : variante détaillée sur les cartes Disciplines,
// contour dans les filtres ; lisibles en clair et en sombre, chargés hors ligne

const IDS = ['boxe', 'kickboxing', 'mma', 'muaythai', 'bjj', 'judo'];

async function detailed(page: Page) {
  const imgs = page.locator('.train-disc img.discipline-emblem[data-variant="detaille"]');
  await expect(imgs).toHaveCount(6);
  await expect.poll(() => imgs.evaluateAll((els) => els.every((e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0))).toBe(true);
  return imgs.evaluateAll((els) =>
    els.map((e) => {
      const i = e as HTMLImageElement;
      const b = i.getBoundingClientRect();
      const card = i.closest('.disc-card')!.getBoundingClientRect();
      return { id: i.dataset.emblem, w: b.width, h: b.height, nw: i.naturalWidth, inside: b.left >= card.left && b.right <= card.right && b.top >= card.top && b.bottom <= card.bottom };
    }),
  );
}

for (const scheme of ['light', 'dark'] as const)
  test(`emblèmes détaillés et contours, thème ${scheme === 'light' ? 'clair' : 'sombre'}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await seedProfile(page);
    await page.goto('/#/entrainer?espace=disciplines');
    const r = await detailed(page);
    expect(r.map((x) => x.id).sort()).toEqual([...IDS].sort());
    for (const x of r) {
      expect(x.w, x.id).toBe(72);
      expect(x.h, x.id).toBe(72);
      // the 2x file is used on 2x screens, the 1x elsewhere: never an upscaled picture
      expect(x.nw, x.id).toBeGreaterThanOrEqual(72);
      expect(x.inside, `${x.id} dans sa carte`).toBe(true);
    }
    await page.getByTestId('space-programmes').click();
    const outlines = page.locator('.prog-filters svg.discipline-emblem[data-variant="contour"]');
    await expect(outlines).toHaveCount(6);
    // the outline takes the colour of its chip text, so it reads in both themes
    const c = await outlines.evaluateAll((els) =>
      els.map((e) => ({ stroke: getComputedStyle(e).stroke, color: getComputedStyle(e.closest('button,label') ?? e.parentElement!).color, w: e.getBoundingClientRect().width })),
    );
    for (const x of c) {
      expect(x.stroke).toBe(x.color);
      expect(x.w).toBe(18);
    }
  });

test('emblèmes affichés hors ligne une fois l’application installée', async ({ page, context }) => {
  await seedProfile(page);
  await page.goto('/#/entrainer?espace=disciplines');
  // the service worker takes control after its first install; its precache holds the emblems
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);
  await context.setOffline(true);
  try {
    await page.reload();
    await page.goto('/#/entrainer?espace=disciplines');
    const r = await detailed(page);
    expect(r.length).toBe(6);
  } finally {
    await context.setOffline(false);
  }
});
