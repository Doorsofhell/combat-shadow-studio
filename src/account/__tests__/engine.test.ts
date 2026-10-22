import { describe, expect, test } from 'vitest';
import { SyncEngine, memoryAdapter } from '../sync/engine';
import type { SyncState } from '../sync/engine';
import type { CollectionDef } from '../sync/collections';
import type { Snapshot } from '../sync/model';

/** a fake store: a map of items and a field, with change listeners */
function fakeStore(name: string) {
  let state: Snapshot = { fields: { goal: 0 }, items: {} };
  const ls = new Set<() => void>();
  const def: CollectionDef = {
    name,
    snapshot: () => structuredClone(state),
    apply: (s) => {
      state = structuredClone(s);
      ls.forEach((l) => l());
    },
    subscribe: (cb) => (ls.add(cb), () => ls.delete(cb)),
  };
  const change = (fn: (s: Snapshot) => void) => {
    fn(state);
    state = structuredClone(state);
    ls.forEach((l) => l());
  };
  return { def, change, get: () => state };
}

function device(adapter: ReturnType<typeof memoryAdapter>, opts: { online: { v: boolean }; clock: { t: number } }) {
  const store = fakeStore('custom');
  let saved: SyncState | undefined;
  const statuses: string[] = [];
  const engine = new SyncEngine({
    adapter,
    uid: 'u1',
    defs: [store.def],
    load: async () => saved && structuredClone(saved),
    save: async (s) => void (saved = structuredClone(s)),
    online: () => opts.online.v,
    onStatus: (s) => statuses.push(s.phase),
    debounceMs: 5,
    now: () => opts.clock.t,
  });
  return { store, engine, statuses, saved: () => saved };
}

describe('moteur de synchronisation', () => {
  test('envoie, récupère sur un autre appareil et fusionne les modifications concurrentes', async () => {
    const server = memoryAdapter();
    const clock = { t: 1000 };
    const online = { v: true };
    const phone = device(server, { online, clock });
    const tablet = device(server, { online, clock });
    phone.store.change((s) => (s.items.c1 = 'jab-direct'));
    await phone.engine.start();
    expect(server.data.get('u1/custom')?.items.c1.data).toBe('jab-direct');

    await tablet.engine.start();
    expect(tablet.store.get().items).toEqual({ c1: 'jab-direct' });

    // both edit while offline
    online.v = false;
    clock.t = 2000;
    phone.store.change((s) => (s.fields.goal = 90));
    clock.t = 3000;
    tablet.store.change((s) => {
      delete s.items.c1;
      s.items.c2 = 'crochet';
    });
    await phone.engine.flush();
    await tablet.engine.flush();
    expect(phone.statuses.at(-1)).toBe('offline');
    expect(phone.saved()!.pending).toEqual(['custom']); // queued on the device

    online.v = true;
    await phone.engine.syncNow();
    await tablet.engine.syncNow();
    await phone.engine.syncNow();
    const expected = { fields: { goal: 90 }, items: { c2: 'crochet' } };
    expect(phone.store.get()).toEqual(expected);
    expect(tablet.store.get()).toEqual(expected);
    expect(phone.saved()!.pending).toEqual([]);
    expect(phone.statuses.at(-1)).toBe('idle');
    phone.engine.stop();
    tablet.engine.stop();
  });

  test('une panne réseau garde la file d’attente et la reprise envoie tout', async () => {
    const server = memoryAdapter();
    const d = device(server, { online: { v: true }, clock: { t: 10 } });
    await d.engine.start();
    server.fail = true;
    d.store.change((s) => (s.items.x = 1));
    await d.engine.flush();
    expect(d.saved()!.pending).toEqual(['custom']);
    expect(d.statuses.at(-1)).toBe('offline');
    server.fail = false;
    await d.engine.syncNow();
    expect(server.data.get('u1/custom')?.items.x.data).toBe(1);
    expect(d.saved()!.pending).toEqual([]);
    d.engine.stop();
  });

  test('un document distant malformé est ignoré, pas appliqué', async () => {
    const server = memoryAdapter();
    server.data.set('u1/custom', { schema: 9 } as never);
    const d = device(server, { online: { v: true }, clock: { t: 10 } });
    d.store.change((s) => (s.items.a = 'ok'));
    await d.engine.start();
    expect(d.store.get().items).toEqual({ a: 'ok' });
    expect(server.data.get('u1/custom')?.schema).toBe(1);
    d.engine.stop();
  });

  test('les changements appliqués depuis le serveur ne repartent pas comme des modifications locales', async () => {
    const server = memoryAdapter();
    const clock = { t: 100 };
    const a = device(server, { online: { v: true }, clock });
    a.store.change((s) => (s.items.k = 'v'));
    await a.engine.start();
    const b = device(server, { online: { v: true }, clock });
    await b.engine.start();
    clock.t = 500;
    await b.engine.flush();
    expect(server.data.get('u1/custom')?.items.k.updatedAt).toBe(100);
    a.engine.stop();
    b.engine.stop();
  });
});

describe('messages d’erreur de synchronisation (v0.37)', () => {
  test('accès refusé et quota gratuit atteint sont nommés, le reste est générique', async () => {
    const { syncErrorMessage } = await import('../sync/engine');
    expect(syncErrorMessage({ code: 'permission-denied' })).toContain('refusé');
    expect(syncErrorMessage({ code: 'resource-exhausted' })).toContain('quota gratuit');
    expect(syncErrorMessage(new Error('x'))).toContain('retentée');
  });
});
