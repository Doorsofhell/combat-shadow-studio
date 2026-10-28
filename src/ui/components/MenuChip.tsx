import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { popLayer, pushLayer } from '../nav/layers';
import { NavIcon } from '../nav/NavIcon';

export interface MenuChipOption<T> {
  id: T;
  label: string;
  /** a line under the name, in the menu only (the rules of a style, what a level is for) */
  description?: ReactNode;
  lead?: ReactNode;
}

/**
 * 1.1.0 (Youssef, 2026-10-28: « toutes les options sur une seule ligne », proposition A « trois menus »): a Material 3
 * filter chip that opens a dropdown menu. The chip shows the choice; the explanations live in the menu, not on the
 * page. The menu is a history layer, so Android's back closes it first.
 */
export function MenuChip<T extends string>({
  label,
  value,
  options,
  onChange,
  chipLabel,
  lead,
  active,
  testId,
  testPrefix,
}: {
  label: string;
  value: T;
  options: MenuChipOption<T>[];
  onChange: (v: T) => void;
  /** the words on the chip (default: the chosen option's name) */
  chipLabel?: string;
  lead?: ReactNode;
  /** tinted when a filter is on (default: always) */
  active?: boolean;
  testId?: string;
  testPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; maxH: number } | null>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const layer = useRef<number | null>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  const close = (focus = true) => {
    setOpen(false);
    if (layer.current !== null) popLayer(layer.current);
    layer.current = null;
    if (focus) chip.current?.focus();
  };
  const show = () => {
    layer.current = pushLayer(() => {
      layer.current = null;
      setOpen(false);
    });
    setOpen(true);
  };
  useLayoutEffect(() => {
    if (!open || !chip.current) return;
    const r = chip.current.getBoundingClientRect();
    const w = Math.min(320, innerWidth - 32);
    const below = innerHeight - r.bottom - 16;
    setPos({ left: Math.max(16, Math.min(r.left, innerWidth - w - 16)), top: r.bottom + 4, maxH: Math.max(200, below) });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const m = menu.current;
    (m?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus();
    const down = (e: PointerEvent) => {
      if (!m?.contains(e.target as Node) && !chip.current?.contains(e.target as Node)) close(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(m?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={chip}
        type="button"
        className={`chip menu-chip ${active ?? true ? 'on' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label} : ${current.label}`}
        onClick={() => (open ? close() : show())}
        data-testid={testId}
      >
        {lead ?? current.lead}
        <span className="menu-chip-v">{chipLabel ?? current.label}</span>
        <NavIcon id="chevronDown" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            className="menu-pop"
            role="menu"
            aria-label={label}
            style={pos ? { left: pos.left, top: pos.top, maxHeight: pos.maxH } : { visibility: 'hidden' }}
            data-testid={testId ? `${testId}-menu` : undefined}
          >
            <div className="menu-pop-h" aria-hidden>
              {label}
            </div>
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={o.id === value}
                className="menu-pop-i"
                onClick={() => {
                  onChange(o.id);
                  close();
                }}
                data-testid={testPrefix ? `${testPrefix}${o.id}` : undefined}
              >
                {o.lead && <span className="menu-pop-lead">{o.lead}</span>}
                <span className="menu-pop-t">
                  {o.label}
                  {o.description && <small>{o.description}</small>}
                </span>
                <span className="menu-pop-ck">{o.id === value && <NavIcon id="check" />}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

/** the four bars of a level (filled up to the level), drawn in the chip and the menu */
export function LevelPips({ index }: { index: number }) {
  return (
    <span className="level-pips" aria-hidden>
      {[0, 1, 2, 3].map((j) => (
        <i key={j} className={j <= index ? 'f' : ''} style={{ height: 5 + j * 3 }} />
      ))}
    </span>
  );
}
