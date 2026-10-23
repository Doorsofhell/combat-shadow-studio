/**
 * Registre des icônes de la navigation dynamique v0.32, copié tel quel depuis la maquette validée par Youssef
 * (docs/design/navigation-dynamique-reference.html, branche design/navigation-reference-v032, objet `icons`).
 * Source unique de vérité : ne pas redessiner ces chemins. Le test src/ui/nav/__tests__/nav.test.ts vérifie
 * qu'ils sont identiques à ceux de la maquette.
 */
export const NAV_ICONS = {
  home: '<path d="m3 10 9-7 9 7v11H3z"/><path d="M9 21v-7h6v7"/>',
  dumbbell: '<path d="m6.5 6.5 11 11M3 8l5-5M16 21l5-5M2 11l9-9M13 22l9-9"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-9M22 20H2"/>',
  star: '<path d="m12 2 3.1 6.3 7 .9-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-.9z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  speed: '<path d="M4 17a9 9 0 1 1 16 0M12 13l5-5"/><circle cx="12" cy="17" r="1"/>',
  scan: '<path d="M8 3H4v4M16 3h4v4M4 17v4h4M20 17v4h-4"/><circle cx="12" cy="12" r="4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  filter: '<path d="M3 5h18M7 12h10M10 19h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  history: '<path d="M3 12a9 9 0 1 1 3 7M3 17v-5h5M12 7v5l4 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  sparkle: '<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  options: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  coach: '<circle cx="9" cy="7" r="3"/><path d="M3 19v-3a6 6 0 0 1 12 0v3M17 8h5M19.5 5.5v5"/>',
} as const;

/**
 * v0.38 (Créateur d'enchaînements V2): the bars of the list, the sheet and the editor of sequences need actions the
 * mockup has no icon for (Créer, Ajouter, Modifier, Supprimer, Enregistrer, Annuler). They are drawn here in the same
 * grammar (24 × 24, plain strokes, no fill) and kept apart, so the registry copied from the mockup stays exact.
 */
export const NAV_EXTRA_ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  // v0.40: « Premium à vie » in Menu, the same cut gem as the gold marker
  diamond: '<path d="M6.5 4h11l4 5.5L12 20.5 2.5 9.5z"/><path d="M2.5 9.5h19M9 4l-1.5 5.5L12 20.5l4.5-11L15 4"/>',
  // v0.45 (refonte de la page Premium à vie): the bar Avantages / FAQ / Restaurer and the icons of its cards and panels
  checklist: '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1.6 1.6L7.5 4.7M3 12l1.6 1.6 2.9-2.9M3 18l1.6 1.6 2.9-2.9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2.9-1.2 1.7v.5M12 16.8v.2"/>',
  restore: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 3.5v5h-5"/>',
  swords: '<path d="M5 5l14 14M19 5 5 19M14.5 21l2.5-2.5M21 14.5l-2.5 2.5M9.5 21 7 18.5M3 14.5 5.5 17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.2"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  // v0.46 (Encyclopédie du combat): the open book of Menu, and the bar Classement / A–Z of the encyclopedia
  book: '<path d="M12 6.5C10 5 7 4.5 3 5v14c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z"/><path d="M12 6.5v14"/>',
  ranking: '<path d="M4 5h16M4 10h10M4 15h13M4 20h7"/>',
  az: '<path d="M3 11 6 3l3 8M4.1 8h3.8M13 3h6l-6 8h6"/><path d="M16 14v7m-3-3 3 3 3-3"/>',
} as const;

export type NavIconId = keyof typeof NAV_ICONS | keyof typeof NAV_EXTRA_ICONS;

/** the paths of an icon, from the mockup's registry or the v0.38 additions */
export const navIconPaths = (id: NavIconId): string => (id in NAV_ICONS ? NAV_ICONS[id as keyof typeof NAV_ICONS] : NAV_EXTRA_ICONS[id as keyof typeof NAV_EXTRA_ICONS]);
