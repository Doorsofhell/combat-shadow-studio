/**
 * 2.10.6: what the bar, the menu and the settings need to know about the versions, without the whole history of
 * src/domain/releases.ts (loaded only with « Nouveautés »). The latest version is the package version
 * (VITE_APP_VERSION, set from package.json in vite.config.ts) without a « -protoN » suffix; the tests check that it
 * is the first entry of RELEASES.
 */
export const LATEST_RELEASE_VERSION: string = String(import.meta.env?.VITE_APP_VERSION ?? '').replace(/-.*$/, '');

/** a version the user has not opened yet: the red dots of Menu and Nouveautés */
export const hasUnseenRelease = (seen: string | null | undefined) => seen !== LATEST_RELEASE_VERSION;

/** 2026-10-22 → « 22 octobre 2026 » */
export function releaseDateLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d} ${months[m - 1]} ${y}`;
}
