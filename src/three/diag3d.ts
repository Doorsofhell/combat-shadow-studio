/**
 * v0.29 diagnostic of the 3D engine (Youssef, 2026-10-21: the coach vanished on his Android phone and the
 * home screen showed « Affichage 3D indisponible » after every restart). A short journal kept on the device
 * (localStorage, at most MAX entries, nothing sent anywhere) tells apart a React error, a lost graphics
 * context, a model that does not load and an animation that stops. It is shown in Réglages › Affichage 3D,
 * where it can be copied and sent. Kept apart from the 3D bundle so the screens can read it.
 */
export type DiagKind =
  | 'demarrage' // a 3D stage is created: quality, coach, model
  | 'gpu' // what the device reports about its graphics (once per stage)
  | 'modele' // a coach model finished loading
  | 'qualite' // the quality level changes (and why)
  | 'contexte-perdu'
  | 'contexte-restaure'
  | 'recuperation' // a new stage is created after a loss
  | 'echec' // the stage could not be shown (React error, context not restored)
  | 'arriere-plan' // the app is hidden or shown again (rendering paused or resumed)
  | 'animation' // the animation stopped advancing
  | 'mesure'; // periodic measurement: images per second, objects in graphics memory

export interface DiagEntry {
  /** ISO time */
  t: string;
  kind: DiagKind;
  msg: string;
}

const KEY = 'css-3d-diag';
const MAX = 80;

export function readDiag(): DiagEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function log3d(kind: DiagKind, msg: string) {
  const e: DiagEntry = { t: new Date().toISOString(), kind, msg: msg.slice(0, 400) };
  if (import.meta.env.DEV) console.info(`[3D] ${kind}: ${e.msg}`);
  else if (kind === 'echec' || kind === 'contexte-perdu') console.warn(`[3D] ${kind}: ${e.msg}`);
  try {
    const all = readDiag();
    all.push(e);
    localStorage.setItem(KEY, JSON.stringify(all.slice(-MAX)));
  } catch {
    /* storage full or private mode: the journal is only lost for this visit */
  }
}

export function clearDiag() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** the journal as plain text, to copy into a message */
export function diagText(entries = readDiag()) {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const head = [
    `Combat Shadow Studio ${import.meta.env.VITE_APP_VERSION ?? ''}`,
    nav ? `Appareil : ${nav.userAgent}` : '',
    nav && 'deviceMemory' in nav ? `Mémoire annoncée : ${(nav as { deviceMemory?: number }).deviceMemory} Go` : '',
    typeof window !== 'undefined' ? `Écran : ${window.screen?.width}×${window.screen?.height}, densité ${window.devicePixelRatio}` : '',
  ].filter(Boolean);
  return [...head, '', ...entries.map((e) => `${e.t.slice(5, 19).replace('T', ' ')} ${e.kind} : ${e.msg}`)].join('\n');
}
