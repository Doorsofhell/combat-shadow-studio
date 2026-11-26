/**
 * 2.10.3 (audit ponytail n°1 et n°2): the online backup holds when the history grows, a failing collection does not
 * stop the others, and a training session does not resend the history every few seconds.
 */
import { beforeAll, describe, expect, test } from 'vitest';
import { SyncEngine, memoryAdapter, MAX_DOC_BYTES, docBytes, syncErrorMessage } from '../sync/engine';
import type { SyncAdapter, SyncState } from '../sync/engine';
import type { CollectionDef } from '../sync/collections';
import { LEGACY_STATS, statsShardOf, syncDefs } from '../sync/collections';
import { track } from '../sync/model';
import type { Snapshot } from '../sync/model';
import { useStats } from '../../store/stats';
import type { SessionRecord } from '../../store/stats';
import { hydrated } from './helpers';

function fakeStore(name: string, hold = false) {
  let state: Snapshot = { fields: {}, items: {} };
  const ls = new Set<() => void>();
  const def: CollectionDef = {
    name,
    hold,
    snapshot: () => structuredClone(state),
    apply: (s) => void (state = structuredClone(s)),
    subscribe: (cb) => (ls.add(cb), () => ls.delete(cb)),
  };
  const change = (fn: (s: Snapshot) => void) => {
    fn(state);
    state = structuredClone(state);
    ls.forEach((l) => l());
  };
  return { def, change, get: () => state };
}

/** counts the calls that Firestore bills */
function counting(a: SyncAdapter) {
  const n = { pull: 0, push: 0, list: 0 };
  const c: SyncAdapter = {
    pull: (u, x) => (n.pull++, a.pull(u, x)),
    push: (u, x, d) => (n.push++, a.push(u, x, d)),
    deleteAll: (u, x) => a.deleteAll(u, x),
    list: (u) => (n.list++, a.list!(u)),
  };
  return { adapter: c, n };
}

function engine(adapter: SyncAdapter, defs: CollectionDef[] | ((r: string[]) => CollectionDef[]), statuses: { phase: string; message?: string }[] = []) {
  let saved: SyncState | undefined;
  const e = new SyncEngine({ adapter, uid: 'u', defs, load: async () => saved, save: async (s) => void (saved = structuredClone(s)), online: () => true, onStatus: (s) => statuses.push(s), debounceMs: 5, now: () => 1000 });
  return e;
}
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

describe('n°1 : un document trop gros ne bloque plus la sauvegarde', () => {
  test('la collection trop grosse est refusée avant l’envoi, les autres continuent, le message le dit', async () => {
    const server = memoryAdapter();
    const big = fakeStore('big');
    const small = fakeStore('custom');
    big.change((s) => (s.items.x = 'a'.repeat(MAX_DOC_BYTES + 10)));
    small.change((s) => (s.items.c = 'jab'));
    const statuses: { phase: string; message?: string }[] = [];
    const e = engine(server, [big.def, small.def], statuses);
    await e.start();
    expect(server.data.has('u/big')).toBe(false);
    expect(server.data.get('u/custom')?.items.c.data).toBe('jab');
    expect(e.snapshot.pending).toEqual(['big']);
    expect(statuses.at(-1)?.phase).toBe('error');
    expect(statuses.at(-1)?.message).toBe(syncErrorMessage({ code: 'doc-too-large' }));
    expect(statuses.at(-1)?.message).toContain('trop grosse');
    e.stop();
  });

  test('une collection refusée par le serveur ne bloque pas les suivantes', async () => {
    const mem = memoryAdapter();
    const refusing: SyncAdapter = { ...mem, push: async (u, c, d) => (c === 'a' ? Promise.reject(Object.assign(new Error('x'), { code: 'permission-denied' })) : mem.push(u, c, d)) };
    const a = fakeStore('a');
    const b = fakeStore('b');
    a.change((s) => (s.items.x = 1));
    b.change((s) => (s.items.y = 2));
    const e = engine(refusing, [a.def, b.def]);
    await e.start();
    expect(mem.data.get('u/b')?.items.y.data).toBe(2);
    expect(e.snapshot.pending).toEqual(['a']);
    e.stop();
  });
});

describe('n°1 : historique découpé par trimestre', () => {
  beforeAll(async () => {
    await hydrated(useStats as never);
  });
  const rec = (i: number, start: string): SessionRecord => ({ id: `${start}#ex-${i}`, start, discipline: 'boxe', level: 'debutant', exerciseId: `boxe-debutant-exercice-${i % 40}`, exerciseName: 'Jab, direct et crochet avant', mode: 'programme', activeSec: 180, reps: 12, status: 'terminee', workSec: 540, restSec: 120, totalSec: 680, plannedRounds: 3, doneRounds: 3, work: 180 });

  test('le trimestre se lit sur la date UTC de début', () => {
    expect(statsShardOf('2026-01-01T00:00:00.000Z')).toBe('stats-2026-t1');
    expect(statsShardOf('2026-03-31T23:59:00.000Z')).toBe('stats-2026-t1');
    expect(statsShardOf('2026-04-01T00:00:00.000Z')).toBe('stats-2026-t2');
    expect(statsShardOf('2026-12-31T10:00:00.000Z')).toBe('stats-2026-t4');
  });

  test('trois ans d’usage intensif (10 exercices par jour) : aucun document ne dépasse la limite', async () => {
    const sessions: SessionRecord[] = [];
    const t0 = Date.parse('2024-01-01T08:00:00Z');
    for (let d = 0; d < 3 * 365; d++) for (let k = 0; k < 10; k++) sessions.push(rec(k, new Date(t0 + d * 864e5 + k * 6e5).toISOString()));
    useStats.setState({ sessions, perExercise: {} });
    const shards = syncDefs().filter((d) => d.name.startsWith('stats-'));
    expect(shards).toHaveLength(12);
    let biggest = 0;
    for (const d of shards) biggest = Math.max(biggest, docBytes(track(null, d.snapshot(), d.name, Date.now()).doc));
    // the same history in one document (2.10.2) was far over the limit
    const all = { fields: {}, items: Object.fromEntries(sessions.map((s) => [s.id, s])) };
    expect(docBytes(track(null, all, 'stats', Date.now()).doc)).toBeGreaterThan(MAX_DOC_BYTES);
    expect(biggest).toBeLessThan(MAX_DOC_BYTES / 2);
    useStats.setState({ sessions: [], perExercise: {} });
  }, 30_000);

  test('un nouvel appareil retrouve l’ancien historique et les trimestres, sans ramener une séance supprimée', async () => {
    const server = memoryAdapter();
    const a = rec(1, '2026-10-10T10:00:00.000Z');
    const b = rec(2, '2026-11-02T10:00:00.000Z');
    const c = rec(3, '2025-02-02T10:00:00.000Z');
    // what a 2.10.2 device left: a, b and c in the old single document
    server.data.set(`u/${LEGACY_STATS}`, track(null, { fields: {}, items: { [a.id]: a, [b.id]: b, [c.id]: c } }, LEGACY_STATS, 500).doc);
    // b was deleted since then on a 2.10.3 device (tombstone in its quarter)
    const q = track(track(null, { fields: {}, items: { [b.id]: b } }, 'stats-2026-t4', 600).doc, { fields: {}, items: {} }, 'stats-2026-t4', 700).doc;
    server.data.set('u/stats-2026-t4', q);
    useStats.setState({ sessions: [], perExercise: {} });
    const e = engine(server, syncDefs);
    await e.start();
    expect(useStats.getState().sessions.map((s) => s.id).sort()).toEqual([c.id, a.id].sort());
    expect(useStats.getState().perExercise[a.exerciseId]).toBe(180);
    // pushed to their quarters; the old document is left as it was (older devices still read it)
    await e.flush();
    expect(Object.keys(server.data.get('u/stats-2025-t1')!.items)).toEqual([c.id]);
    expect(server.data.get('u/stats-2026-t4')!.items[a.id].data).toBeTruthy();
    expect(server.data.get('u/stats-2026-t4')!.items[b.id].deleted).toBe(true);
    expect(server.data.get(`u/${LEGACY_STATS}`)!.updatedAt).toBe(500);
    // read once per device
    expect(e.snapshot.imported).toEqual([LEGACY_STATS]);
    e.stop();
    useStats.setState({ sessions: [], perExercise: {} });
  });
});

describe('n°2 : pas de synchronisation complète toutes les quelques secondes', () => {
  test('un changement local relit et renvoie seulement sa collection', async () => {
    const { adapter, n } = counting(memoryAdapter());
    const stores = ['p', 'q', 'r', 's'].map((x) => fakeStore(x));
    const e = engine(adapter, stores.map((s) => s.def));
    await e.start();
    expect(n.list).toBe(1);
    Object.assign(n, { pull: 0, push: 0, list: 0 });
    stores[0].change((s) => (s.items.k = 1));
    await wait();
    expect(n).toEqual({ pull: 1, push: 1, list: 0 });
    e.stop();
  });

  test('pendant une séance, l’historique ne part pas ; un seul envoi à la pause', async () => {
    const { adapter, n } = counting(memoryAdapter());
    const stats = fakeStore('stats-2026-t4', true);
    const other = fakeStore('custom');
    const e = engine(adapter, [other.def, stats.def]);
    await e.start();
    Object.assign(n, { pull: 0, push: 0, list: 0 });
    e.setHold(true);
    for (let i = 0; i < 20; i++) {
      stats.change((s) => (s.items.r = i));
      await wait(8);
    }
    // a full pass during the session (network back) still leaves the history alone
    await e.syncNow();
    const during = n.push;
    expect(during).toBe(0);
    e.setHold(false);
    await wait();
    expect(n.push).toBe(1);
    e.stop();
  });
});
