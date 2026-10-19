import { AppIcon } from '../icons';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface SuggestRailProps {
  questions: string[];
  onPick: (q: string) => void;
  label?: string;
}

/** a finger that moved more than this, or a rail that scrolled, is a swipe and never a tap */
const TAP_SLOP = 8;
const SCROLL_QUIET_MS = 150;


/**
 * Horizontal rail of suggested questions: native finger scrolling (pan-x, snapped on each card),
 * discreet arrows disabled at the ends, a counter and edge fades that show more cards are there.
 * A swipe never sends a question; each card is a real button (Tab, Enter, Space).
 */
export function SuggestRail({ questions, onPick, label = 'Suggestions' }: SuggestRailProps) {
  const rail = useRef<HTMLDivElement>(null);
  const [ends, setEnds] = useState({ start: true, end: true });
  const press = useRef<{ x: number; y: number; left: number } | null>(null);
  const lastScroll = useRef(0);

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEnds({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  // a new list starts at the first card
  useLayoutEffect(() => {
    rail.current?.scrollTo({ left: 0 });
    measure();
  }, [questions, measure]);

  useEffect(() => {
    const el = rail.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const onScroll = () => {
    lastScroll.current = performance.now();
    measure();
  };

  const page = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.8), behavior: smooth ? 'smooth' : 'auto' });
  };

  const down = (e: ReactPointerEvent) => {
    press.current = { x: e.clientX, y: e.clientY, left: rail.current?.scrollLeft ?? 0 };
  };
  const move = (e: ReactPointerEvent) => {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_SLOP) p.x = Number.NaN;
  };

  const pick = (q: string, keyboard: boolean) => {
    const p = press.current;
    press.current = null;
    if (p && !keyboard) {
      const moved = Number.isNaN(p.x) || Math.abs((rail.current?.scrollLeft ?? 0) - p.left) > 4;
      if (moved || performance.now() - lastScroll.current < SCROLL_QUIET_MS) return;
    }
    onPick(q);
  };

  if (!questions.length) return null;
  const scrollable = !(ends.start && ends.end);

  return (
    <div className="cai-rail" role="group" aria-label={label} data-testid="coach-suggestions">
      <div className="cai-rail-head">
        <span className="cai-rail-title">
          {label} <span className="cai-rail-count">({questions.length})</span>
        </span>
        {scrollable && <span className="cai-rail-hint">Glisse pour voir plus</span>}
      </div>
      <div className="cai-rail-row">
      <button type="button" className="cai-rail-arrow" onClick={() => page(-1)} disabled={ends.start} aria-label="Questions précédentes" data-testid="suggest-prev">
        <AppIcon id="back" size={18} />
      </button>
      <div
        ref={rail}
        className={`cai-suggest ${ends.start ? '' : 'fade-start'} ${ends.end ? '' : 'fade-end'}`}
        onScroll={onScroll}
        onPointerDown={down}
        onPointerMove={move}
        onPointerCancel={() => (press.current = { x: Number.NaN, y: 0, left: 0 })}
        data-testid="coach-suggest-rail"
      >
        {questions.map((s) => (
          <button key={s} type="button" className="cai-q" onClick={(e) => pick(s, e.detail === 0)} data-testid="coach-suggestion">
            {s}
          </button>
        ))}
      </div>
      <button type="button" className="cai-rail-arrow" onClick={() => page(1)} disabled={ends.end} aria-label="Questions suivantes" data-testid="suggest-next">
        <AppIcon id="chevron" size={18} />
      </button>
      </div>
    </div>
  );
}
