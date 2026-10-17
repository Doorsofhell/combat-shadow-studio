/** waits until a persisted zustand store finished reading IndexedDB */
export function hydrated(store: { persist: { hasHydrated(): boolean; onFinishHydration(cb: () => void): () => void } }) {
  return new Promise<void>((resolve) => {
    if (store.persist.hasHydrated()) return resolve();
    const un = store.persist.onFinishHydration(() => (un(), resolve()));
  });
}
export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
