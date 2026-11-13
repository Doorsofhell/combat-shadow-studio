import type { ReactElement } from 'react';
import type { DisciplineId } from '../../domain/types';

/**
 * Variant C of the discipline emblems: the same six objects as the 3D renders and the semi-flat icons, reduced to
 * a monochrome outline on a 24 × 24 grid (stroke 1.75, round ends). They take `currentColor`, so they follow the
 * text colour of the theme; meant for 24 and 32 px (chips, filters, lists).
 */
export const OUTLINE_DRAWINGS: Record<DisciplineId, ReactElement> = {
  // boxing glove: mitt, thumb, cuff with its band
  boxe: (
    <>
      <path d="M8 14h9V8.6C17 5.4 15 3 12.2 3 9.4 3 7.6 5 7.6 8v1" />
      <path d="M7.6 9C5.9 9 5 10.2 5 11.6 5 13 6.1 14 8 14" />
      <rect x="8" y="14" width="9" height="6.5" rx="1.2" />
      <path d="M8 17.2h9" />
    </>
  ),
  // shin guard: the shell with its centre panel, the instep pad, two straps
  kickboxing: (
    <>
      <path d="M8 3h8l-.5 11h-7z" />
      <path d="M12 5.5v6" />
      <path d="M8.5 14h7l.6 3.3c.3 1.7-.9 3.2-2.6 3.2H10.5c-1.7 0-2.9-1.5-2.6-3.2z" />
      <path d="M6.6 6.5H8M16 6.5h1.4M6.8 10.5h1.4M15.8 10.5h1.4" />
    </>
  ),
  // open-finger glove: knuckle pad, three finger loops, palm and wrist strap
  mma: (
    <>
      <path d="M6 7C6 4.8 7.8 3 10 3h4c2.2 0 4 1.8 4 4v2H6z" />
      <path d="M6 9v4.4c0 1.3.6 2.5 1.6 3.2v3.9h8.8v-3.9c1-.7 1.6-1.9 1.6-3.2V9" />
      <path d="M7.8 9v1.4a1.3 1.3 0 0 0 2.6 0V9M10.7 9v1.4a1.3 1.3 0 0 0 2.6 0V9M13.6 9v1.4a1.3 1.3 0 0 0 2.6 0V9" />
      <path d="M7.6 16.6h8.8" />
    </>
  ),
  // mongkol: the braided ring and its two tails, wraps on the ring
  muaythai: (
    <>
      <ellipse cx="12" cy="9" rx="7.5" ry="4.8" />
      <path d="M10.6 13.7 9.6 21M13.4 13.7l1 7.3" />
      <path d="M5.6 6.2 7 7.6M18.4 6.2 17 7.6M12 4.2v1.6M8.8 20.4h1.6M13.6 20.4h1.6" />
    </>
  ),
  // BJJ belt: the waist band, the knot, two tails, the rank bar on one tail
  bjj: (
    <>
      <path d="M3 7.5c2.6 1.9 5.6 2.8 9 2.8s6.4-.9 9-2.8M3 10.6c2.6 1.9 5.6 2.8 9 2.8s6.4-.9 9-2.8" />
      <rect x="10" y="9" width="4" height="4.6" rx="1" />
      <path d="M10.6 13.6 8 21h3l1.4-5.4M13.4 13.6 16 21h-3l-.6-2.4" />
      <path d="m8.6 18.6 2.9.6" strokeWidth="2.6" />
    </>
  ),
  // judo: the folded jacket with its crossed collar, the black belt and its knot
  judo: (
    <>
      <rect x="4" y="4" width="16" height="15" rx="2" />
      <path d="M9.2 4 15 13M14.8 4 9 13" />
      <path d="M4 13h16M4 15.6h16" />
      <rect x="10.6" y="12.2" width="2.8" height="4.2" rx=".6" />
      <path d="M11 16.4 9.6 21M13 16.4l1.4 4.6" />
    </>
  ),
};
