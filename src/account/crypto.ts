import { createStore, del, get, set } from 'idb-keyval';

/**
 * Encryption at rest of sensitive fields (physical limitations) with WebCrypto AES-GCM 256.
 *
 * One key per user scope, generated on the device with `extractable: false` and kept in a separate
 * IndexedDB database. The browser never hands out the raw key bytes: a copy of the app's data files
 * (backup, file inspection, export of the other databases) only contains ciphertext.
 * Limits: code running inside the app can still ask the browser to decrypt, and anyone who can
 * use the unlocked device inside the app sees the data. This is protection at rest, not a vault.
 */
export interface SealedText {
  alg: 'AES-GCM';
  v: 1;
  iv: string;
  ct: string;
}

const keyStore = () => createStore('css-keys', 'keys');
const cache = new Map<string, Promise<CryptoKey>>();

export const cryptoAvailable = () => typeof crypto !== 'undefined' && !!crypto.subtle && typeof indexedDB !== 'undefined';

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function getKey(scope: string) {
  let p = cache.get(scope);
  if (!p) {
    p = (async () => {
      const store = keyStore();
      const id = `k:${scope}`;
      const existing = await get<CryptoKey>(id, store);
      if (existing) return existing;
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      await set(id, key, store);
      return key;
    })();
    cache.set(scope, p);
    p.catch(() => cache.delete(scope));
  }
  return p;
}

export async function sealText(plain: string, scope: string): Promise<SealedText> {
  const key = await getKey(scope);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)));
  return { alg: 'AES-GCM', v: 1, iv: b64(iv), ct: b64(ct) };
}

/** null when the key is gone (data deleted) or the box was altered */
export async function openText(box: SealedText, scope: string): Promise<string | null> {
  try {
    const key = await getKey(scope);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

export const isSealed = (x: unknown): x is SealedText => !!x && typeof x === 'object' && (x as SealedText).alg === 'AES-GCM' && typeof (x as SealedText).ct === 'string';

/** "Supprimer mes données": the key goes too, so any leftover ciphertext becomes unreadable */
export async function deleteKey(scope: string) {
  cache.delete(scope);
  try {
    await del(`k:${scope}`, keyStore());
  } catch {
    // no IndexedDB: nothing was stored
  }
}
