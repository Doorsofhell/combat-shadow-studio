/**
 * Android (Capacitor) integration. Every function also works in the browser, where it falls back
 * to the web APIs, so the same code ships as the PWA and as the Android app.
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNative = () => Capacitor.isNativePlatform();

// ------------------------------------------------------------------ screen kept on while training
let wakeLock: { release: () => Promise<void> } | null = null;

export async function keepScreenOn(on: boolean) {
  try {
    if (isNative()) {
      if (on) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
      return;
    }
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    if (on && !wakeLock && nav.wakeLock) wakeLock = await nav.wakeLock.request('screen');
    if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    // not supported or refused: training still works, the screen may just dim
  }
}

// ------------------------------------------------------------------ app going to the background
const pauseListeners = new Set<() => void>();

/** called when the app is sent to the background, the screen turns off or a call comes in */
export function onAppPause(fn: () => void) {
  pauseListeners.add(fn);
  return () => pauseListeners.delete(fn);
}

/**
 * 0.27: screens can take the Android back button first (a total fullscreen closes before the page is left).
 * The last registered handler is asked first; returning true consumes the press.
 */
const backHandlers: (() => boolean)[] = [];
export function onBackButton(fn: () => boolean) {
  backHandlers.push(fn);
  return () => {
    const i = backHandlers.lastIndexOf(fn);
    if (i >= 0) backHandlers.splice(i, 1);
  };
}

let installed = false;

/** Android lifecycle and back button; safe to call several times */
export function installNativeHandlers() {
  if (installed || !isNative()) return;
  installed = true;
  void App.addListener('pause', () => pauseListeners.forEach((f) => f()));
  void App.addListener('backButton', ({ canGoBack }) => {
    for (let i = backHandlers.length - 1; i >= 0; i--) if (backHandlers[i]()) return;
    if (canGoBack && location.hash && location.hash !== '#/') history.back();
    else void App.minimizeApp();
  });
}

// ------------------------------------------------------------------ export file
/** Saves a JSON backup: browser download, or the Android share sheet (Drive, Files, e-mail...) */
export async function saveTextFile(name: string, text: string): Promise<string> {
  if (isNative()) {
    const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Sauvegarde Combat Shadow Studio', files: [res.uri], dialogTitle: 'Enregistrer la sauvegarde' });
    return 'Choisis où enregistrer la sauvegarde.';
  }
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'Sauvegarde exportée.';
}
