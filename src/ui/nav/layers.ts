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
    stack.pop()?.close();
  });
  // Android (Capacitor): the back button closes the top layer first
  onBackButton(() => {
    const top = stack[stack.length - 1];
    if (!top) return false;
    top.close();
    popLayer(top.id);
    return true;
  });
}

/** opens a layer; `close` is called when Back is pressed while it is on top */
export function pushLayer(close: () => void): number {
  install();
  const id = ++seq;
  stack.push({ id, close });
  try {
    window.history.pushState({ ...(window.history.state ?? {}), cssLayer: id }, '');
  } catch {
    // no history (sandboxed frame): the layer still closes with its own buttons
  }
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
