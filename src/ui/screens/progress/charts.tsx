/**
 * Charts of the Progrès screen. Current period in deep red, previous period in slate grey (0.34)
 * (the colour pair of the brief; both series are also named in text: zone 4 lines, readout, sr-only table); text stays in the ink tokens and a
 * legend always names both series. Every chart has a text equivalent (sr-only table).
 */
import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Bucket, Delta, Row } from '../../../domain/progress';
import { delta, deltaLabel } from '../../../domain/progress';

/** size of an element, followed as the window changes (rotation, Android navigation bar) */
export function useBox<T extends HTMLElement>(): [RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setBox((b) => (b.w === el.clientWidth && b.h === el.clientHeight ? b : { w: el.clientWidth, h: el.clientHeight }));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

const TREND_TEXT: Record<Delta['trend'], string> = {
  up: 'En hausse',
  flat: 'Stable',
  down: 'En baisse',
  new: 'Nouvelle activité',
  none: 'Aucune donnée',
};

/** arrow + words: the state never relies on colour alone */
export function TrendMark({ d, unit, short = false, testId }: { d: Delta; unit: (n: number) => string; short?: boolean; testId?: string }) {
  const dir = d.trend === 'up' || d.trend === 'new' ? 'up' : d.trend === 'down' ? 'down' : d.trend === 'flat' ? 'flat' : null;
  const text = deltaLabel(d, unit);
  return (
    <span className={`trend ${d.tone}`} data-testid={testId} data-trend={d.trend} title={`${TREND_TEXT[d.trend]} par rapport à la période précédente`}>
      {dir && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
          {dir === 'flat' ? <path d="M1.5 6h8M7 3l3 3-3 3" /> : dir === 'up' ? <path d="M6 10.5v-8M3 5l3-3 3 3" /> : <path d="M6 1.5v8M3 7l3 3 3-3" />}
        </svg>
      )}
      {d.trend !== 'new' && d.trend !== 'none' && <span className="sr-only">{TREND_TEXT[d.trend]} : </span>}
      {short && d.trend !== 'new' && d.trend !== 'none' && d.pct !== null ? text.replace(/ \(.*\)$/, '') : text}
    </span>
  );
}

export function Legend({ cur, prev }: { cur: string; prev: string }) {
  return (
    <div className="legend" aria-hidden>
      <span>
        <i className="sw cur" />
        {cur}
      </span>
      <span>
        <i className="sw prev" />
        {prev}
      </span>
    </div>
  );
}

/**
 * Paired columns: for each bucket, the previous period (left) and the current one (right), on one
 * axis in minutes. Tapping a pair shows its values; the selected pair is announced.
 */
export function CompareColumns({
  data,
  label,
  format,
  labelOf,
  rangeOf,
  height,
}: {
  data: Bucket[];
  label: string;
  format: (sec: number) => string;
  labelOf: (b: Bucket) => string;
  rangeOf: (b: Bucket, which: 'cur' | 'prev') => string;
  height: number;
}) {
  const [wrap, box] = useBox<HTMLDivElement>();
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => setSel(null), [data.length]);
  const max = Math.max(60, ...data.map((b) => Math.max(b.curSec, b.prevSec)));
  // a round top of the axis, in minutes
  const steps = [1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300, 480, 600, 900, 1200, 1800, 2400, 3600, 6000];
  const topMin = steps.find((s) => s * 60 >= max) ?? Math.ceil(max / 60);
  const top = topMin * 60;
  const labelH = 16;
  const axisW = 30;
  // the readout line (26 px) and the date labels sit inside the given height
  const h = Math.max(40, height - labelH - 30);
  const w = Math.max(0, box.w - axisW);
  const n = data.length;
  const slot = n ? w / n : 0;
  const gap = 2;
  const pairW = Math.max(4, Math.min(34, slot * 0.72));
  const barW = (pairW - gap) / 2;
  const y = (sec: number) => h - (sec / top) * h;
  const every = Math.ceil(n / Math.max(1, Math.floor(w / 42)));
  const pick = sel ?? null;
  const cur = pick !== null ? data[pick] : null;
  const bar = (x: number, sec: number, cls: string) => {
    if (sec <= 0) return null;
    const bh = Math.max(2, h - y(sec));
    const r = Math.min(4, barW / 2, bh);
    // rounded top, square base on the axis
    return <path className={cls} d={`M${x},${h} v${-(bh - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${bh - r} z`} />;
  };
  return (
    <figure className="cmp-cols" style={{ margin: 0 }}>
      <div className="readout" aria-live="polite" data-testid="chart-readout">
        {cur ? (
          <>
            <strong>{rangeOf(cur, 'cur')}</strong> {format(cur.curSec)}
            <span className="muted">
              {' '}
              · précédente ({rangeOf(cur, 'prev')}) {format(cur.prevSec)}
            </span>
          </>
        ) : (
          <span className="muted">Minutes actives · touchez une colonne</span>
        )}
      </div>
      <div ref={wrap} style={{ position: 'relative', height: h + labelH }}>
        {box.w > 0 && (
          <svg width={box.w} height={h + labelH} aria-hidden focusable="false" style={{ display: 'block', overflow: 'visible' }}>
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line className="grid" x1={axisW} x2={box.w} y1={y(top * f)} y2={y(top * f)} />
                <text className="tick" x={axisW - 6} y={y(top * f)} textAnchor="end" dominantBaseline="central">
                  {Math.round(topMin * f)}
                </text>
              </g>
            ))}

            {data.map((b, i) => {
              const x0 = axisW + i * slot + (slot - pairW) / 2;
              return (
                <g key={b.index} className={pick === i ? 'on' : ''}>
                  {pick === i && <rect className="hl" x={axisW + i * slot} y={0} width={slot} height={h} rx={4} />}
                  {bar(x0, b.prevSec, 'prev')}
                  {bar(x0 + barW + gap, b.curSec, b.inProgress ? 'cur partial' : 'cur')}
                  {(i % every === 0 || i === n - 1) && (
                    <text className="tick" x={axisW + i * slot + slot / 2} y={h + 12} textAnchor="middle">
                      {labelOf(b)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        <div className="hits" style={{ left: axisW, height: h }}>
          {data.map((b, i) => (
            <button
              key={b.index}
              type="button"
              aria-label={`${rangeOf(b, 'cur')} : ${format(b.curSec)} ; période précédente ${rangeOf(b, 'prev')} : ${format(b.prevSec)}`}
              aria-pressed={pick === i}
              onClick={() => setSel(pick === i ? null : i)}
            />
          ))}
        </div>
      </div>
      {/* a table ignores the 1px width of .sr-only: the wrapper takes it */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>Intervalle</th>
              <th>Période actuelle</th>
              <th>Période précédente</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.index}>
                <td>{rangeOf(b, 'cur')}</td>
                <td>{format(b.curSec)}</td>
                <td>{format(b.prevSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** one row per level or category: current bar over the previous one, values and change */
export function PairRows({ rows, format, unit, empty }: { rows: Row[]; format: (sec: number) => string; unit: (n: number) => string; empty?: ReactNode }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.cur, r.prev)));
  if (!rows.some((r) => r.cur || r.prev)) return <>{empty}</>;
  return (
    <ul className="pair-rows">
      {rows.map((r) => (
        <PairRow key={r.id} r={r} max={max} format={format} unit={unit} />
      ))}
    </ul>
  );
}

function PairRow({ r, max, format, unit }: { r: Row; max: number; format: (sec: number) => string; unit: (n: number) => string }) {
  const d = delta(r.cur, r.prev);
  return (
    <li className="pair-row fit" data-testid={`row-${r.id}`}>
      <span className="lbl">{r.label}</span>
      <span className="pbars" aria-hidden>
        <i className="cur" style={{ width: `${(r.cur / max) * 100}%` }} />
        <i className="prev" style={{ width: `${(r.prev / max) * 100}%` }} />
      </span>
      <span className="val">
        <strong>{format(r.cur)}</strong>
        <TrendMark d={d} unit={unit} short />
      </span>
      <span className="sr-only">période précédente {format(r.prev)}</span>
    </li>
  );
}
