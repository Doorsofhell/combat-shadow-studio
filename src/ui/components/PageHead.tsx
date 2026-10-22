import type { ReactNode } from 'react';

/**
 * Screen header: eyebrow and title. v0.32 (navigation dynamique: « aucun bouton de retour applicatif en haut de
 * l'écran »): Retour is place 1 of the bottom bar, with the same history rules; `back` and `fallback` are kept so
 * the screens' calls stay as they were (the parent page of each screen is in nav/config.ts, NAV_PARENT).
 */
export function PageHead({ title, eyebrow, right }: { title: string; eyebrow?: string; back?: boolean; right?: ReactNode; fallback?: string }) {
  return (
    <header className="page-head">
      <div className="grow">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {right}
    </header>
  );
}
