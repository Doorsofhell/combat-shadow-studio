/**
 * v0.29 (Youssef, 2026-10-21: the coach vanished on his phone and never came back): graphics stability of the
 * device, kept apart from the 3D bundle so the screens can read it without loading three.js.
 *
 * Cause reproduced (scripts/dev/gpucrash.mjs, docs/v029/CORRECTIF_3D.md): when the graphics process of the
 * browser resets twice, Chrome refuses any new 3D drawing to the site for about two minutes (« Web page caused
 * context loss and was blocked »); the app showed an error and never tried again.
 *
 * Instead of a light quality kept for good after one incident, a level that goes down one step per incident
 * and back up after a calm period:
 * - 0: the quality chosen in Réglages
 * - 1: light quality (no antialiasing, no soft shadows, standard materials, one pixel per screen pixel)
 * - 2: light quality drawn at 3/4 of the screen resolution
 */
export type StabilityLevel = 0 | 1 | 2;

const KEY = 'css-3d-level';
/** the former flag (v0.29.0-proto2), read once and converted */
const OLD_KEY = 'css-3d-safe';
/** rendering without incident for this long brings the quality one step back up */
export const CALM_MS = 10 * 60_000;

interface Stored {
  level: StabilityLevel;
  /** last incident (ms since epoch) */
  at: number;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Stored;
      if (v && (v.level === 0 || v.level === 1 || v.level === 2)) return v;
    }
    if (localStorage.getItem(OLD_KEY) === '1') {
      // proto2 kept the light quality for good: it becomes level 1, which goes back up after a calm period
      const v: Stored = { level: 1, at: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(v));
      localStorage.removeItem(OLD_KEY);
      return v;
    }
  } catch {
    /* storage unavailable: normal quality */
  }
  return { level: 0, at: 0 };
}

function write(v: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* private mode: the level holds for this visit only (memory below) */
  }
  memory = v;
}

let memory: Stored | null = null;

export function stabilityLevel(): StabilityLevel {
  memory ??= read();
  return memory.level;
}

/** a graphics incident: one step down (at most 2); returns the new level */
export function stepDown(): StabilityLevel {
  const cur = stabilityLevel();
  const level = Math.min(2, cur + 1) as StabilityLevel;
  write({ level, at: Date.now() });
  return level;
}

/** calm rendering for CALM_MS since the last incident: one step back up; returns the new level */
export function stepUp(now = Date.now()): StabilityLevel {
  const cur = stabilityLevel();
  if (cur === 0 || now - (memory?.at ?? 0) < CALM_MS) return cur;
  const level = (cur - 1) as StabilityLevel;
  // the calm period starts again for the next step
  write({ level, at: now });
  return level;
}

/** Réglages › Affichage 3D: back to the chosen quality at once */
export function resetStability() {
  write({ level: 0, at: 0 });
}

/** for tests: forget the cached level */
export function _reloadStability() {
  memory = null;
}
