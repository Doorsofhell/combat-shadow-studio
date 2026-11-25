import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

// 2.3.5 (Youssef, 2026-11-20, P1 « Risque lié au bouton Retour Android »): the Android back button (Capacitor) of a
// screen with unsaved changes. installNativeHandlers asks the registered handlers, the last one first; the test
// presses the button the same way, without a phone.
const handlers: (() => boolean)[] = vi.hoisted(() => []);
vi.mock('../../../platform/native', () => ({
  onBackButton: (fn: () => boolean) => {
    handlers.push(fn);
    return () => handlers.splice(handlers.indexOf(fn), 1);
  },
}));
const { useLeaveGuard } = await import('../useLeaveGuard');
const { openLayers, popLayer, pushLayer } = await import('../layers');

/** what Capacitor's backButton listener does (src/platform/native.ts); false = the app would go back by itself */
const pressAndroidBack = () => {
  let used = false;
  act(() => {
    used = handlers.slice().reverse().some((h) => h());
  });
  return used;
};
const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let api: { asking: boolean; confirm: () => void; setDirty: (d: boolean) => void } | null = null;
function Editor({ back }: { back: () => void }) {
  const [dirty, setDirty] = useState(false);
  const g = useLeaveGuard(dirty, back);
  api = { asking: g.asking, confirm: g.confirm, setDirty };
  return null;
}
async function mount(back: () => void) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<Editor back={back} />));
  await settle();
}
afterEach(async () => {
  act(() => root?.unmount());
  await settle();
  host?.remove();
  root = null;
});

describe('bouton Retour Android dans un écran avec des modifications non enregistrées', () => {
  it('avec des modifications : il demande, un deuxième appui ferme la question, seul « Abandonner » sort', async () => {
    const back = vi.fn();
    await mount(back);
    act(() => api!.setDirty(true));
    expect(pressAndroidBack()).toBe(true);
    expect(api!.asking).toBe(true);
    expect(back).not.toHaveBeenCalled();
    expect(pressAndroidBack()).toBe(true);
    expect(api!.asking).toBe(false);
    expect(back).not.toHaveBeenCalled();
    pressAndroidBack();
    expect(api!.asking).toBe(true);
    act(() => api!.confirm());
    await settle();
    expect(back).toHaveBeenCalledTimes(1);
    expect(openLayers()).toBe(0);
  });

  it('sans modification : il sort tout de suite, sans question', async () => {
    const back = vi.fn();
    await mount(back);
    expect(pressAndroidBack()).toBe(true);
    await settle();
    expect(api!.asking).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('un panneau ouvert par-dessus se ferme d’abord, sans question', async () => {
    const back = vi.fn();
    await mount(back);
    act(() => api!.setDirty(true));
    const closed = vi.fn();
    const panel = pushLayer(closed);
    pressAndroidBack();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(api!.asking).toBe(false);
    popLayer(panel);
    await settle();
    pressAndroidBack();
    expect(api!.asking).toBe(true);
    expect(back).not.toHaveBeenCalled();
  });
});
