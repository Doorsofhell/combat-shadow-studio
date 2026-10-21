import type { ReactElement } from 'react';

/**
 * Interface glyphs of the charter, on a 24 × 24 grid, solid style.
 * A glyph is a stencil: what is drawn in white (`W`) is the icon, what is drawn in black (`K`)
 * cuts a hole in it. `AppIcon` uses it as a mask over the icon colour and a soft top-light gradient,
 * so every glyph gets the same light, volume and colour states without carrying any colour itself.
 * Keep strokes at 2 or more and holes at 1.5 or more: they must stay sharp at 20 px.
 */
const W = '#fff';
const K = '#000';
const line = { fill: 'none', stroke: W, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const cut = { fill: 'none', stroke: K, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const GLYPHS = {
  /* ---------------------------------------------------------------- navigation */
  home: (
    <>
      <path d="M12 2.6 1.9 11.1a1 1 0 0 0 .64 1.77H4.5V20a1.6 1.6 0 0 0 1.6 1.6h3.6v-5.4a2.3 2.3 0 0 1 4.6 0v5.4h3.6a1.6 1.6 0 0 0 1.6-1.6v-7.12h1.96a1 1 0 0 0 .64-1.77z" fill={W} />
    </>
  ),
  /** Entraîner: a heavy bag on its chains */
  train: (
    <>
      <path d="M12 1.4v2.4M12 3.8 7.6 7.4M12 3.8l4.4 3.6" {...line} strokeWidth={1.8} />
      <path d="M7.4 6.4h9.2a2 2 0 0 1 2 2v10.4c0 2.1-2.9 3.8-6.6 3.8s-6.6-1.7-6.6-3.8V8.4a2 2 0 0 1 2-2z" fill={W} />
      <path d="M5.4 10.6h13.2M5.4 17h13.2" {...cut} strokeWidth={1.6} />
    </>
  ),
  techniques: (
    <>
      <path d="M12 2.4 2.4 7.3 12 12.2l9.6-4.9z" fill={W} />
      <path d="m4.6 11.1-2.2 1.1 9.6 4.9 9.6-4.9-2.2-1.1-7.4 3.8z" fill={W} />
      <path d="m4.6 16-2.2 1.1 9.6 4.9 9.6-4.9-2.2-1.1-7.4 3.8z" fill={W} />
    </>
  ),
  /** Coach: the coach (bust) and his speech bubble */
  coach: (
    <>
      <circle cx="9" cy="7.2" r="4.2" fill={W} />
      <path d="M1.6 20.4c0-4.1 3.3-7.2 7.4-7.2s7.4 3.1 7.4 7.2c0 .7-.5 1.2-1.2 1.2H2.8c-.7 0-1.2-.5-1.2-1.2z" fill={W} />
      <path d="M15.4 2.2h5.4a1.8 1.8 0 0 1 1.8 1.8v3.6a1.8 1.8 0 0 1-1.8 1.8h-2.6l-2.4 2v-2h-.4a1.8 1.8 0 0 1-1.8-1.8V4a1.8 1.8 0 0 1 1.8-1.8z" fill={W} />
    </>
  ),
  coachAi: (
    <>
      <path d="M4.4 3h15.2A2.4 2.4 0 0 1 22 5.4v10.2a2.4 2.4 0 0 1-2.4 2.4h-7.4l-5 3.8a.8.8 0 0 1-1.3-.6V18H4.4A2.4 2.4 0 0 1 2 15.6V5.4A2.4 2.4 0 0 1 4.4 3z" fill={W} />
      <circle cx="7.8" cy="10.5" r="1.4" fill={K} />
      <circle cx="12" cy="10.5" r="1.4" fill={K} />
      <circle cx="16.2" cy="10.5" r="1.4" fill={K} />
    </>
  ),
  progress: (
    <>
      <rect x="2.6" y="13" width="4.6" height="8.6" rx="1.4" fill={W} />
      <rect x="9.7" y="8" width="4.6" height="13.6" rx="1.4" fill={W} />
      <rect x="16.8" y="2.6" width="4.6" height="19" rx="1.4" fill={W} />
    </>
  ),
  legends: <path d="m12 1.9 2.95 6.2 6.8.84-5 4.68 1.3 6.73L12 17.06l-6.05 3.29 1.3-6.73-5-4.68 6.8-.84z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1.2" />,

  /* ---------------------------------------------------------------- quick access */
  programs: (
    <>
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5" fill={W} />
      <path d="M9.4 7.2v9.6l7.6-4.8z" fill={K} />
    </>
  ),
  combos: (
    <>
      <circle cx="12" cy="12" r="9.6" fill={W} />
      <circle cx="12" cy="12" r="6.4" fill={K} />
      <circle cx="12" cy="12" r="3.6" fill={W} />
      <path d="m12 12 8.8-8.8" {...cut} strokeWidth={3.4} />
      <path d="m12 12 7.4-7.4M17.2 2.6v4.2h4.2" {...line} strokeWidth={2} />
    </>
  ),
  challenges: (
    <>
      <path d="M6 2.4h12v2h3a1 1 0 0 1 1 1.1c-.3 3.6-2.2 6-5 6.6A6 6 0 0 1 13.4 15v2.6h3.2a1.2 1.2 0 0 1 1.2 1.2v2.6H6.2v-2.6a1.2 1.2 0 0 1 1.2-1.2h3.2V15A6 6 0 0 1 7 12.1c-2.8-.6-4.7-3-5-6.6a1 1 0 0 1 1-1.1h3z" fill={W} />
      <path d="M6 6.4H4.2c.3 1.8 1 3 2.1 3.6A8 8 0 0 1 6 8zM18 6.4h1.8c-.3 1.8-1 3-2.1 3.6.2-.6.3-1.3.3-2z" fill={K} />
    </>
  ),
  favorite: <path d="M12 21.2 10.6 20C5.4 15.4 2 12.4 2 8.6 2 5.6 4.4 3.2 7.4 3.2c1.7 0 3.4.8 4.6 2.1 1.2-1.3 2.9-2.1 4.6-2.1 3 0 5.4 2.4 5.4 5.4 0 3.8-3.4 6.8-8.6 11.4z" fill={W} />,
  favoriteOutline: <path d="M12 19.6 11.2 18.9C6.4 14.6 3.4 12 3.4 8.7 3.4 6.4 5.2 4.6 7.4 4.6c1.4 0 2.8.7 3.6 1.9l1 1.3 1-1.3c.8-1.2 2.2-1.9 3.6-1.9 2.2 0 4 1.8 4 4.1 0 3.3-3 5.9-7.8 10.2z" {...line} />,
  history: (
    <>
      <circle cx="12" cy="12" r="9.8" fill={W} />
      <path d="M12 6.6V12l3.6 2.4" {...cut} strokeWidth={2.2} />
    </>
  ),
  search: (
    <>
      <circle cx="10.2" cy="10.2" r="6.6" {...line} strokeWidth={2.6} />
      <path d="m15.2 15.2 5.8 5.8" {...line} strokeWidth={3.2} />
    </>
  ),
  filters: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" {...line} strokeWidth={2} />
      <circle cx="15.5" cy="6" r="2.8" fill={W} />
      <circle cx="8.5" cy="12" r="2.8" fill={W} />
      <circle cx="13.5" cy="18" r="2.8" fill={W} />
      <circle cx="15.5" cy="6" r="1" fill={K} />
      <circle cx="8.5" cy="12" r="1" fill={K} />
      <circle cx="13.5" cy="18" r="1" fill={K} />
    </>
  ),
  collection: <path d="M2 6.2A2.2 2.2 0 0 1 4.2 4h5.1l2.2 2.4h8.3A2.2 2.2 0 0 1 22 8.6v9.2a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 17.8z" fill={W} />,
  library: (
    <>
      <rect x="2.6" y="3" width="4.6" height="18" rx="1.2" fill={W} />
      <rect x="8.4" y="5" width="4.6" height="16" rx="1.2" fill={W} />
      <path d="m14.4 6.6 4.4-1.2 3.6 13.6-4.4 1.2z" fill={W} />
      <path d="M3.8 7h2.2M9.6 9h2.2" {...cut} strokeWidth={1.4} />
    </>
  ),
  calendar: (
    <>
      <path d="M5 4.2h14a2.6 2.6 0 0 1 2.6 2.6v12.4a2.6 2.6 0 0 1-2.6 2.6H5a2.6 2.6 0 0 1-2.6-2.6V6.8A2.6 2.6 0 0 1 5 4.2z" fill={W} />
      <path d="M2.4 9.2h19.2" {...cut} />
      <path d="M7.6 2.2v4M16.4 2.2v4" {...line} />
      <rect x="6" y="12" width="3" height="2.6" rx=".6" fill={K} />
      <rect x="10.5" y="12" width="3" height="2.6" rx=".6" fill={K} />
      <rect x="15" y="12" width="3" height="2.6" rx=".6" fill={K} />
      <rect x="6" y="16.2" width="3" height="2.6" rx=".6" fill={K} />
    </>
  ),
  /** Créer un enchaînement: blocks put in sequence */
  compose: (
    <>
      <rect x="2" y="3" width="8.6" height="8.6" rx="2.2" fill={W} />
      <rect x="13.4" y="3" width="8.6" height="8.6" rx="2.2" fill={W} />
      <rect x="2" y="13.8" width="8.6" height="8.6" rx="2.2" fill={W} />
      <path d="M17.7 14v8M13.7 18h8" {...line} strokeWidth={2.4} />
    </>
  ),

  /* ---------------------------------------------------------------- account and settings */
  profile: (
    <>
      <circle cx="12" cy="7.4" r="4.8" fill={W} />
      <path d="M3 20.2c0-4.4 4-7.6 9-7.6s9 3.2 9 7.6c0 .8-.6 1.4-1.4 1.4H4.4c-.8 0-1.4-.6-1.4-1.4z" fill={W} />
    </>
  ),
  settings: (
    <>
      <path d="M10.2 1.8h3.6l.6 2.9 1.8.9 2.6-1.5 2.6 2.6-1.5 2.6.8 1.8 2.9.6v3.6l-2.9.6-.8 1.8 1.5 2.6-2.6 2.6-2.6-1.5-1.8.8-.6 2.9h-3.6l-.6-2.9-1.8-.8-2.6 1.5-2.6-2.6 1.5-2.6-.8-1.8-2.9-.6v-3.6l2.9-.6.8-1.8-1.5-2.6 2.6-2.6 2.6 1.5 1.8-.9z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1" />
      <circle cx="12" cy="12" r="3.4" fill={K} />
    </>
  ),
  notifications: (
    <>
      <path d="M12 2.2c-3.6 0-6.4 2.8-6.4 6.4v4.6L3.6 16.6c-.4.7.1 1.6.9 1.6h15c.8 0 1.3-.9.9-1.6l-2-3.4V8.6c0-3.6-2.8-6.4-6.4-6.4z" fill={W} />
      <path d="M9.2 19.6a2.9 2.9 0 0 0 5.6 0z" fill={W} />
    </>
  ),
  download: (
    <>
      <path d="M12 2.6v11.2M7 9l5 5 5-5" {...line} strokeWidth={2.6} />
      <path d="M3 15.4v3.4A2.6 2.6 0 0 0 5.6 21.4h12.8A2.6 2.6 0 0 0 21 18.8v-3.4" {...line} strokeWidth={2.6} />
    </>
  ),
  upload: (
    <>
      <path d="M12 14.2V3M7 7.8l5-5 5 5" {...line} strokeWidth={2.6} />
      <path d="M3 15.4v3.4A2.6 2.6 0 0 0 5.6 21.4h12.8A2.6 2.6 0 0 0 21 18.8v-3.4" {...line} strokeWidth={2.6} />
    </>
  ),
  subscription: (
    <>
      <path d="m2.2 7.4 5.2 3.8L12 3.6l4.6 7.6 5.2-3.8-2 11.2H4.2z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1.2" />
      <rect x="4" y="19.6" width="16" height="2.4" rx="1" fill={W} />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M9.2 9.2a2.9 2.9 0 0 1 5.6.9c0 1.9-2.8 2.4-2.8 4.3" {...cut} strokeWidth={2.2} />
      <circle cx="12" cy="17.6" r="1.4" fill={K} />
    </>
  ),
  accessibility: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <circle cx="12" cy="6.6" r="1.7" fill={K} />
      <path d="M6.6 9.6 12 10.8l5.4-1.2M12 10.8v3.6l-2.6 4.6M12 14.4l2.6 4.6" {...cut} strokeWidth={1.9} />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M2.4 12h19.2M12 2.2c-3.4 3.6-3.4 16 0 19.6M12 2.2c3.4 3.6 3.4 16 0 19.6M4 7h16M4 17h16" {...cut} strokeWidth={1.4} />
    </>
  ),
  audio: (
    <>
      <path d="M3 9.2a1.2 1.2 0 0 1 1.2-1.2h3.2l4.6-4.2c.8-.7 2-.1 2 .9v14.6c0 1-1.2 1.6-2 .9L7.4 16H4.2A1.2 1.2 0 0 1 3 14.8z" fill={W} />
      <path d="M17.2 8.4a5 5 0 0 1 0 7.2M19.8 5.6a9 9 0 0 1 0 12.8" {...line} strokeWidth={2} />
    </>
  ),
  mute: (
    <>
      <path d="M3 9.2a1.2 1.2 0 0 1 1.2-1.2h3.2l4.6-4.2c.8-.7 2-.1 2 .9v14.6c0 1-1.2 1.6-2 .9L7.4 16H4.2A1.2 1.2 0 0 1 3 14.8z" fill={W} />
      <path d="m17 9.2 5 5.6M22 9.2l-5 5.6" {...line} strokeWidth={2.2} />
    </>
  ),
  display: (
    <>
      <rect x="1.8" y="3" width="20.4" height="14" rx="2.4" fill={W} />
      <path d="M8 21h8M12 17v4" {...line} />
      <path d="M12 6.4a3.6 3.6 0 0 1 0 7.2z" fill={K} />
      <circle cx="12" cy="10" r="3.6" {...cut} strokeWidth={1.5} />
    </>
  ),
  theme: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill={K} />
    </>
  ),
  offline: (
    <>
      <path d="M6.6 19.2A4.6 4.6 0 0 1 6 10.1a6.4 6.4 0 0 1 12.3-1.6 5.4 5.4 0 0 1-.6 10.7z" fill={W} />
      <path d="m8.8 13.8 2.4 2.4 4.4-4.6" {...cut} strokeWidth={2.2} />
    </>
  ),
  privacy: (
    <>
      <path d="M12 1.8 3.6 5v6.2c0 5 3.6 9.6 8.4 11 4.8-1.4 8.4-6 8.4-11V5z" fill={W} />
      <path d="m8.2 11.8 2.6 2.6 5-5" {...cut} strokeWidth={2.2} />
    </>
  ),
  textSize: (
    <>
      <path d="M2 20 6.2 9h1.6L12 20M3.6 16.4h6.8" {...line} strokeWidth={2} />
      <path d="M11.6 20 16.4 4h1.8L23 20M13.4 14.6h8" {...line} strokeWidth={2.2} />
    </>
  ),
  signOut: (
    <>
      <path d="M9.4 3H5.2A2.2 2.2 0 0 0 3 5.2v13.6A2.2 2.2 0 0 0 5.2 21h4.2" {...line} />
      <path d="M10 12h11M16.6 7.4 21.2 12l-4.6 4.6" {...line} />
    </>
  ),

  /* ---------------------------------------------------------------- training controls */
  play: <path d="M7.2 3.6c0-1 1.1-1.6 1.9-1.1l11.6 8.4c.7.5.7 1.6 0 2.1L9.1 21.4c-.8.6-1.9 0-1.9-1z" fill={W} />,
  pause: (
    <>
      <rect x="5" y="3" width="5" height="18" rx="1.6" fill={W} />
      <rect x="14" y="3" width="5" height="18" rx="1.6" fill={W} />
    </>
  ),
  stop: <rect x="4" y="4" width="16" height="16" rx="3" fill={W} />,
  replay: (
    <>
      <path d="M4.4 12.6a7.6 7.6 0 1 0 2.4-6.2" {...line} strokeWidth={2.6} />
      <path d="M2.8 3.2v6h6z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1.2" />
    </>
  ),
  /** Répétition (loop) */
  repeat: (
    <>
      <path d="M4 11V9.4A3.4 3.4 0 0 1 7.4 6h11.2M20 13v1.6A3.4 3.4 0 0 1 16.6 18H5.4" {...line} strokeWidth={2.4} />
      <path d="M16.4 2.6 20.4 6l-4 3.4zM7.6 14.6 3.6 18l4 3.4z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1" />
    </>
  ),
  /** Ralenti: speed dial, needle low */
  slow: (
    <>
      <path d="M2 16.4A10 10 0 0 1 22 16.4a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 16.4z" fill={W} />
      <path d="m12 15.4-4.4-3.8" {...cut} strokeWidth={2.2} />
      <circle cx="12" cy="15.4" r="1.6" fill={K} />
    </>
  ),
  /** Vitesse normale: speed dial, needle up */
  speed: (
    <>
      <path d="M2 16.4A10 10 0 0 1 22 16.4a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 16.4z" fill={W} />
      <path d="M12 15.4 12 9" {...cut} strokeWidth={2.2} />
      <circle cx="12" cy="15.4" r="1.6" fill={K} />
    </>
  ),
  /** Au hasard (0.26 action pill): a die showing five */
  random: (
    <>
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="4.4" fill={W} />
      <circle cx="7.9" cy="7.9" r="1.8" fill={K} />
      <circle cx="16.1" cy="7.9" r="1.8" fill={K} />
      <circle cx="12" cy="12" r="1.8" fill={K} />
      <circle cx="7.9" cy="16.1" r="1.8" fill={K} />
      <circle cx="16.1" cy="16.1" r="1.8" fill={K} />
    </>
  ),
  /** Avance: one frame forward */
  forward: (
    <>
      <path d="M2.6 5.4c0-.9 1-1.4 1.7-.9l7.2 5.6c.6.5.6 1.4 0 1.9l-7.2 5.6c-.7.5-1.7 0-1.7-.9z" fill={W} transform="translate(0 1)" />
      <path d="M11.6 5.4c0-.9 1-1.4 1.7-.9l7.2 5.6c.6.5.6 1.4 0 1.9l-7.2 5.6c-.7.5-1.7 0-1.7-.9z" fill={W} transform="translate(0 1)" />
    </>
  ),
  stepBack: (
    <>
      <path d="M19.4 4.2c0-1-1.1-1.5-1.9-1L8.4 10.9c-.7.5-.7 1.6 0 2.1l9.1 7.8c.8.6 1.9 0 1.9-1z" fill={W} />
      <rect x="4" y="3.4" width="3.2" height="17.2" rx="1.4" fill={W} />
    </>
  ),
  stepForward: (
    <>
      <path d="M4.6 4.2c0-1 1.1-1.5 1.9-1l9.1 7.7c.7.5.7 1.6 0 2.1l-9.1 7.8c-.8.6-1.9 0-1.9-1z" fill={W} />
      <rect x="16.8" y="3.4" width="3.2" height="17.2" rx="1.4" fill={W} />
    </>
  ),
  /** Décomposer: the move cut into phases */
  decompose: (
    <>
      <rect x="1.8" y="5" width="5.6" height="14" rx="1.6" fill={W} />
      <rect x="9.2" y="5" width="5.6" height="14" rx="1.6" fill={W} opacity="0.75" />
      <rect x="16.6" y="5" width="5.6" height="14" rx="1.6" fill={W} opacity="0.5" />
    </>
  ),
  fullscreen: <path d="M3 9V4.6A1.6 1.6 0 0 1 4.6 3H9M15 3h4.4A1.6 1.6 0 0 1 21 4.6V9M21 15v4.4a1.6 1.6 0 0 1-1.6 1.6H15M9 21H4.6A1.6 1.6 0 0 1 3 19.4V15" {...line} strokeWidth={2.6} />,
  camera: (
    <>
      <path d="M4.4 6.4h2.4l1.6-2.2c.3-.4.8-.6 1.3-.6h4.6c.5 0 1 .2 1.3.6l1.6 2.2h2.4A2.4 2.4 0 0 1 22 8.8v9.4a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 18.2V8.8a2.4 2.4 0 0 1 2.4-2.4z" fill={W} />
      <circle cx="12" cy="13.2" r="4.4" fill={K} />
      <circle cx="12" cy="13.2" r="2.6" fill={W} />
    </>
  ),
  rotateLeft: (
    <>
      <path d="M5 13a7.4 7.4 0 1 0 2.5-6.2" {...line} strokeWidth={2.6} />
      <path d="M3.6 3.4v6.2h6.2z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1" />
    </>
  ),
  rotateRight: (
    <>
      <path d="M19 13a7.4 7.4 0 1 1-2.5-6.2" {...line} strokeWidth={2.6} />
      <path d="M20.4 3.4v6.2h-6.2z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.2" cy="10.2" r="7.6" fill={W} />
      <path d="M10.2 6.6v7.2M6.6 10.2h7.2" {...cut} strokeWidth={2.2} />
      <path d="m16 16 5.4 5.4" {...line} strokeWidth={3.2} />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10.2" cy="10.2" r="7.6" fill={W} />
      <path d="M6.6 10.2h7.2" {...cut} strokeWidth={2.2} />
      <path d="m16 16 5.4 5.4" {...line} strokeWidth={3.2} />
    </>
  ),
  hideUi: (
    <>
      <path d="M12 5C6.8 5 3 9 1.6 11.4a1.2 1.2 0 0 0 0 1.2C3 15 6.8 19 12 19s9-4 10.4-6.4a1.2 1.2 0 0 0 0-1.2C21 9 17.2 5 12 5z" fill={W} />
      <circle cx="12" cy="12" r="3.6" fill={K} />
      <path d="M3.4 2.6 20.6 21.4" {...cut} strokeWidth={4.2} />
      <path d="M3.4 2.6 20.6 21.4" {...line} strokeWidth={2} />
    </>
  ),
  showUi: (
    <>
      <path d="M12 5C6.8 5 3 9 1.6 11.4a1.2 1.2 0 0 0 0 1.2C3 15 6.8 19 12 19s9-4 10.4-6.4a1.2 1.2 0 0 0 0-1.2C21 9 17.2 5 12 5z" fill={W} />
      <circle cx="12" cy="12" r="3.6" fill={K} />
      <circle cx="12" cy="12" r="1.6" fill={W} />
    </>
  ),
  ar: (
    <>
      <path d="m12 1.8 9 5.1v10.2l-9 5.1-9-5.1V6.9z" fill={W} />
      <path d="m3.6 7.2 8.4 4.8 8.4-4.8M12 12v9.6" {...cut} strokeWidth={1.6} />
    </>
  ),
  mic: (
    <>
      <rect x="8" y="1.8" width="8" height="13" rx="4" fill={W} />
      <path d="M4.6 11a7.4 7.4 0 0 0 14.8 0M12 18.4v3.4" {...line} />
    </>
  ),
  send: <path d="M2.6 3.4c-.4-1 .6-1.9 1.6-1.5l17.6 8.8c.9.5.9 1.8 0 2.3L4.2 21.8c-1 .5-2-.5-1.6-1.5L5.4 13l8.2-1-8.2-1z" fill={W} />,

  /* ---------------------------------------------------------------- actions */
  add: <path d="M12 3.4v17.2M3.4 12h17.2" {...line} strokeWidth={2.8} />,
  edit: (
    <>
      <path d="M15.4 3.6a2.4 2.4 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4L9 20l-5.6 1.4a.7.7 0 0 1-.8-.8L4 15z" fill={W} />
      <path d="m13.6 5.4 5 5" {...cut} strokeWidth={1.6} />
    </>
  ),
  duplicate: (
    <>
      <rect x="2.4" y="2.4" width="13.6" height="13.6" rx="2.6" fill={W} opacity="0.6" />
      <rect x="8" y="8" width="13.6" height="13.6" rx="2.6" fill={W} />
    </>
  ),
  delete: (
    <>
      <path d="M9 2.4h6a1 1 0 0 1 1 1V5h4.6a1.2 1.2 0 0 1 0 2.4H3.4a1.2 1.2 0 0 1 0-2.4H8V3.4a1 1 0 0 1 1-1z" fill={W} />
      <path d="M4.8 8.8h14.4l-1 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z" fill={W} />
      <path d="M10 12.2v6M14 12.2v6" {...cut} strokeWidth={1.6} />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3.2" fill={W} />
      <circle cx="6" cy="12" r="3.2" fill={W} />
      <circle cx="18" cy="19" r="3.2" fill={W} />
      <path d="m8.6 10.6 6.8-4M8.6 13.4l6.8 4" {...line} strokeWidth={2} />
    </>
  ),
  save: (
    <>
      <path d="M4.6 2.4h11.6l5.4 5.4v11.6a2.2 2.2 0 0 1-2.2 2.2H4.6a2.2 2.2 0 0 1-2.2-2.2V4.6a2.2 2.2 0 0 1 2.2-2.2z" fill={W} />
      <rect x="6.2" y="4.4" width="9" height="4.4" rx="1" fill={K} />
      <circle cx="12" cy="15" r="3" fill={K} />
    </>
  ),
  sync: (
    <>
      <path d="M6.4 18.6a4.6 4.6 0 0 1-.6-9.1A6.4 6.4 0 0 1 18 8a5.3 5.3 0 0 1-.4 10.6z" fill={W} />
      <path d="M9.4 13.4a2.8 2.8 0 0 1 5-1.6M14.6 14.2a2.8 2.8 0 0 1-5 1.6" {...cut} strokeWidth={1.5} />
      <path d="m14.6 10.4-.1 1.6-1.6-.2M9.4 17.2l.1-1.6 1.6.2" {...cut} strokeWidth={1.4} />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4.4 4.4 0 0 0 6.2 0l3.4-3.4a4.4 4.4 0 0 0-6.2-6.2l-1.2 1.2" {...line} strokeWidth={2.4} />
      <path d="M14 10a4.4 4.4 0 0 0-6.2 0l-3.4 3.4a4.4 4.4 0 0 0 6.2 6.2l1.2-1.2" {...line} strokeWidth={2.4} />
    </>
  ),
  details: (
    <>
      <rect x="2.2" y="4" width="3.4" height="3.4" rx="1" fill={W} />
      <rect x="2.2" y="10.3" width="3.4" height="3.4" rx="1" fill={W} />
      <rect x="2.2" y="16.6" width="3.4" height="3.4" rx="1" fill={W} />
      <path d="M8.8 5.7h12.6M8.8 12h12.6M8.8 18.3h12.6" {...line} strokeWidth={2.4} />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M12 11v6" {...cut} strokeWidth={2.4} />
      <circle cx="12" cy="7.4" r="1.5" fill={K} />
    </>
  ),
  back: <path d="M15 4.6 7.6 12l7.4 7.4" {...line} strokeWidth={2.8} />,
  /** 0.27 Replier (action pill): a chevron pushed back against the edge it folds to */
  fold: <path d="M4.2 4.6v14.8M18.4 4.6 11 12l7.4 7.4" {...line} strokeWidth={2.8} />,
  /** 0.27 Agrandir la fenêtre (Coach IA panel): two arrows going out to the corners */
  panelExpand: (
    <>
      <path d="M13.8 10.2 20 4M10.2 13.8 4 20" {...line} strokeWidth={2.4} />
      <path d="M14.2 3.4h6.4v6.4M3.4 14.2v6.4h6.4" {...line} strokeWidth={2.4} />
    </>
  ),
  /** 0.27 Réduire la fenêtre (Coach IA panel): two arrows coming in from the corners */
  panelShrink: (
    <>
      <path d="M20.6 3.4l-6.2 6.2M3.4 20.6l6.2-6.2" {...line} strokeWidth={2.4} />
      <path d="M14.4 4.2v5.4h5.4M9.6 19.8v-5.4H4.2" {...line} strokeWidth={2.4} />
    </>
  ),
  /** 0.27 Quitter le plein écran: the four corners turned inwards */
  exitFullscreen: <path d="M9 3v4.4A1.6 1.6 0 0 1 7.4 9H3M21 9h-4.4A1.6 1.6 0 0 1 15 7.4V3M15 21v-4.4a1.6 1.6 0 0 1 1.6-1.6H21M3 15h4.4A1.6 1.6 0 0 1 9 16.6V21" {...line} strokeWidth={2.6} />,
  /** 0.27 Actions rapides (folded action pill): the pill itself, three actions punched in it */
  quickActions: (
    <>
      <rect x="1.6" y="6.4" width="20.8" height="11.2" rx="5.6" fill={W} />
      <circle cx="7.2" cy="12" r="1.9" fill={K} />
      <circle cx="12" cy="12" r="1.9" fill={K} />
      <circle cx="16.8" cy="12" r="1.9" fill={K} />
    </>
  ),
  chevron: <path d="m9 4.6 7.4 7.4L9 19.4" {...line} strokeWidth={2.8} />,
  chevronDown: <path d="M4.6 9 12 16.4 19.4 9" {...line} strokeWidth={2.8} />,
  close: <path d="M5.4 5.4l13.2 13.2M18.6 5.4 5.4 18.6" {...line} strokeWidth={2.8} />,
  confirm: <path d="m3.6 12.6 5.4 5.4L20.4 6.6" {...line} strokeWidth={3} />,
  cancel: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="m8.4 8.4 7.2 7.2M15.6 8.4l-7.2 7.2" {...cut} strokeWidth={2.4} />
    </>
  ),
  minus: <path d="M4 12h16" {...line} strokeWidth={2.8} />,
  grid: (
    <>
      <rect x="2.6" y="2.6" width="8.2" height="8.2" rx="2" fill={W} />
      <rect x="13.2" y="2.6" width="8.2" height="8.2" rx="2" fill={W} />
      <rect x="2.6" y="13.2" width="8.2" height="8.2" rx="2" fill={W} />
      <rect x="13.2" y="13.2" width="8.2" height="8.2" rx="2" fill={W} />
    </>
  ),
  list: (
    <>
      <path d="M3 5.6h18M3 12h18M3 18.4h18" {...line} strokeWidth={2.6} />
    </>
  ),
  compare: (
    <>
      <rect x="2" y="3.4" width="20" height="17.2" rx="2.6" fill={W} />
      <rect x="12" y="5.4" width="8" height="13.2" rx="1.2" fill={K} />
    </>
  ),

  /* ---------------------------------------------------------------- statuses and misc */
  verified: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="m7.4 12.4 3.2 3.2 6-6.4" {...cut} strokeWidth={2.4} />
    </>
  ),
  adapted: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="m12 5.8 1.8 3.8 4.2.5-3.1 2.9.8 4.1L12 15l-3.7 2.1.8-4.1L6 10.1l4.2-.5z" fill={K} />
    </>
  ),
  inspired: (
    <>
      <path d="M12 1.8c.5 3.9 2.6 6 6.6 6.6-4 .6-6.1 2.7-6.6 6.6-.5-3.9-2.6-6-6.6-6.6 4-.6 6.1-2.7 6.6-6.6z" fill={W} />
      <path d="M18.6 13.6c.3 2.1 1.4 3.2 3.4 3.4-2 .3-3.1 1.4-3.4 3.4-.3-2-1.4-3.1-3.4-3.4 2-.2 3.1-1.3 3.4-3.4zM5.4 15c.2 1.6 1 2.4 2.6 2.6-1.6.2-2.4 1-2.6 2.6-.2-1.6-1-2.4-2.6-2.6 1.6-.2 2.4-1 2.6-2.6z" fill={W} />
    </>
  ),
  pending: (
    <>
      <path d="M6 2.2h12a1.2 1.2 0 0 1 0 2.4h-.6c0 3.2-1.6 5.4-3.6 7.4 2 2 3.6 4.2 3.6 7.4h.6a1.2 1.2 0 0 1 0 2.4H6a1.2 1.2 0 0 1 0-2.4h.6c0-3.2 1.6-5.4 3.6-7.4-2-2-3.6-4.2-3.6-7.4H6a1.2 1.2 0 0 1 0-2.4z" fill={W} />
      <path d="M9 4.6h6c0 2.2-1 3.8-3 5.4-2-1.6-3-3.2-3-5.4zM12 15c-1.8 1.4-2.8 2.8-3 4.4h6c-.2-1.6-1.2-3-3-4.4z" fill={K} opacity="0.85" />
    </>
  ),
  free: (
    <>
      <path d="M2.4 4.6A2.2 2.2 0 0 1 4.6 2.4h6.2c.6 0 1.1.2 1.6.6l9 9a2.2 2.2 0 0 1 0 3.2l-6.2 6.2a2.2 2.2 0 0 1-3.2 0l-9-9a2.2 2.2 0 0 1-.6-1.6z" fill={W} />
      <circle cx="7.4" cy="7.4" r="2" fill={K} />
    </>
  ),
  premium: (
    <>
      <path d="m2.2 7.4 5.2 3.8L12 3.6l4.6 7.6 5.2-3.8-2 11.2H4.2z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1.2" />
      <rect x="4" y="19.6" width="16" height="2.4" rx="1" fill={W} />
    </>
  ),
  locked: (
    <>
      <path d="M7 10.4V7.6a5 5 0 0 1 10 0v2.8" {...line} strokeWidth={2.6} />
      <rect x="3.6" y="10" width="16.8" height="12" rx="2.6" fill={W} />
      <circle cx="12" cy="15.2" r="1.8" fill={K} />
      <path d="M12 16v2.6" {...cut} strokeWidth={1.8} />
    </>
  ),
  downloaded: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M12 6.2v8.4M8.4 11.2 12 14.8l3.6-3.6M7.6 17.6h8.8" {...cut} strokeWidth={2} />
    </>
  ),
  /** Assimilée: a filled disc with the tick cut out */
  mastered: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="m7.4 12.4 3.2 3.2 6-6.4" {...cut} strokeWidth={2.4} />
    </>
  ),
  /** Encore du mal: a filled disc with a "go again" arrow cut out */
  struggling: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <path d="M16.6 9.2A5.2 5.2 0 1 0 17.2 13" {...cut} strokeWidth={2.2} />
      <path d="m17.6 5.8-.1 4-3.9-.4z" fill={K} />
    </>
  ),
  check: <path d="m3.6 12.6 5.4 5.4L20.4 6.6" {...line} strokeWidth={3} />,
  star: <path d="m12 2.6 2.8 5.8 6.4.8-4.7 4.4 1.2 6.3L12 16.8l-5.7 3.1 1.2-6.3L2.8 9.2l6.4-.8z" {...line} strokeWidth={2} />,
  starFilled: <path d="m12 1.9 2.95 6.2 6.8.84-5 4.68 1.3 6.73L12 17.06l-6.05 3.29 1.3-6.73-5-4.68 6.8-.84z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1.2" />,
  trophy: (
    <>
      <path d="M6 2.4h12v2h3a1 1 0 0 1 1 1.1c-.3 3.6-2.2 6-5 6.6A6 6 0 0 1 13.4 15v2.6h3.2a1.2 1.2 0 0 1 1.2 1.2v2.6H6.2v-2.6a1.2 1.2 0 0 1 1.2-1.2h3.2V15A6 6 0 0 1 7 12.1c-2.8-.6-4.7-3-5-6.6a1 1 0 0 1 1-1.1h3z" fill={W} />
      <path d="M6 6.4H4.2c.3 1.8 1 3 2.1 3.6A8 8 0 0 1 6 8zM18 6.4h1.8c-.3 1.8-1 3-2.1 3.6.2-.6.3-1.3.3-2z" fill={K} />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" fill={W} />
      <circle cx="12" cy="12" r="6.6" fill={K} />
      <circle cx="12" cy="12" r="3.4" fill={W} />
    </>
  ),
  flame: <path d="M12.6 1.8c.6 3.2 2.4 4.6 4.2 6.6 1.6 1.8 3 3.8 3 6.6a7.8 7.8 0 0 1-15.6 0c0-2.6 1.2-4.6 2.8-6.2.2 1.8 1 3 2.4 3.6-.6-4.4 1-7.8 3.2-10.6z" fill={W} />,
  bolt: <path d="M13.6 1.8 4 13.4c-.5.6 0 1.4.7 1.4H11l-1.4 7.4 9.6-11.6c.5-.6 0-1.4-.7-1.4H12.2z" fill={W} />,
  shield: <path d="M12 1.8 3.6 5v6.2c0 5 3.6 9.6 8.4 11 4.8-1.4 8.4-6 8.4-11V5z" fill={W} />,
  fighter: (
    <>
      <circle cx="12" cy="5" r="3.2" fill={W} />
      <path d="M7.2 10.2c0-1.2 1-2.2 2.2-2.2h5.2c1.2 0 2.2 1 2.2 2.2l3.4.6c1 .2 1.5 1.3.9 2.1l-2 2.8c-.5.7-1.6.6-2-.2l-.6-1.2-.5 3.4 1.6 4.2c.4 1-.6 1.8-1.5 1.2L12 19.6l-3.4 3.3c-.9.6-1.9-.3-1.5-1.2l1.6-4.2-.5-3.4-.6 1.2c-.4.8-1.5.9-2 .2l-2-2.8c-.6-.8-.1-1.9.9-2.1z" fill={W} />
    </>
  ),
  wrench: <path d="M20.8 6.4a5.6 5.6 0 0 1-7.4 6.8l-7.6 7.6a2.2 2.2 0 0 1-3.2-3.2l7.6-7.6a5.6 5.6 0 0 1 6.8-7.4l-3.4 3.4.6 2.8 2.8.6z" fill={W} />,
  trend: (
    <>
      <path d="m2.6 17.4 6.2-6.2 4 4 8-8" {...line} strokeWidth={2.6} />
      <path d="M15.2 5.2h6.4v6.4z" fill={W} strokeLinejoin="round" stroke={W} strokeWidth="1" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="1.8" y="8.4" width="3.4" height="7.2" rx="1.2" fill={W} />
      <rect x="4.6" y="5.6" width="4" height="12.8" rx="1.4" fill={W} />
      <rect x="15.4" y="5.6" width="4" height="12.8" rx="1.4" fill={W} />
      <rect x="18.8" y="8.4" width="3.4" height="7.2" rx="1.2" fill={W} />
      <rect x="8" y="10.6" width="8" height="2.8" rx="1" fill={W} />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type GlyphId = keyof typeof GLYPHS;
