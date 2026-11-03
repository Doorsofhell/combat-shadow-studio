import { expect, test } from '@playwright/test';
import { bar, seedProfile } from './nav-helpers';

/**
 * 1.7.0 (Youssef, 2026-10-28 11:30, proposition A « Réponse du coach en tête », maquette 9Bm1j9XWeRYAWtittrjn5q):
 * one bar with the IA icon ✦ inside; the coach's answer at the top of the search sheet, the app's results below it.
 */

test('un simple mot : les résultats, et « Demander au coach » en première ligne, qui répond dans la même fenêtre', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await bar(page).getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('garde');
  await expect(page.getByTestId('search-hit').first()).toBeVisible();
  await expect(page.getByTestId('search-coach')).toHaveCount(0);
  await expect(page.getByTestId('search-ask')).toContainText('Demander au coach : « garde »');
  await page.getByTestId('search-ask').click();
  // same sheet: the answer on top, the results still below
  await expect(page.getByTestId('search-sheet')).toBeVisible();
  await expect(page.getByTestId('search-coach-text')).not.toBeEmpty();
  await expect(page.getByTestId('search-ask')).toHaveCount(0);
  await expect(page.getByTestId('search-hit').first()).toBeVisible();
  const order = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="search-coach"]')!.getBoundingClientRect().top;
    const hit = document.querySelector('[data-testid="search-hit"]')!.getBoundingClientRect().top;
    return card < hit;
  });
  expect(order).toBe(true);
  // typing again hides the answer until asked
  await page.getByTestId('search-input').fill('garde basse');
  await expect(page.getByTestId('search-coach')).toHaveCount(0);
});

test('une question : réponse courte en tête avec « Lire la suite », ses actions, et l’historique garde une seule entrée', async ({ page }) => {
  await seedProfile(page);
  // the history is off by default: turned on first
  await page.goto('/#/coach-ia');
  await page.getByRole('switch', { name: /Garder l’historique/ }).check({ force: true });
  await expect(page.getByRole('switch', { name: /Garder l’historique/ })).toBeChecked();
  await page.goto('/#/');
  await bar(page).getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('Comment corriger mon jab ?');
  await expect(page.getByTestId('search-coach')).toBeVisible();
  // asked on purpose (Entrée): kept in the history
  await page.getByTestId('search-input').press('Enter');
  await expect(page.getByTestId('search-ai')).toHaveClass(/on/);
  const text = page.getByTestId('search-coach-text');
  if ((await page.getByTestId('search-coach-more').count()) > 0) {
    await expect(text).toHaveClass(/clamped/);
    await page.getByTestId('search-coach-more').click();
    await expect(text).not.toHaveClass(/clamped/);
  }
  await expect(page.getByTestId('search-coach-action').first()).toBeVisible();
  // « Continuer avec le Coach IA »: the full panel on the same question
  await page.getByTestId('search-coach-open').click();
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  const panel = page.getByTestId('coach-bubble-panel');
  await expect(panel.getByTestId('coach-answer')).not.toHaveClass(/placeholder/);
  await page.keyboard.press('Escape');
  await page.goto('/#/coach-ia');
  const items = page.getByTestId('coach-history').locator('li');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText('Comment corriger mon jab ?');
});

test('une action de la réponse ferme la recherche et ouvre l’écran', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await bar(page).getByTestId('app-search').click();
  await page.getByTestId('search-input').fill('Comment corriger mon jab ?');
  const first = page.getByTestId('search-coach-action').first();
  await expect(first).toBeVisible();
  const before = page.url();
  await first.click();
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  await expect.poll(() => page.url()).not.toBe(before);
});

test('✦ avec la barre vide ouvre le Coach IA en grand ; plus de gros bouton noir', async ({ page }) => {
  await seedProfile(page);
  await page.goto('/#/');
  await bar(page).getByTestId('app-search').click();
  await expect(page.getByTestId('search-ask')).toHaveCount(0);
  await expect(page.getByTestId('search-coach')).toHaveCount(0);
  await page.getByTestId('search-ai').click();
  await expect(page.getByTestId('search-sheet')).toHaveCount(0);
  await expect(page.getByTestId('coach-bubble-panel')).toBeVisible();
});
