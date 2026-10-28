import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { bar, openCoachIA, openMenu } from './nav-helpers';

/**
 * 0.24 (Youssef, 2026-10-20 10:52): the AI coach is a bubble at the bottom right; Légendes has its own tab.
 * v0.32 (PROMPT MAÎTRE navigation, 2026-10-22: no floating element, one bottom bar): the Coach IA opens from the Menu
 * (« Sur cet écran » › Coach IA) on every screen; the panel, its questions per screen and its actions are the same.
 */
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

test('Coach IA depuis le Menu : il s’ouvre, Échap le ferme, aucune bulle flottante', async ({ page }) => {
  await seed(page);
  await page.goto('/#/reglages');
  await expect(bar(page)).toBeVisible();
  await expect(page.getByTestId('coach-bubble')).toHaveCount(0);
  await openCoachIA(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await openCoachIA(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  // the training screen has no Coach button of its own either: the same entry in the Menu
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await expect(page.getByTestId('exercise-name')).toBeVisible();
  await expect(page.getByTestId('ask-coach')).toHaveCount(0);
  await expect(page.getByTestId('coach-bubble')).toHaveCount(0);
  await openCoachIA(page);
});

test('Coach IA : par « Rechercher » sur chaque écran (dans « Plus » en séance), plus dans les menus', async ({ page }) => {
  // 1.1.0 (Youssef, 2026-10-27: « Retirer plus / coach IA car désormais il est dans la barre de recherche »)
  await seed(page);
  const screens = ['/#/', '/#/techniques', '/#/techniques/jab?d=boxe', '/#/stats', '/#/champions', '/#/reglages', '/#/reglages/voix', '/#/profil', '/#/coach', '/#/connexion', '/#/entrainer', '/#/entrainement?ex=boxe-debutant-01&mode=technique'];
  for (const s of screens) {
    await page.goto('about:blank');
    await page.goto(s);
    await expect(bar(page)).toBeVisible();
    if (s.includes('entrainement')) {
      await openMenu(page);
      await expect(page.getByTestId('cmd-search'), s).toBeVisible();
      await page.getByTestId('cmd-search').click();
    } else await bar(page).getByTestId('app-search').click();
    await expect(page.getByTestId('search-ask'), s).toBeVisible();
    await expect(page.getByTestId('cmd-coach-ia'), s).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
  // the whole coach page is open: its ⋮ has no second way in
  await page.goto('/#/coach-ia');
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(bar(page)).toHaveAttribute('data-screen', 'coach-ia');
  if (await bar(page).locator('[data-action="menu"]').count()) await openMenu(page);
  await expect(page.getByTestId('cmd-coach-ia')).toHaveCount(0);
});

test('Coach IA à l’entraînement : pause, démo sur le lecteur, ralenti, sans quitter la séance', async ({ page }) => {
  await seed(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=technique');
  await page.getByTestId('start').click();
  await openCoachIA(page);
  // opening the coach pauses the session, as the former Coach button did
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  // the panel knows the session: questions about the move on screen
  await expect(page.getByTestId('coach-suggestion').first()).toBeVisible();
  // a suggested demo plays on the session's coach (Décomposer), the screen stays the training one
  const demo = page.getByTestId('coach-suggestion').filter({ hasText: /^Montre-moi/ }).first();
  await demo.scrollIntoViewIfNeeded();
  // a tap within 150 ms of a scroll of the rail is read as the end of a swipe (SuggestRail); a person never
  // taps that fast after the list moved, the test waits the same quiet time
  await page.waitForTimeout(250);
  await demo.click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/entrainement\?/);
  await page.getByTestId('study-close').click();
  // slow motion of another move, asked in words
  await openCoachIA(page);
  await page.getByTestId('coach-input').fill('Montre-moi le crochet gauche au ralenti');
  await page.getByTestId('coach-send').click();
  await expect(page.getByTestId('study-panel')).toBeVisible();
  await expect(page.getByTestId('current-move')).toHaveText('Crochet gauche');
  // Échap closes it like everywhere else
  await openCoachIA(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/entrainement\?/);
});

test('Légendes : un onglet d’Apprendre (1.0.0, formerly in the Menu)', async ({ page }) => {
  await seed(page);
  await page.goto('/#/');
  await page.getByTestId('nav-techniques').click();
  await page.getByTestId('tab-legendes').click();
  await expect(page).toHaveURL(/#\/champions/);
  // 1.0.0 (refonte, lot 2, replaces the 0.36 rule): Techniques = Techniques, Combinaisons; Légendes is a tab of
  // Apprendre at the top of the screen and Favoris a tab of Entraîner; their old links lead there
  await page.goto('/#/techniques');
  const sections = page.getByRole('tablist', { name: 'Sections' }).getByRole('tab');
  await expect(sections).toHaveText(['Techniques', 'Combinaisons']);
  await expect(page.getByTestId('tab-legendes')).toBeVisible();
  await page.goto('/#/techniques?tab=legendes');
  await expect(page).toHaveURL(/#\/champions$/);
  await expect(page.getByTestId('tab-legendes')).toHaveAttribute('aria-current', 'page');
  await page.goto('/#/techniques?tab=favoris');
  await expect(page).toHaveURL(/#\/favoris$/);
  await expect(page.getByTestId('tab-favoris')).toHaveAttribute('aria-current', 'page');
});

/** 0.25 (Youssef, 2026-10-20): the coach answers for the screen it is opened from, and explains the app. */
test('Coach IA : questions sur l’écran courant et lien vers un autre écran', async ({ page }) => {
  await seed(page);
  await page.goto('/#/stats');
  await openCoachIA(page);
  await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment lire mes statistiques ?');
  await page.getByTestId('coach-suggestion').first().click();
  await expect(page.getByTestId('coach-answer')).toContainText('Parcours');
  // on the home screen, how the app works (v0.32: the bar and the Menu), with a link to the Train tab
  await page.goto('/#/');
  await openCoachIA(page);
  await page.getByTestId('coach-suggestion').filter({ hasText: 'Comment fonctionne l’application ?' }).click();
  await expect(page.getByTestId('coach-answer')).toContainText('barre du bas');
  await page.getByTestId('coach-actions').getByRole('button', { name: 'Aller à Entraîner' }).click();
  await expect(page).toHaveURL(/#\/entrainer$/);
  await expect(page.getByTestId('coach-bubble-panel')).toHaveCount(0);
  // on a technique sheet, marking it is the first question
  await page.goto('/#/techniques/jab?d=boxe');
  await openCoachIA(page);
  await expect(page.getByTestId('coach-suggestion').first()).toHaveText('Comment marquer cette technique comme assimilée ?');
  await page.getByTestId('coach-input').fill('À quoi sert cet écran ?');
  await page.getByTestId('coach-send').click();
  await expect(page.getByTestId('coach-answer')).toContainText('barre de lecture');
});
