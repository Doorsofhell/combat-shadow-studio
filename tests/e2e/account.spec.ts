import { expect, Page, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** every key/value of the app's IndexedDB (idb-keyval default store) */
async function idbDump(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(
    () =>
      new Promise<Record<string, unknown>>((resolve, reject) => {
        const req = indexedDB.open('keyval-store');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('keyval', 'readonly');
          const st = tx.objectStore('keyval');
          const out: Record<string, unknown> = {};
          const cur = st.openCursor();
          cur.onsuccess = () => {
            const c = cur.result;
            if (!c) return resolve(out);
            out[String(c.key)] = c.value;
            c.continue();
          };
        };
      }),
  );
}

async function onboard(page: Page, pseudo: string) {
  await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
  await page.getByTestId('pseudo').fill(pseudo);
  await page.getByTestId('next').click();
  await page.getByTestId('coach-homme').click();
  await page.getByTestId('next').click();
  for (let i = 0; i < 5; i++) await page.getByTestId('next').click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('home-cta')).toBeVisible();
}

test('compte : mode invité, profil modifié conservé, export, suppression des données', async ({ page }) => {
  // without a Firebase configuration only the guest path exists: no provider button at all
  await page.goto('/#/connexion');
  await expect(page.getByTestId('accounts-off')).toHaveText(/Les comptes en ligne ne sont pas activés/);
  await expect(page.getByRole('button', { name: /Google|Se connecter|Créer mon compte|Facebook|clé d’accès/i })).toHaveCount(0);
  await page.getByTestId('guest-continue').click();
  await onboard(page, 'Yan');

  // profile from the settings
  await page.getByTestId('open-settings').click();
  await page.getByRole('link', { name: /Mon profil et mon compte/ }).click();
  await expect(page.getByTestId('profile-name')).toHaveText('Yan');
  await expect(page.getByText('Les comptes en ligne ne sont pas activés dans cette version. Tout reste sur cet appareil.')).toBeVisible();
  await page.getByTestId('pseudo-input').fill('Yanis');
  await page.getByLabel('Prénom (facultatif)').fill('Yann');
  await page.getByLabel('Taille', { exact: true }).fill('180');
  await page.getByTestId('pf-goal-mobilite').click();
  await page.getByTestId('pf-disc-mma').click();
  await page.getByTestId('show-limitations').click();
  await page.getByLabel('Limitations ou blessures').fill('genou droit fragile');
  await expect(page.getByTestId('profile-name')).toHaveText('Yanis');
  await page.waitForTimeout(500);

  await page.reload();
  await expect(page.getByTestId('profile-name')).toHaveText('Yanis');
  await expect(page.getByLabel('Prénom (facultatif)')).toHaveValue('Yann');
  await expect(page.getByLabel('Taille', { exact: true })).toHaveValue('180');
  await expect(page.getByTestId('pf-goal-mobilite')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('pf-disc-mma')).toHaveAttribute('aria-pressed', 'true');
  // limitations hidden by default, then readable
  await expect(page.getByLabel('Limitations ou blessures')).toHaveCount(0);
  await page.getByTestId('show-limitations').click();
  await expect(page.getByLabel('Limitations ou blessures')).toHaveValue('genou droit fragile');

  // stored per user (guest scope) and the limitations are encrypted at rest
  const dump = await idbDump(page);
  expect(Object.keys(dump)).toContain('u:local:css-profile');
  expect(Object.keys(dump)).not.toContain('css-profile');
  const raw = String(dump['u:local:css-profile']);
  expect(raw).toContain('Yanis');
  expect(raw).not.toContain('genou');
  expect(raw).toContain('AES-GCM');

  // export of all my data
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-my-data').click()]);
  const json = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(json.app).toBe('combat-shadow-studio');
  expect(json.account).toEqual({ type: 'invite' });
  expect(json.profile.pseudo).toBe('Yanis');
  expect(json.profile.limitations).toBe('genou droit fragile');
  expect(json.fighters.fighters).toHaveLength(1);

  // delete my data
  await page.getByTestId('delete-my-data').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
  const after = await idbDump(page);
  const left = Object.entries(after).filter(([k]) => k.startsWith('u:local:'));
  for (const [, v] of left) expect(String(v)).not.toContain('Yanis');
  if (after['u:local:css-fighters']) expect(JSON.parse(String(after['u:local:css-fighters'])).state.fighters).toEqual([]);
});

/**
 * Real accounts against the Firebase emulators (skipped unless FIREBASE_E2E_URL is set): build with a demo
 * config + VITE_FIREBASE_AUTH_EMULATOR / VITE_FIREBASE_FIRESTORE_EMULATOR, serve it, start the emulators
 * (project demo-css), then run with FIREBASE_E2E_URL=http://localhost:<port>/. See docs/COMPTES.md.
 */
const FB = process.env.FIREBASE_E2E_URL;
const AUTH_EMU = 'http://127.0.0.1:9099';
const FS_EMU = 'http://127.0.0.1:8080';

test.describe(() => {
  test.skip(!FB, 'émulateurs Firebase non lancés');

  test('compte Firebase (émulateurs) : invité converti, vérification, synchronisation, déconnexion, suppression', async ({ page, request }) => {
    const email = `ana-${Date.now()}@example.com`;
    await page.goto(`${FB}#/connexion`);
    await expect(page.getByRole('tab', { name: 'Créer un compte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer avec Google' })).toBeVisible();
    await expect(page.getByTestId('accounts-off')).toHaveCount(0);
    await page.getByTestId('guest-continue').click();
    await onboard(page, 'Ana');

    // guest -> account, keeping the guest data
    await page.goto(`${FB}#/connexion`);
    await page.getByRole('tab', { name: 'Créer un compte' }).click();
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('court');
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await expect(page.getByRole('alert')).toContainText('8 caractères');
    await page.getByLabel('Mot de passe', { exact: true }).fill('motdepasse1');
    await expect(page.getByRole('checkbox')).toBeChecked();
    await page.getByRole('button', { name: 'Créer mon compte' }).click();
    await expect(page.getByTestId('profile-name')).toHaveText('Ana');
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText('E-mail à vérifier')).toBeVisible();
    const scope = String((await idbDump(page))['css-meta:current-scope']);
    expect(scope).toMatch(/^fb-/);
    const uid = scope.slice(3);

    // e-mail verification link "received" through the emulator
    const codes = (await (await request.get(`${AUTH_EMU}/emulator/v1/projects/demo-css/oobCodes`)).json()) as { oobCodes: { email: string; requestType: string; oobLink: string }[] };
    const link = codes.oobCodes.find((c) => c.email === email && c.requestType === 'VERIFY_EMAIL')!.oobLink;
    await request.get(link);
    await page.getByRole('button', { name: 'J’ai vérifié' }).click();
    await expect(page.getByText('E-mail à vérifier')).toHaveCount(0);

    // sync on: data in Firestore, without the limitations
    await page.getByTestId('show-limitations').click();
    await page.getByLabel('Limitations ou blessures').fill('épaule gauche');
    await page.getByRole('switch', { name: /Synchronisation en ligne/ }).check({ force: true });
    await expect(page.getByTestId('sync-status')).toContainText('À jour', { timeout: 20_000 });
    const docUrl = `${FS_EMU}/v1/projects/demo-css/databases/(default)/documents/users/${uid}/sync/profile`;
    const doc = await (await request.get(docUrl, { headers: { Authorization: 'Bearer owner' } })).text();
    expect(doc).toContain('Ana');
    expect(doc).not.toContain('épaule');

    // sign out: back to an empty guest; sign in again: the account's data is back
    await page.getByTestId('sign-out').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
    await page.goto(`${FB}#/connexion`);
    await page.getByLabel('Adresse e-mail').fill(email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('mauvais123');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('alert')).toHaveText('E-mail ou mot de passe incorrect.');
    await page.getByLabel('Mot de passe', { exact: true }).fill('motdepasse1');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByTestId('profile-name')).toHaveText('Ana');

    // delete the account: re-authentication, cloud copy and local data removed
    await page.getByTestId('delete-account').click();
    await page.getByLabel('Confirme avec ton mot de passe').fill('motdepasse1');
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByText('Entraîne-toi seul')).toBeVisible();
    expect((await request.get(docUrl, { headers: { Authorization: 'Bearer owner' } })).status()).toBe(404);
    const keys = Object.keys(await idbDump(page));
    expect(keys.filter((k) => k.startsWith(`u:${scope}:`))).toEqual([]);
    const accounts = (await (await request.post(`${AUTH_EMU}/identitytoolkit.googleapis.com/v1/projects/demo-css/accounts:query`, { headers: { Authorization: 'Bearer owner' }, data: {} })).json()) as { userInfo?: { email: string }[] };
    expect((accounts.userInfo ?? []).some((u) => u.email === email)).toBe(false);
  });

  test('mot de passe oublié (émulateurs) : message neutre', async ({ page }) => {
    await page.goto(`${FB}#/connexion`);
    await page.getByRole('button', { name: 'Mot de passe oublié ?' }).click();
    await page.getByLabel('Adresse e-mail').fill('personne@example.com');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Si un compte existe' })).toBeVisible();
  });
});
