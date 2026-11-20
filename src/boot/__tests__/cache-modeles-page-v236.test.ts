import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FINGERPRINT_HEADER, isKept, noteKept, type BootItem } from '../preload';

/**
 * 2.3.6 cache des modèles 3D: the start screen reads the fingerprint the service worker writes on each model it keeps
 * (tools/build/swModeles.ts), before its own note (localStorage, 1.34) and the announced size (before 1.34).
 */
function fakeCaches() {
  const m = new Map<string, Response>();
  const store = { match: async (u: string) => m.get(u)?.clone(), put: async (u: string, r: Response) => void m.set(u, r), delete: async (u: string) => m.delete(u) };
  return { open: async () => store, m };
}

const item = (url: string, bytes: number, v?: string): BootItem => ({ url, bytes, v, step: 'coach' });
const abs = (u: string) => new URL(u, location.href).href;

describe('2.3.6 : l’écran de démarrage lit l’empreinte écrite par le service worker', () => {
  let c: ReturnType<typeof fakeCaches>;
  beforeEach(() => {
    c = fakeCaches();
    (globalThis as { caches?: unknown }).caches = c;
    localStorage.clear();
  });
  afterEach(() => {
    delete (globalThis as { caches?: unknown }).caches;
  });

  it('empreinte de cette version : gardé, et noté', async () => {
    const x = item('./coaches/nael/photo.glb', 10, 'nouveau');
    await (await c.open()).put(abs(x.url), new Response(new Uint8Array(10), { headers: { [FINGERPRINT_HEADER]: 'nouveau' } }));
    expect(await isKept(x)).toBe(true);
    expect(JSON.parse(localStorage.getItem('css-modeles-versions')!)[abs(x.url)]).toBe('nouveau');
  });

  it('empreinte d’une autre version : retiré et retéléchargé, même si une ancienne note dit le contraire', async () => {
    const x = item('./coaches/nael/photo.glb', 10, 'nouveau');
    noteKept(x);
    await (await c.open()).put(abs(x.url), new Response(new Uint8Array(10), { headers: { [FINGERPRINT_HEADER]: 'ancien', 'content-length': '10' } }));
    expect(await isKept(x)).toBe(false);
    expect(c.m.has(abs(x.url))).toBe(false);
  });

  it('sans empreinte (gardé avant 2.3.6) : la note puis la taille décident, comme avant', async () => {
    const x = item('./salles/boxe/salle.json', 10, 'v1');
    await (await c.open()).put(abs(x.url), new Response(new Uint8Array(10), { headers: { 'content-length': '10' } }));
    expect(await isKept(x)).toBe(true);
    expect(await isKept(x)).toBe(true);
  });
});
