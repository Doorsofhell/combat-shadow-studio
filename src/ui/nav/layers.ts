import { onBackButton } from '../../platform/native';

/**
 * v0.32 smart back (PROMPT MAÎTRE, section 11: « Si un panneau est ouvert, Retour ferme d'abord le panneau »): every
 * sheet opened from the bar is a « layer » with its own history entry, so the Android back button, the back gesture
 * of the installed PWA and the browser's Back close the sheet first and leave the page where it is.
 *
 * The entries are pushed and removed from event handlers only (never from effects, which React runs twice in
 * development), and they keep the URL: the router sees the same page.
 */
interface Layer {
  id: number;
  close: () => void;
  /** 1.42.0: a guard stays in place after Back (see pushGuard) */
  guard?: boolean;
}

const stack: Layer[] = [];
let seq = 0;
/** history.back() calls made here, whose popstate must not close another layer */
let ownPops = 0;
let afterPop: (() => void)[] = [];
let installed = false;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('popstate', () => {
    if (ownPops > 0) {
      ownPops--;
      const run = afterPop;
      afterPop = [];
      run.forEach((f) => f());
      return;
    }
    // Back pressed by the user: the top layer closes, the page stays
    const top = stack[stack.length - 1];
    if (!top) return;
    if (!top.guard) {
      stack.pop();
      top.close();
      return;
    }
    // a guard answers and stays: its history entry, just used by this Back, is put back (unless it left by itself)
    top.close();
    if (stack.includes(top)) pushEntry(top.id);
  });
  // Android (Capacitor): the back button closes the top layer first
  onBackButton(() => {
    const top = stack[stack.length - 1];
    if (!top) return false;
    top.close();
    // a guard keeps its place and its history entry (the native button did not use it)
    if (!top.guard) popLayer(top.id);
    return true;
  });
}

function pushEntry(id: number) {
  try {
    window.history.pushState({ ...(window.history.state ?? {}), cssLayer: id }, '');
  } catch {
    // no history (sandboxed frame): the layer still closes with its own buttons
  }
}

/** opens a layer; `close` is called when Back is pressed while it is on top */
export function pushLayer(close: () => void): number {
  install();
  const id = ++seq;
  stack.push({ id, close });
  pushEntry(id);
  return id;
}

/**
 * 1.42.0 (Youssef, 2026-11-11: « Revois aussi le retour arrière quand on est en plein écran »; rule validated the
 * same day: « un Retour = un seul pas en arrière »): a guard is a layer that stays. Each Back (Android button, back
 * gesture, browser) calls `onBack` and the page is kept, until the screen removes the guard with popLayer (which
 * also gives the moment to really leave, through its `then`). Used by the session: Back leaves the fullscreen first,
 * then pauses and asks before leaving; it never leaves by itself.
 */
export function pushGuard(onBack: () => void): number {
  install();
  const id = ++seq;
  stack.push({ id, close: onBack, guard: true });
  pushEntry(id);
  return id;
}

/**
 * Closes a layer from the screen (its close button, the scrim, a choice): its history entry is removed, then
 * `then` runs (a page change waits for it, so the new page is never removed by that history.back()).
 */
export function popLayer(id: number, then?: () => void) {
  const i = stack.findIndex((l) => l.id === id);
  if (i < 0) {
    then?.();
    return;
  }
  stack.splice(i, 1);
  if ((window.history.state as { cssLayer?: number } | null)?.cssLayer === id) {
    ownPops++;
    if (then) afterPop.push(then);
    window.history.back();
  } else then?.();
}

/** a page left with layers still open (a link inside a sheet): they are forgotten, the history is left as it is */
export function forgetLayers() {
  stack.length = 0;
}

export const openLayers = () => stack.length;
