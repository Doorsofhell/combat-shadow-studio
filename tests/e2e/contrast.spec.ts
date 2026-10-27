import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * Text legibility (WCAG 2.x AA): every screen is audited with axe-core's colour-contrast rule
 * (4.5:1 for normal text, 3:1 for large text), in each colour scheme.
 */
const SCREENS = [
  ['accueil', '/#/'],
  ['entrainer', '/#/entrainer'],
  // 0.33: the three spaces of Entraîner
  ['entrainer-disciplines', '/#/entrainer?espace=disciplines'],
  ['entrainer-programmes', '/#/programmes'],
  ['discipline', '/#/discipline/boxe'],
  ['techniques', '/#/techniques'],
  ['technique', '/#/techniques/jab'],
  ['champions', '/#/champions'],
  // 0.28 (Youssef, 2026-10-20 21:52): the style flower, the legend cards and a judo / BJJ champion page
  ['champions-liste', '/#/champions?vue=champions&d=bjj'],
  ['champion-judo', '/#/champions/c/riner'],
  ['createur-enchainement', '/#/createur'],
  // 0.38 Créateur V2: the editor of a new sequence
  ['createur-editeur', '/#/createur/nouveau?d=boxe'],
  ['programmes', '/#/programmes'],
  ['coach-editeur', '/#/combattant'],
  ['progres', '/#/stats'],
  ['historique', '/#/historique'],
  ['reglages', '/#/reglages'],
  ['profil', '/#/profil'],
  ['confidentialite', '/#/confidentialite'],
  ['coach-ia', '/#/coach-ia'],
  ['connexion', '/#/connexion'],
  ['entrainement', '/#/entrainement?ex=boxe-debutant-01&mode=technique'],
] as const;

async function seed(page: Page) {
  await page.goto('/icons/icon.svg');
  await page.evaluate(
    async ({ profile, look }) => {
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
    },
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme', pseudo: 'Youssef' }, look: defaultLook('homme') },
  );
}

/**
 * axe cannot compute text over gradients, images, translucent layers or pseudo-elements and reports
 * those nodes as "incomplete". They are measured here from the rendered pixels: the text is made
 * transparent (its shadow, when it has one, stays as part of the protection), the area behind it is
 * captured, and 95 % of those background pixels must reach the AA ratio against the text colour.
 */
async function measureRendered(page: Page, selector: string) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) return null;
  await loc.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' })).catch(() => {});
  const info = await loc.evaluate((el) => {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight) >= 700;
    // read now: cs is live, and the probe below turns the text transparent
    const color = cs.color;
    const st = document.createElement('style');
    st.id = 'cr-probe';
    el.setAttribute('data-cr-probe', '');
    // a sibling icon drawn in the text colour (bar buttons) can overlap the label box: hide it too, it is not background
    el.parentElement?.setAttribute('data-cr-probe-parent', '');
    st.textContent =
      '[data-cr-probe], [data-cr-probe] * { color: transparent !important; caret-color: transparent !important; }' +
      ' [data-cr-probe-parent] > svg, [data-cr-probe-parent] > span > svg { visibility: hidden !important; }';
    document.head.append(st);
    return { color, large: px >= 24 || (bold && px >= 18.66), box: { x: b.x, y: b.y, width: b.width, height: b.height } };
  });
  if (info.box.width < 2 || info.box.height < 2) return null;
  await page.waitForTimeout(30);
  const png = await page.screenshot({ clip: info.box, animations: 'disabled' });
  await page.evaluate(() => {
    document.getElementById('cr-probe')?.remove();
    document.querySelector('[data-cr-probe]')?.removeAttribute('data-cr-probe');
    document.querySelector('[data-cr-probe-parent]')?.removeAttribute('data-cr-probe-parent');
  });
  const ratio = await page.evaluate(
    async ({ b64, color }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r: number, gg: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
      // rgb(0-255) or, for color-mix() colours (v0.44 bar), color(srgb 0-1): read both as 0-255
      const srgb = color.startsWith('color(srgb');
      const m = color.match(/[\d.]+/g)!.map(Number).map((v) => (srgb ? v * 255 : v));
      const fg = lum(m[0], m[1], m[2]);
      const rs: number[] = [];
      for (let i = 0; i < d.length; i += 4) {
        const bg = lum(d[i], d[i + 1], d[i + 2]);
        rs.push((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05));
      }
      rs.sort((a, b) => a - b);
      return rs[Math.floor(rs.length * 0.05)];
    },
    { b64: png.toString('base64'), color: info.color },
  );
  return { ratio, need: info.large ? 3 : 4.5 };
}

async function audit(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const bad = r.violations.flatMap((v) =>
    v.nodes.map((n) => `${label} ${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`),
  );
  const skip = ['nonBmp']; // icon glyphs, not text
  for (const n of r.incomplete.flatMap((v) => v.nodes)) {
    if (skip.includes(n.any[0]?.data?.messageKey)) continue;
    const sel = n.target.join(' ');
    if (typeof n.target[0] !== 'string') continue;
    const m = await measureRendered(page, sel);
    if (m && m.ratio < m.need) bad.push(`${label} ${sel} — rendu ${m.ratio.toFixed(2)}:1 < ${m.need}:1 (${n.any[0]?.data?.messageKey})`);
  }
  // axe skips aria-hidden content, but text that is visible must be readable all the same
  const hidden = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('[aria-hidden="true"] *').forEach((el, i) => {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      const b = el.getBoundingClientRect();
      if (!own || b.width < 2 || b.height < 2 || getComputedStyle(el).visibility === 'hidden' || +getComputedStyle(el).opacity === 0) return;
      el.setAttribute('data-cr-hidden', String(i));
      out.push(`[data-cr-hidden="${i}"]`);
    });
    return out;
  });
  for (const sel of hidden) {
    const m = await measureRendered(page, sel);
    if (m && m.ratio < m.need) bad.push(`${label} ${sel} (masqué aux lecteurs d’écran mais visible) — rendu ${m.ratio.toFixed(2)}:1 < ${m.need}:1`);
  }
  return bad;
}

for (const scheme of ['dark', 'light'] as const) {
  test(`contraste des textes (WCAG AA), thème système ${scheme}`, async ({ page }) => {
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await seed(page);
    const bad: string[] = [];
    for (const [name, path] of SCREENS) {
      await page.goto('about:blank');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(name === 'entrainement' || name === 'coach-editeur' ? 2500 : 600);
      bad.push(...(await audit(page, name)));
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

test('contraste des états : survol, appui, champ vide', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await seed(page);
  await page.goto('/#/connexion');
  await page.waitForLoadState('networkidle');
  const btn = page.locator('.btn.primary').first();
  await btn.hover();
  const bad = await audit(page, 'survol');
  await page.mouse.down();
  bad.push(...(await audit(page, 'appui')));
  await page.mouse.up();
  await page.goto('about:blank');
  await page.goto('/#/profil');
  await page.waitForLoadState('networkidle');
  expect(await page.locator('input[placeholder]').count()).toBeGreaterThan(0);
  // placeholders: same AA rule as the text typed in the field
  const ph = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLInputElement>('input[placeholder], textarea[placeholder]')) {
      const c = getComputedStyle(el, '::placeholder').color;
      let bg = 'rgb(0,0,0)';
      for (let e: Element | null = el; e; e = e.parentElement) {
        const b = getComputedStyle(e).backgroundColor;
        if (b && !b.endsWith(', 0)') && b !== 'transparent') { bg = b; break; }
      }
      const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (s: string) => { const m = s.match(/[\d.]+/g)!.map(Number); return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]); };
      const a = lum(c), b = lum(bg);
      const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (r < 4.5) out.push(`placeholder ${el.name || el.type} ${r.toFixed(2)}:1`);
    }
    return out;
  });
  bad.push(...ph);
  expect(bad, bad.join('\n')).toEqual([]);
});
