import { useId, type CSSProperties } from 'react';
import type { DisciplineId } from '../../domain/types';
import { DISCIPLINE_DRAWINGS, DISCIPLINE_ICON_ALT } from './disciplines';
import { GLYPHS, type GlyphId } from './glyphs';
import { iconRole, type ActionIconId, type NavigationIconId, type StatusIconId, type TrainingControlIconId } from './registry';

/**
 * Size scale of the charter (px): 24 navigation and compact actions, 32 quick access,
 * 48 secondary menus, 64 menu cards, 96 and more discipline cards. Any number is accepted when a
 * layout needs it; the drawing is a vector and is never stretched (square viewBox).
 */
export type IconSize = 16 | 18 | 20 | 24 | 28 | 32 | 40 | 48 | 64 | 96 | 128 | number;

/**
 * Colour of a glyph. `current` follows the text colour (buttons, links: the states of the
 * component carry the colour), the others are fixed roles of the palette.
 * `auto` takes the icon's own role colour (registry ICON_ROLE, after the icon sheet v2).
 * The colour never carries a meaning alone: every icon has a label next to it or an aria-label.
 */
export type IconTone = 'current' | 'auto' | 'neutral' | 'muted' | 'accent' | 'gold' | 'success' | 'danger' | 'info' | 'orange' | 'purple';

export interface AppIconProps {
  id: GlyphId;
  size?: IconSize;
  tone?: IconTone;
  /** spoken name when the icon is alone (no visible label); otherwise the icon is decorative */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The one icon component of the application: every interface icon goes through it (directly or
 * through the family components below). The glyph is used as a stencil over its colour plus a
 * soft top light, which gives the same discreet relief to every icon in every colour.
 */
export function AppIcon({ id, size = 24, tone = 'current', label, className, style }: AppIconProps) {
  const u = useId().replace(/:/g, '');
  return (
    <svg
      className={`app-icon tone-${tone}${className ? ` ${className}` : ''}`}
      data-icon={id}
      data-role={iconRole(id)}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <mask id={`${u}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#000" />
          {GLYPHS[id]}
        </mask>
        <linearGradient id={`${u}l`} x1="0" y1="1" x2="0" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" style={{ stopOpacity: 'var(--icon-light, 0.32)' }} />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" style={{ stopOpacity: 'var(--icon-shade, 0.2)' }} />
        </linearGradient>
      </defs>
      <g mask={`url(#${u}m)`}>
        <rect width="24" height="24" fill="currentColor" />
        <rect width="24" height="24" fill={`url(#${u}l)`} />
      </g>
    </svg>
  );
}

/* --- families: the same component, restricted to the icons of one use, with that use's default size */

export const NavigationIcon = (p: Omit<AppIconProps, 'id'> & { id: NavigationIconId }) => <AppIcon size={24} {...p} />;
export const ActionIcon = (p: Omit<AppIconProps, 'id'> & { id: ActionIconId }) => <AppIcon size={20} {...p} />;
export const TrainingControlIcon = (p: Omit<AppIconProps, 'id'> & { id: TrainingControlIconId }) => <AppIcon size={22} {...p} />;
export const StatusIcon = (p: Omit<AppIconProps, 'id'> & { id: StatusIconId }) => <AppIcon size={16} {...p} />;

export interface DisciplineIconProps {
  id: DisciplineId | string;
  size?: IconSize;
  /** spoken name when the discipline name is not written next to the icon */
  label?: string;
  /** true when the name is written next to it: the icon is then decorative (default) */
  className?: string;
  style?: CSSProperties;
}

/**
 * The official icon of a discipline (its sports object). The same drawing everywhere: home,
 * discipline choice, training, techniques, combinations, legends, programmes, filters, favourites,
 * history, progression. Below 40 px the compact drawing is used (no fine lines).
 */
export function DisciplineIcon({ id, size = 48, label, className, style }: DisciplineIconProps) {
  const u = useId().replace(/:/g, '');
  const draw = (DISCIPLINE_DRAWINGS as Record<string, (typeof DISCIPLINE_DRAWINGS)['boxe']>)[id];
  if (!draw) return null;
  return (
    <svg
      className={`discipline-icon${className ? ` ${className}` : ''}`}
      data-discipline={id}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {draw(u, size >= 40 ? 'full' : 'compact')}
    </svg>
  );
}

/** what the discipline icon shows (inventory, tests) */
export const disciplineIconAlt = (id: DisciplineId) => DISCIPLINE_ICON_ALT[id];

const LEVEL_RANK: Record<string, number> = { debutant: 1, intermediaire: 2, avance: 3, expert: 4 };

/**
 * Level of a technique or a programme: four rising bars, as many filled as the rank (1 to 4), so the
 * level reads from the count and the label, never from the colour alone.
 */
export function LevelIcon({ level, size = 16, className }: { level: string; size?: number; className?: string }) {
  const n = LEVEL_RANK[level] ?? 0;
  return (
    <svg className={`level-icon${className ? ` ${className}` : ''}`} data-level={level} viewBox="0 0 16 16" width={size} height={size} aria-hidden focusable="false">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1 + i * 3.8} y={11 - i * 3} width="2.8" height={4 + i * 3} rx="1" className={i < n ? 'on' : 'off'} />
      ))}
    </svg>
  );
}
