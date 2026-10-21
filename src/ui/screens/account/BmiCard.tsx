import { BMI_GAUGE, BMI_HEIGHT_CM, BMI_LIMITS, BMI_MINOR_NOTE, BMI_WEIGHT_KG, bmiGaugePosition, computeBmi, formatBmi, type BmiCategoryId } from '../../../domain/bmi';

/** the four zones of the gauge (the three obesity classes share the last one; the badge names the class) */
const ZONES: { id: string; label: string; range: string; from: number; to: number; cats: BmiCategoryId[] }[] = [
  { id: 'insuffisance', label: 'Insuffisance pondérale', range: 'moins de 18,5', from: BMI_GAUGE.min, to: 18.5, cats: ['insuffisance'] },
  { id: 'normale', label: 'Corpulence normale', range: '18,5 à 24,9', from: 18.5, to: 25, cats: ['normale'] },
  { id: 'surpoids', label: 'Surpoids', range: '25 à 29,9', from: 25, to: 30, cats: ['surpoids'] },
  { id: 'obesite', label: 'Obésité', range: '30 et plus', from: 30, to: BMI_GAUGE.max, cats: ['obesite-1', 'obesite-2', 'obesite-3'] },
];
const TICKS = [18.5, 25, 30];
const pct = (v: number) => `${bmiGaugePosition(v) * 100}%`;

/**
 * 0.27 (Youssef, 2026-10-20 21:45: « un calcul imc auto avec recommandation et jauge dans le profil »): the IMC
 * computed from the height and weight of the profile as they are typed, its adult category, a short training
 * tip and the limits of the measure. Nothing leaves the device: the measures are those of the local profile.
 */
export function BmiCard({ heightCm, weightKg, age }: { heightCm?: number; weightKg?: number; age?: number }) {
  const r = computeBmi(heightCm, weightKg, age);
  return (
    <section className="bmi-card" aria-labelledby="bmi-title" data-testid="bmi-card" data-status={r.status}>
      <div className="bmi-head" aria-live="polite">
        <h3 id="bmi-title">Ton IMC</h3>
        {(r.status === 'ok' || r.status === 'minor') && (
          <span className="bmi-value" data-testid="bmi-value">
            {formatBmi(r.value)}
          </span>
        )}
        {r.status === 'ok' && (
          <span className={`badge bmi-badge z-${ZONES.find((z) => z.cats.includes(r.category.id))!.id}`} data-testid="bmi-category">
            {r.category.label}
          </span>
        )}
      </div>

      {r.status === 'missing' && (
        <p className="small muted" data-testid="bmi-hint">
          Indique ta taille ({BMI_HEIGHT_CM.min} à {BMI_HEIGHT_CM.max} cm) et ton poids ({BMI_WEIGHT_KG.min} à {BMI_WEIGHT_KG.max} kg) : ton IMC (indice de masse corporelle) se calcule tout seul.
        </p>
      )}
      {r.status === 'invalid' && (
        <p className="small muted" data-testid="bmi-hint">
          Vérifie ta taille et ton poids : l’IMC se calcule pour une taille de {BMI_HEIGHT_CM.min} à {BMI_HEIGHT_CM.max} cm et un poids de {BMI_WEIGHT_KG.min} à {BMI_WEIGHT_KG.max} kg.
        </p>
      )}
      {r.status === 'minor' && (
        <p className="note" data-testid="bmi-minor">
          {BMI_MINOR_NOTE}
        </p>
      )}

      {r.status === 'ok' && (
        <>
          <div
            className="bmi-gauge"
            role="meter"
            aria-label="Jauge de l’IMC"
            aria-valuemin={BMI_GAUGE.min}
            aria-valuemax={BMI_GAUGE.max}
            aria-valuenow={Math.min(BMI_GAUGE.max, Math.max(BMI_GAUGE.min, r.value))}
            aria-valuetext={`IMC ${formatBmi(r.value)} : ${r.category.label.toLowerCase()}`}
            data-testid="bmi-gauge"
          >
            <div className="bmi-bar">
              {ZONES.map((z) => (
                <span key={z.id} className={`bmi-zone z-${z.id}`} style={{ left: pct(z.from), width: `calc(${pct(z.to)} - ${pct(z.from)})` }} />
              ))}
            </div>
            <span className="bmi-marker" style={{ left: pct(r.value) }} data-testid="bmi-marker">
              <b>{formatBmi(r.value)}</b>
            </span>
            <div className="bmi-ticks" aria-hidden>
              <span style={{ left: 0 }}>{BMI_GAUGE.min}</span>
              {TICKS.map((t) => (
                <span key={t} style={{ left: pct(t) }}>
                  {formatBmi(t).replace(',0', '')}
                </span>
              ))}
              <span style={{ left: '100%' }}>{BMI_GAUGE.max}</span>
            </div>
          </div>
          <ul className="bmi-legend" aria-label="Zones de l’échelle adulte">
            {ZONES.map((z) => {
              const on = z.cats.includes(r.category.id);
              return (
                <li key={z.id} className={on ? 'on' : ''} data-zone={z.id} aria-current={on ? 'true' : undefined}>
                  <i className={`bmi-swatch z-${z.id}`} aria-hidden />
                  <span>
                    {on ? <strong>{z.label}</strong> : z.label} <span className="muted">({z.range})</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="bmi-advice" data-testid="bmi-advice">
            {r.category.advice}
          </p>
        </>
      )}

      <p className="small muted" data-testid="bmi-limits">
        {BMI_LIMITS}
      </p>
    </section>
  );
}
