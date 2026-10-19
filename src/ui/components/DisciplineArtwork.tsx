import type { CSSProperties } from 'react';
import { disciplineArt } from '../../domain/disciplineArt';
import { DisciplineIcon } from '../icons';

export type ArtFormat = 'cover' | 'tile' | 'avatar';
export type ArtSize = 'xs' | 'sm' | 'md' | 'lg';

export interface DisciplineArtworkProps {
  /** discipline id (boxe, kickboxing, mma, muaythai…) */
  id: string;
  /**
   * cover: fills its (positioned) parent, for discipline cards and banners;
   * tile: framed picture keeping the artwork's proportions, for lists;
   * avatar: round badge framed on the fighter, for tabs, chips and compact rows.
   */
  format?: ArtFormat;
  size?: ArtSize;
  /** framing: the whole picture, or close on the fighter */
  crop?: 'full' | 'bust';
  /** true when the discipline name is written next to it (the picture is then decorative) */
  decorative?: boolean;
  /** replaces the official description for screen readers */
  alt?: string;
  className?: string;
  eager?: boolean;
}

const SIZE_PX: Record<ArtSize, number> = { xs: 28, sm: 36, md: 56, lg: 96 };

/**
 * The official picture of a discipline, from the central registry (src/domain/disciplineArt.ts).
 * Same picture everywhere; only its size and framing change. Never stretched: the container keeps
 * the picture's proportions, or crops it around its focus point.
 */
export function DisciplineArtwork({ id, format = 'tile', size = 'md', crop, decorative = true, alt, className = '', eager }: DisciplineArtworkProps) {
  const a = disciplineArt(id);
  if (!a) return null;
  const framing = crop ?? (format === 'avatar' ? 'bust' : 'full');
  const srcSet = a.sources.map((s) => `${s.src}?v=${a.rev} ${s.w}w`).join(', ');
  const largest = a.sources[a.sources.length - 1];
  const px = SIZE_PX[size];
  const sizes = format === 'cover' ? '(min-width: 980px) 300px, 60vw' : `${Math.ceil(px * (framing === 'bust' ? a.bust.zoom : 1))}px`;
  const imgStyle: CSSProperties =
    framing === 'bust'
      ? { objectPosition: `${a.bust.x}% ${a.bust.y}%`, transform: `scale(${a.bust.zoom})`, transformOrigin: `${a.bust.x}% ${a.bust.y}%` }
      : { objectPosition: `${a.focus.x}% ${a.focus.y}%` };
  const img = (
    <img
      src={`${largest.src}?v=${a.rev}`}
      srcSet={srcSet}
      sizes={sizes}
      width={a.width}
      height={a.height}
      alt={decorative ? '' : (alt ?? a.alt)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      style={imgStyle}
      data-discipline-art={id}
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
    />
  );
  if (format === 'cover') return <span className={`disc-art cover ${className}`}>{img}</span>;
  const box: CSSProperties = format === 'avatar' ? { width: px, height: px } : { width: px, height: Math.round((px * a.height) / a.width) };
  return (
    <span className={`disc-art ${format} ${className}`} style={box} aria-hidden={decorative || undefined}>
      {img}
    </span>
  );
}

/** discipline name preceded by its official icon, for lists and metadata lines */
export function DisciplineLabel({ id, name }: { id: string; name: string }) {
  return (
    <span className="disc-label">
      <DisciplineIcon id={id} size={24} />
      <span className="t">{name}</span>
    </span>
  );
}
