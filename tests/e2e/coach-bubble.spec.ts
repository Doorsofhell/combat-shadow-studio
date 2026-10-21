import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';

/** 0.24 (Youssef, 2026-10-20 10:52): the AI coach is a bubble at the bottom right; Légendes has its own tab. */
async function seed(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (profile) => {
    await new Promise<void>((res, rej) => {
      const r = indexedDB.open('keyval-store');
      r.onupgradeneeded = () => r.result.createObjectStore('keyval');
      r.onsuccess = () => {
        const tx = r.result.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(JSON.stringify({ state: { profile }, version: 0 }), 'u:local:css-profile');
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      };
    });
  }, { ...DEFAULT_PROFILE, completed: true, coach: 'femme', mainDiscipline: 'boxe', disciplines: ['boxe'] });
  await page.goto('about:blank');
}

test('bulle Coach IA : un appui ouvre, un autre masque, Échap masque aussi', async ({ page }) => {
  await seed(page);
  // 0.27 (Youssef, 2026-10-20 21:45: « intégrer le coach ia dans la barre d'icône dynamique »): the technique
  // catalogue has an action pill, so its Coach IA is in the pill (action-pill.spec); the bubble is checked on the
  // settings, which have no pill
  await page.goto('/#/reglages');
  const bubble = page.getByTestId('coach-bubble');
  await expect(bubble).toHaveAttribute('aria-expanded', 'false');
  await bubble.click();
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
  await bubble.click();
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await bubble.click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  // 0.25 (Youssef, 2026-10-20 12:30: « le coach IA doit être identique sur tous les écrans »): the training
  // screen no longer has its own Coach button, the same bubble is there
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  await expect(page.getByTestId('coach-bubble')).toBeVisible();
  await expect(page.getByTestId('ask-coach')).toHaveCount(0);
});

/** what makes the bubble look the same, and where it is */
async function bubbleLook(page: Page) {
  const b = page.getByTestId('coach-bubble');
  await expect(b).toBeVisible();
  return b.evaluate((e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return {
      look: { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, shadow: cs.boxShadow, icon: (e.querySelector('svg')?.innerHTML ?? '').replace(/_r_\w+?_/g, 'id') },
      fromRight: innerWidth - r.right,
      top: r.top,
      bottom: r.bottom,
      vh: innerHeight,
    };
  });
}

test('bulle Coach IA identique sur tous les écrans, en bas à droite, entraînement compris', async ({ page }) => {
  await seed(page);
  // 0.27 (Youssef, 2026-10-20 21:45): on the screens with an action pill (accueil, techniques, fiche, progrès,
  // légendes) the Coach IA is the pill's last button and the bubble is not drawn (one entry point); the bubble is
  // the same on every other screen
  const screens = ['/#/reglages', '/#/reglages/voix', '/#/profil', '/#/coach', '/#/connexion', '/#/entrainer', '/#/entrainement?ex=boxe-debutant-01&mode=technique'];
  let ref: Awaited<ReturnType<typeof bubbleLook>>['look'] | null = null;
  for (const s of screens) {
    await page.goto('about:blank');
    await page.goto(s);
    const b = await bubbleLook(page);
    if (!ref) ref = b.look;
    expect(b.look, s).toEqual(ref);
    // bottom right: at the right edge, in the lower part of the screen
    expect(b.fromRight, s).toBeLessThanOrEqual(20);
    expect(b.top, s).toBeGreaterThan(b.vh / 3);
    expect(b.bottom, s).toBeLessThanOrEqual(b.vh);
  }
  // hidden where the whole coach page is open, and during onboarding (its buttons are at the bottom)
  await page.goto('/#/coach-ia');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page.getByTestId('coach-bubble')).toHaveCount(0);
  // where the pill is, the Coach IA is in it and the bubble is absent
  for (const s of ['/#/', '/#/techniques', '/#/techniques/jab?d=boxe', '/#/stats', '/#/champions']) {
    await page.goto(s);
    await expect(page.getByTestId('pill-coach'), s).toBeVisible();
    await expect(page.getByTestId('coach-bubble'), s).toHaveCount(0);
  }
});

test('bulle Coach IA à l’entraînement : pause, démo sur le lecteur, ralenti, sans quitter la séance', async ({ page }) => {
  await seed(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await page.getByTestId('start').click();
  await page.getByTestId('coach-bubble').click();
  // opening the coach pauses the session, as the former Coach button did
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
  // the panel knows the session: questions about the move on screen
  await expect(page.getByTestId('coach-suggestion').first()).toBeVisible();
  // a suggested demo plays on the session's coach (Décomposer), the screen stays the training one
  const demo = page.getByTestId('coach-suggestion').filter({ hasText: /^Montre-moi/ }).first();
  await demo.scrollIntoViewIfNeeded();
  await demo.click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/entrainement\?/);
  await page.getByTestId('study-close').click();
  // slow motion of another move, asked in words
  await page.getByTestId('coach-bubble').click();
  await page.getByTestId('coach-input').fill('Montre-moi le crochet gauche au ralenti');
  await page.getByTestId('coach-send').click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  await expect(page.getByTestId('current-move')).toHaveText('Crochet gauche');
  // Échap closes it like everywhere else
  await page.getByTestId('coach-bubble').click();
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await expect(page.getByTestId('coach-bubble')).toBeVisible();
});

test('onglet Légendes dans la barre du bas', async ({ page }) => {
  await seed(page);
  await page.goto('/#/');
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Légendes' }).click();
  await expect(page).toHaveURL(/#\/champions/);
  // 0.27 (Youssef, 2026-10-20 21:56: « Retire légendes des techniques vu qu'ils ont leur menu »): the Techniques
  // tab has no Légendes section any more, and its old link goes to the Légendes tab
  await page.goto('/#/techniques');
  const sections = page.getByRole('tablist', { name: 'Sections' }).getByRole('tab');
  await expect(sections).toHaveText(['Techniques', 'Combinaisons', 'Créateur', 'Favoris', 'Programmes']);
  await page.goto('about:blank');
  await page.goto('/#/techniques?tab=legendes');
  await expect(page).toHaveURL(/#\/champions$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/tab=legendes/);
});

/** 0.25 (Youssef, 2026-10-20): the coach answers for the screen it is opened from, and explains the app. */
test('bulle Coach IA : questions sur l’écran courant et lien vers un autre écran', async ({ page }) => {
  await seed(page);
  // 0.27 (Youssef, 2026-10-20 21:45): on these screens the Coach IA opens from the action pill (no bubble there)
  await page.goto('/#/stats');
  await page.getByTestId('pill-coach').click();
  await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment lire mes statistiques ?');
  await page.getByTestId('coach-suggestion').first().click();
  await expect(page.getByTestId('coach-answer')).toContainText('Parcours');
  // on the home screen, how the app works, with a link to the Train tab
  await page.goto('/#/');
  await page.getByTestId('pill-coach').click();
  await page.getByTestId('coach-suggestion').filter({ hasText: 'Comment fonctionne l’application ?' }).click();
  await expect(page.getByTestId('coach-answer')).toContainText('cinq onglets');
  await page.getByTestId('coach-actions').getByRole('button', { name: 'Aller à Entraîner' }).click();
  await expect(page).toHaveURL(/#\/entrainer$/);
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  // on a technique sheet, marking it is the first question
  await page.goto('/#/techniques/jab?d=boxe');
  await page.getByTestId('pill-coach').click();
  await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment marquer cette technique comme assimilée ?');
  await page.getByTestId('coach-input').fill('À quoi sert cet écran ?');
  await page.getByTestId('coach-send').click();
  await expect(page.getByTestId('coach-answer')).toContainText('barre de lecture');
});
