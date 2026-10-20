/**
 * Progrès: one screen without vertical scrolling. Discipline, period, course gauge, three key
 * figures compared with the previous period, and a chart area with five tabs. Every figure comes
 * from the sessions recorded on this device (src/store/stats.ts) through src/domain/progress.ts.
 */
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DISCIPLINES, LEVELS } from '../../../domain/types';
import type { DisciplineId, ExerciseKind, LevelId } from '../../../domain/types';
import { EXERCISES, EXERCISE_BY_ID } from '../../../domain/exercises';
import { TECHNIQUES, TECHNIQUE_BY_ID, techniquesFor } from '../../../domain/techniques';
import { masteryCount } from '../../../domain/mastery';
import { useGoals } from '../../../store/goals';
import { filterExercises, filterTechniques, type KbStyleChoice } from '../../../domain/kickboxingStyles';
import {
  Bucket,
  KIND_LABEL,
  PERIOD_PRESETS,
  PeriodPreset,
  ProgressFilters,
  ProgressRecord,
  SessionGroup,
  buckets,
  byExercise,
  byKind,
  byLevel,
  compare,
  courseOf,
  coverage,
  dayKey,
  dayNum,
  firstDayOf,
  matches,
  periodPair,
  sessionGroups,
  split,
  totals,
} from '../../../domain/progress';
import { formatDuration, useStats } from '../../../store/stats';
import { useCustom } from '../../../store/custom';
import { useCatalog } from '../../../store/catalog';
import { ProgressTab, useProgressView } from '../../../store/progressView';
import { MODE_LABEL } from '../../training/plan';
import { EmptyState, FilterChips, PageHead, Sheet, Tabs, useKbStyle } from '../../components';
import { AppIcon, DisciplineIcon } from '../../icons';
import { CompareColumns, Legend, PairRows, TrendMark, useBox } from './charts';
import { useActionPill } from '../../components/ActionPill';

const dur = (sec: number) => formatDuration(sec);
const count = (n: number) => String(n);
const daysU = (n: number) => `${n} j`;

const fmtDay = (key: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR', o);
/** the year is written when the range is not within the current year */
const withYear = (a: string, b: string) => a.slice(0, 4) !== b.slice(0, 4) || a.slice(0, 4) !== String(new Date().getFullYear());
const fmtRange = (a: string, b: string) => {
  const o: Intl.DateTimeFormatOptions = withYear(a, b) ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' };
  return a === b ? fmtDay(a, o) : `${fmtDay(a, o)} – ${fmtDay(b, o)}`;
};
/** 20/09 – 19/10: short enough for one line on a phone */
const fmtShort = (a: string, b: string) => {
  const o: Intl.DateTimeFormatOptions = withYear(a, b) ? { day: '2-digit', month: '2-digit', year: '2-digit' } : { day: '2-digit', month: '2-digit' };
  return a === b ? fmtDay(a, o) : `${fmtDay(a, o)} – ${fmtDay(b, o)}`;
};

const kindOfRecord = (r: ProgressRecord): ExerciseKind | null => {
  const e = EXERCISE_BY_ID.get(r.exerciseId);
  if (e) return e.kind;
  // custom and catalogue combinations are sequences of techniques
  if (r.exerciseId.startsWith('perso-') || r.exerciseId.startsWith('cat-')) return 'combinaison';
  return null;
};

const TABS: { id: ProgressTab; label: string }[] = [
  { id: 'activite', label: 'Activité' },
  { id: 'niveaux', label: 'Niveaux' },
  { id: 'categories', label: 'Catégories' },
  { id: 'exercices', label: 'Exercices' },
  { id: 'historique', label: 'Historique' },
  // 0.24: the techniques the user marked as assimilated or still hard
  { id: 'maitrise', label: 'Maîtrise' },
];

export function Stats() {
  const sessions = useStats((s) => s.sessions);
  const custom = useCustom((s) => s.combos);
  const v = useProgressView();
  const [kb] = useKbStyle();
  const needCatalog = useMemo(() => sessions.some((s) => s.exerciseId.startsWith('cat-')), [sessions]);
  const { catalog } = useCatalog(needCatalog);
  const [sheet, setSheet] = useState<null | 'periode' | 'filtres' | 'parcours' | 'detail' | 'comparaison'>(null);
  const [session, setSession] = useState<SessionGroup | null>(null);

  // the day changes at midnight while the screen stays open
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow((n) => (dayKey(n) === dayKey(new Date()) ? n : new Date())), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const today = dayKey(now);

  const f: ProgressFilters = {
    discipline: v.discipline,
    level: v.level,
    kind: v.kind,
  };
  const p = periodPair(v.preset === 'perso' && !v.custom ? '30j' : v.preset, now, v.custom ?? undefined);
  const { cur, prev } = split(sessions, p, f, kindOfRecord);
  // breaks are counted from the first day trained with these filters, never before the first use
  const first = firstDayOf(sessions.filter((r) => matches(r, f, kindOfRecord)));
  const tc = totals(cur, p.cur, today, first);
  const tp = totals(prev, p.prev, today, first);
  const cmp = compare(tc, tp);

  const sequenceOf = (r: ProgressRecord) => {
    const e = EXERCISE_BY_ID.get(r.exerciseId);
    if (e) return e.sequence;
    if (r.exerciseId.startsWith('perso-')) return custom.find((c) => `perso-${c.id}` === r.exerciseId)?.sequence ?? null;
    if (r.exerciseId.startsWith('cat-')) return catalog?.comboById.get(r.exerciseId.slice(4))?.sequence ?? null;
    return null;
  };
  const course = courseOf(filterExercises(EXERCISES, kb), (id) => !!TECHNIQUE_BY_ID.get(id) && TECHNIQUE_BY_ID.get(id)!.mode !== 'partenaire', f);
  const cov = coverage(sessions, course, f, sequenceOf, p);
  const courseKey = `${v.discipline}|${v.level ?? 'tous'}|${v.discipline === 'kickboxing' || v.discipline === 'toutes' ? kb : '-'}`;
  const seen = v.seen[courseKey];
  useEffect(() => {
    v.noteCourse(courseKey, course.size, today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey, course.size]);
  const changed = seen?.before !== undefined && seen.changedOn && dayNum(today) - dayNum(seen.changedOn) <= 60 ? seen : null;

  const discName = v.discipline === 'toutes' ? 'Toutes disciplines' : DISCIPLINES.find((d) => d.id === v.discipline)!.name;
  const filterCount = (v.level ? 1 : 0) + (v.kind ? 1 : 0);
  const presetLabel = v.preset === 'perso' ? 'Perso' : PERIOD_PRESETS.find((x) => x.id === v.preset)!.label;
  const nav = useNavigate();
  // 0.26 action pill (Youssef, mockup C): a new session (the Entraîner tab), the goals, and a period of your
  // own (the « Perso » chip's sheet). The dashboard keeps its no-scroll layout above the pill (.with-pill).
  useActionPill([
    { id: 'nouvelle-seance', label: 'Nouvelle séance', icon: 'play', primary: true, ariaLabel: 'Nouvelle séance : choisir un entraînement', onSelect: () => nav('/entrainer') },
    { id: 'objectifs', label: 'Objectifs', icon: 'target', ariaLabel: 'Objectifs personnels', onSelect: () => nav('/objectifs') },
    { id: 'periode', label: 'Période', icon: 'calendar', ariaLabel: 'Période personnalisée', pressed: v.preset === 'perso', onSelect: () => setSheet('periode') },
  ]);

  return (
    <div className="page dash with-pill" data-testid="progress-dashboard">
      <PageHead
        title="Progrès"
        back={false}
        right={
          <div className="row" style={{ gap: 4 }}>
            <Link to="/objectifs" className="btn icon ghost" aria-label="Objectifs personnels" data-testid="goals-link">
              <AppIcon id="target" />
            </Link>
            <button
              type="button"
              className={`btn icon ghost ${filterCount ? 'has-badge' : ''}`}
              aria-label={`Filtres${filterCount ? ` (${filterCount} actif${filterCount > 1 ? 's' : ''})` : ''}`}
              onClick={() => setSheet('filtres')}
              data-testid="progress-filters"
            >
              <AppIcon id="filters" />
              {filterCount > 0 && <span className="badge-dot">{filterCount}</span>}
            </button>
            <Link to="/historique" className="btn icon ghost" aria-label="Historique complet">
              <AppIcon id="history" />
            </Link>
          </div>
        }
      />

      <Tabs
        label="Discipline"
        value={v.discipline}
        onChange={(discipline) => v.set({ discipline })}
        items={[
          { id: 'toutes' as const, label: 'Toutes', testId: 'disc-toutes' },
          ...DISCIPLINES.map((d) => ({
            id: d.id,
            label: d.short,
            icon: <DisciplineIcon id={d.id} size={22} />,
            testId: `disc-${d.id}`,
          })),
        ]}
      />

      <div className="dash-period">
        <FilterChips
          label="Période"
          scroll
          testPrefix="period-"
          value={v.preset}
          onChange={(preset: PeriodPreset) => (preset === 'perso' ? setSheet('periode') : v.set({ preset }))}
          options={[
            ...PERIOD_PRESETS.map((x) => ({
              id: x.id as PeriodPreset,
              label: x.label,
            })),
            {
              id: 'perso' as PeriodPreset,
              label: v.preset === 'perso' && v.custom ? fmtRange(v.custom.from, v.custom.to) : 'Perso',
              icon: <AppIcon id="calendar" size={16} />,
            },
          ]}
        />
        <p className="small muted dash-caption" data-testid="period-caption">
          <span className="sr-only">Période du </span>
          {fmtShort(p.cur.from, p.cur.to)}
          {p.inProgress && <span className="tag">en cours</span>} vs {fmtShort(p.prev.from, p.prev.to)}
          {filterCount > 0 && ` · ${[v.level && LEVELS.find((l) => l.id === v.level)!.name, v.kind && KIND_LABEL[v.kind]].filter(Boolean).join(', ')}`}
        </p>
      </div>

      <div className="dash-sum">
        <button
          type="button"
          className="gauge-btn"
          onClick={() => setSheet('parcours')}
          data-testid="course-gauge"
          aria-label={`Parcours ${discName} : ${cov.studied} techniques étudiées sur ${cov.total}, ${Math.round(cov.ratio * 100)} %. Détails`}
        >
          <Gauge value={cov.ratio} size={62} />
          <span className="k">Parcours{changed ? ' *' : ''}</span>
        </button>
        <div className="sum-rows">
          <div className="sum-row" data-testid="course-row">
            <span className="k">Techniques{v.level ? ` · ${LEVELS.find((l) => l.id === v.level)!.name}` : ''}</span>
            <span className="mv">
              <span className="v">
                {cov.studied}
                <small>/{cov.total}</small>
              </span>
              <span className="trend neutral">{cov.newCur > 0 ? `+${cov.newCur} nouvelle${cov.newCur > 1 ? 's' : ''}` : 'aucune nouvelle'}</span>
            </span>
          </div>
          <Kpi label="Temps actif" value={dur(tc.activeSec)} d={cmp.activeSec} unit={dur} testId="total-time" />
          <Kpi label="Séances" value={count(tc.sessions)} d={cmp.sessions} unit={count} testId="kpi-sessions" />
          <Kpi label="Répétitions" value={count(tc.reps)} d={cmp.reps} unit={count} testId="kpi-reps" />
        </div>
      </div>

      <div className="dash-chart card">
        <Tabs label="Statistiques détaillées" variant="underline" value={v.tab} onChange={(tab) => v.set({ tab })} items={TABS.map((t) => ({ ...t, testId: `ptab-${t.id}` }))} />
        <div className="dash-body" role="tabpanel" aria-label={TABS.find((t) => t.id === v.tab)!.label} data-testid={`ppanel-${v.tab}`}>
          {v.tab === 'maitrise' ? (
            <MasteryPanel discipline={v.discipline} kb={kb} />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="Pas encore de données"
              text="Le temps est compté uniquement pendant l’entraînement actif, sur cet appareil."
              action={
                <Link to="/entrainer" className="btn primary sm">
                  S’entraîner
                </Link>
              }
            />
          ) : (
            <Panel
              key={v.tab}
              tab={v.tab}
              p={p}
              cur={cur}
              prev={prev}
              today={today}
              cmp={cmp}
              tc={tc}
              onMore={() => setSheet(v.tab === 'activite' ? 'comparaison' : 'detail')}
              onSession={setSession}
            />
          )}
        </div>
      </div>

      {sheet === 'periode' && <PeriodSheet today={today} initial={v.custom} onClose={() => setSheet(null)} onApply={(custom) => (v.set({ preset: 'perso', custom }), setSheet(null))} />}
      {sheet === 'filtres' && (
        <Sheet title="Filtres" onClose={() => setSheet(null)}>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Niveau</span>
            <FilterChips<LevelId | 'tous'>
              label="Niveau"
              testPrefix="flevel-"
              value={v.level ?? 'tous'}
              onChange={(l) => v.set({ level: l === 'tous' ? null : l })}
              options={[{ id: 'tous', label: 'Tous' }, ...LEVELS.map((l) => ({ id: l.id, label: l.name }))]}
            />
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <span className="label">Catégorie d’exercice</span>
            <FilterChips<ExerciseKind | 'toutes'>
              label="Catégorie d’exercice"
              testPrefix="fkind-"
              value={v.kind ?? 'toutes'}
              onChange={(k) => v.set({ kind: k === 'toutes' ? null : k })}
              options={[
                { id: 'toutes', label: 'Toutes' },
                ...(Object.keys(KIND_LABEL) as (ExerciseKind | 'autre')[]).filter((k): k is ExerciseKind => k !== 'autre').map((k) => ({ id: k, label: KIND_LABEL[k] })),
              ]}
            />
          </div>
          <p className="small muted">Les filtres s’ajoutent à la discipline et à la période. Le parcours suit la discipline et le niveau.</p>
          <button type="button" className="btn primary block" onClick={() => setSheet(null)}>
            Afficher
          </button>
        </Sheet>
      )}
      {sheet === 'parcours' && (
        <Sheet title={`Parcours · ${discName}`} onClose={() => setSheet(null)}>
          <div className="row" style={{ gap: 14 }}>
            <Gauge value={cov.ratio} size={84} />
            <p style={{ margin: 0 }}>
              <strong>{cov.studied}</strong> techniques étudiées sur <strong>{cov.total}</strong> dans le parcours
              {v.level ? ` du niveau ${LEVELS.find((l) => l.id === v.level)!.name}` : ''}.
            </p>
          </div>
          <ul className="plain-list small">
            <li>
              Nouvelles sur la période : <strong>{cov.newCur}</strong> (période précédente : {cov.newPrev}).
            </li>
            <li>Une technique compte comme étudiée dès qu’elle fait partie d’un exercice que tu as pratiqué. Le temps passé ne fait pas monter la jauge.</li>
            <li>
              Le parcours réunit les techniques des exercices du programme
              {v.discipline === 'kickboxing' || v.discipline === 'toutes' ? `, selon le style de kick-boxing choisi` : ''}. Les techniques réservées au travail avec partenaire n’y figurent pas.
            </li>
            <li>La qualité d’exécution n’est pas mesurée : aucun capteur n’observe tes mouvements.</li>
            {changed && (
              <li data-testid="course-changed">
                Le parcours est passé de {changed.before} à {changed.total} techniques le {fmtDay(changed.changedOn!)}. Tes techniques déjà étudiées sont conservées : seul le total a changé, donc le
                pourcentage aussi.
              </li>
            )}
            {cov.unresolved > 0 && (
              <li>{cov.unresolved} enregistrement(s) concernent une combinaison supprimée ou indisponible : leurs techniques ne sont pas comptées, leur temps reste dans les statistiques.</li>
            )}
          </ul>
        </Sheet>
      )}
      {sheet === 'comparaison' && (
        <Sheet title="Comparaison des périodes" onClose={() => setSheet(null)}>
          <p className="small muted">
            {fmtRange(p.cur.from, p.cur.to)}
            {p.inProgress ? ' (en cours)' : ''} comparé à {fmtRange(p.prev.from, p.prev.to)}, même nombre de jours ({p.cur.days}).
          </p>
          <table className="cmp-table" data-testid="comparison-table">
            <thead>
              <tr>
                <th scope="col">Mesure</th>
                <th scope="col">Actuelle</th>
                <th scope="col">Précédente</th>
                <th scope="col">Évolution</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Temps actif', cmp.activeSec, dur],
                  ['Séances', cmp.sessions, count],
                  ['Répétitions', cmp.reps, count],
                  ['Exercices distincts', cmp.exercises, count],
                  ['Jours actifs', cmp.activeDays, count],
                  ['Plus longue pause', cmp.longestBreak, daysU],
                ] as const
              ).map(([k, d, u]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{u(d.cur)}</td>
                  <td>{u(d.prev)}</td>
                  <td>
                    <TrendMark d={d} unit={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">
            Ces chiffres décrivent le volume et la régularité d’entraînement. Une baisse de temps n’indique pas une baisse de niveau technique. Écart de moins de 5 % : stable.
          </p>
        </Sheet>
      )}
      {sheet === 'detail' && <DetailSheet tab={v.tab} cur={cur} prev={prev} p={p} onClose={() => setSheet(null)} onSession={(g) => (setSheet(null), setSession(g))} />}
      {session && <SessionSheet g={session} onClose={() => setSession(null)} />}
      <span className="sr-only" aria-live="polite">
        {discName}, {presetLabel}
      </span>
    </div>
  );
}

function Gauge({ value, size = 64 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false" className="gauge">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth="6" />
      {v > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={v >= 1 ? 'var(--gold)' : 'var(--red)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="currentColor"
        style={{
          color: 'var(--ink)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.27,
        }}
      >
        {Math.round(v * 100)}%
      </text>
    </svg>
  );
}

function Kpi({ label, value, d, unit, testId }: { label: string; value: string; d: Parameters<typeof TrendMark>[0]['d']; unit: (n: number) => string; testId: string }) {
  return (
    <div className="sum-row">
      <span className="k">{label}</span>
      <span className="mv">
        <span className="v" data-testid={testId}>
          {value}
        </span>
        <TrendMark d={d} unit={unit} short testId={`${testId}-delta`} />
      </span>
    </div>
  );
}

type PanelProps = {
  tab: ProgressTab;
  p: ReturnType<typeof periodPair>;
  cur: ProgressRecord[];
  prev: ProgressRecord[];
  today: string;
  cmp: ReturnType<typeof compare>;
  tc: ReturnType<typeof totals>;
  onMore: () => void;
  onSession: (g: SessionGroup) => void;
};

/**
 * How many list rows fit in the panel: every row is rendered, measured, and the rows that would pass
 * the bottom are left to the full list ("Voir tout"). Measured again when the panel changes size.
 */
function useFit(total: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(total);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH((x) => (x === el.clientHeight ? x : el.clientHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // a new size or a new list: measure again from the whole list
  useLayoutEffect(() => setN(total), [h, total]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || n !== total) return;
    const bottom = el.getBoundingClientRect().bottom + 0.5;
    const items = el.querySelectorAll(':scope li.fit');
    let k = 0;
    for (const it of Array.from(items)) {
      if (it.getBoundingClientRect().bottom > bottom) break;
      k++;
    }
    if (k < total) setN(Math.max(1, k));
  });
  return [ref, n] as const;
}

function Panel({ tab, p, cur, prev, today, cmp, tc, onMore, onSession }: PanelProps) {
  const [ref, box] = useBox<HTMLDivElement>();
  const legend = <Legend cur={fmtShort(p.cur.from, p.cur.to)} prev={fmtShort(p.prev.from, p.prev.to)} />;
  const emptyPeriod = <p className="small muted dash-empty">Aucune séance sur ces deux périodes pour ces filtres. Les données des autres périodes sont conservées.</p>;
  if (tab === 'activite') {
    const bs = buckets(cur, prev, p, today);
    const size = bs.length > 1 ? dayNum(bs[1].cur.from) - dayNum(bs[0].cur.from) : p.cur.days;
    const labelOf = (b: Bucket) =>
      size === 1
        ? p.cur.days <= 7
          ? fmtDay(b.cur.from, { weekday: 'short' })
          : fmtDay(b.cur.from, { day: 'numeric' })
        : size === 7
          ? fmtDay(b.cur.from, { day: 'numeric', month: 'numeric' })
          : fmtDay(b.cur.from, { month: 'short' });
    return (
      <div className="act">
        <div className="legend-row">
          {legend}
          <button type="button" className="link small" onClick={onMore} data-testid="open-comparison">
            Détails
          </button>
        </div>
        <div className="act-chart" ref={ref}>
          {box.h > 0 && (
            <CompareColumns
              data={bs}
              height={box.h}
              label={`Temps actif par ${size === 1 ? 'jour' : size === 7 ? 'semaine' : `tranche de ${size} jours`}, en minutes`}
              format={dur}
              labelOf={labelOf}
              rangeOf={(b, w) => fmtRange(b[w].from, b[w].to) + (w === 'cur' && b.inProgress ? ' (en cours)' : '')}
            />
          )}
        </div>
        <div className="mini-stats">
          <Mini label="Exercices" value={count(tc.exercises)} d={cmp.exercises} unit={count} testId="mini-exercises" />
          <Mini label="Jours actifs" value={count(tc.activeDays)} d={cmp.activeDays} unit={count} testId="mini-days" />
          <Mini label="Pause max." value={daysU(tc.longestBreak)} d={cmp.longestBreak} unit={daysU} testId="mini-break" />
        </div>
      </div>
    );
  }
  return <ListPanel tab={tab} cur={cur} prev={prev} legend={legend} emptyPeriod={emptyPeriod} onMore={onMore} onSession={onSession} />;
}

function ListPanel({ tab, cur, prev, legend, emptyPeriod, onMore, onSession }: Pick<PanelProps, 'tab' | 'cur' | 'prev' | 'onMore' | 'onSession'> & { legend: ReactNode; emptyPeriod: ReactNode }) {
  const rows = tab === 'niveaux' ? byLevel(cur, prev).filter((r) => r.cur || r.prev) : tab === 'categories' ? byKind(cur, prev, kindOfRecord) : [];
  const ex = tab === 'exercices' ? byExercise(cur, prev) : [];
  const gs = tab === 'historique' ? sessionGroups(cur) : [];
  const total = rows.length + ex.length + gs.length;
  const [ref, n] = useFit(total);
  return (
    <>
      {(tab === 'niveaux' || tab === 'categories') && rows.length > 0 && legend}
      <div className="list-panel" ref={ref}>
        {total === 0 &&
          (tab === 'niveaux' || tab === 'categories' ? (
            emptyPeriod
          ) : (
            <p className="small muted dash-empty">{tab === 'exercices' ? 'Aucun exercice pratiqué sur la période.' : 'Aucune séance sur la période.'}</p>
          ))}
        {rows.length > 0 && <PairRows rows={rows.slice(0, n)} format={dur} unit={dur} />}
        {ex.length > 0 && <ExerciseRows rows={ex.slice(0, n)} />}
        {gs.length > 0 && <SessionRows gs={gs.slice(0, n)} onOpen={onSession} />}
      </div>
      {total > 0 && (
        <button type="button" className="link small more" onClick={onMore} data-testid="see-all">
          {n < total ? `Voir tout (${total})` : 'Ouvrir en plein écran'}
        </button>
      )}
    </>
  );
}

function Mini({ label, value, d, unit, testId }: { label: string; value: string; d: Parameters<typeof TrendMark>[0]['d']; unit: (n: number) => string; testId: string }) {
  return (
    <div className="mini" data-testid={testId}>
      <span className="k">{label}</span>
      <span className="mv">
        <span className="v">{value}</span>
        <TrendMark d={d} unit={unit} short />
      </span>
    </div>
  );
}

function ExerciseRows({ rows }: { rows: ReturnType<typeof byExercise> }) {
  return (
    <ul className="ex-rows">
      {rows.map((r) => (
        <li key={r.id} className="ex-row fit" data-testid={`ex-${r.id}`}>
          <span className="lbl">
            <span className="name">{r.name}</span>
            <span className="small muted">
              {r.reps} rép. · {r.sessions} séance{r.sessions > 1 ? 's' : ''}
            </span>
          </span>
          <strong className="num">{dur(r.sec)}</strong>
        </li>
      ))}
    </ul>
  );
}

function SessionRows({ gs, onOpen }: { gs: SessionGroup[]; onOpen: (g: SessionGroup) => void }) {
  return (
    <ul className="ex-rows">
      {gs.map((g) => {
        const d = new Date(g.start);
        return (
          <li key={g.start} className="fit">
            <button type="button" className="ex-row as-btn" onClick={() => onOpen(g)} data-testid="session-row">
              <DisciplineIcon id={g.discipline} size={22} />
              <span className="lbl">
                <span className="name">{g.records.length === 1 ? g.records[0].exerciseName : `${g.records.length} exercices`}</span>
                <span className="small muted">
                  {d.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  ·{' '}
                  {d.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
              <strong className="num">{dur(g.activeSec)}</strong>
              <AppIcon id="chevron" size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DetailSheet({
  tab,
  cur,
  prev,
  p,
  onClose,
  onSession,
}: {
  tab: ProgressTab;
  cur: ProgressRecord[];
  prev: ProgressRecord[];
  p: ReturnType<typeof periodPair>;
  onClose: () => void;
  onSession: (g: SessionGroup) => void;
}) {
  const title = TABS.find((t) => t.id === tab)!.label;
  return (
    <Sheet title={title} eyebrow={fmtRange(p.cur.from, p.cur.to)} onClose={onClose}>
      <div data-testid="detail-sheet" className="stack" style={{ gap: 10 }}>
        {tab === 'niveaux' && (
          <>
            <Legend cur="Période actuelle" prev="Période précédente" />
            <PairRows rows={byLevel(cur, prev)} format={dur} unit={dur} />
          </>
        )}
        {tab === 'categories' && (
          <>
            <Legend cur="Période actuelle" prev="Période précédente" />
            <PairRows rows={byKind(cur, prev, kindOfRecord)} format={dur} unit={dur} />
          </>
        )}
        {tab === 'exercices' && <ExerciseRows rows={byExercise(cur, prev)} />}
        {tab === 'historique' && <SessionRows gs={sessionGroups(cur)} onOpen={onSession} />}
      </div>
    </Sheet>
  );
}

function SessionSheet({ g, onClose }: { g: SessionGroup; onClose: () => void }) {
  const d = new Date(g.start);
  return (
    <Sheet
      title="Séance"
      eyebrow={
        d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }) +
        ' · ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 6 }} data-testid="session-detail">
        <p className="small muted" style={{ margin: 0 }}>
          {DISCIPLINES.find((x) => x.id === g.discipline)?.name} · {dur(g.activeSec)} d’entraînement actif · {g.reps} répétitions
        </p>
        <ul className="ex-rows">
          {g.records.map((r) => (
            <li key={r.id} className="ex-row">
              <span className="lbl">
                <span className="name">{r.exerciseName}</span>
                <span className="small muted">
                  {LEVELS.find((l) => l.id === r.level)?.name} · {MODE_LABEL[(r as { mode?: keyof typeof MODE_LABEL }).mode ?? 'libre']} · {r.reps} rép.
                </span>
              </span>
              <strong className="num">{dur(r.activeSec)}</strong>
            </li>
          ))}
        </ul>
        <p className="small muted">Temps actif seulement : les pauses ne sont pas comptées.</p>
      </div>
    </Sheet>
  );
}

function PeriodSheet({ today, initial, onClose, onApply }: { today: string; initial: { from: string; to: string } | null; onClose: () => void; onApply: (r: { from: string; to: string }) => void }) {
  const [from, setFrom] = useState(initial?.from ?? today.slice(0, 8) + '01');
  const [to, setTo] = useState(initial?.to ?? today);
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to;
  const days = ok ? dayNum(to) - dayNum(from) + 1 : 0;
  return (
    <Sheet title="Période personnalisée" onClose={onClose}>
      <div className="date-pair">
        <label className="stack" style={{ gap: 6 }}>
          <span className="label">Début</span>
          <input type="date" className="input" value={from} max={today} onChange={(e) => setFrom(e.target.value)} data-testid="custom-from" />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <span className="label">Fin</span>
          <input type="date" className="input" value={to} max={today} onChange={(e) => setTo(e.target.value)} data-testid="custom-to" />
        </label>
      </div>
      <p className="small muted" role="status">
        {ok ? `${days} jour${days > 1 ? 's' : ''}, comparé${days > 1 ? 's' : ''} aux ${days} jours précédents.` : 'La date de début doit précéder la date de fin.'}
      </p>
      <button type="button" className="btn primary block" disabled={!ok} onClick={() => onApply({ from, to })} data-testid="custom-apply">
        Appliquer
      </button>
    </Sheet>
  );
}

/**
 * Maîtrise tab: what the user marked on the technique sheets (assimilated / still hard), for the
 * chosen discipline. It does not depend on the period: a mark has no date.
 */
function MasteryPanel({ discipline, kb }: { discipline: DisciplineId | 'toutes'; kb: KbStyleChoice }) {
  const mastery = useGoals((s) => s.mastery);
  const list = discipline === 'toutes' ? TECHNIQUES : filterTechniques(techniquesFor(discipline), discipline, kb);
  const c = masteryCount(list, mastery);
  const pct = (n: number) => (c.total ? (n / c.total) * 100 : 0);
  const shown = c.aRevoirList.slice(0, 4);
  return (
    <div className="mastery-panel stack" style={{ gap: 12 }} data-testid="mastery-panel">
      <div className="mastery-bar" role="img" aria-label={`${c.acquises} assimilées, ${c.aRevoir} à revoir, ${c.autres} non évaluées sur ${c.total} techniques`}>
        <span className="ok" style={{ width: `${pct(c.acquises)}%` }} />
        <span className="again" style={{ width: `${pct(c.aRevoir)}%` }} />
      </div>
      <div className="mastery-figures">
        <span data-testid="mastery-ok">
          <AppIcon id="mastered" tone="success" size={18} />
          <b className="num-figure">{c.acquises}</b> assimilées
        </span>
        <span data-testid="mastery-again">
          <AppIcon id="struggling" tone="orange" size={18} />
          <b className="num-figure">{c.aRevoir}</b> à revoir
        </span>
        <span className="muted">
          <b className="num-figure">{c.autres}</b> non évaluées
        </span>
      </div>
      {c.acquises + c.aRevoir === 0 ? (
        <p className="small muted">Sur la fiche d’une technique, touche l’icône verte quand tu l’as assimilée, ou l’orange quand tu as encore du mal : elle apparaîtra ici.</p>
      ) : shown.length > 0 ? (
        <ul className="plain-list mastery-list">
          {shown.map((t) => (
            <li key={t.id}>
              <Link to={`/techniques/${t.id}${discipline === 'toutes' ? '' : `?d=${discipline}`}`}>
                <AppIcon id="struggling" tone="orange" size={16} /> {t.name}
              </Link>
            </li>
          ))}
          {c.aRevoir > shown.length && (
            <li>
              <Link to={`/techniques${discipline === 'toutes' ? '' : `?d=${discipline}`}`}>Voir les {c.aRevoir} techniques à revoir</Link>
            </li>
          )}
        </ul>
      ) : (
        <p className="small muted">Aucune technique à revoir pour l’instant.</p>
      )}
    </div>
  );
}
