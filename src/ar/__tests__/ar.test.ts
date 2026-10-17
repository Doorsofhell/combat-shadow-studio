import { describe, expect, it, vi } from 'vitest';
import { ArBridge } from '../ArBridge';
import { detectAr } from '../support';

/** minimal fake WebXR session: records listeners and end() */
function fakeXr(supported = true) {
  const listeners: Record<string, (() => void)[]> = {};
  const session = {
    ended: false,
    domOverlayState: { type: 'screen' },
    addEventListener: (t: string, f: () => void) => (listeners[t] ??= []).push(f),
    removeEventListener: (t: string, f: () => void) => (listeners[t] = (listeners[t] ?? []).filter((x) => x !== f)),
    requestReferenceSpace: vi.fn(async () => ({})),
    requestHitTestSource: vi.fn(async () => ({ cancel: vi.fn() })),
    end: vi.fn(async () => {
      session.ended = true;
      (listeners.end ?? []).forEach((f) => f());
    }),
    fire: (t: string) => (listeners[t] ?? []).forEach((f) => f()),
  };
  const xr = {
    isSessionSupported: vi.fn(async () => supported),
    requestSession: vi.fn(async () => session),
  };
  Object.defineProperty(navigator, 'xr', { value: xr, configurable: true });
  const gl = { xr: { enabled: false, setReferenceSpaceType: vi.fn(), setSession: vi.fn(async () => undefined) } };
  return { xr, session, gl };
}

describe('réalité augmentée', () => {
  it('ne touche pas à la caméra tant que l’utilisateur ne démarre pas', async () => {
    const { xr } = fakeXr();
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const b = new ArBridge();
    expect(b.view.state).toBe('off');
    expect(await detectAr()).toEqual({ ok: true });
    expect(xr.requestSession).not.toHaveBeenCalled();
  });

  it('signale clairement un appareil non compatible', async () => {
    fakeXr(false);
    const r = await detectAr();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/mode classique reste disponible/);
  });

  it('demande le suivi du sol, place le coach au toucher et ferme la caméra en sortant', async () => {
    const { xr, session, gl } = fakeXr();
    const b = new ArBridge();
    b.gl = gl as never;
    const root = document.createElement('div');
    await b.start(root);
    const init = (xr.requestSession.mock.calls[0] as unknown as [string, XRSessionInit])[1];
    expect(xr.requestSession.mock.calls[0][0]).toBe('immersive-ar');
    expect(init.requiredFeatures).toContain('hit-test');
    expect(init.domOverlay?.root).toBe(root);
    expect(b.view.state).toBe('scanning');
    expect(b.view.overlay).toBe(true);
    session.fire('select');
    expect(b.placeRequested).toBe(true);
    await b.stop();
    expect(session.end).toHaveBeenCalled();
    expect(b.view.state).toBe('off');
    expect(b.session).toBeNull();
  });

  it('revient au fond blanc si l’utilisateur refuse la caméra', async () => {
    const { xr, gl } = fakeXr();
    xr.requestSession.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    const b = new ArBridge();
    b.gl = gl as never;
    await b.start(null);
    expect(b.view.state).toBe('off');
    expect(b.view.error).toMatch(/refusé/);
  });

  it('la fin de session imposée par le système remet tout à zéro', async () => {
    const { session, gl } = fakeXr();
    const b = new ArBridge();
    b.gl = gl as never;
    await b.start(null);
    session.fire('end');
    expect(b.view.state).toBe('off');
  });
});
