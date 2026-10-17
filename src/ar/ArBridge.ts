/// <reference types="webxr" />
import type { WebGLRenderer } from 'three';

export type ArState = 'off' | 'starting' | 'scanning' | 'placed';

export interface ArView {
  state: ArState;
  /** a floor surface is currently found under the centre of the screen */
  surface: boolean;
  /** 1 = natural size */
  scale: number;
  /** extra rotation of the coach, degrees */
  yaw: number;
  /** the browser accepted the HTML controls on top of the camera */
  overlay: boolean;
  /** spatial anchor in use (otherwise the world-tracked reference space keeps the position) */
  anchored: boolean;
  error: string | null;
}

/**
 * Owns the WebXR "immersive-ar" session: starts it on a user gesture, keeps the hit-test source
 * that finds the floor, and holds the placement chosen by the user (position, size, rotation).
 * The 3D scene reads it every frame; React reads `view` through subscribe.
 * The camera is only open while a session exists, and every exit path ends the session.
 */
export class ArBridge {
  gl: WebGLRenderer | null = null;
  session: XRSession | null = null;
  refSpace: XRReferenceSpace | null = null;
  hitSource: XRHitTestSource | null = null;
  anchor: XRAnchor | null = null;
  /** set by a tap, consumed by the scene on the next frame that has a floor hit */
  placeRequested = false;
  recenterRequested = false;
  view: ArView = { state: 'off', surface: false, scale: 1, yaw: 0, overlay: false, anchored: false, error: null };
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  set(patch: Partial<ArView>) {
    const next = { ...this.view, ...patch };
    if ((Object.keys(patch) as (keyof ArView)[]).every((k) => next[k] === this.view[k])) return;
    this.view = next;
    this.listeners.forEach((l) => l());
  }

  /** must be called from a click handler (the browser requires a user gesture) */
  async start(overlayRoot: HTMLElement | null) {
    if (this.session || this.view.state === 'starting') return;
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    const gl = this.gl;
    if (!xr || !gl) {
      this.set({ error: 'La réalité augmentée n’est pas disponible.' });
      return;
    }
    this.set({ state: 'starting', error: null });
    let session: XRSession;
    try {
      session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'anchors', 'local-floor'],
        ...(overlayRoot ? { domOverlay: { root: overlayRoot } } : {}),
      } as XRSessionInit);
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      this.set({
        state: 'off',
        error: denied ? 'Accès à la caméra refusé : le mode classique reste actif.' : 'La session de réalité augmentée n’a pas pu démarrer sur cet appareil.',
      });
      return;
    }
    this.session = session;
    session.addEventListener('end', this.onEnd);
    session.addEventListener('select', this.onSelect);
    try {
      gl.xr.enabled = true;
      gl.xr.setReferenceSpaceType('local');
      await gl.xr.setSession(session);
      this.refSpace = await session.requestReferenceSpace('local');
      const viewer = await session.requestReferenceSpace('viewer');
      this.hitSource = (await session.requestHitTestSource?.({ space: viewer })) ?? null;
      const overlay = (session as XRSession & { domOverlayState?: { type: string } }).domOverlayState;
      this.set({ state: 'scanning', overlay: !!overlay, surface: false });
    } catch {
      this.set({ error: 'Le suivi du sol n’est pas disponible sur cet appareil.' });
      await this.stop();
    }
  }

  /** ends the session: the browser closes the camera */
  async stop() {
    const s = this.session;
    if (!s) {
      this.set({ state: 'off' });
      return;
    }
    try {
      await s.end();
    } catch {
      // already ended
      this.onEnd();
    }
  }

  /** tap on the floor, or the "Placer" button */
  requestPlace() {
    this.placeRequested = true;
  }

  /** move the coach again: back to the floor search */
  replace() {
    this.dropAnchor();
    this.placeRequested = false;
    this.set({ state: 'scanning' });
  }

  /** put the coach straight in front of the phone, facing it */
  recenter() {
    this.recenterRequested = true;
  }

  dropAnchor() {
    try {
      this.anchor?.delete();
    } catch {
      // anchor already gone
    }
    this.anchor = null;
    this.set({ anchored: false });
  }

  private onSelect = () => {
    if (this.view.state === 'scanning') this.placeRequested = true;
  };

  private onEnd = () => {
    const s = this.session;
    s?.removeEventListener('end', this.onEnd);
    s?.removeEventListener('select', this.onSelect);
    try {
      this.hitSource?.cancel();
    } catch {
      // nothing to cancel
    }
    this.hitSource = null;
    this.anchor = null;
    this.session = null;
    this.refSpace = null;
    this.placeRequested = false;
    this.recenterRequested = false;
    this.set({ state: 'off', surface: false, overlay: false, anchored: false });
  };
}
