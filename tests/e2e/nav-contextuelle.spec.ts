import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { bar, seedProfile } from './nav-helpers';

/**
 * v0.44 roles, v0.45.1 colours (Youssef, 2026-10-23, « Correctif mineur de navigation »): a monochrome bar. No place
 * has a background of its own; Retour and Menu in a neutral grey; the actions of the screen in a graphite slightly more
 * contrasted; the active one more contrasted still, with a bolder word; never red or pink. Colours read on the real
 * bar, in light and dark menus. CAPTURES=dir writes the comparison captures (docs/v0451-navigation/).
 */
const SHOTS = process.env.CAPTURES;

/** waits for the colour transitions of the bar, then reads each place; colours as rgba numbers (the browser may
 * write a mixed colour as color(srgb …) or oklab(…): a canvas turns any of them into the same 0-255 values) */
async function look(page: Page) {
  await page.waitForFunction(() => document.querySelector('[data-testid="bottom-bar"]')!.getAnimations({ subtree: true }).filter((a) => a instanceof CSSTransition).length === 0);
  return bar(page)
    .locator('button')
    .evaluateAll((bs) => {
      const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
      const norm = (c: string) => {
        cv.clearRect(0, 0, 1, 1);
        cv.fillStyle = c;
        cv.fillRect(0, 0, 1, 1);
        return Array.from(cv.getImageData(0, 0, 1, 1).data).join(',');
      };
      return bs.map((b) => {
        const cs = getComputedStyle(b);
        const small = b.querySelector('small');
        return { role: b.getAttribute('data-role'), active: b.classList.contains('active'), color: norm(cs.color), bg: norm(cs.backgroundColor), label: small?.textContent, weight: Number(small ? getComputedStyle(small).fontWeight : 0) };
      });
    });
}

/** WCAG contrast of the label on the bar (the bar's own background under the place's tint) */
async function contrasts(page: Page) {
  await page.waitForFunction(() => document.querySelector('[data-testid="bottom-bar"]')!.getAnimations({ subtree: true }).filter((a) => a instanceof CSSTransition).length === 0);
  return bar(page).evaluate((nav) => {
    const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    /** any CSS colour as [r, g, b, a] with a in 0-1 */
    const rgb = (c: string) => {
      cv.clearRect(0, 0, 1, 1);
      cv.fillStyle = c;
      cv.fillRect(0, 0, 1, 1);
      const d = cv.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const over = (top: number[], under: number[]) => {
      const a = top.length > 3 ? top[3] : 1;
      return [0, 1, 2].map((k) => top[k] * a + under[k] * (1 - a));
    };
    // the bar is drawn over the page: its almost opaque background over the page background
    const body = rgb(getComputedStyle(document.body).backgroundColor);
    const html = rgb(getComputedStyle(document.documentElement).backgroundColor);
    const pageBg = body[3] > 0 ? body : html[3] > 0 ? html : [255, 255, 255, 1];
    const base = over(rgb(getComputedStyle(nav).backgroundColor), pageBg);
    return [...nav.querySelectorAll('button')].map((b) => {
      const cs = getComputedStyle(b);
      const fg = rgb(cs.color);
      const bg = over(rgb(cs.backgroundColor), base);
      const [l1, l2] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (l1 + 0.05) / (l2 + 0.05);
    });
  });
}

/** a grey of the theme (its greys are slightly cool: 90,95,105 by day, 156,163,175 by night): low saturation, and red
 * never above green or blue, so no red, no pink */
const grey = (c: string) => {
  const [r, g, b] = c.split(',').map(Number);
  return Math.max(r, g, b) - Math.min(r, g, b) <= 24 && r <= Math.min(g, b) + 4;
};
/** no background of its own: fully transparent */
const noBg = (c: string) => c.split(',')[3] === '0';

for (const [theme, scheme] of [['clair', 'light'], ['sombre', 'dark']] as const) {
  test.describe(`menus ${theme}`, () => {
    test.use({ viewport: { width: 360, height: 740 } });

    test('barre monochrome : aucun fond par bouton, Retour et Menu neutres, actions en graphite, active plus contrastée et plus grasse, jamais de rouge', async ({ page }) => {
      // theme « auto » (default) follows the system
      await page.emulateMedia({ colorScheme: scheme });
      await seedProfile(page);
      // a sheet of technique: S’entraîner, Ralenti, Maîtrise are its own actions
      await page.goto('/#/techniques/jab?d=boxe');
      await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
      await page.waitForTimeout(400);
      let l = await look(page);
      expect(l.map((x) => x.role)).toEqual(['global', 'contextual', 'contextual', 'contextual', 'global']);
      const neutral = l[0];
      expect(l[4].color).toBe(neutral.color);
      for (const x of l) {
        expect(noBg(x.bg), `${x.label} fond ${x.bg}`).toBe(true);
        expect(grey(x.color), `${x.label} couleur ${x.color}`).toBe(true);
      }
      for (const x of l.slice(1, 4)) expect(x.color, x.label!).not.toBe(neutral.color);
      const rest = l[2];
      let c = await contrasts(page);
      for (const k of c) expect(k).toBeGreaterThanOrEqual(4.5);
      // graphite: more contrasted than the neutral grey of Retour and Menu
      for (const k of [1, 2, 3]) expect(c[k]).toBeGreaterThan(c[0]);
      const restContrast = c[2];
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-1-fiche-repos.png` });

      // Ralenti selected: stronger and bolder, the two others stay graphite
      await bar(page).locator('[data-action="slow"]').click();
      await expect(bar(page).locator('[data-action="slow"]')).toHaveClass(/active/);
      await page.waitForTimeout(400);
      l = await look(page);
      expect(l[2].active).toBe(true);
      expect(l[2].color).not.toBe(rest.color);
      expect(noBg(l[2].bg), `fond actif ${l[2].bg}`).toBe(true);
      expect(grey(l[2].color), `couleur active ${l[2].color}`).toBe(true);
      expect(l[2].weight).toBeGreaterThan(rest.weight);
      expect(l[1].color).toBe(rest.color);
      expect(l[3].color).toBe(rest.color);
      expect(l[0].color).toBe(neutral.color);
      expect(l[4].color).toBe(neutral.color);
      c = await contrasts(page);
      for (const k of c) expect(k).toBeGreaterThanOrEqual(4.5);
      expect(c[2]).toBeGreaterThan(restContrast);
      const axe = await new AxeBuilder({ page }).include('[data-testid="bottom-bar"]').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-2-fiche-ralenti.png` });

      // another screen: its own three actions in graphite, nothing left selected from the previous one
      await page.goto('/#/stats');
      await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
      await page.waitForTimeout(400);
      l = await look(page);
      expect(l.map((x) => x.role)).toEqual(['global', 'contextual', 'contextual', 'contextual', 'global']);
      expect(l.some((x) => x.active)).toBe(false);
      expect(l[2].color).toBe(rest.color);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-3-progres.png` });

      // Accueil: only links to the main places, all neutral
      await page.goto('/#/');
      await expect(bar(page)).toHaveAttribute('data-screen', 'accueil');
      await page.waitForTimeout(400);
      l = await look(page);
      expect(l.every((x) => x.role === 'global')).toBe(true);
      expect(new Set(l.map((x) => x.color)).size).toBe(1);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-4-accueil.png` });
      // same size and place as before: five equal places, nothing moved
      const sizes = await bar(page).locator('button').evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().width)));
      expect(new Set(sizes).size).toBe(1);
    });
  });
}
