import { useState } from 'react';
export { Stats } from './progress/Overview';
export { ActivityDetail } from './progress/Dashboard';
export { TechniquesDetail, DisciplinesDetail, CombosDetail } from './progress/Details';
import { DISCIPLINES, LEVELS } from '../../domain/types';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { SessionRecord, formatDuration, localDay, sum, useStats, weekKey } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { MODE_LABEL } from '../training/plan';
import { DisciplineLabel, EmptyState, FilterChips, GoalRing, PageHead, ProgressBar, SectionHead, Sheet, TechniqueCard, toast } from '../components';
import { AppIcon } from '../icons';

const MIN_GOALS = [0, 30, 60, 90, 120, 180, 240];
const DAY_GOALS = [0, 1, 2, 3, 4, 5, 6, 7];

export function GoalsCard({ sessions }: { sessions: SessionRecord[] }) {
  const goals = useGoals((s) => s.goals);
  const setGoals = useGoals((s) => s.setGoals);
  const [edit, setEdit] = useState(false);
  const wk = weekKey(new Date().toISOString());
  const week = sessions.filter((s) => weekKey(s.start) === wk);
  const weekMin = Math.round(sum(week) / 60);
  const weekDays = new Set(week.map((s) => localDay(new Date(s.start)))).size;
  const none = !goals.weeklyMinutes && !goals.weeklySessions;
  return (
    <section className="section" aria-labelledby="h-goals">
      <SectionHead
        id="h-goals"
        title="Objectifs personnels"
        action={
          <button type="button" className="link" onClick={() => setEdit(true)} data-testid="edit-goals">
            {none ? 'Définir' : 'Modifier'}
          </button>
        }
      />
      {none ? (
        <EmptyState
          title="Aucun objectif défini"
          text="Fixe-toi un temps actif ou un nombre de jours d’entraînement par semaine."
          action={
            <button type="button" className="btn secondary" onClick={() => setEdit(true)}>
              <AppIcon id="target" size={18} /> Définir un objectif
            </button>
          }
        />
      ) : (
        <div className="card stack" style={{ gap: 14 }}>
          {goals.weeklyMinutes > 0 && (
            <div className="goal-ring">
              <GoalRing value={weekMin / goals.weeklyMinutes} />
              <div className="stack" style={{ gap: 2 }}>
                <span className="eyebrow">Temps actif cette semaine</span>
                <span className="num-figure" style={{ fontSize: '1.5rem' }}>
                  {weekMin} / {goals.weeklyMinutes} min
                </span>
                <span className="small muted">{weekMin >= goals.weeklyMinutes ? 'Objectif atteint.' : `Encore ${goals.weeklyMinutes - weekMin} min.`}</span>
              </div>
            </div>
          )}
          {goals.weeklySessions > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <div className="row between">
                <span className="small">Jours d’entraînement</span>
                <span className="small num-figure">
                  {weekDays} / {goals.weeklySessions}
                </span>
              </div>
              <ProgressBar value={weekDays / goals.weeklySessions} label="Jours d’entraînement cette semaine" tone={weekDays >= goals.weeklySessions ? 'gold' : 'red'} />
            </div>
          )}
        </div>
      )}
      {edit && (
        <Sheet title="Objectifs de la semaine" onClose={() => setEdit(false)}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Temps actif par semaine</span>
            <FilterChips label="Temps actif par semaine" value={goals.weeklyMinutes} onChange={(v) => setGoals({ weeklyMinutes: v })} options={MIN_GOALS.map((m) => ({ id: m, label: m ? `${m} min` : 'Aucun' }))} />
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Jours d’entraînement par semaine</span>
            <FilterChips label="Jours d’entraînement par semaine" value={goals.weeklySessions} onChange={(v) => setGoals({ weeklySessions: v })} options={DAY_GOALS.map((m) => ({ id: m, label: m ? String(m) : 'Aucun' }))} />
          </div>
          <button type="button" className="btn primary block" onClick={() => (setEdit(false), toast('Objectifs enregistrés'))}>
            Valider
          </button>
        </Sheet>
      )}
    </section>
  );
}

/** personal goals and favourites, moved from the Progrès screen to their own view */
export function Goals() {
  const sessions = useStats((s) => s.sessions);
  const favT = useGoals((s) => s.favTechniques);
  const favs = favT.map((id) => TECHNIQUE_BY_ID.get(id)).filter((t) => !!t);
  return (
    <div className="page" data-testid="goals-page">
      <PageHead title="Objectifs" eyebrow="Progrès" fallback="/stats" />
      <GoalsCard sessions={sessions} />
      <section className="section" aria-labelledby="h-favs">
        <SectionHead id="h-favs" title="Techniques favorites" />
        {favs.length === 0 ? (
          <EmptyState title="Aucune technique favorite" text="Ajoute une technique à tes favoris depuis sa fiche." />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {favs.map((t) => (
              <TechniqueCard key={t!.id} to={`/techniques/${t!.id}`} title={t!.name} favorite />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function SessionRow({ s, withDate }: { s: SessionRecord; withDate?: boolean }) {
  const d = new Date(s.start);
  return (
    <div className="list-row">
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{s.exerciseName}</span>
        <span className="small muted" style={{ display: 'block' }}>
          <DisciplineLabel id={s.discipline} name={DISCIPLINES.find((x) => x.id === s.discipline)?.name ?? ''} /> · {LEVELS.find((l) => l.id === s.level)?.name} · {MODE_LABEL[s.mode]} ·{' '}
          {withDate ? `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ` : ''}
          {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span className="num-figure" style={{ fontSize: '1.05rem' }}>
          {formatDuration(s.activeSec)}
        </span>
        <span className="small muted" style={{ display: 'block' }}>
          {s.reps} rép.
        </span>
      </span>
    </div>
  );
}

export function History() {
  const sessions = useStats((s) => s.sessions);
  const days = new Map<string, SessionRecord[]>();
  for (const s of [...sessions].sort((a, b) => b.start.localeCompare(a.start))) {
    const k = localDay(new Date(s.start));
    days.set(k, [...(days.get(k) ?? []), s]);
  }
  return (
    <div className="page">
      <PageHead title="Historique" eyebrow="Séances" fallback="/stats" />
      {days.size === 0 && <EmptyState title="Aucune séance enregistrée" text="Le temps est compté uniquement pendant l’entraînement actif." />}
      {[...days.entries()].map(([day, list]) => (
        <section key={day} className="stack" style={{ gap: 8 }}>
          <h3 style={{ textTransform: 'capitalize' }}>
            {new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            <span className="muted small" style={{ fontFamily: 'var(--font-text)', textTransform: 'none' }}>
              {' '}
              · {formatDuration(sum(list))}
            </span>
          </h3>
          <div className="panel">
            {list.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
