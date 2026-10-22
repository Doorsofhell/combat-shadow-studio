import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DISCIPLINES, type DisciplineId } from '../../../domain/types';
import { TECHNIQUES, techniquesFor } from '../../../domain/techniques';
import { filterTechniques } from '../../../domain/kickboxingStyles';
import { masteryCount } from '../../../domain/mastery';
import { PERIOD_PRESETS, coverage, type PeriodPreset } from '../../../domain/progress';
import { formatDuration } from '../../../store/stats';
import { useGoals } from '../../../store/goals';
import { useProgressView } from '../../../store/progressView';
import { EmptyState, FilterChips, PageHead, Tabs } from '../../components';
import { AppIcon, DisciplineIcon } from '../../icons';
import { useNavActions } from '../../nav/store';
import { MasteryPanel, PeriodSheet, fmtRange } from './Dashboard';
import { Ring } from './Ring';
import { courseFor, useProgressData } from './data';
import './progress.css';

/** the period chips and the bar's « Période », shared by the detail screens that depend on the period */
function usePeriod() {
  const v = useProgressView();
  const { today } = useProgressData();
  const [open, setOpen] = useState(false);
  const label = v.preset === 'perso' ? (v.custom ? fmtRange(v.custom.from, v.custom.to) : 'Perso') : PERIOD_PRESETS.find((x) => x.id === v.preset)!.label;
  useNavActions({ period: { run: () => setOpen(true), pressed: v.preset === 'perso', ariaLabel: `Période : ${label}`, testId: 'nav-period' } });
  const chips = (
    <FilterChips
      label="Période"
      scroll
      testPrefix="period-"
      value={v.preset}
      onChange={(preset: PeriodPreset) => (preset === 'perso' ? setOpen(true) : v.set({ preset }))}
      options={[
        ...PERIOD_PRESETS.map((x) => ({ id: x.id as PeriodPreset, label: x.label })),
        { id: 'perso' as PeriodPreset, label: v.preset === 'perso' && v.custom ? fmtRange(v.custom.from, v.custom.to) : 'Perso', icon: <AppIcon id="calendar" size={16} /> },
      ]}
    />
  );
  const sheet = open ? <PeriodSheet today={today} initial={v.custom} onClose={() => setOpen(false)} onApply={(custom) => (v.set({ preset: 'perso', custom }), setOpen(false))} /> : null;
  return { chips, sheet, label };
}

function DisciplineTabs({ value, onChange }: { value: DisciplineId | 'toutes'; onChange: (d: DisciplineId | 'toutes') => void }) {
  return (
    <Tabs
      label="Discipline"
      value={value}
      onChange={onChange}
      items={[{ id: 'toutes' as const, label: 'Toutes', testId: 'disc-toutes' }, ...DISCIPLINES.map((x) => ({ id: x.id, label: x.short, icon: <DisciplineIcon id={x.id} size={20} />, testId: `disc-${x.id}` }))]}
    />
  );
}

/**
 * v0.39 maquette 4: techniques marked as mastered (on the technique sheets) over the techniques of the discipline,
 * then the course (techniques met in practised exercises). A mark has no date: this screen does not follow the period.
 */
export function TechniquesDetail() {
  const v = useProgressView();
  const [q] = useSearchParams();
  const d = (q.get('d') as DisciplineId | null) ?? v.discipline;
  const { kb, cov } = useProgressData({ discipline: d });
  const mastery = useGoals((s) => s.mastery);
  const list = d === 'toutes' ? TECHNIQUES : filterTechniques(techniquesFor(d), d, kb);
  const c = masteryCount(list, mastery);
  const nav = useNavigate();
  // the marks have no date; the period still applies to the other screens, so it stays reachable from the bar
  const period = usePeriod();
  const setD = (x: DisciplineId | 'toutes') => (v.set({ discipline: x }), nav('/stats/techniques', { replace: true }));
  return (
    <div className="page p2" data-testid="p2-techniques">
      <PageHead title="Techniques" eyebrow="Progrès" fallback="/stats" />
      <DisciplineTabs value={d} onChange={setD} />
      <div className="p2-hero">
        <Ring value={c.total ? c.acquises / c.total : 0} size={196} stroke={18} tone="orange" label={`${c.acquises} techniques assimilées sur ${c.total}`} testId="tech-ring">
          <AppIcon id="mastered" size={24} tone="gold" />
          <b className="p2-big num-figure">
            {c.acquises} <small>/ {c.total}</small>
          </b>
          <span className="p2-cap">techniques assimilées</span>
        </Ring>
      </div>
      <ul className="p2-legend" aria-label="Répartition">
        <li>
          <i className="dot gold" aria-hidden /> Assimilées <b className="num-figure">{c.acquises}</b>
        </li>
        <li>
          <i className="dot orange" aria-hidden /> À revoir <b className="num-figure">{c.aRevoir}</b>
        </li>
        <li>
          <i className="dot muted" aria-hidden /> Non évaluées <b className="num-figure">{c.autres}</b>
        </li>
      </ul>
      <div className="p2-card">
        <Ring value={cov.ratio} size={64} stroke={8} label={`Parcours : ${cov.studied} techniques étudiées sur ${cov.total}`} testId="course-ring">
          <b className="num-figure">{Math.round(cov.ratio * 100)}%</b>
        </Ring>
        <span>
          <b>Parcours</b>
          <br />
          <span className="small muted">
            {cov.studied} techniques étudiées sur {cov.total} (rencontrées dans tes exercices pratiqués).
          </span>
        </span>
      </div>
      <MasteryPanel discipline={d} kb={kb} />
      <Link className="btn secondary block" to={`/techniques${d === 'toutes' ? '' : `?d=${d}`}`} data-testid="see-techniques">
        Voir mes techniques <AppIcon id="chevron" size={16} />
      </Link>
      <p className="small muted">Assimilée ou à revoir : ce que tu as marqué toi-même sur la fiche d’une technique. Aucun capteur ne juge ton exécution.</p>
      {period.sheet}
    </div>
  );
}

/** v0.39 maquette 5: the six disciplines, their course and their active time over the period; tap = techniques */
export function DisciplinesDetail() {
  const { sessions, cur, p, kb, sequenceOf, v } = useProgressData();
  const period = usePeriod();
  const nav = useNavigate();
  return (
    <div className="page p2" data-testid="p2-disciplines">
      <PageHead title="Disciplines" eyebrow="Progrès" fallback="/stats" />
      {period.chips}
      <ul className="p2-list">
        {DISCIPLINES.map((x) => {
          const f = { discipline: x.id, level: v.level, kind: null };
          const cov = coverage(sessions, courseFor(f, kb), f, sequenceOf, p);
          const mine = cur.filter((r) => r.discipline === x.id);
          const sec = mine.reduce((a, r) => a + r.activeSec, 0);
          return (
            <li key={x.id}>
              <button type="button" className="p2-disc" onClick={() => (v.set({ discipline: x.id }), nav(`/stats/techniques?d=${x.id}`))} data-testid={`p2-disc-${x.id}`}>
                <DisciplineIcon id={x.id} size={34} />
                <span className="grow">
                  <b>{x.name}</b>
                  <span className="small muted">
                    {cov.studied} / {cov.total} techniques étudiées · {sec ? formatDuration(sec) : 'aucun temps'} {period.label === 'Perso' ? 'sur la période' : `(${period.label})`}
                  </span>
                </span>
                <Ring value={cov.ratio} size={58} stroke={7} tone={cov.ratio >= 0.5 ? 'orange' : 'red'} label={`${x.name} : ${cov.studied} techniques étudiées sur ${cov.total}`}>
                  <b className="num-figure p2-mini">{Math.round(cov.ratio * 100)}%</b>
                </Ring>
                <AppIcon id="chevron" size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="small muted">Le pourcentage est la part des techniques du parcours de la discipline déjà rencontrées dans tes exercices. Période : {fmtRange(p.cur.from, p.cur.to)}.</p>
      {period.sheet}
    </div>
  );
}

/** v0.39 maquette 6: the user's own sequences: created, used over the period, time and sessions */
export function CombosDetail() {
  const { custom, cur, p } = useProgressData({ discipline: 'toutes' });
  const period = usePeriod();
  const perso = cur.filter((r) => r.exerciseId.startsWith('perso-'));
  const usedIds = new Set(perso.map((r) => r.exerciseId.slice(6)));
  const usedNow = custom.filter((c) => usedIds.has(c.id)).length;
  const sec = perso.reduce((a, r) => a + r.activeSec, 0);
  const lib = cur.filter((r) => r.exerciseId.startsWith('cat-'));
  const libSec = lib.reduce((a, r) => a + r.activeSec, 0);
  const top = custom
    .map((c) => ({ c, sec: perso.filter((r) => r.exerciseId === `perso-${c.id}`).reduce((a, r) => a + r.activeSec, 0) }))
    .filter((x) => x.sec > 0)
    .sort((a, b) => b.sec - a.sec)
    .slice(0, 5);
  return (
    <div className="page p2" data-testid="p2-combos">
      <PageHead title="Enchaînements" eyebrow="Progrès" fallback="/stats" />
      {period.chips}
      {custom.length === 0 ? (
        <EmptyState
          title="Aucun enchaînement créé"
          text="Compose tes propres enchaînements dans Entraîner : leur utilisation apparaîtra ici."
          action={
            <Link to="/createur" className="btn primary sm">
              Créer un enchaînement
            </Link>
          }
        />
      ) : (
        <>
          <div className="p2-hero">
            <Ring value={usedNow / custom.length} size={196} stroke={18} tone="orange" label={`${usedNow} enchaînements utilisés sur ${custom.length} créés`} testId="combos-ring">
              <AppIcon id="combos" size={24} tone="orange" />
              <b className="p2-big num-figure">
                {usedNow} <small>/ {custom.length}</small>
              </b>
              <span className="p2-cap">utilisés sur la période</span>
            </Ring>
          </div>
          <dl className="p2-facts">
            <dt>Enchaînements créés</dt>
            <dd data-testid="combos-created">{custom.length}</dd>
            <dt>Séances avec un enchaînement</dt>
            <dd>{new Set(perso.map((r) => r.id.split('#')[0])).size}</dd>
            <dt>Temps actif sur tes enchaînements</dt>
            <dd>{formatDuration(sec)}</dd>
            {libSec > 0 && (
              <>
                <dt>Temps sur les combinaisons des légendes</dt>
                <dd>{formatDuration(libSec)}</dd>
              </>
            )}
          </dl>
          {top.length > 0 && (
            <ul className="p2-list">
              {top.map(({ c, sec: s }) => (
                <li key={c.id} className="p2-top">
                  <span className="grow">{c.name}</span>
                  <b className="num-figure">{formatDuration(s)}</b>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <Link className="btn secondary block" to="/createur" data-testid="see-combos">
        Voir mes enchaînements <AppIcon id="chevron" size={16} />
      </Link>
      <p className="small muted">
        Période : {fmtRange(p.cur.from, p.cur.to)}. Le temps est le temps actif réellement enregistré ; les répétitions ne sont pas converties en nombre de coups.
      </p>
      {period.sheet}
    </div>
  );
}
