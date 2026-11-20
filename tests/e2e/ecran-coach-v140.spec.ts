import { expect, test, type Page } from '@playwright/test';
import { closeCoachPanel, seedProfile, showCoachTools } from './nav-helpers';

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

// 2.4: what the coach's panel offers on each screen (the commands that a tap showed in 1.4.0 are its sections)
const SCREENS: { path: string; id: string; context: string; commands: string[]; angles: boolean }[] = [
  { path: '/', id: 'hero-stage', context: 'accueil', commands: ['cp-fullscreen', 'cp-voice'], angles: false },
  { path: '/techniques/jab?d=boxe', id: 'technique-stage', context: 'fiche', commands: ['cp-speed', 'cp-fullscreen', 'cp-voice'], angles: true },
  { path: '/entrainement?ex=boxe-debutant-02&mode=technique', id: 'training-stage', context: 'seance', commands: ['cp-speed', 'cp-fullscreen', 'cp-voice'], angles: true },
];

test('le même module partout : un toucher ouvre le panneau du coach, un toucher à côté le ferme', async ({ page }) => {
  await seedProfile(page, {}, { stageFsHintSeen: true });
  for (const s of SCREENS) {
    await page.goto(`/#${s.path}`);
    const screen = page.getByTestId(s.id);
    await expect(screen.locator('canvas')).toBeVisible({ timeout: 60_000 });
    await expect(screen, s.context).toHaveAttribute('data-context', s.context);
    await expect(screen).toHaveClass(/coach-screen/);
    // at rest: nothing over the coach (2.4: no setting of the coach outside its panel)
    await expect(page.getByTestId('coach-panel'), s.context).toHaveCount(0);
    // (the Coach IA bubble of the session lives in its corner of the stage: it is an assistant, not a setting of the coach)
    await expect(screen.locator('button:not(.sr-only):not(.tr-coach-slot *)'), `${s.context} : aucun bouton sur le coach`).toHaveCount(0);
    await tapCoach(page, s.id);
    await expect(page.getByTestId('coach-panel'), s.context).toBeVisible();
    await expect(screen).toHaveAttribute('data-ui', 'on');
    for (const c of s.commands) await expect(page.getByTestId('coach-panel').getByTestId(c), `${s.context} : ${c}`).toBeVisible();
    await expect(page.getByTestId('cp-camera'), `${s.context} : angles`).toHaveCount(s.angles ? 1 : 0);
    // the panel is over the coach, centred on the screen
    const [z, t] = await Promise.all([page.viewportSize(), page.getByTestId('coach-panel').boundingBox()]);
    expect(t!.x >= 0 && t!.x + t!.width <= z!.width + 1 && t!.y >= 0 && t!.y + t!.height <= z!.height + 1, s.context).toBe(true);
    // a tap outside it (top left corner of the screen) closes it
    await page.mouse.click(4, 4);
    await expect(page.getByTestId('coach-panel-root'), s.context).toHaveCount(0);
    await expect(screen).toHaveAttribute('data-ui', 'off');
  }
});

test('séance : ouvrir le panneau ne met pas en pause ; la pause reste dans la barre', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('pause')).toBeVisible();
  await tapCoach(page, 'training-stage');
  await expect(page.getByTestId('coach-panel')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
  await closeCoachPanel(page);
  await page.getByTestId('pause').click();
  await expect(page.getByTestId('phase')).toHaveText('Pause');
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('phase')).not.toHaveText('Pause');
});

test('fiche technique : les angles et la vitesse du panneau changent la vue', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/techniques/jab?d=boxe');
  await showCoachTools(page);
  const angles = page.getByTestId('cp-camera');
  await expect(angles.getByRole('radio')).toHaveText(['Auto', 'Face', '3/4', 'Profil', '3/4 opposé']);
  await angles.getByRole('radio', { name: 'Profil', exact: true }).click();
  await expect(angles.getByRole('radio', { name: 'Profil', exact: true })).toHaveAttribute('aria-checked', 'true');
  // the same six speeds as before, the same start (×0,6)
  await expect(page.getByTestId('cp-speed-value')).toHaveText('×0,6');
  await page.getByTestId('cp-speed').fill('4');
  await expect(page.getByTestId('cp-speed-value')).toHaveText('×1');
  await page.getByTestId('cp-speed').fill('0');
  await expect(page.getByTestId('cp-speed-value')).toHaveText('×0,2');
  // the panel stays open after a choice
  await expect(page.getByTestId('coach-panel')).toBeVisible();
  await closeCoachPanel(page);
  // the play / pause stays under the coach; the mastery is in the panel
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByTestId('mastery-switch')).toHaveCount(0);
});

test('voix coupée : un haut-parleur barré reste dans le coin, sans message au départ (Youssef : « Pas besoin de dire voix coupée »)', async ({ page }) => {
  await seedProfile(page, {}, { voice: false });
  for (const [path, id] of [['/', 'hero-stage'], ['/techniques/jab?d=boxe', 'technique-stage']] as const) {
    await page.goto(`/#${path}`);
    await expect(page.getByTestId(id).getByTestId('coach-muted'), path).toBeVisible();
  }
  await page.goto('/#/entrainement?ex=boxe-debutant-02&mode=technique');
  await expect(page.getByTestId('coach-muted')).toBeVisible();
  await page.getByTestId('start').click();
  await page.waitForTimeout(1500);
  await expect(page.getByText(/Voix coupée/)).toHaveCount(0);
  // the sound back (2.4: the switch of the panel): the sign goes away
  await showCoachTools(page);
  await expect(page.getByTestId('cp-voice')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('cp-voice').click();
  await expect(page.getByTestId('cp-voice')).toHaveAttribute('aria-checked', 'true');
  await closeCoachPanel(page);
  await expect(page.getByTestId('coach-muted')).toHaveCount(0);
});

for (const theme of ['clair', 'sombre'] as const) {
  test(`mode ${theme === 'clair' ? 'jour' : 'nuit'} : le panneau du coach reste lisible`, async ({ page }) => {
    await seedProfile(page, {}, { theme });
    for (const s of SCREENS.slice(0, 3)) {
      await page.goto(`/#${s.path}`);
      await showCoachTools(page);
      // 2.4: the ink of the panel against its own glass (the buttons are transparent over it)
      const fg = await page.getByTestId('cp-fullscreen').evaluate((e) => getComputedStyle(e).color);
      const bg = await page.getByTestId('coach-panel').evaluate((e) => getComputedStyle(e).backgroundColor);
      // light ink on a dark glass, or dark ink on a light glass: never the same tone
      const lum = (c: string) => {
        const [r, g, b] = c.match(/[\d.]+/g)!.map(Number);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      expect(Math.abs(lum(fg) - lum(bg)), `${theme} ${s.context} ${fg} / ${bg}`).toBeGreaterThan(120);
      await closeCoachPanel(page);
    }
  });
}
