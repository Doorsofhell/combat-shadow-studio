import { GUIDES } from '../domain/guide';
import { TECHNIQUE_BY_ID } from '../domain/techniques';

/** "Comment faire" sheet of a technique: numbered steps, frequent mistakes, breathing, key points. */
export function GuideCard({ id, southpaw, title = false }: { id: string; southpaw?: boolean; title?: boolean }) {
  const t = TECHNIQUE_BY_ID.get(id);
  const g = GUIDES[id];
  if (!t || !g) return null;
  return (
    <div className="stack" style={{ gap: 12 }}>
      {title && <h2>{t.name}</h2>}
      <div className="card stack">
        <h3>Comment faire</h3>
        {southpaw && <p className="small muted">Fiche écrite pour la garde orthodoxe : en garde gaucher, inverse gauche et droite.</p>}
        <ol className="steps">
          {g.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {g.breath && (
          <p className="small">
            <b>Respiration : </b>
            {g.breath}
          </p>
        )}
      </div>
      <div className="card stack">
        <h3>Erreurs fréquentes</h3>
        <ul className="plain-list">
          {g.errors.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="card stack">
        <h3>Points clés</h3>
        <ul className="plain-list">
          {t.keyPoints.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
