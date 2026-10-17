import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DISCIPLINES, DisciplineId, LEVELS, LevelId } from '../../domain/types';
import { IconChevron, IconStarFilled } from '../icons';

/** Rendered images of our own 3D coach, one per discipline (public/disciplines). */
export const DISCIPLINE_IMG: Record<DisciplineId, string> = {
  boxe: './disciplines/boxe.jpg',
  kickboxing: './disciplines/kickboxing.jpg',
  mma: './disciplines/mma.jpg',
  muaythai: './disciplines/muaythai.jpg',
};

/** Premium discipline card: render of the coach, name in Rajdhani, current level. */
export function DisciplineCard({ id, level, to, onClick, selected, testId, tall }: { id: DisciplineId; level?: LevelId; to?: string; onClick?: () => void; selected?: boolean; testId?: string; tall?: boolean }) {
  const d = DISCIPLINES.find((x) => x.id === id)!;
  const inner = (
    <>
      <img src={DISCIPLINE_IMG[id]} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
      <span className="tag" aria-hidden>
        {d.short}
      </span>
      <span className="bar" aria-hidden />
      <span className="name">{d.name}</span>
      <span className="sub">{d.tagline}</span>
      {level && <span className="lvl">Niveau : {LEVELS.find((l) => l.id === level)!.name}</span>}
    </>
  );
  const style = tall ? { minHeight: 240 } : undefined;
  if (to)
    return (
      <Link to={to} className={`disc-card ${selected ? 'on' : ''}`} data-testid={testId} style={style}>
        {inner}
      </Link>
    );
  return (
    <button type="button" className={`disc-card ${selected ? 'on' : ''}`} onClick={onClick} data-testid={testId} aria-pressed={selected} style={style}>
      {inner}
    </button>
  );
}

/** One technique / exercise row card (link). */
export function TechniqueCard({ to, title, description, glyph, favorite, meta, testId }: { to: string; title: string; description?: string; glyph?: string; favorite?: boolean; meta?: ReactNode; testId?: string }) {
  return (
    <Link to={to} className="tech-card" data-testid={testId}>
      {glyph && (
        <span className="glyph" aria-hidden>
          {glyph}
        </span>
      )}
      <span className="body">
        <span className="title" style={{ display: 'block' }}>
          {title}
          {favorite && <IconStarFilled className="fav" width={14} height={14} style={{ marginLeft: 6, verticalAlign: -1 }} aria-label="Favori" />}
        </span>
        {description && <span className="desc">{description}</span>}
        {meta}
      </span>
      <IconChevron className="muted" />
    </Link>
  );
}

/** Champion card: gold accent (distinction), name in Rajdhani. */
export function ChampionCard({ to, name, style, meta }: { to: string; name: string; style: string; meta?: ReactNode }) {
  return (
    <Link to={to} className="champ-card">
      <span className="eyebrow gold">Légende</span>
      <span className="name">{name}</span>
      <span className="small muted">{style}</span>
      {meta}
    </Link>
  );
}

/** Generic row card with an icon tile (hub entries, shortcuts). */
export function EntryCard({ to, icon, title, text, tone, testId }: { to: string; icon: ReactNode; title: string; text?: string; tone?: 'red' | 'gold'; testId?: string }) {
  return (
    <Link to={to} className="card link ex-card" data-testid={testId}>
      <span className={`icon-tile ${tone ?? ''}`} aria-hidden>
        {icon}
      </span>
      <span className="body">
        <span className="title">{title}</span>
        {text && <span className="small muted">{text}</span>}
      </span>
      <IconChevron />
    </Link>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {text && <span className="small">{text}</span>}
      {action}
    </div>
  );
}

export function SectionHead({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="section-head">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
}
