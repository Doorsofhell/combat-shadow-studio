import { useEffect, useState } from 'react';

interface Persisted {
  persist: { hasHydrated(): boolean; onFinishHydration(fn: () => void): () => void };
}

/** true once a persisted zustand store has read its saved value (IndexedDB is asynchronous) */
export function useHydrated(store: Persisted) {
  const [done, setDone] = useState(() => store.persist.hasHydrated());
  useEffect(() => {
    if (store.persist.hasHydrated()) setDone(true);
    return store.persist.onFinishHydration(() => setDone(true));
  }, [store]);
  return done;
}
