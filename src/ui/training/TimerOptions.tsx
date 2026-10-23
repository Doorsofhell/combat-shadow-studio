import { Segmented, Toggle } from '../components';
import { useSettings } from '../../store/settings';
import { INTENSITY_HELP, INTENSITY_LABEL, type CardioIntensity, type CardioOptions } from './plan';

/**
 * v0.47 « Chronomètre intégré au coach 3D »: the Cardio intervals (§7) and the chronometer options of Rounds and
 * Cardio (§8: preparation, warning before the end, gongs, voice). They are remembered in the settings; the Rounds
 * options themselves (length, rest, number) stay in RoundOptions, unchanged.
 */

const INTENSITIES: CardioIntensity[] = ['moderee', 'soutenue', 'intense'];

/** the intervals as query parameters of /entrainement (so a saved session resumes with the same plan) */
export function cardioParams(c: CardioOptions) {
  return { cw: String(c.work), cr: String(c.rest), cc: String(c.cycles), ci: c.intensity };
}

/** reads them back; anything missing or invalid falls back to the remembered choice */
export function cardioFromQuery(q: URLSearchParams, fallback: CardioOptions): CardioOptions {
  const n = (k: string, d: number, lo: number, hi: number) => {
    const v = Number(q.get(k));
    return Number.isFinite(v) && v >= lo && v <= hi ? v : d;
  };
  const i = q.get('ci') as CardioIntensity | null;
  return {
    work: n('cw', fallback.work, 5, 600),
    rest: n('cr', fallback.rest, 0, 600),
    cycles: Math.round(n('cc', fallback.cycles, 1, 50)),
    intensity: i && INTENSITIES.includes(i) ? i : fallback.intensity,
  };
}

export function CardioOptionsPicker() {
  const c = useSettings((s) => s.settings.cardio);
  const set = useSettings((s) => s.set);
  const patch = (p: Partial<CardioOptions>) => set({ cardio: { ...c, ...p } });
  return (
    <div className="stack" style={{ gap: 14 }} data-testid="cardio-options">
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Effort</span>
        <Segmented label="Durée d’effort" value={c.work} onChange={(v) => patch({ work: v })} options={[20, 30, 40, 60].map((s) => ({ id: s, label: `${s} s` }))} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Récupération</span>
        <Segmented label="Durée de récupération" value={c.rest} onChange={(v) => patch({ rest: v })} options={[10, 20, 30, 60].map((s) => ({ id: s, label: `${s} s` }))} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Cycles</span>
        <Segmented label="Nombre de cycles" value={c.cycles} onChange={(v) => patch({ cycles: v })} options={[5, 8, 10, 12].map((s) => ({ id: s, label: String(s) }))} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Intensité</span>
        <Segmented label="Intensité" value={c.intensity} onChange={(v) => patch({ intensity: v })} options={INTENSITIES.map((i) => ({ id: i, label: INTENSITY_LABEL[i] }))} />
        <p className="small muted" data-testid="intensity-help">
          {INTENSITY_HELP[c.intensity]}
        </p>
      </div>
      <p className="small muted">Ces valeurs sont des exemples à adapter à ta forme, pas une prescription.</p>
    </div>
  );
}

/** preparation, warning before the end, gongs and voice: shared by Rounds and Cardio */
export function ChronoOptions() {
  const s = useSettings((x) => x.settings);
  const set = useSettings((x) => x.set);
  return (
    <div className="stack" style={{ gap: 10 }} data-testid="chrono-options">
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Préparation</span>
        <Segmented label="Préparation avant de commencer" value={s.prepSec} onChange={(v) => set({ prepSec: v })} options={[3, 5, 10, 15].map((v) => ({ id: v, label: `${v} s` }))} />
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Alerte avant la fin</span>
        <Segmented
          label="Alerte avant la fin du round"
          value={s.roundWarnSec}
          onChange={(v) => set({ roundWarnSec: v })}
          options={[
            { id: 0, label: 'Aucune' },
            { id: 10, label: '10 s' },
            { id: 30, label: '30 s' },
          ]}
        />
      </div>
      <div className="panel">
        <Toggle label="Gongs" hint="Au début et à la fin de chaque round ou effort" on={s.gongs} onChange={(v) => set({ gongs: v })} />
        <Toggle label="Annonces vocales" hint="Rounds, repos, temps restant et consignes" on={s.voice} onChange={(v) => set({ voice: v })} />
      </div>
    </div>
  );
}
