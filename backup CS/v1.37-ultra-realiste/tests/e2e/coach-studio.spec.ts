import { expect, Page, test } from '@playwright/test';
import { DEFAULT_PROFILE } from '../../src/store/profile';
import { defaultLook } from '../../src/editor/look';

/**
 * Fighter creator (/combattant): edits stay in a draft until "Enregistrer", fighters can be
 * created, duplicated, deleted and made active, and the screen never scrolls horizontally.
 */

/** writes the stores before the app starts (legacy keys and the guest scope, whichever the storage reads) */
async function seed(page: Page, fighters: { id: string; name: string; look: unknown }[], activeId: string) {
  // any same-origin page that does not run the app
  await page.goto('/icons/icon.svg');
  await page.evaluate(
    async ({ profile, fighters, activeId }) => {
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
      for (const pre of ['', 'u:local:']) {
        await put(`${pre}css-profile`, { state: { profile }, version: 0 });
        await put(`${pre}css-fighters`, {
          state: {
            fighters: fighters.map((f) => ({
              ...f,
              createdAt: '',
              updatedAt: '',
            })),
            activeId,
          },
          version: 0,
        });
      }
    },
    {
      profile: { ...DEFAULT_PROFILE, completed: true, coach: 'homme' },
      fighters,
      activeId,
    },
  );
}

async function openStudio(page: Page) {
  await page.goto('about:blank');
  await page.goto('/#/combattant');
  await expect(page.getByTestId('editor-panel')).toBeVisible();
}

/** stored fighters state (the scoped key when the storage namespaces keys) */
const stored = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{
        activeId: string;
        fighters: { name: string; look: { body: { mass: number } } }[];
      } | null>((res) => {
        const r = indexedDB.open('keyval-store');
        r.onsuccess = () => {
          const found: Record<string, string> = {};
          const c = r.result.transaction('keyval').objectStore('keyval').openCursor();
          c.onsuccess = () => {
            const cur = c.result;
            if (cur) {
              if (String(cur.key).endsWith('css-fighters')) found[String(cur.key)] = cur.value as string;
              cur.continue();
              return;
            }
            const raw = found['u:local:css-fighters'] ?? found['css-fighters'];
            res(raw ? JSON.parse(raw).state : null);
          };
        };
      }),
  );

const cards = (page: Page) => page.getByTestId('fighter-card');

test('modifier un curseur et une couleur, enregistrer, recharger : les valeurs sont conservées', async ({ page }) => {
  await seed(page, [{ id: 'f1', name: 'Test', look: defaultLook('homme') }], 'f1');
  await openStudio(page);

  await page.getByTestId('tab-corps').click();
  await expect(page.getByTestId('value-body-mass')).toHaveText('0');
  await page.getByTestId('slider-body-mass').fill('0.4');
  await expect(page.getByTestId('value-body-mass')).toHaveText('+40');

  await page.getByTestId('tab-peau').click();
  await page.getByTestId('skin-custom').fill('#123456');

  // nothing is saved yet: cancel brings the saved look back
  await expect(page.getByTestId('save-fighter')).toBeVisible();
  await page.getByTestId('cancel-edits').click();
  await expect(page.getByTestId('save-fighter')).toHaveCount(0);
  await page.getByTestId('tab-corps').click();
  await expect(page.getByTestId('value-body-mass')).toHaveText('0');

  // edit again and save
  await page.getByTestId('slider-body-mass').fill('0.4');
  await page.getByTestId('tab-peau').click();
  await page.getByTestId('skin-custom').fill('#123456');
  await page.getByTestId('save-fighter').click();
  await expect(page.getByTestId('save-fighter')).toHaveCount(0);
  // the store writes to IndexedDB asynchronously
  await expect.poll(async () => (await stored(page))?.fighters[0].look.body.mass).toBe(0.4);

  await page.reload();
  await expect(page.getByTestId('editor-panel')).toBeVisible();
  await page.getByTestId('tab-corps').click();
  await expect(page.getByTestId('value-body-mass')).toHaveText('+40');
  await page.getByTestId('tab-peau').click();
  await expect(page.getByTestId('skin-custom')).toHaveValue('#123456');
  // nothing is pending after a reload of a saved look
  await expect(page.getByTestId('save-fighter')).toHaveCount(0);
});

test('un ancien enregistrement incomplet s’ouvre sans erreur', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(
    page,
    [
      {
        id: 'old',
        name: 'Ancien',
        look: {
          sex: 'femme',
          body: { mass: 0.3 },
          hair: { style: 'iroquoise' },
          tattoos: [{ design: 'inconnu' }],
        },
      },
    ],
    'old',
  );
  await openStudio(page);
  await page.getByTestId('tab-corps').click();
  await expect(page.getByTestId('value-body-mass')).toHaveText('+30');
  await page.getByTestId('tab-cheveux').click();
  await expect(page.getByTestId('hair-chignon')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('tab-tatouages').click();
  await expect(page.getByTestId('tattoo-item')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('créer, dupliquer, supprimer un combattant, définir le combattant actif', async ({ page }) => {
  await seed(page, [{ id: 'f1', name: 'Premier', look: defaultLook('homme') }], 'f1');
  await openStudio(page);
  await expect(cards(page)).toHaveCount(1);
  // the only fighter cannot be deleted
  await expect(page.getByTestId('delete-fighter')).toBeDisabled();

  // new (woman): it is edited, the active fighter does not change
  await page.getByTestId('new-fighter').click();
  await page.getByTestId('new-femme').click();
  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByTestId('editing-name')).toHaveText('Ma combattante');
  await expect(page.getByTestId('set-active')).toBeVisible();

  // rename + save, then duplicate
  await page.getByTestId('fighter-name-input').fill('Nina');
  await page.getByTestId('save-fighter').click();
  await page.getByTestId('duplicate-fighter').click();
  await expect(cards(page)).toHaveCount(3);
  await expect(page.getByTestId('editing-name')).toHaveText('Nina (copie)');

  // delete the copy (confirm dialog)
  await page.getByTestId('delete-fighter').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByText('Nina (copie)')).toHaveCount(0);

  // make Nina the active fighter
  await cards(page).filter({ hasText: 'Nina' }).click();
  await expect(page.getByTestId('editing-name')).toHaveText('Nina');
  await page.getByTestId('set-active').click();
  await expect(page.getByTestId('active-badge')).toBeVisible();
  await expect(cards(page).filter({ hasText: 'Nina' })).toContainText('Actif');

  // persisted (the store writes to IndexedDB asynchronously)
  await expect
    .poll(async () => {
      const st = await stored(page);
      return st?.fighters.find((f) => f.name === 'Nina') && st.fighters.length === 2 && st.fighters.find((f) => (f as { id?: string }).id === st.activeId)?.name;
    })
    .toBe('Nina');
  await page.reload();
  await expect(page.getByTestId('editor-panel')).toBeVisible();
  await expect(cards(page)).toHaveCount(2);
  await expect(page.getByTestId('editing-name')).toHaveText('Nina');
  await expect(page.getByTestId('active-badge')).toBeVisible();
});

test('modifications non enregistrées : confirmation avant de quitter par la navigation', async ({ page }) => {
  await seed(page, [{ id: 'f1', name: 'Test', look: defaultLook('homme') }], 'f1');
  await openStudio(page);
  await page.getByTestId('tab-corps').click();
  await page.getByTestId('slider-body-mass').fill('0.5');
  await page.getByTestId('nav-stats').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler' }).click();
  await expect(page).toHaveURL(/#\/combattant/);
  await expect(page.getByTestId('value-body-mass')).toHaveText('+50');
  await page.getByTestId('nav-stats').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Continuer sans enregistrer' }).click();
  await expect(page).toHaveURL(/#\/stats/);
});

for (const size of [
  { width: 360, height: 740 },
  { width: 800, height: 400 },
]) {
  test(`pas de défilement horizontal, aperçu toujours visible (${size.width}x${size.height})`, async ({ page }) => {
    await page.setViewportSize(size);
    await seed(
      page,
      [
        {
          id: 'f1',
          name: 'Un nom de combattant vraiment très long pour tester',
          look: defaultLook('femme'),
        },
      ],
      'f1',
    );
    await openStudio(page);
    for (const tab of ['combattant', 'corps', 'visage', 'peau', 'cheveux', 'tatouages', 'tenue', 'equipement']) {
      await page.getByTestId(`tab-${tab}`).click();
      // scroll the panel to its end: the preview must stay on screen
      await page.getByTestId('editor-panel').evaluate((e) => (e.scrollTop = e.scrollHeight));
      const r = await page.evaluate(() => {
        const se = document.scrollingElement!;
        const p = document.querySelector('.cs-preview')!.getBoundingClientRect();
        const wide = [...document.querySelectorAll('.cs-root *')].filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1) && !e.closest('.utabs');
        });
        return {
          sx: se.scrollWidth - innerWidth,
          previewTop: p.top,
          previewBottom: p.bottom,
          previewH: p.height,
          wide: wide.map((e) => e.className).slice(0, 5),
        };
      });
      expect(r.sx, tab).toBeLessThanOrEqual(0);
      expect(r.wide, tab).toEqual([]);
      expect(r.previewTop, tab).toBeGreaterThanOrEqual(-1);
      expect(r.previewH, tab).toBeGreaterThan(150);
    }
  });
}
