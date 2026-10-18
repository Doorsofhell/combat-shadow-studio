import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * The training screen must hold on one screen, without any scrolling: coach, move name, current
 * instruction, every key point, timers and controls, on small to large phones, portrait and
 * landscape, and with enlarged text.
 */
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
  await page.reload();
}

/** a hash change does not reload the app: force a real navigation so every check starts clean */
async function open(page: Page, path: string) {
  await page.goto('about:blank');
  await page.goto(path);
}

const SIZES = [
  { name: 'petit 360x640', width: 360, height: 640 },
  { name: 'standard 393x851', width: 393, height: 851 },
  { name: 'grand 430x932', width: 430, height: 932 },
  { name: 'paysage 740x360', width: 740, height: 360 },
  { name: 'paysage 915x412', width: 915, height: 412 },
];
const EXERCISES = ['boxe-debutant-01', 'muaythai-expert-02', 'mma-expert-07'];

async function checkFits(page: Page, label: string) {
  const r = await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const root = document.querySelector('.training') as HTMLElement;
    const inView = (sel: string) =>
      [...document.querySelectorAll(sel)].every((e) => {
        const b = e.getBoundingClientRect();
        return b.width > 0 && b.top >= -1 && b.bottom <= vh + 1 && b.left >= -1 && b.right <= vw + 1;
      });
    const clipped = [...document.querySelectorAll('.tr-info *, .tr-top *, .tr-bottom *')]
      .filter((e) => {
        const el = e as HTMLElement;
        // any element holding text directly (also buttons with an icon), except visually hidden labels
        const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        if (!ownText || el.getBoundingClientRect().width <= 1) return false;
        return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2;
      })
      .map((e) => `${e.className || e.tagName}:${e.textContent}`)
      .join(' / ');
    const stage = (document.querySelector('.tr-stage') as HTMLElement).getBoundingClientRect();
    return {
      scrollY: document.scrollingElement!.scrollHeight - vh,
      scrollX: document.scrollingElement!.scrollWidth - vw,
      rootScroll: root.scrollHeight - root.clientHeight,
      overflowMode: root.classList.contains('overflow'),
      points: inView('.tr-points li'),
      cue: inView('.tr-cue'),
      name: inView('[data-testid=current-move]'),
      title: inView('[data-testid=exercise-name]'),
      time: inView('[data-testid=session-time]'),
      play: inView('[data-testid=start], [data-testid=pause], [data-testid=resume]'),
      ar: inView('[data-testid=ar-button]'),
      decompose: inView('[data-testid=decompose]'),
      clipped,
      stageH: stage.height,
    };
  });
  expect(r.scrollY, `${label} défilement vertical`).toBeLessThanOrEqual(0);
  expect(r.scrollX, `${label} défilement horizontal`).toBeLessThanOrEqual(0);
  expect(r.rootScroll, `${label} débordement`).toBeLessThanOrEqual(1);
  expect(r.overflowMode, label).toBe(false);
  for (const k of ['points', 'cue', 'name', 'title', 'time', 'play', 'ar', 'decompose'] as const) expect(r[k], `${label} ${k} visible`).toBe(true);
  expect(r.clipped, `${label} textes coupés`).toBe('');
  expect(r.stageH, `${label} hauteur du coach`).toBeGreaterThan(150);
}

test('écran d’entraînement sans défilement, toutes tailles', async ({ page }) => {
  await seed(page);
  for (const s of SIZES) {
    await page.setViewportSize({ width: s.width, height: s.height });
    for (const ex of EXERCISES) {
      await open(page, `/#/entrainement?ex=${ex}&mode=technique`);
      await expect(page.getByTestId('exercise-name')).toBeVisible();
      await page.waitForTimeout(400);
      await checkFits(page, `${s.name} ${ex}`);
    }
  }
});

test('texte agrandi : tout reste visible, ou bascule explicite', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  for (const zoom of ['115%', '130%']) {
    await open(page, `/#/entrainement?ex=mma-expert-07&mode=technique`);
    await page.evaluate((z) => (document.documentElement.style.fontSize = z), zoom);
    await page.waitForTimeout(400);
    await checkFits(page, `police ${zoom}`);
  }
  // extreme enlargement: the explicit scrolling layout takes over instead of hiding content
  await page.evaluate(() => (document.documentElement.style.fontSize = '220%'));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(500);
  const mode = await page.evaluate(() => {
    const root = document.querySelector('.training') as HTMLElement;
    return { overflow: root.classList.contains('overflow'), clipped: root.scrollHeight > root.clientHeight && getComputedStyle(root).overflowY === 'hidden' };
  });
  expect(mode.clipped).toBe(false);
});

test('mode Décomposer et pause : rien ne déborde', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, `/#/entrainement?ex=boxe-debutant-08&mode=technique`);
  await page.getByTestId('decompose').click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  const r = await page.evaluate(() => ({ s: document.scrollingElement!.scrollHeight - innerHeight, root: (() => { const t = document.querySelector('.training') as HTMLElement; return t.scrollHeight - t.clientHeight; })() }));
  expect(r.s).toBeLessThanOrEqual(0);
  expect(r.root).toBeLessThanOrEqual(1);
});

test('demander au coach : pause, réponse hors ligne, ralenti, sans défilement ni consignes masquées', async ({ page }) => {
  await seed(page);
  for (const [w, h] of [
    [360, 640],
    [740, 360],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await open(page, `/#/entrainement?ex=boxe-debutant-01&mode=technique`);
    await page.getByTestId('start').click();
    await page.getByTestId('ask-coach').click();
    await expect(page.getByTestId('phase')).toHaveText('Pause');
    await page.getByTestId('coach-input').fill('Pourquoi dois-je pivoter le pied arrière ?');
    await page.getByTestId('coach-send').click();
    await expect(page.getByTestId('coach-answer')).toContainText('pied arrière');
    const r = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid=coach-ask-panel]')!.getBoundingClientRect();
      const info = document.querySelector('.tr-info')!.getBoundingClientRect();
      const answer = document.querySelector('[data-testid=coach-answer]')!.getBoundingClientRect();
      const overlap = !(panel.bottom <= info.top + 1 || panel.right <= info.left + 1 || panel.left >= info.right - 1);
      return { scroll: document.scrollingElement!.scrollHeight - innerHeight, overlap, answerH: answer.height };
    });
    expect(r.scroll, `${w}x${h}`).toBeLessThanOrEqual(0);
    expect(r.overlap, `${w}x${h} le panneau masque les consignes`).toBe(false);
    expect(r.answerH, `${w}x${h} réponse lisible`).toBeGreaterThan(30);
    // still paused: training resumes only on request
    await expect(page.getByTestId('resume')).toBeVisible();
    await page.getByTestId('coach-input').fill('Montre-moi le crochet gauche au ralenti');
    await page.getByTestId('coach-send').click();
    await expect(page.getByTestId('study-panel')).toBeVisible();
    await expect(page.getByTestId('current-move')).toHaveText('Crochet gauche');
  }
});

test('zone Caméra : angle, rotation, zoom, recentrer, sans masquer le coach ni déborder', async ({ page }) => {
  await seed(page);
  for (const s of SIZES) {
    await page.setViewportSize({ width: s.width, height: s.height });
    await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
    await page.getByTestId('cam-mode').click();
    await expect(page.getByTestId('camera-panel')).toBeVisible();
    const r = await page.evaluate(() => {
      const vw = innerWidth;
      const vh = innerHeight;
      const ids = ['cam-auto', 'cam-next', 'cam-left', 'cam-right', 'zoom-in', 'zoom-out', 'cam-reset', 'cam-close', 'start', 'ask-coach'];
      const hidden = ids.filter((id) => {
        const b = document.querySelector(`[data-testid=${id}]`)?.getBoundingClientRect();
        return !b || b.width < 40 || b.height < 40 || b.left < -1 || b.right > vw + 1 || b.top < -1 || b.bottom > vh + 1;
      });
      const panel = document.querySelector('[data-testid=camera-panel]')!.getBoundingClientRect();
      const stage = document.querySelector('.tr-stage')!.getBoundingClientRect();
      const clipped = [...document.querySelectorAll('.tr-bottom *')]
        // visually hidden labels (1 px, read by screen readers) are not visible text, as in checkFits
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getBoundingClientRect().width > 1 && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2))
        .map((e) => e.textContent);
      return { hidden, overStage: panel.top < stage.bottom - 1, stageH: stage.height, scroll: document.scrollingElement!.scrollHeight - vh, clipped };
    });
    expect(r.hidden, `${s.name} boutons hors écran ou trop petits`).toEqual([]);
    expect(r.overStage, `${s.name} la zone Caméra masque le coach`).toBe(false);
    expect(r.stageH, `${s.name} hauteur du coach`).toBeGreaterThan(150);
    expect(r.scroll, s.name).toBeLessThanOrEqual(0);
    expect(r.clipped, `${s.name} textes coupés`).toEqual([]);
  }
  // the controls act: angle chosen, then everything back to the advised angle
  await page.getByTestId('cam-next').click();
  await expect(page.getByTestId('cam-angle')).toHaveText('Face');
  await expect(page.getByTestId('cam-mode')).toContainText('Face');
  await page.getByTestId('zoom-in').click();
  await page.getByTestId('cam-left').click();
  await page.getByTestId('cam-reset').click();
  await expect(page.getByTestId('cam-mode')).toContainText('Auto');
  await expect(page.getByTestId('cam-auto')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('cam-close').click();
  await expect(page.getByTestId('decompose')).toBeVisible();
});

/** where the camera looks from (degrees), exposed by the studio for these checks */
const camera = (page: Page) => page.evaluate(() => (window as unknown as { __cssCamera: { az: number; el: number; dist: number; coachYaw: number } }).__cssCamera);
const settle = (page: Page) => page.waitForTimeout(3500);
/** waits until the camera has stopped gliding, then reads it */
async function steady(page: Page) {
  await expect.poll(() => camera(page), { timeout: 30_000 }).toBeTruthy();
  let prev = await camera(page);
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500);
    const c = await camera(page);
    if (Math.abs(c.az - prev.az) < 0.2 && Math.abs(c.dist - prev.dist) < 0.005 && Math.abs(c.el - prev.el) < 0.2) return c;
    prev = c;
  }
  return prev;
}

test('caméra : « Auto » annule rotation et zoom, un angle manuel est exact', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  const auto = await steady(page);
  await page.getByTestId('cam-mode').click();
  await expect(page.getByTestId('cam-angle')).toHaveText('3/4 avant');
  await page.getByTestId('cam-right').click();
  await page.getByTestId('zoom-in').click();
  await expect(page.getByTestId('cam-auto')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('cam-mode')).toContainText('Auto ajusté');
  await settle(page);
  expect(Math.abs((await camera(page)).az - auto.az - 30)).toBeLessThan(3);
  // back to Auto: the advised angle and distance, nothing left from the adjustment
  await page.getByTestId('cam-auto').click();
  await expect(page.getByTestId('cam-auto')).toHaveAttribute('aria-pressed', 'true');
  // the camera glides back (it moves away slowly on purpose, so the view never pumps)
  await expect.poll(async () => Math.abs((await camera(page)).az - auto.az), { timeout: 15_000 }).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await camera(page)).dist - auto.dist), { timeout: 15_000 }).toBeLessThan(0.1);
  // a manual angle after a rotation is the angle itself
  await page.getByTestId('cam-left').click();
  await page.getByTestId('cam-next').click();
  await expect(page.getByTestId('cam-angle')).toHaveText('Face');
  await settle(page);
  expect(Math.abs((await camera(page)).az)).toBeLessThan(2);
  // the same choices from the Options sheet
  await page.getByTestId('cam-close').click();
  await page.getByTestId('options').click();
  await page.getByTestId('cam-chip-profil-gauche').click();
  await settle(page);
  expect(Math.abs((await camera(page)).az - 90)).toBeLessThan(2);
  await page.getByTestId('cam-chip-auto').click();
  await expect(page.getByTestId('cam-why')).toBeVisible();
  await settle(page);
  expect(Math.abs((await camera(page)).az - auto.az)).toBeLessThan(2);
});

test('caméra Auto : pas de vue de haut sur les coups, et elle tourne avec le coach après un pivot', async ({ page }) => {
  test.setTimeout(150_000);
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  // « Pivots et angles » : jab, pivot, direct, pivot, jab, direct
  await open(page, `/#/entrainement?ex=boxe-avance-09&mode=technique`);
  await settle(page);
  const start = await camera(page);
  expect(start.el, 'jab vu presque à hauteur d’homme').toBeLessThan(12);
  await page.getByTestId('start').click();
  // the coach has turned after the first pivot: the camera keeps the same angle relative to him
  await expect.poll(async () => (await camera(page)).coachYaw, { timeout: 90_000, intervals: [500] }).toBeLessThan(-30);
  await expect(page.getByTestId('current-move')).toHaveText('Direct arrière');
  await settle(page);
  const after = await camera(page);
  expect(Math.abs(after.az - after.coachYaw - start.az), 'angle par rapport au coach').toBeLessThan(6);
  expect(after.el, 'direct vu presque à hauteur d’homme').toBeLessThan(12);
});

test('consigne principale, points clés, ralenti et ligne de temps', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  await expect(page.getByTestId('main-instruction')).toHaveText('Tends le bras avant dans l’axe, puis ramène immédiatement le poing en garde.');
  await expect(page.getByTestId('key-points').locator('li')).toHaveCount(5);
  await expect(page.getByTestId('timer-row')).toContainText('Séance');
  await expect(page.getByTestId('timer-row')).toContainText('rép.');
  await page.getByTestId('slow').click();
  await expect(page.getByTestId('slow')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('options').click();
  await expect(page.getByTestId('speed')).toHaveText('×0.25');
});

test('repères au sol : chacun s’active seul, légende sans débordement, choix mémorisé', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, `/#/entrainement?ex=muaythai-intermediaire-11&mode=technique`);
  await expect(page.getByTestId('mark-legend')).toHaveCount(0);
  await page.getByTestId('options').click();
  const ids = ['pieds', 'orientation', 'avantArriere', 'pivot', 'trajectoire'];
  for (const id of ids) await expect(page.getByTestId(`mark-${id}`)).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('mark-pivot').click();
  await expect(page.getByTestId('mark-pivot')).toHaveAttribute('aria-pressed', 'true');
  for (const id of ids.filter((i) => i !== 'pivot')) await expect(page.getByTestId(`mark-${id}`)).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('mark-avantArriere').click();
  await page.getByRole('button', { name: 'Fermer' }).last().click();
  await expect(page.getByTestId('mark-legend')).toContainText('Pied avant');
  await expect(page.getByTestId('mark-legend')).toContainText('Pivot');
  await expect(page.getByTestId('mark-legend')).not.toContainText('Trajectoire');
  await page.getByTestId('start').click();
  await page.waitForTimeout(3000);
  await checkFits(page, 'repères actifs');
  // saved on the device: still on after reopening the screen
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  await expect(page.getByTestId('mark-legend')).toContainText('Pivot');
  expect(errors).toEqual([]);
});

test('exercice précédent et suivant', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  const first = await page.getByTestId('exercise-name').textContent();
  await page.getByRole('button', { name: 'Exercice suivant' }).click();
  await expect(page.getByTestId('exercise-name')).not.toHaveText(first!);
  await page.getByRole('button', { name: 'Exercice précédent' }).click();
  await expect(page.getByTestId('exercise-name')).toHaveText(first!);
});

test('changer de coach pendant l’entraînement : la coach femme s’affiche', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'homme');
  await page.getByTestId('options').click();
  await page.getByRole('button', { name: 'Coach femme' }).click();
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'femme');
  await page.getByRole('button', { name: 'Coach homme' }).click();
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'homme');
});
