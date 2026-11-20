import type { RuntimeCaching } from 'workbox-build';

/**
 * 2.3.6 cache des modèles 3D (Youssef, 2026-11-20, P0 « Stratégies de cache 3D potentiellement contradictoires »).
 *
 * Constat (v2.3.2): vite.config.ts declared two rules for the same files. Workbox answers a request with the FIRST
 * route that matches, so every file of coaches/ and salles/ took the CacheFirst rule and the NetworkFirst rule written
 * after it never applied to them (only to the referee outfits). A model changed by an update was then replaced only if
 * the start screen saw it (fingerprint check, 1.34); a copy it did not check (« Entrer sans attendre », a boot cut
 * short, a coach portrait) stayed the old one for good.
 *
 * Who does what now:
 * - the precache (Workbox, globPatterns) keeps only the app itself (code, pages, small pictures); never the 3D;
 * - both rules ask the server itself (no-cache: a short « not modified » when nothing changed), never the browser's
 *   own copy, which GitHub Pages keeps 10 min (max-age=600);
 * - the PWA cache « css-modeles » keeps the 3D on first use, with two rules that never match the same file:
 *   A. the files the start screen downloads (bootFiles: coaches' models and outfits, rooms): CacheFirst, answered
 *      at once from the phone, but ONLY while the copy kept is the one of this version (its fingerprint, below);
 *      another copy is fetched again from the network (the old one answers only offline);
 *   B. the other files of these folders (portraits, referee outfits): NetworkFirst, the kept copy after 4 s or offline;
 * - the versioning: each file of rule A has a fingerprint computed when the app is built (tools/build/bootModels.ts,
 *   SHA-1 of the bytes served), written into the service worker AND into the start screen (virtual:boot-assets).
 *
 * The functions below are written into sw.js as text by Workbox (stringify-object): they use only their arguments,
 * `this` (the plugin object, which carries the fingerprints) and the globals of a service worker.
 */

export const MODEL_CACHE = 'css-modeles';
/** header added to a copy kept by rule A: the fingerprint of its bytes */
export const FINGERPRINT_HEADER = 'x-css-empreinte';

/** rule A: exactly the files of bootFiles() (tools/build/bootModels.ts), anywhere under the app's folder */
export const VERSIONED_MODELS = /\/(?:coaches\/[^/?#]+\/(?:photo|photo-clean)\.glb|coaches\/[^/?#]+\/tenues\/(?!arbitre)[^/?#]+\.glb|salles\/[^/?#]+\/[^/?#]+)(?:\?[^#]*)?$/;
/** rule B: the rest of coaches/, salles/ and models/ (never a file of rule A, so their order no longer matters) */
export const OTHER_MODEL_FILES = new RegExp(`^(?!.*${VERSIONED_MODELS.source}).*\\/(?:coaches|models|salles)\\/`);

/** what the functions of the plugin read on `this` */
interface VersionPlugin {
  empreintes: Record<string, string>;
  cacheName: string;
  header: string;
  /** the app's folder; the service worker's scope when not set (set by the tests) */
  scope?: string;
  rel(url: string): string;
  hash(buf: ArrayBuffer): Promise<string>;
  stamp(buf: ArrayBuffer, r: Response, v: string): Response;
}

/** the tools of the callbacks below (on `this`) */
const helpers = {
  /** the path of a request from the app's folder (scope), without query: coaches/nael/photo.glb */
  rel: function (this: VersionPlugin, url: string) {
    const u = new URL(url);
    const scope = this.scope || (typeof self !== 'undefined' && (self as unknown as { registration?: { scope: string } }).registration?.scope) || new URL('./', u.href).href;
    const href = u.origin + u.pathname;
    return href.startsWith(scope) ? href.slice(scope.length) : u.pathname.replace(/^\//, '');
  },
  /** the fingerprint of bytes: 12 hex of SHA-1, as bootModels.ts */
  hash: async function (buf: ArrayBuffer) {
    const d = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
    let h = '';
    for (let i = 0; i < 6; i++) h += d[i].toString(16).padStart(2, '0');
    return h;
  },
  /** the same response, carrying its fingerprint (and its true size: a server that compresses announces another) */
  stamp: function (this: VersionPlugin, buf: ArrayBuffer, r: Response, v: string) {
    const headers = new Headers(r.headers);
    headers.set(this.header, v);
    headers.set('content-length', String(buf.byteLength));
    headers.delete('content-encoding');
    return new Response(buf, {
      status: r.status,
      statusText: r.statusText,
      headers,
    });
  },
};

const callbacks = {
  /** a model changed by an update is asked to the server again, never to the browser's own cache (max-age) */
  requestWillFetch: async function ({ request }: { request: Request }) {
    return new Request(request, { cache: 'no-cache' });
  },
  /** what is kept carries the fingerprint of its bytes */
  cacheWillUpdate: async function (this: VersionPlugin, { response }: { response: Response }) {
    if (!response || response.status !== 200) return response;
    const buf = await response.clone().arrayBuffer();
    return this.stamp(buf, response, await this.hash(buf));
  },
  /** the kept copy answers only when it is this version's; otherwise the network is asked (rule A then keeps it) */
  cachedResponseWillBeUsed: async function (this: VersionPlugin, { request, cachedResponse }: { request: Request; cachedResponse?: Response | null }) {
    if (!cachedResponse) return null;
    const want = this.empreintes[this.rel(request.url)];
    if (!want) return null;
    const have = cachedResponse.headers.get(this.header);
    if (have) return have === want ? cachedResponse : null;
    // a copy kept before 2.3.6 (or by the start screen on the very first launch): its bytes decide, once
    const buf = await cachedResponse.clone().arrayBuffer();
    const v = await this.hash(buf);
    if (v !== want) return null;
    const stamped = this.stamp(buf, cachedResponse, v);
    try {
      await (await caches.open(this.cacheName)).put(request, stamped.clone());
    } catch {
      /* full storage: checked again next time */
    }
    return stamped;
  },
  /** offline (or a server error): the copy kept, even of another version, rather than no coach at all */
  handlerDidError: async function (this: VersionPlugin, { request }: { request: Request }) {
    return (await caches.match(request, { cacheName: this.cacheName })) ?? undefined;
  },
};

/** the global of the service worker where the callbacks keep their `this` (built once per service worker) */
export const SW_GLOBAL = '__cssModeles';

/**
 * The plugin of rule A: the copy kept on the phone is used only when it is this version's. Workbox writes the plugin
 * into sw.js as text and accepts only its callbacks, so each callback carries the fingerprints of this build in its
 * own source and finds its `this` (fingerprints and helpers) on the service worker's global.
 */
export function modelVersionPlugin(fingerprints: Record<string, string>) {
  const ctx = `{empreintes:${JSON.stringify(fingerprints)},cacheName:${JSON.stringify(MODEL_CACHE)},header:${JSON.stringify(FINGERPRINT_HEADER)},${Object.entries(helpers)
    .map(([k, f]) => `${k}:${f.toString()}`)
    .join(',')}}`;
  const out: Record<string, (p: unknown) => Promise<unknown>> = {};
  for (const [k, f] of Object.entries(callbacks)) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    out[k] = new Function('p', `const ctx = globalThis.${SW_GLOBAL} || (globalThis.${SW_GLOBAL} = ${ctx});\nreturn (${f.toString()}).call(ctx, p);`) as (p: unknown) => Promise<unknown>;
  }
  return out;
}

/** the runtime caching of the service worker (vite.config.ts), with the fingerprints of this build */
export function modelCaching(fingerprints: Record<string, string>): RuntimeCaching[] {
  return [
    {
      urlPattern: VERSIONED_MODELS,
      handler: 'CacheFirst',
      options: {
        cacheName: MODEL_CACHE,
        expiration: { maxEntries: 600, purgeOnQuotaError: true },
        cacheableResponse: { statuses: [200] },
        plugins: [modelVersionPlugin(fingerprints) as never],
      },
    },
    {
      urlPattern: OTHER_MODEL_FILES,
      handler: 'NetworkFirst',
      options: {
        cacheName: MODEL_CACHE,
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 600, purgeOnQuotaError: true },
        cacheableResponse: { statuses: [0, 200] },
        // « network first » means the server, not the browser's own copy (GitHub Pages: max-age=600, 10 min old)
        plugins: [{ requestWillFetch: callbacks.requestWillFetch } as never],
      },
    },
  ];
}
