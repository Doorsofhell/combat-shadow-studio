import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBack } from '../icons';

/** Screen header: back button (history, or `fallback` when the screen was opened directly), eyebrow and title. */
export function PageHead({ title, eyebrow, back = true, right, fallback = '/' }: { title: string; eyebrow?: string; back?: boolean; right?: ReactNode; fallback?: string }) {
  const nav = useNavigate();
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) nav(-1);
    else nav(fallback, { replace: true });
  };
  return (
    <header className="page-head">
      {back && (
        <button type="button" className="btn icon ghost" onClick={goBack} aria-label="Retour" style={{ marginLeft: -12 }}>
          <IconBack />
        </button>
      )}
      <div className="grow">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {right}
    </header>
  );
}
