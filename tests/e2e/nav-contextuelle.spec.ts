import { expect, Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.0.0 (refonte ergonomique, maquette v4 validée par Youssef le 2026-10-27), replacing the v0.45.1 monochrome bar:
 * - the five places: no background of their own, a neutral grey, the place lit in the text colour with a bolder word;
 * - the actions of the screen: glass pills (a light background of their own, no frame) in the text colour; the
 *   active one inverted;
 * - the big button: the colour of the main discipline with dark text.
 * Every word readable (WCAG AA 4.5:1), never red outside the colour of the discipline. Colours read on the real bar,
 * by day and by night. CAPTURES=dir writes the captures.
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

/** the buttons of the bar by kind, with the WCAG contrast of each word on what is behind it */
async function parts(page: Page) {
  const l = await look(page);
  const c = await contrasts(page);
  const kinds = await bar(page)
    .locator('button')
    .evaluateAll((bs) => bs.map((b) => (b.classList.contains('nav-tab') ? 'tab' : b.classList.contains('nav-primary') ? 'primary' : b.closest('.nav-backchip') ? 'back' : 'action')));
  return l.map((x, i) => ({ ...x, kind: kinds[i], contrast: c[i], on: false }));
}

for (const [theme, scheme] of [['Jour', 'light'], ['Nuit', 'dark']] as const) {
  test.describe(`thème ${theme}`, () => {
    test.use({ viewport: { width: 360, height: 740 } });

    test('places neutres, actions en verre, gros bouton à la couleur de la discipline, tout lisible, jamais de rouge ailleurs', async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((t) => localStorage.setItem('css-theme', t), theme === 'Jour' ? 'clair' : 'sombre');
      await seedProfile(page);
      // a sheet of technique: S’entraîner (big button), Ralenti, Maîtrise, Plus; 1.0.0 (lot 3): the round
      // « Rechercher ou demander au coach » button first in the row
      await page.goto('/#/techniques/jab?d=boxe');
      await expect(bar(page)).toHaveAttribute('data-screen', 'fiche');
      await page.waitForTimeout(400);
      let l = await parts(page);
      expect(l.map((x) => x.kind)).toEqual(['back', 'action', 'action', 'action', 'action', 'primary', 'tab', 'tab', 'tab', 'tab', 'tab']);
      for (const x of l) expect(x.contrast, `${x.label} contraste`).toBeGreaterThanOrEqual(4.5);
      const tabs = l.filter((x) => x.kind === 'tab');
      const lit = await bar(page).locator('.nav-tab').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-current') === 'page'));
      expect(lit).toEqual([false, false, true, false, false]);
      for (const x of tabs) {
        expect(noBg(x.bg), `${x.label} fond ${x.bg}`).toBe(true);
        expect(grey(x.color), `${x.label} couleur ${x.color}`).toBe(true);
      }
      // the place lit (Apprendre): more contrasted, bolder; the others the same neutral grey
      const others = tabs.filter((_, i) => !lit[i]);
      expect(new Set(others.map((x) => x.color)).size).toBe(1);
      expect(tabs[2].color).not.toBe(others[0].color);
      expect(tabs[2].contrast).toBeGreaterThan(others[0].contrast);
      // the actions: a glass background of their own, a grey (text) colour
      const acts = l.filter((x) => x.kind === 'action' || x.kind === 'back');
      for (const x of acts) {
        expect(noBg(x.bg), `${x.label} sans fond`).toBe(false);
        expect(grey(x.color), `${x.label} couleur ${x.color}`).toBe(true);
      }
      // the big button: the colour of boxe (main discipline of the test profile), dark text
      const big = l.find((x) => x.kind === 'primary')!;
      expect(big.bg).toBe('255,59,59,255');
      expect(big.color).toBe('11,15,20,255');
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-1-fiche-repos.png` });

      // Ralenti selected: inverted, still readable; the others unchanged
      const SLOW = 2; // after the back chip and the search button
      const rest = l[SLOW];
      await bar(page).locator('[data-action="slow"]').click();
      await expect(bar(page).locator('[data-action="slow"]')).toHaveClass(/active/);
      await page.waitForTimeout(400);
      l = await parts(page);
      expect(l[SLOW].active).toBe(true);
      expect(l[SLOW].bg).not.toBe(rest.bg);
      expect(grey(l[SLOW].color)).toBe(true);
      expect(l[SLOW].contrast).toBeGreaterThanOrEqual(4.5);
      expect(l[SLOW + 1].bg).toBe(rest.bg);
      for (const x of l) expect(x.contrast, `${x.label} contraste`).toBeGreaterThanOrEqual(4.5);
      const axe = await new AxeBuilder({ page }).include('[data-testid="bottom-bar"]').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-2-fiche-ralenti.png` });

      // another screen: nothing left selected from the previous one, Progrès lit
      await page.goto('/#/stats');
      await expect(bar(page)).toHaveAttribute('data-screen', 'progres');
      await page.waitForTimeout(400);
      l = await parts(page);
      expect(l.some((x) => x.active)).toBe(false);
      await expect(bar(page).locator('.nav-tab[aria-current="page"]')).toHaveAttribute('data-tab', 'progres');
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-3-progres.png` });

      // Accueil: the five places keep the same size and place on every screen
      const at = async () => bar(page).locator('.nav-tab').evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; }));
      const onStats = await at();
      await page.goto('/#/');
      await expect(bar(page)).toHaveAttribute('data-screen', 'accueil');
      expect(await at()).toEqual(onStats);
      expect(new Set(onStats.map((x) => x[1])).size).toBe(1);
      if (SHOTS) await bar(page).screenshot({ path: `${SHOTS}/${theme}-4-accueil.png` });
    });
  });
}
