import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { instructionOf } from '../../domain/instructions';

export interface ConsigneLine {
  /** « Consigne » for the main sentence, « Point clé n » for a key point */
  kind: string;
  text: string;
}

/** the sequence of one technique: its main instruction, then each key point, in the order of the sheet */
export function consigneLines(techniqueId: string | null | undefined): ConsigneLine[] {
  const t = techniqueId ? TECHNIQUE_BY_ID.get(techniqueId) : undefined;
  const ins = t ? instructionOf(t) : null;
  if (!ins) return [];
  return [{ kind: 'Consigne', text: ins.main }, ...ins.points.map((p, i) => ({ kind: `Point clé ${i + 1}`, text: p.text }))];
}

/**
 * The next state of the sequence after one instruction has been read to its end. A new technique (the next move of
 * a combination) only takes the band at the end of the line being read, never in the middle of it, and every
 * technique starts again where it was left, so a fast combination still goes through all its key points.
 */
export function nextConsigne(shown: { id: string; index: number }, focus: string | null, cursor: Map<string, number>): { id: string; index: number } {
  const len = consigneLines(shown.id).length;
  const after = len ? (shown.index + 1) % len : 0;
  if (focus && focus !== shown.id && consigneLines(focus).length) {
    cursor.set(shown.id, after);
    return { id: focus, index: cursor.get(focus) ?? 0 };
  }
  return { id: shown.id, index: after };
}

/**
 * 1.3.0 (Youssef, 2026-10-28: « A avec un enchaînement temporisé des consignes pour gain de place », « mode Enchaîné
 * ==> OK »): the instructions of the move, one at a time, on the floor under the coach: the main sentence, then each
 * key point, then again. Each line stays `sec` seconds; the segments under it show where the sequence is and the
 * time left. The pause stops it (the time of the line is kept). Its height is reported so the camera keeps the whole
 * coach above it: the text never covers the coach.
 */
export const ConsigneBand = memo(function ConsigneBand({
  techniqueId,
  running,
  sec,
  onHeight,
}: {
  /** the technique taught right now (the one played, or the last one between two repetitions) */
  techniqueId: string | null;
  /** the session works and is not paused: the time runs */
  running: boolean;
  sec: number;
  /** the height the band covers at the bottom of the stage, in CSS pixels (0 when it is gone) */
  onHeight: (px: number) => void;
}) {
  const [shown, setShown] = useState<{ id: string; index: number } | null>(() => (consigneLines(techniqueId).length ? { id: techniqueId!, index: 0 } : null));
  const cursor = useRef(new Map<string, number>());
  const elapsed = useRef(0);
  const focus = useRef(techniqueId);
  focus.current = techniqueId;
  const bar = useRef<HTMLElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);

  // nothing shown yet, or a technique without instructions: the new one takes the band at once
  useEffect(() => {
    if (techniqueId && consigneLines(techniqueId).length && (!shown || !consigneLines(shown.id).length)) {
      elapsed.current = 0;
      setShown({ id: techniqueId, index: cursor.current.get(techniqueId) ?? 0 });
    }
  }, [techniqueId, shown]);

  // the clock of the line: it only runs while the session runs; the bar is drawn without re-rendering
  useEffect(() => {
    if (!running || !shown) return;
    let raf = 0;
    let last = performance.now();
    const ms = sec * 1000;
    const tick = (now: number) => {
      elapsed.current += Math.min(250, now - last);
      last = now;
      if (elapsed.current >= ms) {
        elapsed.current = 0;
        setShown((s) => (s ? nextConsigne(s, focus.current, cursor.current) : s));
      }
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, elapsed.current / ms)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, shown, sec]);

  useLayoutEffect(() => {
    if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, elapsed.current / (sec * 1000))})`;
  });

  const lines = consigneLines(shown?.id);
  const visible = !!shown && lines.length > 0;

  useLayoutEffect(() => {
    const el = root.current;
    if (!visible || !el) {
      onHeight(0);
      return;
    }
    const stage = el.parentElement;
    const measure = () => {
      const s = stage?.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      onHeight(s ? Math.max(0, Math.round(s.bottom - r.top)) : Math.round(r.height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (stage) ro.observe(stage);
    return () => {
      ro.disconnect();
      onHeight(0);
    };
  }, [visible, onHeight]);

  if (!visible) return null;
  const index = Math.min(shown!.index, lines.length - 1);
  const line = lines[index];
  const t = TECHNIQUE_BY_ID.get(shown!.id)!;
  return (
    <div
      ref={root}
      className={`tr-consignes ${running ? '' : 'paused'}`}
      data-testid="consignes"
      data-technique={t.id}
      data-index={index}
      data-paused={running ? undefined : 'true'}
      role="group"
      aria-label={`Consignes : ${t.name}`}
    >
      <div className="cons-tag">
        <span className="cons-kind" data-testid="consigne-kind">
          {line.kind}
        </span>
        <span className="cons-tech">{t.name}</span>
        <span className="cons-count" data-testid="consigne-count">
          {index + 1} / {lines.length}
        </span>
      </div>
      <div className="cons-line">
        {/* a new key for each line: it slides up into place */}
        <p key={`${t.id}:${index}`} data-testid="consigne-line">
          {line.text}
        </p>
      </div>
      <div className="cons-segs" aria-hidden="true">
        {lines.map((_, i) => (
          <i key={i} className={i < index ? 'done' : i === index ? 'cur' : ''}>
            {i === index && <b ref={bar} />}
          </i>
        ))}
      </div>
    </div>
  );
});
