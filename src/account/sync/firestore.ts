/**
 * Firestore adapter (lazy-loaded with the SDK, only when Firebase is configured and the user turned
 * sync on). Documents live at users/{uid}/sync/{collection}; firestore.rules restricts every user
 * to their own users/{uid}/** subtree. Firestore's own offline cache is not used: the app keeps its
 * own queue (see engine.ts), so a memory cache is enough.
 */
import type { SyncAdapter } from './engine';
import type { SyncDoc } from './model';
import type { FirebaseWebConfig } from '../auth/config';
import { firebaseApp } from '../auth/firebase';

export async function createFirestoreAdapter(cfg: FirebaseWebConfig, emulator?: string): Promise<SyncAdapter> {
  const m = await import('firebase/firestore');
  const app = await firebaseApp(cfg);
  let db;
  try {
    db = m.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: m.memoryLocalCache() });
    if (emulator) {
      const [host, port] = emulator.replace(/^https?:\/\//, '').split(':');
      m.connectFirestoreEmulator(db, host, Number(port));
    }
  } catch {
    db = m.getFirestore(app);
  }
  const ref = (uid: string, c: string) => m.doc(db, 'users', uid, 'sync', c);
  return {
    pull: async (uid, c) => {
      const snap = await m.getDoc(ref(uid, c));
      return snap.exists() ? (snap.data() as SyncDoc) : null;
    },
    push: async (uid, c, d) => {
      await m.setDoc(ref(uid, c), d);
    },
    deleteAll: async (uid, cs) => {
      await Promise.all(cs.map((c) => m.deleteDoc(ref(uid, c))));
    },
  };
}
