import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';
import { menuCommand, openCoachIA, openMenu } from './nav-helpers';

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
  { name: 'android 412x915', width: 412, height: 915 },
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
      // 1.0.0 (lot 4): while the session runs, hands-free mode keeps only Retour and Pause; Décomposer comes back
      // with the pause
      handsFree: 'handsFree' in document.documentElement.dataset,
      // v0.32 (navigation, 2026-10-22): the one bottom bar replaces the coach bubble and the training buttons; it is
      // on screen and nothing of the session is under it
      bar: inView('[data-testid=bottom-bar]'),
      barOver: (() => {
        const b = document.querySelector('[data-testid=bottom-bar]')?.getBoundingClientRect();
        if (!b) return 'absente';
        return [...document.querySelectorAll('.training button, .tr-info *, .tr-top *')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !(r.right <= b.left || r.left >= b.right || r.bottom <= b.top + 1 || r.top >= b.bottom);
          })
          .map((e) => e.getAttribute('aria-label') || e.textContent)
          .join(' / ');
      })(),
      clipped,
      stageH: stage.height,
    };
  });
  expect(r.scrollY, `${label} défilement vertical`).toBeLessThanOrEqual(0);
  expect(r.scrollX, `${label} défilement horizontal`).toBeLessThanOrEqual(0);
  expect(r.rootScroll, `${label} débordement`).toBeLessThanOrEqual(1);
  expect(r.overflowMode, label).toBe(false);
  expect(r.barOver, `${label} la barre du bas masque un élément de la séance`).toBe('');
  for (const k of ['points', 'cue', 'name', 'title', 'time', 'play', 'ar', 'bar'] as const) expect(r[k], `${label} ${k} visible`).toBe(true);
  expect(r.decompose, `${label} decompose ${r.handsFree ? 'masqué (mains libres)' : 'visible'}`).toBe(!r.handsFree);
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
    // 1.25: the start screen may show first (files to download): wait for the session screen itself
    await expect(page.getByTestId('exercise-name')).toBeVisible();
    await page.evaluate((z) => (document.documentElement.style.fontSize = z), zoom);
    await page.waitForTimeout(400);
    await checkFits(page, `police ${zoom}`);
  }
  // extreme enlargement: the explicit scrolling layout takes over instead of hiding content
  await page.evaluate(() => (document.documentElement.style.fontSize = '220%'));
  await page.setViewportSize({ width: 360, height: 640 });
  await page.waitForTimeout(500);
  // 1.25: the room of the discipline arrives about then and keeps the page busy for a moment: the switch to the
  // scrolling layout is awaited (same rule: nothing may stay clipped)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const root = document.querySelector('.training') as HTMLElement;
        return root.scrollHeight > root.clientHeight && getComputedStyle(root).overflowY === 'hidden';
      }),
    )
    .toBe(false);
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

test('analyse technique : phases mesurées, rejouer une phase, comparer les gardes, sans débordement', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, `/#/entrainement?ex=boxe-debutant-08&mode=technique`);
  await page.getByTestId('decompose').click();
  const steps = page.getByTestId('study-steps');
  await expect(steps).toBeVisible();
  // a new technique is first shown at real speed
  await expect(page.getByTestId('study-phase')).toHaveText(/Vitesse réelle|^1\./);
  const n = await steps.getByRole('listitem').count();
  expect(n).toBeGreaterThanOrEqual(4);
  await expect(steps.getByRole('listitem').first()).toHaveText('1. Position de départ');
  // replay the second phase: the coach plays it and stops on its end
  const second = steps.getByRole('listitem').nth(1);
  const label = ((await second.textContent()) ?? '').replace(/^2\. /, '');
  await second.click();
  await expect(second).toHaveClass(/on/);
  await expect(page.getByTestId('study-play')).toHaveText(/Lecture/, { timeout: 10000 });
  await expect(page.getByTestId('study-text')).not.toBeEmpty();
  expect(label.length).toBeGreaterThan(3);
  // the other guard, without touching the profile
  const guard = page.getByTestId('study-guard');
  await expect(guard).toHaveAttribute('aria-pressed', 'false');
  await guard.click();
  await expect(guard).toHaveAttribute('aria-pressed', 'true');
  const r = await page.evaluate(() => ({ s: document.scrollingElement!.scrollHeight - innerHeight, root: (() => { const t = document.querySelector('.training') as HTMLElement; return t.scrollHeight - t.clientHeight; })() }));
  expect(r.s).toBeLessThanOrEqual(0);
  expect(r.root).toBeLessThanOrEqual(1);
  await page.getByTestId('study-close').click();
  await expect(page.getByTestId('study-panel')).toHaveCount(0);
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
    // v0.32 (navigation, 2026-10-22): the Coach IA opens from the Menu of the bottom bar (no floating bubble)
    await openCoachIA(page);
    await expect(page.getByTestId('phase')).toHaveText('Pause');
    await page.getByTestId('coach-input').fill('Pourquoi dois-je pivoter le pied arrière ?');
    await page.getByTestId('coach-send').click();
    await expect(page.getByTestId('coach-answer')).toContainText('pied arrière');
    // v0.29: measure once the panel and the training layout have stopped moving (the overlap was read
    // while the panel was still sliding in, the known flake of this test, also on v0.28.0)
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
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

// 2.4 (panneau « Options du coach »): « Caméra » opens the coach's panel on « Angle de vue » (the camera panel of the
// bottom of 0.x is gone). The same commands (Auto, the angles, rotation, zoom, back to the advised angle) are checked:
// reachable at every size, big enough for a finger, none cut; the panel is over the coach on purpose (glass).
test('Caméra : le panneau du coach s’ouvre sur l’angle de vue, tout à portée sans déborder', async ({ page }) => {
  await seed(page);
  for (const s of SIZES) {
    await page.setViewportSize({ width: s.width, height: s.height });
    await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
    await page.getByTestId('cam-mode').click();
    await expect(page.getByTestId('coach-panel')).toBeVisible();
    await expect(page.getByTestId('cp-camera')).toBeVisible();
    // v0.32 (navigation, 2026-10-22): Démarrer and Menu stay behind the panel, untouched
    const ids = ['cp-cam-auto', 'cp-cam-face', 'cp-cam-left', 'cp-cam-right', 'cp-zoom-in', 'cp-zoom-out', 'cp-reset', 'coach-panel-close'];
    const hidden: string[] = [];
    for (const id of ids) {
      const el = page.getByTestId(id);
      await el.scrollIntoViewIfNeeded();
      const ok = await el.evaluate((e) => {
        const b = e.getBoundingClientRect();
        return b.width >= 40 && b.height >= 40 && b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1;
      });
      if (!ok) hidden.push(id);
    }
    const r = await page.evaluate(() => {
      const vh = innerHeight;
      const panel = document.querySelector('[data-testid=coach-panel]')!.getBoundingClientRect();
      const stage = document.querySelector('.tr-stage')!.getBoundingClientRect();
      const clipped = [...document.querySelectorAll('.cpn-body *')]
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()) && e.getBoundingClientRect().width > 1 && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2))
        .map((e) => e.textContent);
      return { inside: panel.top >= 0 && panel.bottom <= vh + 1 && panel.left >= 0 && panel.right <= innerWidth + 1, stageH: stage.height, scroll: document.scrollingElement!.scrollHeight - vh, clipped };
    });
    expect(hidden, `${s.name} boutons hors écran ou trop petits`).toEqual([]);
    expect(r.inside, `${s.name} le panneau dépasse de l’écran`).toBe(true);
    expect(r.stageH, `${s.name} hauteur du coach`).toBeGreaterThan(150);
    expect(r.scroll, s.name).toBeLessThanOrEqual(0);
    expect(r.clipped, `${s.name} textes coupés`).toEqual([]);
  }
  // the controls act: angle chosen, then everything back to the advised angle
  await page.getByTestId('cp-cam-face').click();
  await expect(page.getByTestId('cp-cam-face')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('cam-mode')).toHaveAttribute('aria-label', /^Caméra : Face/);
  await page.getByTestId('cp-zoom-in').click();
  await page.getByTestId('cp-cam-left').click();
  await page.getByTestId('cp-reset').click();
  await expect(page.getByTestId('cam-mode')).toHaveAttribute('aria-label', /^Caméra : Auto/);
  await expect(page.getByTestId('cp-cam-auto')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('coach-panel-close').click();
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
  await expect(page.getByTestId('decompose')).toBeVisible();
});

/** where the camera looks from (degrees), exposed by the studio for these checks */
const camera = (page: Page) => page.evaluate(() => (window as unknown as { __cssCamera: { az: number; el: number; dist: number; coachYaw: number } }).__cssCamera);
const settle = (page: Page) => page.waitForTimeout(3500);
/** waits until the camera has stopped gliding, then reads it */
async function steady(page: Page) {
  await expect.poll(() => camera(page), { timeout: 30_000 }).toBeTruthy();
  // four calm readings in a row: one calm half-second can be a pause while the coach is still loading
  let prev = await camera(page);
  let calm = 0;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const c = await camera(page);
    calm = Math.abs(c.az - prev.az) < 0.2 && Math.abs(c.dist - prev.dist) < 0.005 && Math.abs(c.el - prev.el) < 0.2 ? calm + 1 : 0;
    prev = c;
    if (calm >= 4) return c;
  }
  return prev;
}

test('caméra : « Auto » annule rotation et zoom, un angle manuel est exact', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  const auto = await steady(page);
  // 2.4: the same commands, in the coach's panel (« Caméra » opens it on « Angle de vue »)
  await page.getByTestId('cam-mode').click();
  await expect(page.getByTestId('cp-cam-detail')).toContainText('3/4 avant');
  await page.getByTestId('cp-cam-right').click();
  await page.getByTestId('cp-zoom-in').click();
  await expect(page.getByTestId('cp-cam-auto')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('cam-mode')).toHaveAttribute('aria-label', /^Caméra : Auto ajusté/);
  await settle(page);
  expect(Math.abs((await camera(page)).az - auto.az - 30)).toBeLessThan(3);
  // back to Auto: the advised angle and distance, nothing left from the adjustment
  await page.getByTestId('cp-cam-auto').click();
  await expect(page.getByTestId('cp-cam-auto')).toHaveAttribute('aria-checked', 'true');
  // the camera glides back (it moves away slowly on purpose, so the view never pumps)
  await expect.poll(async () => Math.abs((await camera(page)).az - auto.az), { timeout: 15_000 }).toBeLessThan(2);
  await expect.poll(async () => Math.abs((await camera(page)).dist - auto.dist), { timeout: 15_000 }).toBeLessThan(0.1);
  // a manual angle after a rotation is the angle itself
  await page.getByTestId('cp-cam-left').click();
  await page.getByTestId('cp-cam-face').click();
  await expect(page.getByTestId('cp-cam-face')).toHaveAttribute('aria-checked', 'true');
  await settle(page);
  expect(Math.abs((await camera(page)).az)).toBeLessThan(2);
  // the other angles of the former Options sheet, behind « Autres angles »
  await page.getByTestId('cp-cam-more').click();
  await page.getByTestId('cp-cam-profil-gauche').click();
  await settle(page);
  expect(Math.abs((await camera(page)).az - 90)).toBeLessThan(2);
  await page.getByTestId('cp-cam-auto').click();
  await expect(page.getByTestId('cp-cam-detail')).toBeVisible();
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
  // 2.3.0: the moves are shorter (no frozen impact), the direct is on screen about 3 s: a fixed 3.5 s wait read the
  // camera of the next step (a pivot, seen from higher on purpose). Wait until the camera has stopped moving, and
  // read it while the direct is still being played.
  await expect
    .poll(
      async () => {
        const a = await camera(page);
        await page.waitForTimeout(300);
        const b = await camera(page);
        return Math.abs(a.az - b.az) + Math.abs(a.el - b.el);
      },
      { timeout: 3000, intervals: [0] },
    )
    .toBeLessThan(0.5);
  const after = await camera(page);
  await expect(page.getByTestId('current-move'), 'caméra lue pendant le direct').toHaveText('Direct arrière', { timeout: 1 });
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
  // v0.32 (navigation): Ralenti is a command of the Menu (« Sur cet écran »); it stays pressed there
  await menuCommand(page, 'slow');
  await openMenu(page);
  await expect(page.getByTestId('slow')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  // 2.4: « Options du coach » opens the coach's panel, its speed shows the slow motion
  await menuCommand(page, 'options');
  await expect(page.getByTestId('cp-speed-value')).toHaveText('×0,25');
});

test('repères au sol : chacun s’active seul, légende sans débordement, choix mémorisé', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page);
  await page.setViewportSize({ width: 360, height: 640 });
  await open(page, `/#/entrainement?ex=muaythai-intermediaire-11&mode=technique`);
  await expect(page.getByTestId('mark-legend')).toHaveCount(0);
  // 2.4: the floor marks are in the coach's panel, « Options avancées »
  await menuCommand(page, 'options');
  await page.getByTestId('cp-advanced').click();
  const ids = ['pieds', 'orientation', 'avantArriere', 'pivot', 'trajectoire'];
  for (const id of ids) await expect(page.getByTestId(`cp-mark-${id}`)).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('cp-mark-pivot').click();
  await expect(page.getByTestId('cp-mark-pivot')).toHaveAttribute('aria-pressed', 'true');
  for (const id of ids.filter((i) => i !== 'pivot')) await expect(page.getByTestId(`cp-mark-${id}`)).toHaveAttribute('aria-pressed', 'false');
  await page.getByTestId('cp-mark-avantArriere').click();
  await page.getByTestId('coach-panel-close').click();
  await expect(page.getByTestId('coach-panel-root')).toHaveCount(0);
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
  // v0.32: Précédent and Suivant are commands of the Menu (« Sur cet écran »)
  await menuCommand(page, 'cmd-next');
  await expect(page.getByTestId('exercise-name')).not.toHaveText(first!);
  await menuCommand(page, 'cmd-prev');
  await expect(page.getByTestId('exercise-name')).toHaveText(first!);
});

test('changer de coach pendant l’entraînement : la coach femme s’affiche', async ({ page }) => {
  await seed(page);
  await page.setViewportSize({ width: 393, height: 851 });
  await open(page, `/#/entrainement?ex=boxe-debutant-02&mode=technique`);
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'homme');
  // 2.4: the coach is chosen in the coach's panel, « Options avancées »
  await menuCommand(page, 'options');
  await page.getByTestId('cp-advanced').click();
  // 0.24: the two coaches are named Kadir and Amara
  await page.getByRole('radio', { name: 'Amara' }).click();
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'femme');
  await page.getByRole('radio', { name: 'Kadir' }).click();
  await expect(page.locator('[data-coach]')).toHaveAttribute('data-coach', 'homme');
});
