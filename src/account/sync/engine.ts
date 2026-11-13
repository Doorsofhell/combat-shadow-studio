import { isSyncDoc, materialize, mergeDocs, sameDoc, sameSnapshot, track } from './model';
import type { SyncDoc } from './model';
import type { CollectionDef } from './collections';

/** remote storage of the sync documents (Firestore, or an in-memory fake in tests) */
export interface SyncAdapter {
  pull(uid: string, collection: string): Promise<SyncDoc | null>;
  push(uid: string, collection: string, doc: SyncDoc): Promise<void>;
  /** "Supprimer mes données" / account deletion */
  deleteAll(uid: string, collections: string[]): Promise<void>;
}

export interface SyncState {
  docs: Record<string, SyncDoc>;
  /** collections changed locally and not yet pushed: the offline queue */
  pending: string[];
  lastSyncAt: number | null;
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
  defs: CollectionDef[];
  load: () => Promise<SyncState | undefined>;
  save: (s: SyncState) => Promise<void>;
  online?: () => boolean;
  onStatus?: (s: SyncStatus) => void;
  debounceMs?: number;
  now?: () => number;
}

/**
 * Offline-first synchronisation. Local changes are stamped as soon as they happen and queued
 * (`pending`, saved on the device); when the device is online the engine pulls each document,
 * merges it (per-item / per-field last-write-wins with tombstones), applies the result to the
 * store and pushes it back if the server copy was older.
 */
export class SyncEngine {
  private state: SyncState = { docs: {}, pending: [], lastSyncAt: null };
  private unsubs: (() => void)[] = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private applying = false;
  private running: Promise<void> | null = null;
  private again = false;
  private stopped = false;
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

  async start() {
    const saved = await this.o.load();
    if (saved) this.state = { docs: saved.docs ?? {}, pending: saved.pending ?? [], lastSyncAt: saved.lastSyncAt ?? null };
    for (const def of this.o.defs) this.unsubs.push(def.subscribe(() => this.localChange(def)));
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

  /** waits for the debounced local changes and the running sync (tests, sign-out) */
  async flush() {
    for (const [name, t] of this.timers) {
      clearTimeout(t);
      this.timers.delete(name);
      const def = this.o.defs.find((d) => d.name === name);
      if (def) this.record(def);
    }
    await this.o.save(this.state);
    await this.syncNow();
  }

  private localChange(def: CollectionDef) {
    if (this.applying || this.stopped) return;
    clearTimeout(this.timers.get(def.name));
    this.timers.set(
      def.name,
      setTimeout(() => {
        this.timers.delete(def.name);
        this.record(def);
        void this.o.save(this.state).then(() => this.syncNow());
      }, this.o.debounceMs ?? 1500),
    );
  }

  private record(def: CollectionDef) {
    const { doc, changed } = track(this.state.docs[def.name] ?? null, def.snapshot(), def.name, this.now());
    if (changed) {
      this.state.docs[def.name] = doc;
      if (!this.state.pending.includes(def.name)) this.state.pending.push(def.name);
    }
  }

  syncNow(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.run().finally(() => {
      this.running = null;
      if (this.again && !this.stopped) {
        this.again = false;
        void this.syncNow();
      }
    });
    return this.running;
  }

  private async run() {
    for (const def of this.o.defs) this.record(def);
    if (!this.online()) {
      await this.o.save(this.state);
      this.status('offline');
      return;
    }
    this.status('syncing');
    try {
      for (const def of this.o.defs) {
        if (this.stopped) return;
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
        if (!remote || !sameDoc(merged, remote)) await this.o.adapter.push(this.o.uid, def.name, merged);
        this.state.pending = this.state.pending.filter((n) => n !== def.name);
      }
      this.state.lastSyncAt = this.now();
      await this.o.save(this.state);
      this.status('idle');
    } catch (e) {
      console.warn('[sync]', (e as { code?: string })?.code ?? e);
      await this.o.save(this.state);
      const offline = !this.online() || /unavailable|network|offline/i.test(String((e as { code?: string })?.code ?? e));
      this.status(offline ? 'offline' : 'error', offline ? undefined : syncErrorMessage(e));
    }
  }
}

/** a clear sentence for the error state (v0.37): permissions and the free quota are named, nothing is lost */
export function syncErrorMessage(e: unknown) {
  const code = String((e as { code?: string })?.code ?? '');
  if (/permission-denied|unauthenticated/.test(code)) return 'Le serveur a refusé l’accès : la sauvegarde en ligne n’est pas encore ouverte pour ce compte.';
  if (/resource-exhausted/.test(code)) return 'Le quota gratuit du jour est atteint : la sauvegarde reprendra automatiquement plus tard.';
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
  };
  return a;
}
