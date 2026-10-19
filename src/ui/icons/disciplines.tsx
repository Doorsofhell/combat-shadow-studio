import type { ReactElement } from 'react';
import type { DisciplineId } from '../../domain/types';

/**
 * The six official discipline icons: one sports object per discipline, drawn here (original SVG,
 * no external source), lit from the top left like every icon of the charter.
 * Each drawing exists in two levels of detail on the same 64 × 64 grid:
 * - `full` from 40 px (cards, headers): seams, laces, highlights;
 * - `compact` below (tabs, chips, filters): the same silhouette and colours, thicker shapes, no fine lines.
 * `u` prefixes the gradient ids so several icons can live on one page.
 */
export type Detail = 'full' | 'compact';
type Draw = (u: string, d: Detail) => ReactElement;

const RED = ['#ff5964', '#e11d2f', '#a50f1f', '#6e0814'];
const INK = ['#4a5363', '#2a313d', '#161b23', '#0b0f14'];
const GOLD = ['#f6dd8a', '#d4af37', '#a7841f', '#6f560f'];
const CLOTH = ['#ffffff', '#eef0f3', '#c9ced6', '#8e95a1'];

/** vertical light: lit top, shaded bottom */
const lin = (id: string, c: string[], x1 = 0.2, y1 = 0, x2 = 0.8, y2 = 1) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    <stop offset="0" stopColor={c[0]} />
    <stop offset="0.45" stopColor={c[1]} />
    <stop offset="1" stopColor={c[2]} />
  </linearGradient>
);
/** rounded volume: highlight at the top left, darker rim */
const rad = (id: string, c: string[], cx = 0.35, cy = 0.28) => (
  <radialGradient id={id} cx={cx} cy={cy} r="0.85">
    <stop offset="0" stopColor={c[0]} />
    <stop offset="0.5" stopColor={c[1]} />
    <stop offset="1" stopColor={c[3]} />
  </radialGradient>
);
/** soft contact shadow under the object, the same for every discipline */
const floor = (u: string) => (
  <>
    <radialGradient id={`${u}fl`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#000" stopOpacity="0.45" />
      <stop offset="1" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </>
);
/** thin light rim so dark objects stay readable on the dark background */
const RIM = { stroke: '#ffffff', strokeOpacity: 0.16, strokeWidth: 0.8 } as const;
const Floor = ({ u, y = 59, rx = 20 }: { u: string; y?: number; rx?: number }) => <ellipse cx="32" cy={y} rx={rx} ry="3.2" fill={`url(#${u}fl)`} />;

/** Boxe anglaise: a laced boxing glove, three-quarter view */
const boxe: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {rad(`${u}g`, RED, 0.38, 0.25)}
      {rad(`${u}t`, RED, 0.3, 0.3)}
      {lin(`${u}c`, ['#f4f5f7', '#d9dde3', '#9aa1ac'])}
      {lin(`${u}b`, INK)}
    </defs>
    <Floor u={u} />
    {/* cuff */}
    <path d="M20.5 39 L45.5 39 L44.5 55.5 Q32.5 59.5 21.5 55.5 Z" fill={`url(#${u}c)`} />
    <path d="M20.3 43.5 L45.7 43.5 L45.2 50.5 Q32.5 53.5 20.8 50.5 Z" fill={`url(#${u}b)`} />
    <path d="M20.6 46.9 L45.4 46.9" stroke="#e11d2f" strokeWidth={d === 'full' ? 1.2 : 1.8} />
    {/* fist */}
    <path d="M18.5 30 C14.5 18 21 6.5 33 6 C46 5.5 53 15 51 27 C49.8 34.5 46 39.5 39 40.5 L24 40.5 C21 39.5 19.5 35 18.5 30 Z" fill={`url(#${u}g)`} />
    {/* thumb */}
    <path d="M17.5 24.5 C12.5 26.5 12.5 35 17.5 38.5 C21 41 27.5 40.5 29.5 37.5 C30.8 35.4 29.3 33 26.8 33 C23.4 33 21.8 29.6 22.3 26.4 C22.6 24.3 20.3 23.4 17.5 24.5 Z" fill={`url(#${u}t)`} />
    {d === 'full' && (
      <>
        <path d="M22.5 19.5 C29 15.8 39.5 15.5 48.5 19.6" fill="none" stroke="#6e0814" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        <path d="M23 36.6 C24.8 37.6 27 37.6 28.3 36.6" fill="none" stroke="#6e0814" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      </>
    )}
    {/* specular highlight */}
    <ellipse cx="29" cy="12.5" rx={d === 'full' ? 7.5 : 6.5} ry="3" fill="#fff" opacity="0.32" transform="rotate(-14 29 12.5)" />
  </>
);

/** Kick-boxing: a padded shin and instep guard */
const kickboxing: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {lin(`${u}s`, INK, 0.1, 0, 0.9, 0.6)}
      {lin(`${u}r`, RED, 0, 0, 1, 0.4)}
      {lin(`${u}f`, INK, 0.2, 0, 0.6, 1)}
    </defs>
    <Floor u={u} y={59.5} rx={22} />
    {/* shin pad */}
    <path d="M22 6.5 C27 4.5 36 4.5 40.5 6.8 C42.5 8 43 10.5 42.6 13 L39.8 38.5 C39.4 41.5 37 43.5 34 43.5 L27.6 43.5 C24.8 43.5 22.6 41.5 22.3 38.6 L19.8 12.8 C19.5 10 20.2 7.3 22 6.5 Z" fill={`url(#${u}s)`} {...RIM} />
    {/* red front panel */}
    <path d="M26.5 9.2 C29.5 8.3 33.2 8.3 36.2 9.2 L34.2 39 C33.9 40.4 32.8 41 31.4 41 C30 41 28.9 40.4 28.6 39 Z" fill={`url(#${u}r)`} />
    {/* instep */}
    <path d="M24.5 42.5 L38.5 42.5 C43.5 44.5 49.5 47.5 52 51 C53.4 53 52.4 55.6 49.6 56 L27 56.4 C24.2 56.4 22.4 54.4 22.6 51.8 Z" fill={`url(#${u}f)`} {...RIM} />
    <path d="M30 44.5 C36 45.6 43.5 48.3 47.5 51.7" fill="none" stroke="#e11d2f" strokeWidth={d === 'full' ? 1.6 : 2.4} strokeLinecap="round" />
    {/* straps */}
    <path d="M20.6 19 L42 19 L41.6 23.4 L21 23.4 Z" fill="#0b0f14" opacity="0.9" />
    <path d="M21.6 30 L41 30 L40.6 34.2 L22 34.2 Z" fill="#0b0f14" opacity="0.9" />
    {d === 'full' && (
      <g stroke="#9aa1ac" strokeWidth="0.6" strokeDasharray="1.2 1.2" opacity="0.7" fill="none">
        <path d="M21.2 19.9 L41.9 19.9 M21.6 30.9 L40.9 30.9" />
        <path d="M27.3 11 L29.3 38.2 M35.4 11 L33.5 38.2" />
      </g>
    )}
    <path d="M23.5 8.6 C26 7.4 29 7 31.5 7 L30.2 12 C27.6 12.3 25.6 12.9 23.9 13.8 Z" fill="#fff" opacity="0.22" />
  </>
);

/** MMA: an open-finger grappling glove */
const mma: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {rad(`${u}k`, INK, 0.36, 0.22)}
      {lin(`${u}r`, RED, 0, 0, 1, 0.5)}
      {lin(`${u}w`, INK, 0.2, 0, 0.7, 1)}
    </defs>
    <Floor u={u} />
    {/* wrist strap */}
    <path d="M19.5 40 L45 40 L44.2 55 Q32 58.6 20.5 55 Z" fill={`url(#${u}w)`} {...RIM} />
    <path d="M19.8 44.3 L44.8 44.3 L44.5 49 Q32 52 20.1 49 Z" fill={`url(#${u}r)`} />
    {/* finger loops: open fingers */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={20.6 + i * 6.6} y={4.8 + (i === 0 || i === 3 ? 2.2 : 0)} width="5.8" height="10.6" rx="2.9" fill="#d9a184" />
        <rect x={20.6 + i * 6.6} y={4.8 + (i === 0 || i === 3 ? 2.2 : 0)} width="5.8" height="4.6" rx="2.3" fill="#f0c3a6" opacity="0.7" />
      </g>
    ))}
    {/* padded knuckles */}
    <path d="M18.6 16.5 C18.6 13.4 20.8 11.6 24 11.6 L44.5 11.6 C47.6 11.6 49.6 13.6 49.6 16.6 L49.4 31 C49.2 36.8 45.2 40.8 39.4 40.8 L26.4 40.8 C21.6 40.8 18.6 37.4 18.6 32.8 Z" fill={`url(#${u}k)`} {...RIM} />
    {/* knuckle seam and thumb */}
    <path d="M19.4 24.6 C29 26.8 39.6 26.8 49.2 24.6" fill="none" stroke="#e11d2f" strokeWidth={d === 'full' ? 1.4 : 2.2} strokeLinecap="round" />
    <path d="M18.8 26.5 C14.2 27.6 13.8 34.6 17.6 37.6 C20.6 40 25.6 39.6 27 37.2 C28 35.4 26.6 33.6 24.6 33.6 C22 33.6 20.8 30.8 21.2 28.4 Z" fill={`url(#${u}w)`} />
    {d === 'full' && (
      <g fill="none" stroke="#4a5363" strokeWidth="0.6" strokeDasharray="1.1 1.1" opacity="0.9">
        <path d="M20.4 16.4 C30 14.6 39 14.6 47.8 16.4" />
      </g>
    )}
    <ellipse cx="29" cy="17.4" rx="7" ry="2.2" fill="#fff" opacity="0.2" transform="rotate(-6 29 17.4)" />
  </>
);

/** Muay-thaï: the mongkol, the woven ceremonial headband, with its tail */
const muaythai: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {lin(`${u}o`, GOLD, 0.2, 0, 0.8, 1)}
      {lin(`${u}i`, ['#a7841f', '#6f560f', '#3b2d06'], 0, 0, 0, 1)}
      {lin(`${u}t`, RED, 0, 0, 1, 1)}
    </defs>
    <Floor u={u} y={58} rx={23} />
    {/* tail, hanging behind */}
    <path d="M31 40 C32 46 34.6 51.5 39.5 55.6 L35.2 57.6 C30.4 53.4 27.6 47.6 27 41.2 Z" fill={`url(#${u}t)`} />
    {/* ring: back then front, seen from slightly above */}
    <ellipse cx="32" cy="27" rx="22" ry="13.5" fill="none" stroke={`url(#${u}i)`} strokeWidth="7" />
    <path d="M10 27 C10 35 19.8 40.5 32 40.5 C44.2 40.5 54 35 54 27" fill="none" stroke={`url(#${u}o)`} strokeWidth="7.4" strokeLinecap="round" />
    {/* rope weave */}
    {d === 'full' ? (
      <g stroke="#6f560f" strokeWidth="1" strokeLinecap="round" opacity="0.75">
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI * (0.06 + (i * 0.88) / 12);
          const x = 32 - 22 * Math.cos(a);
          const y = 27 + 13.5 * Math.sin(a);
          return <path key={i} d={`M${(x - 1.6).toFixed(2)} ${(y - 2.8).toFixed(2)} l3.2 5.4`} />;
        })}
      </g>
    ) : null}
    {/* knot at the front */}
    <path d="M27 36.6 C28.6 34.8 35.4 34.8 37 36.6 L36.2 43.4 C34.6 45 29.4 45 27.8 43.4 Z" fill={`url(#${u}t)`} />
    {d === 'full' && <path d="M28.6 38.4 L35.4 38.4 M28.8 41.2 L35.2 41.2" stroke="#6e0814" strokeWidth="0.9" opacity="0.7" />}
    {/* highlight on the front of the ring */}
    <path d="M14.5 31.5 C18.5 35.5 24 37.2 29 37.6" fill="none" stroke="#fff6cf" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
  </>
);

/** Jiu-jitsu brésilien: a tied black belt with its red rank bar */
const bjj: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {lin(`${u}b`, INK, 0.2, 0, 0.6, 1)}
      {lin(`${u}r`, RED, 0, 0, 0, 1)}
    </defs>
    <Floor u={u} y={59} rx={22} />
    {/* belt loop seen from above */}
    <ellipse cx="32" cy="22" rx="21" ry="11" fill="none" stroke="#3a4250" strokeWidth="7.6" />
    <ellipse cx="32" cy="22" rx="21" ry="11" fill="none" stroke="#1b212b" strokeWidth="6" />
    <path d="M11 22 C11 28.4 20.4 33 32 33 C43.6 33 53 28.4 53 22" fill="none" stroke={`url(#${u}b)`} strokeWidth="7" strokeLinecap="round" />
    {/* hanging ends */}
    <path d="M27.6 31.2 L21.2 53.2 L28.4 54.8 L33 33.6 Z" fill={`url(#${u}b)`} {...RIM} />
    <path d="M35.4 31.6 L42.2 52 L35.2 54.6 L31 33.8 Z" fill={`url(#${u}b)`} {...RIM} />
    {/* red bars (black belt rank bar) near the tips */}
    <path d="M22.9 47.4 L29.7 48.9 L28.7 53.4 L21.6 51.8 Z" fill={`url(#${u}r)`} />
    <path d="M40.3 46.2 L42 51.4 L35.6 53.6 L34.2 48.4 Z" fill={`url(#${u}r)`} />
    {d === 'full' && (
      <g stroke="#f4f4f5" strokeWidth="0.8" opacity="0.9">
        <path d="M23.8 48.6 L28.6 49.7 M23.3 50.6 L28.2 51.7 M35.2 49.4 L40.9 47.5 M35.7 51.4 L41.4 49.5" />
      </g>
    )}
    {/* knot */}
    <path d="M26.6 26.6 C28.6 25 35.4 25 37.4 26.6 L38.2 33 C36.4 35.4 27.6 35.4 25.8 33 Z" fill={`url(#${u}b)`} {...RIM} />
    <path d="M27.2 29 C30.4 31.2 33.6 31.2 36.8 29" fill="none" stroke="#000" strokeWidth="1" opacity="0.55" />
    {d === 'full' && (
      <g fill="none" stroke="#5a6375" strokeWidth="0.55" strokeDasharray="1 1" opacity="0.9">
        <path d="M13.6 25.4 C19 29.6 26 31.4 32 31.4 C38 31.4 45 29.6 50.4 25.4" />
      </g>
    )}
    <path d="M15 24.6 C19.6 28.2 25.6 29.8 30 30" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.22" />
  </>
);

/** Judo: a folded white judogi jacket with its black belt */
const judo: Draw = (u, d) => (
  <>
    <defs>
      {floor(u)}
      {lin(`${u}w`, CLOTH, 0.25, 0, 0.75, 1)}
      {lin(`${u}s`, ['#e4e7ec', '#c2c8d1', '#8e95a1'], 0, 0, 1, 1)}
      {lin(`${u}b`, INK, 0.2, 0, 0.6, 1)}
    </defs>
    <Floor u={u} y={59.4} rx={24} />
    {/* sleeves */}
    <path d="M17 12 C11 14 6.5 22 5.6 34 L13.6 36 C14.6 28 17 22.6 20.6 19.6 Z" fill={`url(#${u}s)`} />
    <path d="M47 12 C53 14 57.5 22 58.4 34 L50.4 36 C49.4 28 47 22.6 43.4 19.6 Z" fill={`url(#${u}s)`} />
    {/* body */}
    <path d="M17.6 10.6 L26.4 7.4 L32 13 L37.6 7.4 L46.4 10.6 C48.6 18 49 34 47.6 56 L16.4 56 C15 34 15.4 18 17.6 10.6 Z" fill={`url(#${u}w)`} />
    {/* crossed lapels */}
    <path d="M26.4 7.4 L32 13 L40.8 36.6 L36.2 38.6 L24 10.6 Z" fill="#dfe3e9" />
    <path d="M37.6 7.4 L40 10.6 L29.6 37.6 L25.4 36 L32 13 Z" fill={`url(#${u}w)`} />
    <path d="M37.6 7.4 L40 10.6 L29.6 37.6" fill="none" stroke="#8e95a1" strokeWidth={d === 'full' ? 0.9 : 1.3} />
    {d === 'full' && (
      <g fill="none" stroke="#aab0ba" strokeWidth="0.55" strokeDasharray="1 1">
        <path d="M27 9.6 L35.6 31.6 M36.8 10 L28.6 32" />
      </g>
    )}
    {/* black belt and knot */}
    <path d="M15.8 38 C26 40.4 38 40.4 48.2 38 L48.4 43.6 C38 46 26 46 15.6 43.6 Z" fill={`url(#${u}b)`} />
    <path d="M29 38.6 C30.8 37.6 34 37.6 35.6 38.8 L35.8 44.4 C34 45.4 30.6 45.4 28.8 44.4 Z" fill="#161b23" />
    <path d="M30 44.6 L26.6 55.4 L30.6 56 L32.4 45 Z M34.4 44.6 L38.4 55 L34.6 56.2 L32.6 45 Z" fill={`url(#${u}b)`} />
    {/* highlight on the left shoulder */}
    <path d="M19.4 13 C21 11.6 23 10.6 25 10" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
  </>
);

export const DISCIPLINE_DRAWINGS: Record<DisciplineId, Draw> = { boxe, kickboxing, mma, muaythai, bjj, judo };

/** what each icon shows, for the inventory and screen readers when the name is not written next to it */
export const DISCIPLINE_ICON_ALT: Record<DisciplineId, string> = {
  boxe: 'Gant de boxe',
  kickboxing: 'Protège-tibia de kick-boxing',
  mma: 'Gant de MMA à doigts ouverts',
  muaythai: 'Mongkol de muay-thaï',
  bjj: 'Ceinture noire de jiu-jitsu brésilien',
  judo: 'Judogi blanc et ceinture noire',
};
