/**
 * v0.29: a device that lost its 3D once (graphics memory exhausted, see CoachStage) keeps the light quality in
 * automatic mode. Kept apart from the 3D bundle so the screens can set it without loading three.js.
 */
const SAFE_KEY = 'css-3d-safe';

export function readSafe3d() {
  try {
    return localStorage.getItem(SAFE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeSafe3d() {
  try {
    localStorage.setItem(SAFE_KEY, '1');
  } catch {
    /* private mode: light quality for this visit only */
  }
}
