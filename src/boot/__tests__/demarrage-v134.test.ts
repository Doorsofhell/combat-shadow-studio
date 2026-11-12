import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ASSETS from 'virtual:boot-assets';
import { bootPlan, isKept, noteKept, runBoot, type BootItem } from '../preload';
import { bootFiles, compressModel } from '../../../tools/build/bootModels';

/**
 * 1.34 démarrage rapide (Youssef, 2026-11-11: « Pourquoi le démarrage est devenu si lent ? »; « toute la 3D des coachs
 * et des salles chargée au démarrage »). Measured on 1.31: a server that compresses on the fly announces no size, the
 * start screen then threw away and downloaded again 90 Mo of coaches at every launch. Files are now known by a
 * fingerprint, and the models are compressed without any loss when the app is built.
 */

/** a Cache Storage of the browser, in memory */
function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const open = async (name: string) => {
    const m = stores.get(name) ?? new Map<string, Response>();
    stores.set(name, m);
    return {
      match: async (u: string) => m.get(u)?.clone(),
      put: async (u: string, r: Response) => void m.set(u, r),
      delete: async (u: string) => m.delete(u),
    };
  };
  return { open, stores };
}

const item = (url: string, bytes: number, v?: string): BootItem => ({ url, bytes, v, step: 'coach' });
const abs = (u: string) => new URL(u, location.href).href;

describe('1.34 : un fichier gardé sur le téléphone est reconnu par son empreinte', () => {
  let c: ReturnType<typeof fakeCaches>;
  beforeEach(() => {
    c = fakeCaches();
    (globalThis as { caches?: unknown }).caches = { open: c.open };
    localStorage.clear();
  });
  afterEach(() => {
    delete (globalThis as { caches?: unknown }).caches;
  });

  it('serveur qui compresse (aucune taille annoncée) : le coach gardé n’est plus retéléchargé à chaque ouverture', async () => {
    const x = item('./coaches/nael/photo.glb', 2000, 'abc123');
    // first launch: downloaded whole, kept by the service worker as the server sent it (no Content-Length)
    await (await c.open('css-modeles')).put(abs(x.url), new Response(new Uint8Array(2000)));
    noteKept(x);
    // next launches: recognised, nothing to download
    expect(await isKept(x)).toBe(true);
    expect(await isKept(x)).toBe(true);
    const asked: string[] = [];
    await runBoot([x], () => undefined, { fetch: async (u) => (asked.push(u), new Response('')), cached: (y) => isKept(y) });
    expect(asked).toEqual([]);
  });

  it('une mise à jour du modèle (autre empreinte) : l’ancien est retiré et retéléchargé sur l’écran de démarrage', async () => {
    const old = item('./coaches/nael/photo.glb', 2000, 'ancien');
    await (await c.open('css-modeles')).put(abs(old.url), new Response(new Uint8Array(2000), { headers: { 'content-length': '2000' } }));
    noteKept(old);
    const now = item('./coaches/nael/photo.glb', 2000, 'nouveau');
    expect(await isKept(now)).toBe(false);
    expect(await (await c.open('css-modeles')).match(abs(now.url))).toBeUndefined();
  });

  it('un fichier gardé par une version d’avant 1.34 : la taille annoncée décide, comme avant, puis l’empreinte est notée', async () => {
    const x = item('./salles/boxe/fond-2k.webp', 14790, 'v1');
    await (await c.open('css-modeles')).put(abs(x.url), new Response(new Uint8Array(14790), { headers: { 'content-length': '14790' } }));
    expect(await isKept(x)).toBe(true);
    expect(JSON.parse(localStorage.getItem('css-modeles-versions')!)[abs(x.url)]).toBe('v1');
    // kept by an older version at another size: downloaded again
    const y = item('./salles/boxe/profondeur.png', 500, 'v1');
    await (await c.open('css-modeles')).put(abs(y.url), new Response(new Uint8Array(400), { headers: { 'content-length': '400' } }));
    expect(await isKept(y)).toBe(false);
  });

  it('l’empreinte n’est notée que pour un fichier reçu en entier', async () => {
    const ok = item('ok', 100, 'v-ok');
    const ko = item('ko', 100, 'v-ko');
    await runBoot([ok, ko], () => undefined, {
      fetch: async (u) => {
        if (u === 'ko') throw new TypeError('offline');
        return new Response(new Uint8Array(100));
      },
      received: noteKept,
    });
    const noted = JSON.parse(localStorage.getItem('css-modeles-versions')!);
    expect(noted[abs('ok')]).toBe('v-ok');
    expect(noted[abs('ko')]).toBeUndefined();
  });

  it('chaque fichier du plan porte l’empreinte de ce qui est servi', () => {
    const plan = bootPlan({ coachId: 'nael', coaches: ['inaya'], outfits: true, bjjOutfit: 'gi', rooms: true, sharpRooms: true });
    expect(plan.length).toBeGreaterThan(30);
    for (const x of plan) expect(x.v, x.url).toMatch(/^[0-9a-f]{12}$/);
    // outside a build the files are served as they are in public/
    const a = ASSETS as Record<string, [number, string]>;
    const rel = 'coaches/nael/photo.glb';
    expect(a[rel][1]).toBe(createHash('sha1').update(readFileSync(`public/${rel}`)).digest('hex').slice(0, 12));
    expect(Object.keys(a).sort()).toEqual(bootFiles().sort());
  });
});

describe('1.34 : modèles compressés au build, sans aucune perte', () => {
  it('chaque point, normale, poids, couleur et index de triangle reste le même ; matières et images inchangées', async () => {
    const { NodeIO } = await import('@gltf-transform/core');
    const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions');
    const { MeshoptDecoder } = await import('meshoptimizer');
    await MeshoptDecoder.ready;
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    const hash = (b?: Uint8Array | null) => (b ? createHash('sha1').update(b).digest('hex') : '-');
    // a body (with its face expressions) and outfits of both rigs (Rocketbox, MakeHuman)
    for (const rel of ['coaches/mma-kadir/photo.glb', 'coaches/mma-kadir/tenues/judo.glb', 'coaches/nael/tenues/mma.glb', 'coaches/inaya/tenues/boxe.glb']) {
      const src = readFileSync(`public/${rel}`);
      const out = await compressModel(src);
      expect(out.byteLength, rel).toBeLessThan(src.byteLength);
      expect(JSON.parse(Buffer.from(out.subarray(20, 20 + Buffer.from(out).readUInt32LE(12))).toString()).extensionsRequired).toContain('EXT_meshopt_compression');
      const a = await io.readBinary(src);
      const b = await io.readBinary(out);
      const A = a.getRoot().listAccessors();
      const B = b.getRoot().listAccessors();
      expect(B.length, rel).toBe(A.length);
      const indices = new Set(a.getRoot().listMeshes().flatMap((m) => m.listPrimitives().map((p) => A.indexOf(p.getIndices()!))));
      for (let i = 0; i < A.length; i++) {
        const x = A[i].getArray()!;
        const y = B[i].getArray()!;
        expect(y.constructor, `${rel} #${i}`).toBe(x.constructor);
        expect(y.length, `${rel} #${i}`).toBe(x.length);
        if (!indices.has(i)) {
          expect(Buffer.compare(Buffer.from(x.buffer, x.byteOffset, x.byteLength), Buffer.from(y.buffer, y.byteOffset, y.byteLength)), `${rel} #${i}`).toBe(0);
          continue;
        }
        // the same triangles in the same order and turning the same way (the first corner may differ)
        for (let t = 0; t < x.length; t += 3) {
          const same = [0, 1, 2].some((r) => x[t] === y[t + r] && x[t + 1] === y[t + ((r + 1) % 3)] && x[t + 2] === y[t + ((r + 2) % 3)]);
          if (!same) expect.fail(`${rel} #${i} triangle ${t / 3}`);
        }
      }
      const sig = (d: typeof a) =>
        d
          .getRoot()
          .listMaterials()
          .map((m) => [m.getName(), JSON.stringify(m.getExtras()), m.getDoubleSided(), m.getAlphaMode(), hash(m.getBaseColorTexture()?.getImage()), hash(m.getNormalTexture()?.getImage()), hash(m.getMetallicRoughnessTexture()?.getImage())].join(':'))
          .concat(d.getRoot().listNodes().map((n) => [n.getName(), JSON.stringify(n.getExtras()), n.getMesh()?.getName(), JSON.stringify(n.getMesh()?.getExtras() ?? null), n.getSkin()?.listJoints().map((j) => j.getName()).join(',')].join(':')));
      expect(sig(b), rel).toEqual(sig(a));
    }
  }, 120_000);
});
