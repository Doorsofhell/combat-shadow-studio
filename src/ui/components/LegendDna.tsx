import type { Dna, DnaAxisId } from '../../domain/catalog/dna';
import { dnaSummary } from '../../domain/catalog/dna';

/**
 * v0.28 (Youssef, 2026-10-20 21:52 : « retire les rectangles sur le nombre de techniques, sois
 * créatif ») : la « fleur de style ». Un pétale par famille de mouvements, dont la surface suit la part
 * de cette famille dans les fiches (rayon en racine carrée : une part double donne une surface
 * double) ; au cœur, le nombre de fiches. Toutes les valeurs sont calculées (src/domain/catalog/dna.ts).
 * Accessibilité : role="img" et un aria-label qui donne les pourcentages ; la légende visible les
 * répète en texte.
 */
const AXIS_CLASS: Record<DnaAxisId, string> = {
  poings: 'dna-poings',
  pieds: 'dna-pieds',
  'genoux-coudes': 'dna-genoux',
  'lutte-sol': 'dna-sol',
  defense: 'dna-defense',
  deplacements: 'dna-deplacements',
};

function petal(cx: number, cy: number, r0: number, r: number, a0: number, a1: number) {
  const p = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  return `M ${p(r0, a0)} L ${p(r, a0)} A ${r} ${r} 0 0 1 ${p(r, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export function DnaFlower({ dna, count, label, size = 96, testId }: { dna: Dna; count: number; label: string; size?: number; testId?: string }) {
  const C = 50;
  const R0 = 17;
  const R = 48;
  const max = Math.max(0, ...dna.axes.map((a) => a.share));
  const step = (2 * Math.PI) / dna.axes.length;
  return (
    <span className="dna-flower" style={{ width: size, height: size }} data-testid={testId}>
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label} : ${count} fiches. ${dnaSummary(dna)}`}>
        <circle cx={C} cy={C} r={R} className="dna-guide" />
        <circle cx={C} cy={C} r={(R0 + R) / 2} className="dna-guide" />
        {dna.axes.map((a, i) => {
          if (!a.count || !max) return null;
          const r = R0 + (R - R0) * Math.sqrt(a.share / max);
          const a0 = -Math.PI / 2 + i * step - step / 2 + 0.05;
          return <path key={a.id} d={petal(C, C, R0, r, a0, a0 + step - 0.1)} className={`dna-petal ${AXIS_CLASS[a.id]}`} />;
        })}
        <circle cx={C} cy={C} r={R0 - 1.5} className="dna-core" />
      </svg>
      {/* the count is HTML text over the core (readable, measured by the contrast audit); the svg label already says it */}
      <span className={`dna-count ${count >= 1000 ? 'xl' : ''}`} aria-hidden>
        {count}
      </span>
    </span>
  );
}

/** légende de la fleur : les familles présentes, de la plus forte à la plus faible */
export function DnaLegend({ dna, max = 6 }: { dna: Dna; max?: number }) {
  const list = [...dna.axes].filter((a) => a.count > 0).sort((a, b) => b.count - a.count).slice(0, max);
  return (
    <ul className="dna-legend" aria-hidden>
      {list.map((a) => (
        <li key={a.id}>
          <span className={`dna-dot ${AXIS_CLASS[a.id]}`} />
          <span className="t">{a.label}</span>
          <b>{a.percent} %</b>
        </li>
      ))}
    </ul>
  );
}

/** barre d'ADN miniature des cartes de la liste des légendes */
export function DnaBar({ dna, name }: { dna: Dna; name: string }) {
  return (
    <span className="dna-bar" role="img" aria-label={`ADN de combat de ${name} : ${dnaSummary(dna)}`}>
      {dna.axes
        .filter((a) => a.count > 0)
        .map((a) => (
          <span key={a.id} className={AXIS_CLASS[a.id]} style={{ flexGrow: a.count }} />
        ))}
    </span>
  );
}
