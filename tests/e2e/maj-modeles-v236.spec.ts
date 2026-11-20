import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { championFor } from '../../src/domain/coaches/catalog';
import { seedProfile } from './nav-helpers';

/**
 * 2.3.6 cache des modèles 3D (Youssef, 2026-11-20, P0 « tester une mise à jour de GLB sans effacer manuellement le
 * cache »). Two real builds of the app: the one under test (dist/, version 1) and a second one built here from a copy
 * of public/ where the coach's model and portrait changed (version 2). A server like GitHub Pages (max-age=600, ETag)
 * serves version 1, then version 2, to the same browser: the cache of the phone is never emptied by hand.
 *
 * Expected: after the update the coach kept on the phone is the new one, and the service worker never answers with
 * the old copy, even one the start screen did not check (« Entrer sans attendre », a boot cut short). Before 2.3.6 the
 * CacheFirst rule answered with whatever copy it had (the NetworkFirst rule written after it never applied).
 */

const PORT = 4191;
const BASE = `http://localhost:${PORT}`;
const COACH = championFor('femme').id;
const MODEL = `coaches/${COACH}/photo.glb`;
const PORTRAIT = `coaches/${COACH}/portrait.webp`;
const sha12 = (b: Uint8Array) => createHash('sha1').update(b).digest('hex').slice(0, 12);

/** the same GLB with one more piece of data in its first scene: valid, other bytes (other fingerprint) */
function changedGlb(src: Buffer): Buffer {
  const jsonLen = src.readUInt32LE(12);
  const json = JSON.parse(src.subarray(20, 20 + jsonLen).toString('utf8'));
  json.scenes[0].extras = { ...(json.scenes[0].extras ?? {}), miseAJourTest: '2.3.6' };
  let text = Buffer.from(JSON.stringify(json), 'utf8');
  const pad = (4 - (text.length % 4)) % 4;
  text = Buffer.concat([text, Buffer.alloc(pad, 0x20)]);
  const rest = src.subarray(20 + jsonLen);
  const head = Buffer.alloc(20);
  head.write('glTF', 0, 'ascii');
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(20 + text.length + rest.length, 8);
  head.writeUInt32LE(text.length, 12);
  head.write('JSON', 16, 'ascii');
  return Buffer.concat([head, text, rest]);
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

/** a static server like GitHub Pages: max-age=600 and an ETag on every file; its folder can be switched */
function pagesServer(root: { dir: string }): Promise<Server> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', BASE).pathname);
    let file = resolve(root.dir, `.${path}`);
    if (!file.startsWith(resolve(root.dir))) return void res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return void res.writeHead(404).end();
    const body = readFileSync(file);
    const etag = `"${createHash('md5').update(body).digest('hex')}"`;
    const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'max-age=600', etag };
    if (req.headers['if-none-match'] === etag) return void res.writeHead(304, headers).end();
    res.writeHead(200, { ...headers, 'content-length': body.byteLength });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise((ok) => server.listen(PORT, () => ok(server)));
}

/** the fingerprint of what the service worker answers for a file (the page asks as the 3D loader does) */
const served = (page: Page, rel: string) =>
  page.evaluate(async (rel) => {
    const b = await (await fetch(`./${rel}`)).arrayBuffer();
    const d = new Uint8Array(await crypto.subtle.digest('SHA-1', b));
    return { v: [...d.slice(0, 6)].map((x) => x.toString(16).padStart(2, '0')).join(''), bytes: b.byteLength };
  }, rel);

/** the copy kept on the phone (cache css-modeles): fingerprint of its bytes and the one it carries */
const kept = (page: Page, rel: string) =>
  page.evaluate(async (rel) => {
    const r = await (await caches.open('css-modeles')).match(new URL(`./${rel}`, location.href).href);
    if (!r) return null;
    const b = await r.clone().arrayBuffer();
    const d = new Uint8Array(await crypto.subtle.digest('SHA-1', b));
    return { v: [...d.slice(0, 6)].map((x) => x.toString(16).padStart(2, '0')).join(''), stamp: r.headers.get('x-css-empreinte') };
  }, rel);

/** puts a copy kept aside back in place of the file, as an older version left it (with or without its stamp) */
const putBack = (page: Page, rel: string, stamped: boolean) =>
  page.evaluate(
    async ({ rel, stamped }) => {
      const old = (await (await caches.open('test-ancienne-version')).match(new URL(`./${rel}`, location.href).href))!;
      const headers = new Headers(old.headers);
      if (!stamped) headers.delete('x-css-empreinte');
      await (await caches.open('css-modeles')).put(new URL(`./${rel}`, location.href).href, new Response(await old.arrayBuffer(), { headers }));
    },
    { rel, stamped },
  );

test.describe('2.3.6 : mise à jour d’un GLB sans vider le cache', () => {
  test.use({ baseURL: BASE });
  test.setTimeout(420_000);

  const root = { dir: resolve('dist') };
  let server: Server;
  let work = '';
  let v2 = '';

  test.beforeAll(async () => {
    test.setTimeout(420_000);
    expect(existsSync('dist/sw.js'), 'dist/ construit par le serveur des tests (npm run build)').toBe(true);
    // version 2: the same app built from a copy of public/ where the coach's model and portrait changed
    work = mkdtempSync(join(tmpdir(), 'css-maj-modeles-'));
    cpSync('public', join(work, 'public'), { recursive: true });
    writeFileSync(join(work, 'public', MODEL), changedGlb(readFileSync(join('public', MODEL))));
    writeFileSync(join(work, 'public', PORTRAIT), Buffer.concat([readFileSync(join('public', PORTRAIT)), Buffer.alloc(64)]));
    v2 = join(work, 'dist');
    execFileSync('npx', ['vite', 'build', '--outDir', v2, '--emptyOutDir', '--logLevel', 'warn'], { env: { ...process.env, CSS_PUBLIC_DIR: join(work, 'public') }, stdio: 'inherit' });
    server = await pagesServer(root);
  });

  test.afterAll(async () => {
    await new Promise((ok) => server?.close(ok));
    if (work) rmSync(work, { recursive: true, force: true });
  });

  test('le coach gardé est remplacé par la nouvelle version, et l’ancienne copie n’est plus jamais servie', async ({ page }) => {
    const h1 = sha12(readFileSync(join('dist', MODEL)));
    const h2 = sha12(readFileSync(join(v2, MODEL)));
    expect(h2, 'la version 2 a bien un autre modèle').not.toBe(h1);
    // the chunk of version 2 that carries the new fingerprint: the page runs version 2 once it has loaded it
    const v2Chunk = readdirSync(join(v2, 'assets')).find((f) => f.endsWith('.js') && readFileSync(join(v2, 'assets', f), 'utf8').includes(h2))!;
    expect(v2Chunk).toBeTruthy();
    expect(readFileSync(join(v2, 'sw.js'), 'utf8')).toContain(h2);

    // ── version 1: first launch, then a launch with the service worker in charge
    root.dir = resolve('dist');
    await seedProfile(page);
    await page.goto('/#/');
    await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 180_000 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 180_000 });
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    expect((await served(page, MODEL)).v).toBe(h1);
    expect(await kept(page, MODEL)).toEqual({ v: h1, stamp: h1 });
    const portrait1 = (await served(page, PORTRAIT)).bytes;
    // the version 1 copy, kept aside to play the old copy later
    await page.evaluate(async (rel) => {
      const u = new URL(`./${rel}`, location.href).href;
      await (await caches.open('test-ancienne-version')).put(u, (await (await caches.open('css-modeles')).match(u))!);
    }, MODEL);

    // ── version 2 is deployed: same browser, same cache, nothing emptied
    root.dir = v2;
    await expect
      .poll(
        async () => {
          // what the phone's browser does when the app is opened: it asks the server whether sw.js changed (the
          // headless browser of the tests does not always do it on a reload, so it is asked here the same way)
          await page.evaluate(async () => {
            const r = await navigator.serviceWorker.getRegistration();
            await r?.update().catch(() => undefined);
          });
          await page.reload();
          await page.waitForLoadState('load');
          return page.evaluate((chunk) => performance.getEntriesByType('resource').some((e) => e.name.endsWith(`/assets/${chunk}`)), v2Chunk);
        },
        { timeout: 120_000, intervals: [1_000, 2_000, 5_000] },
      )
      .toBe(true);
    await expect(page.getByTestId('bottom-bar')).toBeVisible({ timeout: 180_000 });

    // 1. the start screen and the service worker replaced the coach: the copy kept is version 2
    await expect.poll(() => kept(page, MODEL), { timeout: 60_000 }).toEqual({ v: h2, stamp: h2 });
    expect((await served(page, MODEL)).v).toBe(h2);

    // 2. an old copy the start screen did not check (« Entrer sans attendre »): the service worker does not serve it
    await putBack(page, MODEL, true);
    expect(await kept(page, MODEL)).toEqual({ v: h1, stamp: h1 });
    expect((await served(page, MODEL)).v).toBe(h2);
    expect(await kept(page, MODEL)).toEqual({ v: h2, stamp: h2 });

    // 3. the same, kept by a version before 2.3.6 (no fingerprint on it): its bytes decide
    await putBack(page, MODEL, false);
    expect((await kept(page, MODEL))?.stamp).toBeNull();
    expect((await served(page, MODEL)).v).toBe(h2);
    expect(await kept(page, MODEL)).toEqual({ v: h2, stamp: h2 });

    // 4. the coach's portrait (not on the start screen) comes from the network first: the new one
    expect((await served(page, PORTRAIT)).bytes).toBe(portrait1 + 64);
  });
});
