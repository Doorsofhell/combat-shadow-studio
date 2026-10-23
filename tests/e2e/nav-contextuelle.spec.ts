import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { bar, seedProfile } from './nav-helpers';

/**
 * v0.44 (Youssef, 2026-10-23, « AMÉLIORATION DE LA BARRE DE NAVIGATION CONTEXTUELLE »): the actions of the screen
 * keep a light tint of the accent, the selected one a stronger tint of the same red; Retour, Menu and the links to
 * the main places stay neutral. Colours read on the real bar, in light and dark menus.
 * CAPTURES=dir writes the comparison captures (docs/v044-navigation/).
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
        return { role: b.getAttribute('data-role'), active: b.classList.contains('active'), color: norm(cs.color), bg: norm(cs.backgroundColor), label: b.querySelector('small')?.textContent };
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

for (const [theme, scheme] of [['clair', 'light'], ['sombre', 'dark']] as const) {
  test.describe(`menus ${theme}`, () => {
    test.use({ viewport: { width: 360, height: 740 } });

    test('actions de l’écran teintées, sélection accentuée, Retour et Menu neutres, au fil des écrans', async ({ page }) => {
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
      expect(l[4].bg).toBe(neutral.bg);
      for (const x of l.slice(1, 4)) {
        expect(x.color, x.label!).not.toBe(neutral.color);
        expect(x.bg, x.label!).not.toBe(neutral.bg);
      }
      const rest = l[2];
      for (const c of await contrasts(page)) expect(c).toBeGreaterThanOrEqual(4.5);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-1-fiche-repos.png` });

      // Ralenti selected: stronger, the two others keep their light tint
      await bar(page).locator('[data-action="slow"]').click();
      await expect(bar(page).locator('[data-action="slow"]')).toHaveClass(/active/);
      await page.waitForTimeout(400);
      l = await look(page);
      expect(l[2].active).toBe(true);
      expect(l[2].color).not.toBe(rest.color);
      expect(l[2].bg).not.toBe(rest.bg);
      expect(l[1].color).toBe(rest.color);
      expect(l[3].color).toBe(rest.color);
      expect(l[0].color).toBe(neutral.color);
      expect(l[4].color).toBe(neutral.color);
      for (const c of await contrasts(page)) expect(c).toBeGreaterThanOrEqual(4.5);
      const axe = await new AxeBuilder({ page }).include('[data-testid="bottom-bar"]').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-2-fiche-ralenti.png` });

      // another screen: its own three actions tinted, nothing left selected from the previous one
      await page.goto('/#/stats');
      await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
      await page.waitForTimeout(400);
      l = await look(page);
      expect(l.map((x) => x.role)).toEqual(['global', 'contextual', 'contextual', 'contextual', 'global']);
      expect(l.some((x) => x.active)).toBe(false);
      expect(l[2].color).toBe(rest.color);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-3-progres.png` });

      // Accueil: only links to the main places, nothing tinted
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
