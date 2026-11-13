import { useState, type CSSProperties } from 'react';
import type { DisciplineId } from '../../domain/types';
import { DisciplineIcon } from '../icons';
import { OUTLINE_DRAWINGS } from './outline';
import { EMBLEMS, defaultVariant, emblemFile, type EmblemVariant } from './registry';

interface Props {
  id: DisciplineId;
  size?: number;
  /** left out: chosen from the size (detailed from 64 px, semi-flat from 32, outline below) */
  variant?: EmblemVariant;
  /** spoken name when the discipline name is not written next to the emblem; otherwise it is decorative */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const base = import.meta.env.BASE_URL;

/**
 * 0.33: the emblem of a discipline in one of its three variants (see registry.ts). The detailed render falls back
 * to the semi-flat drawing if its file cannot be loaded, so a card never shows a broken image.
 */
export function DisciplineEmblem({ id, size = 64, variant, label, className, style }: Props) {
  const v = variant ?? defaultVariant(size);
  const [failed, setFailed] = useState(false);
  const cls = `discipline-emblem v-${v}${className ? ` ${className}` : ''}`;
  if (!EMBLEMS[id]) return null;
  if (v === 'detaille' && !failed) {
    const one = size <= 64 ? 64 : 128;
    return (
      <img
        className={cls}
        data-emblem={id}
        data-variant="detaille"
        src={base + emblemFile(id, one)}
        srcSet={`${base + emblemFile(id, one)} 1x, ${base + emblemFile(id, one * 2 > 256 ? 256 : one * 2)} 2x`}
        width={size}
        height={size}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }
  if (v === 'contour') {
    return (
      <svg
        className={cls}
        data-emblem={id}
        data-variant="contour"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={label ? 'img' : undefined}
        aria-label={label ?? undefined}
        aria-hidden={label ? undefined : true}
        focusable="false"
        style={style}
      >
        {OUTLINE_DRAWINGS[id]}
      </svg>
    );
  }
  return (
    <span className={cls} data-emblem={id} data-variant="semi" style={{ display: 'inline-grid', ...style }}>
      <DisciplineIcon id={id} size={size} label={label} />
    </span>
  );
}
