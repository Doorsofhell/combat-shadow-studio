/**
 * Sync document model and conflict resolution (pure functions, no I/O).
 *
 * One document per collection per user: `users/{uid}/sync/{collection}`.
 *   fields: single values (profile fields, goals, active fighter…), each with its own `updatedAt`;
 *   items:  keyed records (sessions, combos, fighters, favourites…), each with `updatedAt` and an
 *           optional `deleted` tombstone so a deletion on one device wins over an older copy elsewhere.
 *
 * Merge = last-write-wins per field and per item, by `updatedAt` (milliseconds of the device clock).
 * Ties are broken deterministically (tombstone first, then the larger serialised value) so every
 * device converges to the same result whatever the order of synchronisation.
 */
export interface FieldEntry {
  value: unknown;
  updatedAt: number;
}

export interface ItemEntry {
  updatedAt: number;
  deleted?: boolean;
  data?: unknown;
}

export interface SyncDoc {
  schema: 1;
  collection: string;
  updatedAt: number;
  fields: Record<string, FieldEntry>;
  items: Record<string, ItemEntry>;
}

/** what a store exposes to the sync: plain values only */
export interface Snapshot {
  fields: Record<string, unknown>;
  items: Record<string, unknown>;
}

/** tombstones older than this are dropped; a device offline longer may resurrect a deleted item */
export const TOMBSTONE_TTL = 180 * 24 * 3600 * 1000;

/** JSON with sorted keys, so equal values always serialise the same way */
export function stableStringify(v: unknown): string {
  if (v === undefined) return 'null';
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(',')}}`;
}

export const emptyDoc = (collection: string): SyncDoc => ({ schema: 1, collection, updatedAt: 0, fields: {}, items: {} });

/** next timestamp for local changes: never goes back in time relative to what this doc already holds */
export const nextClock = (doc: SyncDoc | null, now = Date.now()) => Math.max(now, (doc?.updatedAt ?? 0) + 1);

/**
 * Records local changes: compares the store snapshot with the last known document and stamps
 * changed fields/items with `now`; items that disappeared become tombstones.
 */
export function track(prev: SyncDoc | null, snap: Snapshot, collection: string, now = Date.now()): { doc: SyncDoc; changed: boolean } {
  const base = prev ?? emptyDoc(collection);
  const t = nextClock(base, now);
  const doc: SyncDoc = { ...base, fields: { ...base.fields }, items: { ...base.items } };
  let changed = false;
  for (const [k, value] of Object.entries(snap.fields)) {
    const old = base.fields[k];
    if (!old || stableStringify(old.value) !== stableStringify(value)) {
      doc.fields[k] = { value: value ?? null, updatedAt: t };
      changed = true;
    }
  }
  for (const [id, data] of Object.entries(snap.items)) {
    const old = base.items[id];
    if (!old || old.deleted || stableStringify(old.data) !== stableStringify(data)) {
      doc.items[id] = { updatedAt: t, data };
      changed = true;
    }
  }
  for (const [id, old] of Object.entries(base.items)) {
    if (!old.deleted && !(id in snap.items)) {
      doc.items[id] = { updatedAt: t, deleted: true };
      changed = true;
    }
  }
  if (changed) doc.updatedAt = t;
  return { doc, changed };
}

function pickField(a: FieldEntry | undefined, b: FieldEntry | undefined) {
  if (!a) return b!;
  if (!b) return a;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return stableStringify(a.value) >= stableStringify(b.value) ? a : b;
}

function pickItem(a: ItemEntry | undefined, b: ItemEntry | undefined) {
  if (!a) return b!;
  if (!b) return a;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  if (!!a.deleted !== !!b.deleted) return a.deleted ? a : b; // deletion wins a perfect tie
  return stableStringify(a.data) >= stableStringify(b.data) ? a : b;
}

/** merges two versions of the same document; commutative, associative and idempotent */
export function mergeDocs(a: SyncDoc, b: SyncDoc, now = Date.now()): SyncDoc {
  const out: SyncDoc = { schema: 1, collection: a.collection, updatedAt: Math.max(a.updatedAt, b.updatedAt), fields: {}, items: {} };
  for (const k of new Set([...Object.keys(a.fields), ...Object.keys(b.fields)])) out.fields[k] = pickField(a.fields[k], b.fields[k]);
  for (const id of new Set([...Object.keys(a.items), ...Object.keys(b.items)])) {
    const it = pickItem(a.items[id], b.items[id]);
    if (it.deleted && now - it.updatedAt > TOMBSTONE_TTL) continue;
    out.items[id] = it;
  }
  return out;
}

/** live values of a document (tombstones removed) */
export function materialize(doc: SyncDoc): Snapshot {
  const fields: Record<string, unknown> = {};
  const items: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(doc.fields)) fields[k] = f.value;
  for (const [id, it] of Object.entries(doc.items)) if (!it.deleted) items[id] = it.data;
  return { fields, items };
}

export const sameDoc = (a: SyncDoc | null, b: SyncDoc | null) => stableStringify(a) === stableStringify(b);
export const sameSnapshot = (a: Snapshot, b: Snapshot) => stableStringify(a) === stableStringify(b);

/** checks a document read from the network before trusting it */
export function isSyncDoc(x: unknown, collection: string): x is SyncDoc {
  const d = x as SyncDoc;
  return !!d && d.schema === 1 && d.collection === collection && typeof d.updatedAt === 'number' && typeof d.fields === 'object' && typeof d.items === 'object';
}
