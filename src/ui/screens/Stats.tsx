import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISCIPLINES, DisciplineId, LEVELS } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { SessionRecord, byKey, formatDuration, localDay, monthKey, sessionCount, sum, useStats, weekKey } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { MODE_LABEL } from '../training/plan';
import { BarChart, EmptyState, FilterChips, GoalRing, HBarList, PageHead, ProgressBar, SectionHead, Segmented, Sheet, StatTile, Tabs, TechniqueCard, toast } from '../components';
import { IconTarget } from '../icons';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function periods(kind: 'semaine' | 'mois', n: number) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    if (kind === 'semaine') {
      const x = new Date(d);
      x.setDate(x.getDate() - i * 7);
      const k = weekKey(x.toISOString());
      out.push({ key: k, label: `${Number(k.slice(8))}/${Number(k.slice(5, 7))}` });
    } else {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push({ key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[x.getMonth()] });
    }
  }
  return out;
}

const minutes = (sec: number) => `${Math.round(sec / 60)} min`;

function Progression({ sessions }: { sessions: SessionRecord[] }) {
  const [kind, setKind] = useState<'semaine' | 'mois'>('semaine');
  const ps = periods(kind, kind === 'semaine' ? 8 : 6);
  const per = byKey(sessions, (s) => (kind === 'semaine' ? weekKey(s.start) : monthKey(localDay(new Date(s.start)))));
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row between">
        <h3>Temps actif</h3>
        <Segmented
          label="Période"
          value={kind}
          onChange={setKind}
          options={[
            { id: 'semaine', label: 'Semaines' },
            { id: 'mois', label: 'Mois' },
          ]}
        />
      </div>
      <BarChart
        label={`Minutes actives par ${kind}`}
        format={minutes}
        data={ps.map((p) => ({ key: p.key, label: p.label, value: per[p.key] ?? 0, display: String(Math.round((per[p.key] ?? 0) / 60)) }))}
      />
      <p className="small muted">En minutes. La dernière barre correspond à la période en cours.</p>
    </div>
  );
}

const MIN_GOALS = [0, 30, 60, 90, 120, 180, 240];
const DAY_GOALS = [0, 1, 2, 3, 4, 5, 6, 7];

function GoalsCard({ sessions }: { sessions: SessionRecord[] }) {
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
              <IconTarget width={18} /> Définir un objectif
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

export function Stats() {
  const sessions = useStats((s) => s.sessions);
  const favT = useGoals((s) => s.favTechniques);
  const [disc, setDisc] = useState<DisciplineId | 'toutes'>('toutes');
  const filtered = disc === 'toutes' ? sessions : sessions.filter((s) => s.discipline === disc);
  const reps = filtered.reduce((a, s) => a + s.reps, 0);
  const byDisc = byKey(sessions, (s) => s.discipline);
  const byLevel = byKey(filtered, (s) => s.level);
  const repsBy: Record<string, number> = {};
  for (const s of filtered) repsBy[s.exerciseId] = (repsBy[s.exerciseId] ?? 0) + s.reps;
  const exRows = Object.entries(byKey(filtered, (s) => s.exerciseId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const names = new Map(sessions.map((s) => [s.exerciseId, s.exerciseName]));
  const recent = [...sessions].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 4);
  const favs = favT.map((id) => TECHNIQUE_BY_ID.get(id)).filter((t) => !!t);

  return (
    <div className="page">
      <PageHead
        title="Progrès"
        eyebrow="Statistiques"
        back={false}
        right={
          <Link to="/historique" className="btn secondary sm">
            Historique
          </Link>
        }
      />
      <Tabs
        label="Discipline"
        value={disc}
        onChange={setDisc}
        items={[{ id: 'toutes' as const, label: 'Toutes' }, ...DISCIPLINES.map((d) => ({ id: d.id, label: d.short }))]}
      />
      <div className="stat-tiles four" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatTile value={formatDuration(sum(filtered))} label="Temps actif total" testId="total-time" />
        <StatTile value={sessionCount(filtered)} label="Séances" />
        <StatTile value={reps} label="Répétitions" />
        <StatTile value={new Set(filtered.map((s) => s.exerciseId)).size} label="Exercices pratiqués" />
      </div>

      {sessions.length === 0 && (
        <EmptyState
          title="Pas encore de données"
          text="Le temps est compté uniquement pendant l’entraînement actif, sur cet appareil. Lance une première séance pour voir ta progression."
          action={
            <Link to="/entrainer" className="btn primary">
              S’entraîner
            </Link>
          }
        />
      )}

      <GoalsCard sessions={sessions} />

      {sessions.length > 0 && (
        <>
          <Progression sessions={filtered} />
          {disc === 'toutes' && (
            <div className="card stack">
              <h3>Par discipline</h3>
              <HBarList format={formatDuration} rows={DISCIPLINES.map((d) => ({ label: d.name, value: byDisc[d.id] ?? 0 }))} />
            </div>
          )}
          <div className="card stack">
            <h3>Par niveau</h3>
            <HBarList format={formatDuration} rows={LEVELS.map((l) => ({ label: l.name, value: byLevel[l.id] ?? 0 }))} />
          </div>
          <div className="card stack" style={{ gap: 4 }}>
            <h3>Par exercice</h3>
            {exRows.length === 0 && <p className="small muted">Aucun exercice pratiqué pour ce filtre.</p>}
            {exRows.map(([id, sec]) => (
              <div key={id} className="list-row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  {names.get(id) ?? EXERCISE_BY_ID.get(id)?.name ?? id}
                  <span className="small muted" style={{ display: 'block' }}>
                    {repsBy[id] ?? 0} répétitions
                  </span>
                </span>
                <span className="num-figure" style={{ fontSize: '1.1rem' }}>
                  {formatDuration(sec)}
                </span>
              </div>
            ))}
          </div>
          <section className="section" aria-labelledby="h-recent">
            <SectionHead id="h-recent" title="Dernières séances" action={<Link to="/historique">Historique</Link>} />
            <div className="panel">
              {recent.map((s) => (
                <SessionRow key={s.id} s={s} withDate />
              ))}
            </div>
          </section>
        </>
      )}

      {favs.length > 0 && (
        <section className="section" aria-labelledby="h-favs">
          <SectionHead id="h-favs" title="Techniques favorites" />
          <div className="stack" style={{ gap: 8 }}>
            {favs.map((t) => (
              <TechniqueCard key={t!.id} to={`/techniques/${t!.id}`} title={t!.name} favorite />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionRow({ s, withDate }: { s: SessionRecord; withDate?: boolean }) {
  const d = new Date(s.start);
  return (
    <div className="list-row">
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{s.exerciseName}</span>
        <span className="small muted" style={{ display: 'block' }}>
          {DISCIPLINES.find((x) => x.id === s.discipline)?.name} · {LEVELS.find((l) => l.id === s.level)?.name} · {MODE_LABEL[s.mode]} ·{' '}
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
