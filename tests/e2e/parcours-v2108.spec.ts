import { expect, test, type Page } from '@playwright/test';
import { bar, menuCommand, seedProfile } from './nav-helpers';

/**
 * 2.10.8 (Youssef, 2026-11-27, « Parcours des écrans »): « Commencer » opens the ready session in the last mode used
 * (mode chosen in « Plus »), the exercise sheet shows the instructions of the session, no PRO badge on the coaches while
 * everything is free, the tip « touche le coach » once, and a first launch has no « nouvelle version » dot.
 */
test.use({ viewport: { width: 393, height: 851 } });

async function seedStats(page: Page, mode: string) {
  await page.goto('/');
  await page.evaluate(
    (s) =>
      new Promise<void>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { sessions: [s] }, version: 0 }), 'u:local:css-stats');
          tx.oncomplete = () => res();
        };
      }),
    { id: 's1', start: '2026-11-20T18:00:00.000Z', discipline: 'boxe', level: 'debutant', exerciseId: 'boxe-debutant-01', exerciseName: 'Jab en garde', mode, activeSec: 600, reps: 10 },
  );
  await page.goto('about:blank');
}

test('« Commencer » ouvre la séance prête, dans le dernier mode utilisé', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await seedStats(page, 'technique');
  await page.goto('/#/');
  await page.getByTestId('home-cta').click();
  await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-[a-z0-9-]+&mode=technique$/);
  await expect(page.getByTestId('start')).toBeVisible();
});

test('le mode se change dans « Plus » avant « Démarrer », l’exercice reste le même', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  await expect(page.getByTestId('start')).toBeVisible();
  await menuCommand(page, 'cmd-mode');
  await expect(page.getByTestId('mode-sheet')).toBeVisible();
  await page.getByTestId('session-mode-cardio').click();
  await page.getByTestId('mode-apply').click();
  await expect(page).toHaveURL(/#\/entrainement\?ex=boxe-debutant-01&mode=cardio&/);
  await expect(page.getByTestId('start')).toBeVisible();
});

test('la fiche d’un exercice affiche les mêmes consignes que la séance', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/entrainement?ex=boxe-debutant-01&mode=libre');
  await expect(page.getByTestId('key-points').locator('li').first()).toBeVisible();
  const session = await page.getByTestId('key-points').locator('li').allInnerTexts();
  expect(session.length).toBeGreaterThan(1);
  await page.goto('/#/discipline/boxe?niveau=debutant&ex=boxe-debutant-01');
  await expect(page.getByTestId('ex-instructions').locator('li').first()).toBeVisible();
  const sheet = await page.getByTestId('ex-instructions').locator('li').allInnerTexts();
  expect(sheet.map((x) => x.trim())).toEqual(session.map((x) => x.trim()));
});

test('aucun badge PRO sur les coachs tant que tout est gratuit', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/coach');
  await expect(page.getByTestId('coach-nael')).toBeVisible();
  await expect(page.locator('[data-testid^="coach-"] .pro-badge')).toHaveCount(0);
});

test('l’astuce « touche le coach » : une seule fois, sur l’Accueil ou dans la séance', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await expect(page.getByTestId('fs-hint')).toBeVisible();
  // the tip is at the bottom of the view, not over the head of the coach
  const stage = await page.getByTestId('hero-stage').boundingBox();
  const hint = await page.getByTestId('fs-hint').boundingBox();
  expect(hint!.y).toBeGreaterThan(stage!.y + stage!.height / 2);
  await page.waitForTimeout(1700);
  await page.getByTestId('home-cta').click();
  await expect(page.getByTestId('start')).toBeVisible();
  await expect(page.getByTestId('fs-hint')).toHaveCount(0);
});

test('premier lancement : pas de texte de personnalisation, pas de pastille « nouvelle version » sur Compte', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('tu pourras le personnaliser')).toHaveCount(0);
  await expect(page.locator('[data-testid^="coach-"] .pro-badge')).toHaveCount(0);
  await page.getByTestId('coach-homme').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('home-cta')).toBeVisible();
  await expect(bar(page).getByTestId('menu-dot')).toHaveCount(0);
  await expect(bar(page).locator('.nav-dot')).toHaveCount(0);
});

/**
 * 2.11.1 (Youssef, 2026-11-27, propositions 2A et 8A): Bienvenue in four steps (coach, guard, discipline, level), the
 * goals and the body data asked later by a card of Compte; the home with one prepared session, one « Commencer » and a
 * row of four accesses.
 */
test('2A : Bienvenue en quatre écrans, puis la carte « Complète ton profil » dans Compte, jamais bloquante', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4');
  await expect(page.getByTestId('next')).toBeDisabled();
  await page.getByTestId('coach-femme').click();
  await page.getByTestId('next').click();
  await expect(page.getByTestId('guard-orthodoxe')).toBeVisible();
  await page.getByTestId('next').click();
  await expect(page.getByTestId('main-boxe')).toBeVisible();
  await page.getByTestId('next').click();
  await expect(page.getByTestId('next')).toHaveCount(0);
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('home-cta')).toBeVisible();
  await page.getByTestId('nav-profil').click();
  const card = page.getByTestId('compte-complete');
  await expect(card).toBeVisible();
  await page.getByTestId('compte-complete-go').click();
  await expect(page.getByTestId('pf-goal-vitesse')).toBeVisible();
  await page.getByTestId('nav-profil').click();
  await page.getByTestId('compte-complete-close').click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('compte-complete')).toHaveCount(0);
});

test('8A : l’accueil montre une séance prête, un seul « Commencer » et quatre accès ; la loupe de la barre cherche', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await page.goto('/#/');
  await expect(page.getByTestId('next-session')).toContainText('Prête à démarrer');
  await expect(page.getByTestId('home-cta')).toHaveCount(1);
  await expect(page.getByTestId('home-access').locator('a')).toHaveText(['Techniques', 'Chrono', 'Créer', 'Coach IA']);
  await expect(page.getByTestId('tile-daily')).toBeVisible();
  await expect(page.getByTestId('home-goal')).toBeVisible();
  await page.getByTestId('app-search').click();
  await expect(page.getByTestId('search-ai')).toBeVisible();
});

test('8A : « Reprendre ta séance » remplace la séance prête quand une séance existe', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  await seedStats(page, 'technique');
  await page.goto('/#/');
  await expect(page.getByTestId('resume-last')).toContainText('Reprendre ta séance');
  await expect(page.getByTestId('next-session')).toHaveCount(0);
});
