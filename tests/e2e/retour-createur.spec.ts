import { expect, Page, test } from '@playwright/test';
import { bar, seedProfile, tapAction } from './nav-helpers';

/**
 * 2.3.5 (Youssef, 2026-11-20, P1 « Risque lié au bouton Retour Android »): the Back of the phone (Android button,
 * back gesture, installed app) and the browser's Back never leave the sequence editor with unsaved changes without
 * asking. Same rule as the session (1.42.0, « un Retour = un seul pas en arrière »): Back closes an open panel
 * first, then asks « Abandonner les modifications ? », a second Back closes the question and keeps the draft, only
 * « Abandonner » leaves. Before 2.3.5 the browser's Back (and the Android button, which calls history.back) left the
 * editor at once and the changes were lost.
 */
const OLD = { id: 'ancien', name: 'Mon un-deux', discipline: 'boxe', sequence: ['jab', 'direct'], createdAt: '2026-10-01T10:00:00.000Z' };

async function seed(page: Page, combos: object[]) {
  await seedProfile(page);
  await page.goto('/');
  await page.evaluate(
    (combos) =>
      new Promise<void>((res, rej) => {
        const r = indexedDB.open('keyval-store');
        r.onupgradeneeded = () => r.result.createObjectStore('keyval');
        r.onsuccess = () => {
          const tx = r.result.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put(JSON.stringify({ state: { combos }, version: 0 }), 'u:local:css-custom');
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
      }),
    combos,
  );
  await page.goto('about:blank');
}

const dialog = (page: Page) => page.getByRole('dialog').filter({ hasText: 'Abandonner les modifications ?' });
const moves = (page: Page) => page.getByTestId('builder-seq').locator('li');

/** the list, then the editor of « Mon un-deux », as a person reaches it: Back has somewhere to go */
async function openEditor(page: Page) {
  await seed(page, [OLD]);
  await page.goto('/#/createur');
  await expect(bar(page)).toHaveAttribute('data-screen', 'createur');
  await page.evaluate(() => (window.location.hash = '#/createur/ancien/modifier'));
  await expect(page.getByTestId('combo-editor')).toBeVisible();
  await expect(moves(page)).toHaveCount(2);
}

test('Retour avec des modifications : question, un deuxième Retour garde le brouillon, « Abandonner » sort sans rien enregistrer', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('button', { name: 'Retirer Direct' }).click();
  await expect(moves(page)).toHaveCount(1);
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(/#\/createur\/ancien\/modifier$/);
  await expect(moves(page)).toHaveCount(1);
  // a second Back closes the question: the draft stays as it is
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/createur\/ancien\/modifier$/);
  await expect(moves(page)).toHaveCount(1);
  // a third Back asks again; « Abandonner » goes back to the page the user came from, nothing is saved
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Abandonner' }).click();
  await expect(bar(page)).toHaveAttribute('data-screen', 'createur');
  await expect(page).toHaveURL(/#\/createur$/);
  await page.goto('/#/createur/ancien');
  await expect(page.getByTestId('combo-moves').locator('li')).toHaveCount(2);
});

test('Retour sans modification : on sort tout de suite, sans question', async ({ page }) => {
  await openEditor(page);
  await page.goBack();
  await expect(bar(page)).toHaveAttribute('data-screen', 'createur');
  await expect(page).toHaveURL(/#\/createur$/);
  await expect(dialog(page)).toHaveCount(0);
});

test('Retour avec le choix des mouvements ouvert : le panneau se ferme d’abord, puis la question', async ({ page }) => {
  await openEditor(page);
  await tapAction(page, 'add');
  await expect(page.getByTestId('move-picker')).toBeVisible();
  await page.getByTestId('add-crochet-avant').click();
  await page.goBack();
  await expect(page.getByTestId('move-picker')).toHaveCount(0);
  await expect(dialog(page)).toHaveCount(0);
  await expect(moves(page)).toHaveCount(3);
  await page.goBack();
  await expect(dialog(page)).toBeVisible();
  await page.getByTestId('confirm-cancel').click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/createur\/ancien\/modifier$/);
  await expect(moves(page)).toHaveCount(3);
});

test('après « Enregistrer », Retour revient à la liste sans repasser par l’éditeur ni poser de question', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('button', { name: 'Retirer Direct' }).click();
  await tapAction(page, 'save');
  await expect(page).toHaveURL(/#\/createur\/ancien$/);
  await expect(page.getByTestId('combo-moves').locator('li')).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/#\/createur$/);
  await expect(dialog(page)).toHaveCount(0);
});

test('la barre et les liens demandent toujours avant de quitter, et l’historique reste propre', async ({ page }) => {
  await openEditor(page);
  await page.getByRole('button', { name: 'Retirer Direct' }).click();
  await bar(page).getByTestId('nav-entrainer').click();
  await expect(dialog(page)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Abandonner' }).click();
  await expect(bar(page)).toHaveAttribute('data-screen', 'entrainer');
  // Back from there goes to the editor (a clean one now), never to a stale copy that would ask again
  await page.goBack();
  await expect(page).toHaveURL(/#\/createur\/ancien\/modifier$/);
  await expect(moves(page)).toHaveCount(2);
  await expect(dialog(page)).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/#\/createur$/);
});
