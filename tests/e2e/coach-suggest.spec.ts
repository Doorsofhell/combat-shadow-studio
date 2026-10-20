import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { EXERCISES } from '../../src/domain/exercises';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * Coach IA in the training screen, on a touch phone: the suggested questions scroll with the finger
 * and with the arrows, a swipe never asks anything, each suggestion is answered by the local engine,
 * they follow the technique on screen, and the panel stays usable with the keyboard open.
 */
test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 740 } });

async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
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
    { profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme' }, look: defaultLook('homme') },
  );
}

/** first single-technique exercise of a discipline on that technique */
const exerciseOn = (d: string, tech: string) => EXERCISES.find((e) => e.discipline === d && e.sequence[0] === tech)!.id;

async function openCoach(page: Page, ex: string) {
  await page.goto('about:blank');
  await page.goto(`/#/entrainement?ex=${ex}&mode=technique`);
  // 0.25 (Youssef, 2026-10-20 12:30: « le coach IA doit être identique sur tous les écrans, une bulle flottante en bas à droite »): the training screen's own « Coach » button is replaced by the app's bubble
  await page.getByTestId('coach-bubble').tap();
  await expect(page.getByTestId('coach-suggestion').first()).toBeVisible();
}

const rail = (page: Page) => page.getByTestId('coach-suggest-rail');
const scrollLeft = (page: Page) => rail(page).evaluate((e) => e.scrollLeft);

/** a real finger swipe (touch events through the browser's input pipeline) */
async function swipe(page: Page, dx: number) {
  const box = (await rail(page).boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const x0 = dx < 0 ? box.x + box.width - 30 : box.x + 30;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (dx * i) / 12, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

const PLACEHOLDER = 'Choisis ou écris ta question';

test('questions suggérées : défilement au doigt dans les deux sens, flèches, aucun envoi en glissant', async ({ page }) => {
  await seed(page);
  await openCoach(page, exerciseOn('mma', 'direct'));
  // no keyboard popping up over the coach on a phone
  expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('cai-q');
  const n = await page.getByTestId('coach-suggestion').count();
  expect(n).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId('suggest-prev')).toBeDisabled();
  await expect(page.getByTestId('suggest-next')).toBeEnabled();

  // finger: right to left, then back
  await swipe(page, -200);
  await expect.poll(() => scrollLeft(page)).toBeGreaterThan(100);
  await expect(page.getByTestId('coach-answer')).toContainText(PLACEHOLDER);
  await expect(page.getByTestId('suggest-prev')).toBeEnabled();
  await swipe(page, 260);
  await expect.poll(() => scrollLeft(page)).toBeLessThan(3);
  await expect(page.getByTestId('coach-answer')).toContainText(PLACEHOLDER);

  // arrows up to the end, where "next" turns off, and back to the start
  for (let i = 0; i < n && (await page.getByTestId('suggest-next').isEnabled()); i++) {
    await page.getByTestId('suggest-next').tap();
    await page.waitForTimeout(450);
  }
  await expect(page.getByTestId('suggest-next')).toBeDisabled();
  const last = page.getByTestId('coach-suggestion').last();
  const fullyIn = await last.evaluate((b) => {
    const r = b.getBoundingClientRect();
    const p = b.parentElement!.getBoundingClientRect();
    return r.left >= p.left - 1 && r.right <= p.right + 1;
  });
  expect(fullyIn, 'la dernière question est entièrement atteignable').toBe(true);
  for (let i = 0; i < n && (await page.getByTestId('suggest-prev').isEnabled()); i++) {
    await page.getByTestId('suggest-prev').tap();
    await page.waitForTimeout(450);
  }
  await expect(page.getByTestId('suggest-prev')).toBeDisabled();
  await expect(page.getByTestId('coach-answer')).toContainText(PLACEHOLDER);

  // nothing cut: every card shows its whole question, and the page never scrolls sideways
  const r = await page.evaluate(() => ({
    cut: [...document.querySelectorAll('[data-testid=coach-suggestion]')].filter((b) => b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent),
    wide: document.scrollingElement!.scrollWidth - innerWidth,
  }));
  expect(r.cut).toEqual([]);
  expect(r.wide).toBeLessThanOrEqual(0);
});

test('questions suggérées : chaque question répond, une seule fois, et propose la suite', async ({ page }) => {
  await seed(page);
  await openCoach(page, exerciseOn('mma', 'direct'));
  const qs = await page.getByTestId('coach-suggestion').allTextContents();
  // the learner's own examples for a rear straight in MMA
  for (const q of ['Comment bien pivoter mon pied arrière ?', 'Comment utiliser ma hanche pour frapper ?', 'Où placer ma main avant ?', 'Comment éviter de perdre l’équilibre ?', 'Comment revenir rapidement en garde ?', 'Quelle est la différence entre jab et direct ?'])
    expect(qs).toContain(q);
  for (const q of qs.filter((x) => !x.startsWith('Montre-moi'))) {
    await openCoach(page, exerciseOn('mma', 'direct'));
    const card = page.getByTestId('coach-suggestion').filter({ hasText: q });
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    const answer = page.getByTestId('coach-answer');
    await expect(answer, q).not.toContainText(PLACEHOLDER);
    await expect(answer, q).not.toContainText(/pas sûr|je n’ai pas compris|reformule/i);
    await expect(answer).toBeInViewport();
    // follow-up questions are offered, without the one just asked
    await expect(page.getByTestId('coach-suggestions')).toContainText('Pour aller plus loin');
    expect(await page.getByTestId('coach-suggestion').allTextContents()).not.toContain(q);
    // training stays paused, nothing else happened
    await expect(page.getByTestId('coach-ask-panel')).toBeVisible();
  }
});

test('questions suggérées : un double tap n’envoie qu’une question', async ({ page }) => {
  await seed(page);
  // the history is off by default (privacy): turn it on to count what was sent
  await page.goto('/#/coach-ia');
  await page.getByRole('switch', { name: /Garder l’historique/ }).check({ force: true });
  await expect(page.getByRole('switch', { name: /Garder l’historique/ })).toBeChecked();
  await openCoach(page, exerciseOn('boxe', 'jab'));
  const card = page.getByTestId('coach-suggestion').first();
  const q = (await card.textContent())!;
  await card.dblclick();
  await expect(page.getByTestId('coach-answer')).not.toContainText(PLACEHOLDER);
  await page.getByTestId('coach-history-link').tap();
  await expect(page.locator('.cai-history li').filter({ hasText: q })).toHaveCount(1);
});

test('questions suggérées : elles suivent la technique travaillée, dans les 4 disciplines', async ({ page }) => {
  await seed(page);
  const cases: [string, string, RegExp][] = [
    ['boxe', 'jab', /jab/i],
    ['kickboxing', 'middle-kick-arriere', /kick|coup de pied/i],
    ['muaythai', 'genou-direct-arriere', /genou/i],
    ['mma', 'sprawl', /sprawl/i],
  ];
  const seen: string[][] = [];
  for (const [d, tech, about] of cases) {
    await openCoach(page, exerciseOn(d, tech));
    const qs = await page.getByTestId('coach-suggestion').allTextContents();
    expect(qs.length, `${d} ${tech}`).toBeGreaterThanOrEqual(4);
    expect(qs.some((q) => about.test(q)), `${d} ${tech} : ${qs.join(' / ')}`).toBe(true);
    seen.push(qs);
    await page.getByTestId('coach-suggestion').first().tap();
    await expect(page.getByTestId('coach-answer')).not.toContainText(/pas sûr|je n’ai pas compris|reformule/i);
  }
  expect(new Set(seen.map((s) => s.join('|'))).size).toBe(cases.length);
  // sprawl: legs, hips, supports, getting back up
  const sprawl = seen[3].join(' ');
  for (const w of ['jambes', 'hanches', 'appuis', 'en garde']) expect(sprawl).toContain(w);
});

test('questions suggérées : changement de technique pendant la séance', async ({ page }) => {
  await seed(page);
  await openCoach(page, exerciseOn('boxe', 'jab'));
  const first = await page.getByTestId('coach-suggestion').allTextContents();
  // the panel stays open while the exercise changes: its questions follow
  await page.getByRole('button', { name: 'Exercice suivant' }).tap();
  await expect(page.getByTestId('coach-ask-panel')).toBeVisible();
  const move = (await page.getByTestId('current-move').textContent())!;
  await expect.poll(async () => (await page.getByTestId('coach-suggestion').allTextContents()).join('|')).not.toBe(first.join('|'));
  expect(move).not.toBe('Jab');
});

test('coach IA : clavier ouvert, champ et « Envoyer » visibles ; hors ligne ; petit écran et paysage', async ({ page, context }) => {
  // the on-screen keyboard is emulated through the visual viewport, as Chrome on Android reports it
  await page.addInitScript(() => {
    const t = new EventTarget() as EventTarget & { height: number; width: number; offsetTop: number; offsetLeft: number; scale: number };
    t.height = innerHeight;
    t.width = innerWidth;
    t.offsetTop = 0;
    t.offsetLeft = 0;
    t.scale = 1;
    Object.defineProperty(window, 'visualViewport', { value: t, configurable: true });
    (window as unknown as { __kb: (h: number) => void }).__kb = (h: number) => {
      t.height = innerHeight - h;
      t.dispatchEvent(new Event('resize'));
    };
  });
  await seed(page);
  await openCoach(page, exerciseOn('kickboxing', 'jab'));
  await page.getByTestId('coach-input').tap();
  await page.evaluate(() => (window as unknown as { __kb: (h: number) => void }).__kb(320));
  await expect(page.getByTestId('coach-ask-panel')).toHaveClass(/kbd/);
  const r = await page.evaluate(() => {
    const visible = innerHeight - 320;
    const b = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    return { input: b('[data-testid=coach-input]').bottom, send: b('[data-testid=coach-send]').bottom, top: b('[data-testid=coach-ask-panel]').top, visible };
  });
  expect(r.input).toBeLessThanOrEqual(r.visible);
  expect(r.send).toBeLessThanOrEqual(r.visible);
  expect(r.top).toBeGreaterThanOrEqual(0);
  await page.getByTestId('coach-input').fill('Comment respirer quand je frappe ?');
  await page.getByTestId('coach-send').tap();
  await expect(page.getByTestId('coach-answer')).toContainText(/souffle|expire|respir/i);

  // offline: the answers are computed on the phone
  await context.setOffline(true);
  await page.getByTestId('coach-input').blur();
  await page.evaluate(() => (window as unknown as { __kb: (h: number) => void }).__kb(0));
  await page.getByTestId('coach-suggestion').first().tap();
  await expect(page.getByTestId('coach-answer')).not.toContainText(/pas sûr|je n’ai pas compris|reformule/i);
  await context.setOffline(false);

  for (const [w, h] of [
    [320, 568],
    [740, 360],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => (window as unknown as { __kb: (h: number) => void }).__kb(0));
    await openCoach(page, exerciseOn('muaythai', 'teep-avant'));
    const f = await page.evaluate(() => {
      const p = document.querySelector('[data-testid=coach-ask-panel]')!.getBoundingClientRect();
      const first = document.querySelector('[data-testid=coach-suggestion]')!.getBoundingClientRect();
      const send = document.querySelector('[data-testid=coach-send]')!.getBoundingClientRect();
      return { wide: document.scrollingElement!.scrollWidth - innerWidth, tall: document.scrollingElement!.scrollHeight - innerHeight, inPanel: first.top >= p.top && first.bottom <= p.bottom + 1, send: send.bottom <= innerHeight && send.right <= innerWidth };
    });
    expect(f.wide, `${w}x${h}`).toBeLessThanOrEqual(0);
    expect(f.tall, `${w}x${h}`).toBeLessThanOrEqual(0);
    expect(f.inPanel, `${w}x${h} questions visibles`).toBe(true);
    expect(f.send, `${w}x${h} Envoyer visible`).toBe(true);
    await page.getByTestId('coach-suggestion').first().tap();
    await expect(page.getByTestId('coach-answer')).not.toContainText(PLACEHOLDER);
  }
});

test('coach IA : contraste AA du panneau en thème clair et sombre', async ({ page }) => {
  await seed(page);
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await openCoach(page, exerciseOn('boxe', 'direct'));
    await page.getByTestId('suggest-next').tap();
    const r = await new AxeBuilder({ page }).include('[data-testid=coach-ask-panel]').withRules(['color-contrast']).analyze();
    expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${n.target.join(' ')} ${n.any[0]?.message}`))).toEqual([]);
  }
});
