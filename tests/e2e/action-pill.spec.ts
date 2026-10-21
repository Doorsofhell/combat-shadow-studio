import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { sessions } from './progress-seed';

/**
 * 0.26 (Youssef, 2026-10-20 12:34: « un système d'icônes flottantes […] qui permettrait de lancer les actions les
 * plus courantes. Les icônes changent en fonction du contexte de l'écran. Icône claire. » Mockup C « Pilule
 * d'actions » chosen at 17:45): a pill at the bottom left, above the navigation, three actions at most per screen
 * (icon + word), the most useful one first and red; the Coach IA bubble stays alone at the bottom right.
 * 0.27 (Youssef, 2026-10-20 21:45: « Il faut intégrer le coach ia dans la barre d'icône dynamique. Il faut prévoir une
 * option pour enrouler dérouler »): where there is a pill, the Coach IA is its last button (gold) and the bubble is
 * not drawn; a chevron at the right end folds the pill into a round handle, remembered after a reload.
 */
const SHOTS = process.env.PILL_SHOTS;

async function seed(page: Page, opts: { sessions?: boolean; mastery?: Record<string, string>; completed?: boolean } = {}) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    async ({ profile, stats, mastery }) => {
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
      if (stats) await put('u:local:css-stats', { state: { sessions: stats, perExercise: {} }, version: 0 });
      if (mastery) await put('u:local:css-goals', { state: { goals: { weeklyMinutes: 0, weeklySessions: 0 }, favTechniques: [], favExercises: [], mastery }, version: 0 });
    },
    {
      profile: { ...DEFAULT_PROFILE, completed: opts.completed ?? true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] },
      stats: opts.sessions ? sessions([{ daysAgo: 1, sec: 600, reps: 12, ex: 'boxe-debutant-02' }]) : null,
      mastery: opts.mastery ?? null,
    },
  );
  await page.goto('about:blank');
}

const pill = (page: Page) => page.getByTestId('action-pill');
const action = (page: Page, id: string) => pill(page).locator(`[data-pill-action="${id}"]`);

/** the actions of the pill, in order, and the first one is the only red (primary) one */
async function expectActions(page: Page, ids: string[]) {
  await expect(pill(page)).toBeVisible();
  // 0.27: the screen's actions, then the Coach IA, then the fold chevron (only the screen's actions carry data-pill-action)
  await expect.poll(() => pill(page).locator('button[data-pill-action]').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-pill-action')))).toEqual(ids);
  const prim = await pill(page).locator('button[data-pill-action]').evaluateAll((bs) => bs.map((b) => b.classList.contains('primary')));
  expect(prim).toEqual(ids.map((_, i) => i === 0));
  await expect(pill(page).locator('button.primary')).toHaveCount(1);
  expect(await pill(page).locator('button').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-testid')).slice(-2))).toEqual(['pill-coach', 'pill-fold']);
  // every button has its icon and its visible word
  for (const b of await pill(page).locator('button.ap-btn').all()) {
    await expect(b.locator('svg[data-icon]')).toHaveCount(1);
    expect(((await b.locator('.ap-label').textContent()) ?? '').trim().length).toBeGreaterThan(2);
  }
  const red = await pill(page).locator('button.primary').evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(red).toBe('rgb(225, 29, 47)');
}

/**
 * the pill is above the navigation, inside the screen, with touch targets of 44 px or more; 0.27 (Youssef,
 * 2026-10-20 21:45): the Coach IA is inside it, so there is no bubble beside it any more
 */
async function expectPlacement(page: Page) {
  const r = await page.evaluate(() => {
    const p = document.querySelector('[data-testid="action-pill"]')!.getBoundingClientRect();
    const nav = document.querySelector('.nav')!.getBoundingClientRect();
    const bubbles = document.querySelectorAll('[data-testid="coach-bubble"]').length;
    const btns = [...document.querySelectorAll('[data-testid="action-pill"] button')].map((b) => b.getBoundingClientRect()).map((b) => [b.width, b.height]);
    const pillEl = document.querySelector('[data-testid="action-pill"]')!;
    // no word spills out of its button
    const spill = [...pillEl.querySelectorAll('.ap-label')].filter((l) => l.scrollWidth > l.clientWidth + 1 || l.getBoundingClientRect().right > l.parentElement!.getBoundingClientRect().right + 1).length;
    return { p: { l: p.left, r: p.right, t: p.top, b: p.bottom }, navTop: nav.top, bubbles, btns, vw: innerWidth, spill, overflow: pillEl.scrollWidth - pillEl.clientWidth };
  });
  expect(r.p.b).toBeLessThanOrEqual(r.navTop);
  expect(r.p.l).toBeGreaterThanOrEqual(0);
  expect(r.p.r, 'inside the screen').toBeLessThanOrEqual(r.vw - 12);
  expect(r.bubbles, 'one Coach IA entry: in the pill, no bubble').toBe(0);
  expect(r.spill, 'no word out of its button').toBe(0);
  expect(r.overflow).toBeLessThanOrEqual(0);
  for (const [w, h] of r.btns) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
  return r;
}

/** scrolled to the end, the last content of the page ends above the pill */
async function expectLastRowReachable(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.scrollingElement!.scrollHeight));
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const pageEl = [...document.querySelectorAll('.page')].find((e) => e.getBoundingClientRect().height > 0)!;
    const kids = [...pageEl.children].filter((e) => e.getBoundingClientRect().height > 0);
    const last = kids[kids.length - 1].getBoundingClientRect();
    return { lastBottom: last.bottom, pillTop: document.querySelector('[data-testid="action-pill"]')!.getBoundingClientRect().top };
  });
  expect(r.lastBottom).toBeLessThanOrEqual(r.pillTop);
}

test.describe('393×851', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test('Accueil : Séance rapide (rouge), Reprendre, Technique du jour', async ({ page }) => {
    await seed(page, { sessions: true });
    await page.goto('/#/');
    await expectActions(page, ['seance-rapide', 'reprendre', 'technique-du-jour']);
    await expectPlacement(page);
    await action(page, 'seance-rapide').click();
    await expect(page).toHaveURL(/#\/discipline\/boxe\?niveau=\w+&ex=/);
    await page.goto('/#/');
    await action(page, 'reprendre').click();
    await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-debutant-02&mode=libre/);
    await expect(page.getByTestId('exercise-name')).toBeVisible();
    // the training studio has its own controls: no pill there
    await expect(pill(page)).toHaveCount(0);
    await page.goto('/#/');
    const name = (await action(page, 'technique-du-jour').getAttribute('aria-label'))!.replace('Technique du jour : ', '');
    await action(page, 'technique-du-jour').click();
    await expect(page).toHaveURL(/#\/techniques\/[\w-]+\?d=boxe/);
    await expect(page.getByTestId('technique-page').locator('h1')).toHaveText(name);
  });

  test('Accueil sans séance passée : pas de « Reprendre »', async ({ page }) => {
    await seed(page);
    await page.goto('/#/');
    await expectActions(page, ['seance-rapide', 'technique-du-jour']);
  });

  test('Techniques : Au hasard (rouge) et le filtre À revoir', async ({ page }) => {
    await seed(page, { mastery: { jab: 'a-revoir' } });
    await page.goto('/#/techniques?d=boxe');
    await expectActions(page, ['au-hasard', 'a-revoir']);
    await expectPlacement(page);
    await expect(action(page, 'a-revoir')).toHaveAttribute('aria-pressed', 'false');
    await action(page, 'a-revoir').click();
    await expect(action(page, 'a-revoir')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('a.tech-card')).toHaveCount(1);
    await action(page, 'au-hasard').click();
    await expect(page).toHaveURL(/#\/techniques\/jab\?d=boxe&cat=a-revoir/);
    await page.goto('/#/techniques?d=boxe');
    await expectLastRowReachable(page);
    await action(page, 'au-hasard').click();
    await expect(page).toHaveURL(/#\/techniques\/[\w-]+\?d=boxe$/);
    await expect(page.getByTestId('technique-page')).toBeVisible();
  });

  test('Techniques sans technique à revoir : seulement Au hasard ; autres onglets sans pilule', async ({ page }) => {
    await seed(page);
    await page.goto('/#/techniques?d=boxe');
    await expectActions(page, ['au-hasard']);
    await page.goto('/#/techniques?tab=programmes');
    await expect(page.getByRole('heading', { name: 'Techniques' })).toBeVisible();
    await expect(pill(page)).toHaveCount(0);
  });

  test('Fiche technique : S’entraîner (rouge), Ralenti, Je la maîtrise', async ({ page }) => {
    await seed(page);
    await page.goto('/#/techniques/jab?d=boxe');
    await expectActions(page, ['entrainer', 'ralenti', 'maitrise']);
    await expectPlacement(page);
    await action(page, 'ralenti').click();
    await expect(action(page, 'ralenti')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.speed-ctl b')).toHaveText('×0.25');
    await action(page, 'ralenti').click();
    await expect(action(page, 'ralenti')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.speed-ctl b')).toHaveText('×0.60');
    // same state as the tick of the mastery switch, both ways
    await action(page, 'maitrise').click();
    await expect(action(page, 'maitrise')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('mastery-acquise')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('mastery-acquise').click();
    await expect(action(page, 'maitrise')).toHaveAttribute('aria-pressed', 'false');
    await expectLastRowReachable(page);
    await action(page, 'entrainer').click();
    await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-debutant-02&mode=technique/);
    await expect(page.getByTestId('exercise-name')).toContainText('Jab');
  });

  test('Légendes : S’entraîner (rouge), Combo du jour, Au hasard, sans bouton en double', async ({ page }) => {
    await seed(page);
    await page.goto('/#/champions');
    await expectActions(page, ['entrainer', 'combo-du-jour', 'au-hasard']);
    await expectPlacement(page);
    // the card shows the pick, the pill launches it: no second « S'entraîner » in the card
    await expect(page.getByTestId('cat-quick').getByRole('button')).toHaveCount(0);
    const today = (await page.getByTestId('cat-quick-sheet').textContent())!.trim();
    await expect(action(page, 'combo-du-jour')).toHaveAttribute('aria-pressed', 'true');
    await action(page, 'au-hasard').click();
    await expect(page.getByTestId('cat-quick')).toContainText('Tirée au sort pour toi');
    await expect(page.getByTestId('cat-quick-sheet')).not.toHaveText(today);
    await expect(action(page, 'combo-du-jour')).toHaveAttribute('aria-pressed', 'false');
    await action(page, 'combo-du-jour').click();
    await expect(page.getByTestId('cat-quick-sheet')).toHaveText(today);
    const id = (await page.getByTestId('cat-quick-sheet').getAttribute('href'))!.split('/').pop()!;
    await expectLastRowReachable(page);
    await action(page, 'entrainer').click();
    await expect(page).toHaveURL(new RegExp(`#/entrainement\\?cat=${id}&mode=libre`));
    await expect(page.getByTestId('exercise-name')).toContainText(today);
  });

  test('Légendes, fiche et champion : la pilule remplace la barre collante', async ({ page }) => {
    await seed(page);
    await page.goto('/#/champions/kickboxing-hari-0001');
    await expectActions(page, ['entrainer', 'decomposer']);
    await expect(page.getByTestId('cat-train-bar')).toHaveCount(0);
    await expectLastRowReachable(page);
    await action(page, 'decomposer').click();
    await expect(page).toHaveURL(/#\/entrainement\?cat=kickboxing-hari-0001&mode=technique&study=1/);
    await page.goto('/#/champions/c/hari');
    await expectActions(page, ['entrainer', 'au-hasard']);
    const first = (await page.getByTestId('champ-quick-sheet').textContent())!.trim();
    await action(page, 'au-hasard').click();
    await expect(page.getByTestId('champ-quick-sheet')).not.toHaveText(first);
  });

  test('Progrès : Nouvelle séance (rouge), Objectifs, Période', async ({ page }) => {
    await seed(page, { sessions: true });
    await page.goto('/#/stats');
    await expectActions(page, ['nouvelle-seance', 'objectifs', 'periode']);
    await expectPlacement(page);
    await action(page, 'periode').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // the sheet covers the pill (pill under the sheets)
    await page.keyboard.press('Escape');
    await page.goto('/#/stats');
    await action(page, 'objectifs').click();
    await expect(page.getByTestId('goals-page')).toBeVisible();
    await page.goto('/#/stats');
    await action(page, 'nouvelle-seance').click();
    await expect(page).toHaveURL(/#\/entrainer$/);
  });

  test('pas de pilule sur les réglages, le profil, la page Coach IA, l’entraînement et l’accueil de bienvenue', async ({ page }) => {
    await seed(page);
    for (const r of ['/#/reglages', '/#/reglages/voix', '/#/profil', '/#/coach-ia', '/#/entrainement?ex=boxe-debutant-02&mode=libre']) {
      await page.goto(r);
      await page.waitForTimeout(400);
      await expect(pill(page), r).toHaveCount(0);
    }
    await seed(page, { completed: false });
    await page.goto('/#/bienvenue');
    await page.waitForTimeout(400);
    await expect(pill(page)).toHaveCount(0);
  });

  test('le panneau du Coach IA ouvert masque la pilule, elle revient à la fermeture', async ({ page }) => {
    await seed(page);
    await page.goto('/#/');
    await expect(pill(page)).toBeVisible();
    // 0.27 (Youssef, 2026-10-20 21:45): opened from the pill's Coach button (no bubble where the pill is)
    await page.getByTestId('pill-coach').click();
    await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
    await expect(pill(page)).toHaveCount(0);
    await page.getByTestId('coach-ask-panel').getByRole('button', { name: 'Fermer le coach' }).click();
    await expect(pill(page)).toBeVisible();
    // Échap closes it too, and the focus comes back to the pill's Coach button
    await page.getByTestId('pill-coach').click();
    await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
    await expect(page.getByTestId('pill-coach')).toBeFocused();
  });

  test('Coach IA dans la pilule : même panneau, mêmes suggestions selon l’écran, pas de bulle en double', async ({ page }) => {
    await seed(page, { sessions: true });
    for (const r of ['/#/', '/#/techniques?d=boxe', '/#/techniques/jab?d=boxe', '/#/champions', '/#/stats']) {
      await page.goto(r);
      await expect(pill(page), r).toBeVisible();
      await expect(page.getByTestId('coach-bubble'), r).toHaveCount(0);
      const c = page.getByTestId('pill-coach');
      await expect(c.locator('.ap-label')).toHaveText('Coach');
      await expect(c.locator('svg[data-icon="coach"]')).toHaveCount(1);
      await expect(c).toHaveAttribute('aria-label', 'Coach IA');
    }
    // the screen's context goes with it: questions about the screen it is opened from
    await page.goto('/#/stats');
    await page.getByTestId('pill-coach').click();
    await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment lire mes statistiques ?');
    await page.goto('/#/techniques/jab?d=boxe');
    await page.getByTestId('pill-coach').click();
    await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment marquer cette technique comme assimilée ?');
    // and its actions: a link to another screen
    await page.goto('/#/');
    await page.getByTestId('pill-coach').click();
    await page.getByTestId('coach-suggestion').filter({ hasText: 'Comment fonctionne l’application ?' }).click();
    await expect(page.getByTestId('coach-answer')).toContainText('cinq onglets');
    await page.getByTestId('coach-actions').getByRole('button', { name: 'Aller à Entraîner' }).click();
    await expect(page).toHaveURL(/#\/entrainer$/);
    await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  });

  test('sans pilule, la bulle reste : réglages, profil, connexion, entraînement', async ({ page }) => {
    await seed(page);
    for (const r of ['/#/reglages', '/#/profil', '/#/connexion', '/#/entrainement?ex=boxe-debutant-02&mode=libre']) {
      await page.goto('about:blank');
      await page.goto(r);
      await expect(page.getByTestId('coach-bubble'), r).toBeVisible();
      await expect(pill(page), r).toHaveCount(0);
      await expect(page.getByTestId('pill-coach'), r).toHaveCount(0);
    }
  });

  test('replier / déplier la pilule : poignée ronde, mémorisé après rechargement, au clavier', async ({ page }) => {
    await seed(page, { sessions: true });
    await page.goto('/#/');
    const fold = page.getByTestId('pill-fold');
    await expect(fold).toHaveAttribute('aria-expanded', 'true');
    await expect(fold).toHaveAttribute('aria-label', 'Replier les actions');
    await fold.click();
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'true');
    await expect(fold).toHaveAttribute('aria-expanded', 'false');
    await expect(fold).toHaveAttribute('aria-label', 'Déplier les actions');
    await expect(pill(page).locator('button')).toHaveCount(1);
    await expect(fold.locator('svg[data-icon="quickActions"]')).toHaveCount(1);
    // a compact round handle above the navigation, bottom left, 44 px or more
    // (measured once the short folding animation has ended: the slow test renderer can catch it midway)
    await expect.poll(() => page.evaluate(() => document.querySelector('[data-testid="pill-fold"]')!.getBoundingClientRect().width), { timeout: 10_000 }).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
    const h = await page.evaluate(() => {
      const b = document.querySelector('[data-testid="pill-fold"]')!.getBoundingClientRect();
      const p = document.querySelector('[data-testid="action-pill"]')!.getBoundingClientRect();
      return { w: b.width, h: b.height, pw: p.width, ph: p.height, l: p.left, bottom: p.bottom, navTop: document.querySelector('.nav')!.getBoundingClientRect().top, radius: getComputedStyle(document.querySelector('[data-testid="action-pill"]')!).borderRadius };
    });
    expect(h.w).toBeGreaterThanOrEqual(44);
    expect(h.h).toBeGreaterThanOrEqual(44);
    expect(Math.abs(h.pw - h.ph)).toBeLessThanOrEqual(1);
    expect(h.l).toBeLessThanOrEqual(24);
    expect(h.bottom).toBeLessThanOrEqual(h.navTop);
    // remembered: after a reload and on another screen
    await page.waitForTimeout(500);
    await page.reload();
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'true');
    await page.goto('/#/stats');
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'true');
    // keyboard: the same button, focus kept, Entrée unfolds
    await page.getByTestId('pill-fold').focus();
    await page.keyboard.press('Enter');
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'false');
    await expect(page.getByTestId('pill-fold')).toBeFocused();
    await expect(page.getByTestId('pill-coach')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'true');
    await page.keyboard.press('Enter');
    // unfolded again and saved before the reload (the save to the browser database is asynchronous)
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'false');
    await page.waitForTimeout(500);
    await page.reload();
    await expect(pill(page)).toHaveAttribute('data-collapsed', 'false');
    await expectActions(page, ['nouvelle-seance', 'objectifs', 'periode']);
  });

  test('au clavier : vrais boutons, focus visible, Entrée lance l’action', async ({ page }) => {
    await seed(page);
    await page.goto('/#/techniques/jab?d=boxe');
    const b = action(page, 'maitrise');
    await b.focus();
    await expect(b).toBeFocused();
    const outline = await b.evaluate((e) => getComputedStyle(e).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    // the accessible name contains the visible word
    for (const x of await pill(page).locator('button.ap-btn').all()) {
      const label = ((await x.locator('.ap-label').textContent()) ?? '').trim();
      const name = (await x.getAttribute('aria-label')) ?? label;
      expect(name.startsWith(label)).toBe(true);
    }
  });
});

// small phones, large phones and landscape: nothing covered, no scroll added on the no-scroll dashboard
for (const vp of [
  { width: 360, height: 640 },
  { width: 412, height: 915 },
  { width: 851, height: 393 },
]) {
  test(`placement ${vp.width}×${vp.height} : au-dessus de la navigation, coach dans la pilule, rien de caché`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seed(page, { sessions: true, mastery: { jab: 'a-revoir' } });
    for (const r of ['/#/', '/#/techniques?d=boxe', '/#/techniques/jab?d=boxe', '/#/champions']) {
      await page.goto(r);
      await expect(pill(page), r).toBeVisible();
      await expectPlacement(page);
      await expectLastRowReachable(page);
    }
    await page.goto('/#/stats');
    await expect(pill(page)).toBeVisible();
    await expectPlacement(page);
    const m = await page.evaluate(() => ({
      sh: document.scrollingElement!.scrollHeight,
      ih: innerHeight,
      chartBottom: document.querySelector('.dash-chart')!.getBoundingClientRect().bottom,
      pillTop: document.querySelector('[data-testid="action-pill"]')!.getBoundingClientRect().top,
    }));
    if (vp.height >= 600) {
      // portrait: the dashboard still fits without scrolling, its chart ends above the pill
      expect(m.sh).toBeLessThanOrEqual(m.ih);
      expect(m.chartBottom).toBeLessThanOrEqual(m.pillTop);
    }
  });
}

for (const scheme of ['dark', 'light'] as const)
  test(`thème ${scheme} : couleurs de la pilule et contrastes`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.emulateMedia({ colorScheme: scheme });
    await seed(page, { sessions: true });
    const shots: [string, string][] = [
      ['/#/', 'accueil'],
      ['/#/techniques?d=boxe', 'catalogue'],
      ['/#/techniques/jab?d=boxe', 'fiche-technique'],
      ['/#/champions', 'legendes'],
      ['/#/stats', 'progres'],
    ];
    for (const [r, name] of shots) {
      await page.goto(r);
      await expect(pill(page)).toBeVisible();
      const c = await pill(page).evaluate((p) => {
        const s = getComputedStyle(p);
        const sec = p.querySelector('button[data-pill-action]:not(.primary)');
        const coach = p.querySelector('[data-testid="pill-coach"]')!;
        return { bg: s.backgroundColor, border: s.borderTopColor, ink: sec ? getComputedStyle(sec).color : null, prim: getComputedStyle(p.querySelector('button.primary')!).color, coach: getComputedStyle(coach.querySelector('.ap-label')!).color };
      });
      expect(c.bg).toBe(scheme === 'dark' ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)');
      if (scheme === 'dark') expect(c.border).toBe('rgb(55, 65, 81)');
      expect(c.prim).toBe('rgb(255, 255, 255)');
      if (c.ink) expect(c.ink).toBe(scheme === 'dark' ? 'rgb(244, 244, 245)' : 'rgb(17, 18, 20)');
      // 0.27: the Coach IA in gold, as the coach's identity
      expect(c.coach).toBe(scheme === 'dark' ? 'rgb(212, 175, 55)' : 'rgb(125, 95, 34)');
      const axe = await new AxeBuilder({ page }).include('[data-testid="action-pill"]').withRules(['color-contrast', 'button-name', 'aria-allowed-attr', 'label-content-name-mismatch']).analyze();
      expect(axe.violations.map((v) => `${r} ${v.id}`)).toEqual([]);
      if (SHOTS) {
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SHOTS}/${name}-${scheme}.png` });
      }
    }
    if (SHOTS) {
      await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=libre');
      await expect(page.getByTestId('start')).toBeVisible();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${SHOTS}/entrainement-${scheme}.png` });
    }
  });
