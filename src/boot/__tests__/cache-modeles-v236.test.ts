// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { bootFiles } from '../../../tools/build/bootModels';
import { FINGERPRINT_HEADER, MODEL_CACHE, OTHER_MODEL_FILES, SW_GLOBAL, VERSIONED_MODELS, modelCaching } from '../../../tools/build/swModeles';
import { FINGERPRINT_HEADER as PAGE_HEADER, MODEL_CACHE as PAGE_CACHE } from '../preload';

/**
 * 2.3.6 cache des modèles 3D (Youssef, 2026-11-20, P0): two rules matched coaches/ and salles/ and Workbox applies
 * only the first one (CacheFirst), so the NetworkFirst rule never ran for them and a copy the start screen did not
 * check stayed the old version. The rules no longer overlap, and the CacheFirst one checks the fingerprint.
 * The whole update, in a real browser with a second build: tests/e2e/maj-modeles-v236.spec.ts.
 */

const APP = 'https://doorsofhell.github.io/combat-shadow-studio/';
const sha12 = (b: Uint8Array) => createHash('sha1').update(b).digest('hex').slice(0, 12);

/** the plugin exactly as Workbox writes it into sw.js (text), read back as the service worker reads it */
function pluginAsInServiceWorker(fp: Record<string, string>) {
  const require = createRequire(import.meta.url);
  const { stringifyWithoutComments } = require('workbox-build/build/lib/stringify-without-comments.js') as { stringifyWithoutComments: (o: unknown) => string };
  const plugin = modelCaching(fp)[0].options!.plugins![0];
  return new Function(`return ${stringifyWithoutComments(plugin)};`)() as Record<string, (p: unknown) => Promise<unknown>>;
}

/** Cache Storage in memory (open / match / put / delete, caches.match with cacheName) */
function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const key = (r: Request | string) => (typeof r === 'string' ? r : r.url);
  const open = async (name: string) => {
    const m = stores.get(name) ?? new Map<string, Response>();
    stores.set(name, m);
    return {
      match: async (r: Request | string) => m.get(key(r))?.clone(),
      put: async (r: Request | string, res: Response) => void m.set(key(r), res),
      delete: async (r: Request | string) => m.delete(key(r)),
    };
  };
  const match = async (r: Request | string, o?: { cacheName?: string }) => (await open(o?.cacheName ?? MODEL_CACHE)).match(r);
  return { open, match, stores };
}

describe('2.3.6 : une seule règle de cache par fichier 3D', () => {
  const versioned = bootFiles();
  const others = ['coaches/nael/portrait.webp', 'coaches/inaya/tenues/arbitre.glb', 'coaches/mma-kadir/tenues/arbitre-boxe.glb', 'models/coach_male.glb', 'coaches/nael/photo.json', 'coaches/LICENSE-ROCKETBOX.txt'];

  it('chaque fichier de l’écran de démarrage prend la règle versionnée, et elle seule', () => {
    expect(versioned.length).toBeGreaterThan(40);
    for (const rel of versioned) {
      expect(VERSIONED_MODELS.test(APP + rel), rel).toBe(true);
      expect(VERSIONED_MODELS.test(`${APP + rel}?v=1`), rel).toBe(true);
      expect(OTHER_MODEL_FILES.test(APP + rel), rel).toBe(false);
    }
  });

  it('les autres fichiers de ces dossiers (portraits, tenues d’arbitre) prennent la règle réseau d’abord, et elle seule', () => {
    for (const rel of others) {
      expect(VERSIONED_MODELS.test(APP + rel), rel).toBe(false);
      expect(OTHER_MODEL_FILES.test(APP + rel), rel).toBe(true);
    }
    // ni le reste de l’application
    for (const rel of ['', 'index.html', 'assets/index-abc.js', 'thumbs/femme/direct.webp', 'icons/icon-192.png']) {
      expect(VERSIONED_MODELS.test(APP + rel), rel).toBe(false);
      expect(OTHER_MODEL_FILES.test(APP + rel), rel).toBe(false);
    }
  });

  it('l’ordre des deux règles ne change plus rien : aucun fichier ne correspond aux deux', () => {
    const caching = modelCaching({});
    expect(caching.map((r) => r.handler)).toEqual(['CacheFirst', 'NetworkFirst']);
    for (const rel of [...versioned, ...others]) {
      const hits = caching.filter((r) => (r.urlPattern as RegExp).test(APP + rel));
      expect(hits.length, rel).toBe(1);
    }
  });

  it('les deux règles demandent le serveur lui-même, pas la copie du navigateur (max-age de GitHub Pages)', async () => {
    const require = createRequire(import.meta.url);
    const { stringifyWithoutComments } = require('workbox-build/build/lib/stringify-without-comments.js') as { stringifyWithoutComments: (o: unknown) => string };
    for (const rule of modelCaching({})) {
      const plugin = new Function(`return ${stringifyWithoutComments(rule.options!.plugins!.at(-1))};`)() as { requestWillFetch: (p: unknown) => Promise<Request> };
      const r = await plugin.requestWillFetch({ request: new Request(`${APP}coaches/nael/portrait.webp`) });
      expect(r.cache, rule.handler as string).toBe('no-cache');
    }
    delete (globalThis as Record<string, unknown>)[SW_GLOBAL];
  });

  it('la page et le service worker parlent du même cache et de la même empreinte', () => {
    expect(PAGE_CACHE).toBe(MODEL_CACHE);
    expect(PAGE_HEADER).toBe(FINGERPRINT_HEADER);
  });
});

describe('2.3.6 : le service worker ne sert une copie gardée que si c’est celle de cette version', () => {
  const v1 = new Uint8Array([1, 2, 3, 4, 5]);
  const v2 = new Uint8Array([9, 8, 7, 6, 5, 4]);
  const rel = 'coaches/nael/photo.glb';
  const url = APP + rel;
  let c: ReturnType<typeof fakeCaches>;
  let plugin: Record<string, (p: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    c = fakeCaches();
    (globalThis as Record<string, unknown>).caches = c;
    delete (globalThis as Record<string, unknown>)[SW_GLOBAL];
    plugin = pluginAsInServiceWorker({ [rel]: sha12(v2) });
    // the service worker's scope (self.registration.scope in sw.js)
    await plugin.requestWillFetch({ request: new Request(url) });
    ((globalThis as Record<string, unknown>)[SW_GLOBAL] as { scope: string }).scope = APP;
  });
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).caches;
    delete (globalThis as Record<string, unknown>)[SW_GLOBAL];
  });

  const use = (cachedResponse: Response | undefined, u = url) => plugin.cachedResponseWillBeUsed({ request: new Request(u), cachedResponse }) as Promise<Response | null>;

  it('ce qui est gardé porte l’empreinte de ses octets (même calcul que le build)', async () => {
    const kept = (await plugin.cacheWillUpdate({ response: new Response(v2, { headers: { 'content-encoding': 'gzip', 'content-length': '3' } }) })) as Response;
    expect(kept.headers.get(FINGERPRINT_HEADER)).toBe(sha12(v2));
    expect(kept.headers.get('content-length')).toBe(String(v2.byteLength));
    expect(kept.headers.has('content-encoding')).toBe(false);
    expect(new Uint8Array(await kept.arrayBuffer())).toEqual(v2);
    // an error is never stamped (and not kept: CacheableResponsePlugin)
    const ko = new Response('x', { status: 404 });
    expect(await plugin.cacheWillUpdate({ response: ko })).toBe(ko);
  });

  it('copie de cette version : répond tout de suite, sans réseau', async () => {
    const r = new Response(v2, { headers: { [FINGERPRINT_HEADER]: sha12(v2) } });
    expect(await use(r)).toBe(r);
  });

  it('copie d’une autre version (le GLB a changé) : pas utilisée, le réseau est demandé', async () => {
    expect(await use(new Response(v1, { headers: { [FINGERPRINT_HEADER]: sha12(v1) } }))).toBeNull();
  });

  it('copie gardée avant 2.3.6 (sans empreinte) : ses octets décident, une seule fois', async () => {
    expect(await use(new Response(v1))).toBeNull();
    const ok = await use(new Response(v2));
    expect(ok?.headers.get(FINGERPRINT_HEADER)).toBe(sha12(v2));
    // re-kept with its fingerprint, so its bytes are not read again next time
    expect((await c.match(url))?.headers.get(FINGERPRINT_HEADER)).toBe(sha12(v2));
  });

  it('fichier que ce build ne connaît pas : le réseau est demandé', async () => {
    expect(await use(new Response(v2, { headers: { [FINGERPRINT_HEADER]: sha12(v2) } }), `${APP}coaches/inconnu/photo.glb`)).toBeNull();
  });

  it('le réseau est interrogé sans le cache HTTP du navigateur (max-age de GitHub Pages)', async () => {
    const r = (await plugin.requestWillFetch({ request: new Request(url) })) as Request;
    expect(r.cache).toBe('no-cache');
    expect(r.url).toBe(url);
  });

  it('hors ligne : la copie gardée répond, même d’une autre version, plutôt que pas de coach', async () => {
    await (await c.open(MODEL_CACHE)).put(url, new Response(v1));
    const r = (await plugin.handlerDidError({ request: new Request(url) })) as Response;
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(v1);
  });
});
