import { isSyncDoc, materialize, mergeDocs, sameDoc, sameSnapshot, track } from './model';
import type { SyncDoc } from './model';
import type { CollectionDef } from './collections';

/** remote storage of the sync documents (Firestore, or an in-memory fake in tests) */
export interface SyncAdapter {
  pull(uid: string, collection: string): Promise<SyncDoc | null>;
  push(uid: string, collection: string, doc: SyncDoc): Promise<void>;
  /** "Supprimer mes données" / account deletion */
  deleteAll(uid: string, collections: string[]): Promise<void>;
  /** 2.10.3: names of the documents this user has on the server (finds the history quarters of other devices) */
  list?(uid: string): Promise<string[]>;
}

export interface SyncState {
  docs: Record<string, SyncDoc>;
  /** collections changed locally and not yet pushed: the offline queue */
  pending: string[];
  lastSyncAt: number | null;
  /** 2.10.3: documents of older versions already read on this device (`importOnly` collections) */
  imported?: string[];
}

export type SyncPhase = 'idle' | 'syncing' | 'offline' | 'error';
export interface SyncStatus {
  phase: SyncPhase;
  lastSyncAt: number | null;
  pending: number;
  message?: string;
}

export interface EngineOptions {
  adapter: SyncAdapter;
  uid: string;
  /** a fixed list, or the list for the document names found on the server (2.10.3: history quarters) */
  defs: CollectionDef[] | ((remote: string[]) => CollectionDef[]);
  load: () => Promise<SyncState | undefined>;
  save: (s: SyncState) => Promise<void>;
  online?: () => boolean;
  onStatus?: (s: SyncStatus) => void;
  debounceMs?: number;
  now?: () => number;
}

/** Firestore refuses a document over 1 MiB (1 048 576 bytes); this margin covers the difference with the JSON size */
export const MAX_DOC_BYTES = 900_000;
export const docBytes = (d: SyncDoc) => new TextEncoder().encode(JSON.stringify(d)).length;
export class DocTooLargeError extends Error {
  code = 'doc-too-large';
  constructor(public collection: string, public bytes: number) {
    super(`${collection}: ${bytes} octets`);
  }
}

/**
 * Offline-first synchronisation. Local changes are stamped as soon as they happen and queued
 * (`pending`, saved on the device); when the device is online the engine pulls each document,
 * merges it (per-item / per-field last-write-wins with tombstones), applies the result to the
 * store and pushes it back if the server copy was older.
 *
 * 2.10.3 (audit ponytail): a local change syncs only the collections that changed (1 read + 1 write each), a full
 * pass (every document) runs at start, when the network comes back and on « Synchroniser » ; while a training session
 * runs (`setHold`), the history is not sent at all; and one failing collection no longer stops the others.
 */
export class SyncEngine {
  private state: SyncState = { docs: {}, pending: [], lastSyncAt: null };
  private defs: CollectionDef[] = [];
  private remote: string[] = [];
  private unsubs: (() => void)[] = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private applying = false;
  private running: Promise<void> | null = null;
  private again: 'none' | 'partial' | 'full' = 'none';
  private stopped = false;
  private held = false;
  private heldDirty = false;
  private onlineListener = () => void this.syncNow();

  constructor(private o: EngineOptions) {}

  private now() {
    return this.o.now?.() ?? Date.now();
  }
  private online() {
    return this.o.online ? this.o.online() : typeof navigator === 'undefined' || navigator.onLine !== false;
  }
  private status(phase: SyncPhase, message?: string) {
    this.o.onStatus?.({ phase, lastSyncAt: this.state.lastSyncAt, pending: this.state.pending.length, message });
  }

  get snapshot(): SyncState {
    return this.state;
  }

  /** recomputes the collections (a new quarter of history appears) and listens to each of them */
  private refreshDefs() {
    const next = typeof this.o.defs === 'function' ? this.o.defs(this.remote) : this.o.defs;
    const same = next.length === this.defs.length && next.every((d, i) => d.name === this.defs[i].name);
    if (same && this.unsubs.length) return;
    this.unsubs.forEach((u) => u());
    this.defs = next;
    this.unsubs = this.stopped ? [] : next.map((def) => def.subscribe(() => this.localChange(def)));
  }

  async start() {
    const saved = await this.o.load();
    if (saved) this.state = { docs: saved.docs ?? {}, pending: saved.pending ?? [], lastSyncAt: saved.lastSyncAt ?? null, imported: saved.imported ?? [] };
    this.refreshDefs();
    if (typeof window !== 'undefined') window.addEventListener('online', this.onlineListener);
    await this.syncNow();
  }

  stop() {
    this.stopped = true;
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    if (typeof window !== 'undefined') window.removeEventListener('online', this.onlineListener);
  }

  /**
   * 2.10.3 (audit ponytail n°2): during a training session the history changes every few seconds; it is only
   * recorded on the device, and sent once when the hold ends (pause, end, leaving the session).
   */
  setHold(on: boolean) {
    if (on === this.held) return;
    this.held = on;
    if (!on && this.heldDirty) {
      this.heldDirty = false;
      void this.o.save(this.state).then(() => this.syncNow(false));
    }
  }

  /** waits for the debounced local changes and the running sync (tests, sign-out); the hold does not apply */
  async flush() {
    for (const [name, t] of this.timers) {
      clearTimeout(t);
      this.timers.delete(name);
      const def = this.defs.find((d) => d.name === name);
      if (def) this.record(def);
    }
    await this.o.save(this.state);
    const held = this.held;
    this.held = false;
    try {
      await this.syncNow();
    } finally {
      this.held = held;
    }
  }

  private localChange(def: CollectionDef) {
    if (this.applying || this.stopped || def.importOnly) return;
    if (def.hold && this.held) {
      this.heldDirty = true;
      return;
    }
    clearTimeout(this.timers.get(def.name));
    this.timers.set(
      def.name,
      setTimeout(() => {
        this.timers.delete(def.name);
        this.record(def);
        void this.o.save(this.state).then(() => this.syncNow(false));
      }, this.o.debounceMs ?? 1500),
    );
  }

  private record(def: CollectionDef) {
    if (def.importOnly) return;
    const { doc, changed } = track(this.state.docs[def.name] ?? null, def.snapshot(), def.name, this.now());
    if (changed) {
      this.state.docs[def.name] = doc;
      if (!this.state.pending.includes(def.name)) this.state.pending.push(def.name);
    }
  }

  /** `full` (default): every collection is read; otherwise only those changed on this device */
  syncNow(full = true): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.running) {
      if (full || this.again === 'none') this.again = full ? 'full' : 'partial';
      return this.running;
    }
    this.running = this.run(full).finally(() => {
      this.running = null;
      const again = this.again;
      this.again = 'none';
      if (again !== 'none' && !this.stopped) void this.syncNow(again === 'full');
    });
    return this.running;
  }

  private async syncOne(def: CollectionDef) {
    if (def.importOnly) {
      if (this.state.imported?.includes(def.name)) return;
      const fetched = await this.o.adapter.pull(this.o.uid, def.name);
      if (isSyncDoc(fetched, def.name)) {
        // an item a newer document already holds (or deleted) is not brought back
        const known = new Set(
          Object.entries(this.state.docs)
            .filter(([n]) => n.startsWith(def.importOnly!.into))
            .flatMap(([, d]) => Object.keys(d.items)),
        );
        const snap = materialize(fetched);
        for (const id of Object.keys(snap.items)) if (known.has(id)) delete snap.items[id];
        def.apply(snap);
      }
      this.state.imported = [...(this.state.imported ?? []), def.name];
      return;
    }
    const local = this.state.docs[def.name] ?? track(null, def.snapshot(), def.name, this.now()).doc;
    const fetched = await this.o.adapter.pull(this.o.uid, def.name);
    const remote = isSyncDoc(fetched, def.name) ? fetched : null;
    const merged = remote ? mergeDocs(local, remote, this.now()) : local;
    const snap = materialize(merged);
    if (!sameSnapshot(snap, def.snapshot())) {
      this.applying = true;
      try {
        def.apply(snap);
      } finally {
        this.applying = false;
      }
    }
    this.state.docs[def.name] = merged;
    if (!remote || !sameDoc(merged, remote)) {
      const bytes = docBytes(merged);
      if (bytes > MAX_DOC_BYTES) throw new DocTooLargeError(def.name, bytes);
      await this.o.adapter.push(this.o.uid, def.name, merged);
    }
    this.state.pending = this.state.pending.filter((n) => n !== def.name);
  }

  private async run(full: boolean) {
    this.refreshDefs();
    for (const def of this.defs) this.record(def);
    if (!this.online()) {
      await this.o.save(this.state);
      this.status('offline');
      return;
    }
    this.status('syncing');
    let failure: unknown = null;
    if (full && this.o.adapter.list) {
      try {
        this.remote = await this.o.adapter.list(this.o.uid);
        this.refreshDefs();
        for (const def of this.defs) this.record(def);
      } catch (e) {
        failure = e;
      }
    }
    // the old history document is read only in a full pass, after the quarters, so it knows what they hold
    const todo = this.defs.filter((d) => !(d.hold && this.held) && (d.importOnly ? full : full || this.state.pending.includes(d.name)));
    for (const def of todo) {
      if (this.stopped) return;
      if (def.importOnly && failure) continue;
      try {
        await this.syncOne(def);
      } catch (e) {
        // one collection that fails (too large, refused) does not stop the others; it stays in the queue
        failure ??= e;
        console.warn('[sync]', def.name, (e as { code?: string })?.code ?? e);
        if (!this.online() || isOffline(e)) break;
      }
    }
    if (!failure) this.state.lastSyncAt = this.now();
    await this.o.save(this.state);
    if (!failure) return this.status('idle');
    const offline = !this.online() || isOffline(failure);
    this.status(offline ? 'offline' : 'error', offline ? undefined : syncErrorMessage(failure));
  }
}

const isOffline = (e: unknown) => /unavailable|network|offline/i.test(String((e as { code?: string })?.code ?? e));

/** a clear sentence for the error state (v0.37): permissions and the free quota are named, nothing is lost */
export function syncErrorMessage(e: unknown) {
  const code = String((e as { code?: string })?.code ?? '');
  if (/permission-denied|unauthenticated/.test(code)) return 'Le serveur a refusé l’accès : la sauvegarde en ligne n’est pas encore ouverte pour ce compte.';
  if (/resource-exhausted/.test(code)) return 'Le quota gratuit du jour est atteint : la sauvegarde reprendra automatiquement plus tard.';
  if (code === 'doc-too-large') return 'Une partie de ton historique est trop grosse pour la sauvegarde en ligne ; elle reste sur cet appareil, le reste est sauvegardé.';
  return 'La synchronisation a échoué ; elle sera retentée.';
}

/** in-memory adapter (tests, and a second "device" in simulations) */
export function memoryAdapter(): SyncAdapter & { data: Map<string, SyncDoc>; fail: boolean } {
  const data = new Map<string, SyncDoc>();
  const a = {
    data,
    fail: false,
    pull: async (uid: string, c: string) => {
      if (a.fail) throw Object.assign(new Error('offline'), { code: 'unavailable' });
      return structuredClone(data.get(`${uid}/${c}`) ?? null);
    },
    push: async (uid: string, c: string, d: SyncDoc) => {
      if (a.fail) throw Object.assign(new Error('offline'), { code: 'unavailable' });
      data.set(`${uid}/${c}`, structuredClone(d));
    },
    deleteAll: async (uid: string, cs: string[]) => cs.forEach((c) => data.delete(`${uid}/${c}`)),
    list: async (uid: string) => {
      if (a.fail) throw Object.assign(new Error('offline'), { code: 'unavailable' });
      return [...data.keys()].filter((k) => k.startsWith(`${uid}/`)).map((k) => k.slice(uid.length + 1));
    },
  };
  return a;
}
