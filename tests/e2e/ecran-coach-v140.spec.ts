import { expect, test, type Page } from '@playwright/test';
import { seedProfile, showCoachTools } from './nav-helpers';

/**
 * 1.4.0 (Youssef, 2026-10-28: « L'écran du coach devrait être exactement le même module appelé partout et alimenté
 * différemment », then option A: one tap shows the commands without pausing, the next tap hides them): the coach of
 * the home, the technique sheet, the session and the preview is one module (CoachScreen), each screen giving it its
 * own commands. Also: a muted coach is never silent without a sign (Youssef: « J'ai l'impression d'avoir perdu les
 * consignes vocales »).
 */

test.use({ viewport: { width: 393, height: 851 } });
test.describe.configure({ timeout: 180_000 });

/** one tap on the coach, away from its buttons; the module waits for the time of a double tap */
async function tapCoach(page: Page, id: string) {
  const b = (await page.getByTestId(id).boundingBox())!;
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.55);
}

const SCREENS: { path: string; id: string; context: string; commands: string[]; angles: boolean }[] = [
  { path: '/', id: 'hero-stage', context: 'accueil', commands: ['fullscreen', 'sound'], angles: false },
  { path: '/techniques/jab?d=boxe', id: 'technique-stage', context: 'fiche', commands: ['speed-tool', 'fullscreen', 'sound'], angles: true },
  { path: '/entrainement?ex=boxe-debutant-02&mode=technique', id: 'training-stage', context: 'seance', commands: ['speed-tool', 'fullscreen', 'sound'], angles: true },
  { path: '/combattant', id: 'studio-stage', context: 'apercu', commands: ['fullscreen'], angles: false },
];

test('le même module partout : un toucher montre les commandes du coach, le toucher suivant les cache', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  for (const s of SCREENS) {
    await page.goto(`/#${s.path}`);
    const screen = page.getByTestId(s.id);
    await expect(screen.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(screen, s.context).toHaveAttribute('data-context', s.context);
    await expect(screen).toHaveClass(/coach-screen/);
    // at rest: nothing over the coach
    await expect(page.getByTestId('coach-tools'), s.context).toHaveCount(0);
    await tapCoach(page, s.id);
    await expect(page.getByTestId('coach-tools'), s.context).toBeVisible();
    await expect(screen).toHaveAttribute('data-ui', 'on');
    for (const c of s.commands) await expect(page.getByTestId('coach-tools').getByTestId(c), `${s.context} : ${c}`).toBeVisible();
    await expect(page.getByTestId('coach-angles'), `${s.context} : angles`).toHaveCount(s.angles ? 1 : 0);
    // the commands are in the zone of the coach
    const [z, t] = await Promise.all([screen.boundingBox(), page.getByTestId('coach-tools').boundingBox()]);
    expect(t!.x >= z!.x && t!.x + t!.width <= z!.x + z!.width + 1 && t!.y >= z!.y && t!.y + t!.height <= z!.y + z!.height + 1, s.context).toBe(true);
    await tapCoach(page, s.id);
    await expect(page.getByTestId('coach-tools'), s.context).toHaveCount(0);
    await expect(screen).toHaveAttribute('data-ui', 'off');
  }
});

test('séance : le toucher ne met plus en pause ; la pause est dans les commandes', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  await tapCoach(page, 'training-stage');
  await expect(page.getByTestId('coach-tools')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  await page.getByTestId('coach-pause').click();
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await page.getByTestId('coach-pause').click();
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
});

test('fiche technique : les angles et la vitesse dans la zone du coach changent la vue', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/techniques/jab?d=boxe');
  await showCoachTools(page);
  const angles = page.getByTestId('coach-angles');
  await angles.getByRole('radio', { name: 'Profil', exact: true }).click();
  await expect(angles.getByRole('radio', { name: 'Profil', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('speed-tool').click();
  await expect(page.getByTestId('speed-choices').getByRole('radio')).toHaveText(['×0,2', '×0,4', '×0,6', '×0,8', '×1', '×1,2']);
  await page.getByTestId('speed-1').click();
  await expect(page.getByTestId('speed-tool')).toHaveText('×1');
  // the play / pause and the mastery stay under the coach
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByTestId('mastery-switch')).toBeVisible();
});

test('voix coupée : un haut-parleur barré reste dans le coin, et la séance le dit au départ', async ({ page }) => {
  await seedProfile(page, {}, { voice: false });
  for (const [path, id] of [['/', 'hero-stage'], ['/techniques/jab?d=boxe', 'technique-stage']] as const) {
    await page.goto(`/#${path}`);
    await expect(page.getByTestId(id).getByTestId('coach-muted'), path).toBeVisible();
  }
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await expect(page.getByTestId('coach-muted')).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByText('Voix coupée : touche le coach, puis le haut-parleur pour la remettre')).toBeVisible();
  // the sound back: the sign goes away
  await showCoachTools(page);
  await page.getByTestId('sound').click();
  await expect(page.getByTestId('sound')).toHaveAttribute('data-level', '1');
  await tapCoach(page, 'training-stage');
  await expect(page.getByTestId('coach-tools')).toHaveCount(0);
  await expect(page.getByTestId('coach-muted')).toHaveCount(0);
});

for (const theme of ['clair', 'sombre'] as const) {
  test(`mode ${theme === 'clair' ? 'jour' : 'nuit'} : les commandes du coach restent lisibles`, async ({ page }) => {
    await seedProfile(page, {}, { theme });
    for (const s of SCREENS.slice(0, 3)) {
      await page.goto(`/#${s.path}`);
      await showCoachTools(page);
      const [fg, bg] = await page
        .getByTestId('fullscreen')
        .evaluate((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]);
      // light ink on a dark glass, or dark ink on a light glass: never the same tone
      const lum = (c: string) => {
        const [r, g, b] = c.match(/[\d.]+/g)!.map(Number);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      expect(Math.abs(lum(fg) - lum(bg)), `${theme} ${s.context} ${fg} / ${bg}`).toBeGreaterThan(120);
    }
  });
}
