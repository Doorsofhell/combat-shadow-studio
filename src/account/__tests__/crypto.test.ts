import { describe, expect, test } from 'vitest';
import { createStore, entries } from 'idb-keyval';
import { cryptoAvailable, deleteKey, isSealed, openText, sealText } from '../crypto';

describe('chiffrement des données sensibles (AES-GCM)', () => {
  test('chiffre, déchiffre, clé non extractible et propre à chaque utilisateur', async () => {
    expect(cryptoAvailable()).toBe(true);
    const box = await sealText('genou droit fragile', 'local');
    expect(isSealed(box)).toBe(true);
    expect(JSON.stringify(box)).not.toContain('genou');
    expect(await openText(box, 'local')).toBe('genou droit fragile');
    // two encryptions of the same text differ (random IV)
    expect((await sealText('genou droit fragile', 'local')).ct).not.toBe(box.ct);
    // another user's key cannot open it
    expect(await openText(box, 'fb-autre')).toBeNull();
    const keys = await entries(createStore('css-keys', 'keys'));
    const key = keys.find(([k]) => k === 'k:local')![1] as CryptoKey;
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toBeTruthy();
  });

  test('la suppression de la clé rend les anciennes données illisibles', async () => {
    const box = await sealText('épaule', 'fb-u1');
    await deleteKey('fb-u1');
    expect(await openText(box, 'fb-u1')).toBeNull();
  });

  test('un contenu altéré est refusé', async () => {
    const box = await sealText('cheville', 'local');
    const ct = atob(box.ct);
    const bad = { ...box, ct: btoa(String.fromCharCode(ct.charCodeAt(0) ^ 1) + ct.slice(1)) };
    expect(await openText(bad, 'local')).toBeNull();
  });
});
