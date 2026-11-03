import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DISCIPLINES } from '../../../domain/types';
import { TECHNIQUES, techniquesFor } from '../../../domain/techniques';
import { filterTechniques } from '../../../domain/kickboxingStyles';
import { masteryCount } from '../../../domain/mastery';
import { PERIOD_PRESETS, type PeriodPreset } from '../../../domain/progress';
import { formatDuration, localDay, sessionCount, weekKey } from '../../../store/stats';
import { useGoals } from '../../../store/goals';
import { FilterChips, PageHead, Tabs } from '../../components';
import { AppIcon, DisciplineIcon, type GlyphId } from '../../icons';
import { useNavActions } from '../../nav/store';
import { PeriodSheet, fmtRange } from './Dashboard';
import { Ring } from './Ring';
import { streak, useProgressData, useResumable } from './data';
import './progress.css';

/** the main ring: the user's own weekly goal when there is one, else the course of techniques (a stated total) */
export function mainRing(o: { weeklySessions: number; weeklyMinutes: number; weekDays: number; weekMin: number; studied: number; total: number }) {
  if (o.weeklySessions > 0) return { kind: 'objectif' as const, value: o.weekDays / o.weeklySessions, big: `${o.weekDays} / ${o.weeklySessions}`, caption: 'jours d’entraînement', sub: 'Objectif de la semaine' };
  if (o.weeklyMinutes > 0) return { kind: 'objectif' as const, value: o.weekMin / o.weeklyMinutes, big: `${o.weekMin} / ${o.weeklyMinutes}`, caption: 'minutes actives', sub: 'Objectif de la semaine' };
  return { kind: 'parcours' as const, value: o.total ? o.studied / o.total : 0, big: `${o.studied} / ${o.total}`, caption: 'techniques étudiées', sub: 'Parcours' };
}

/**
 * v0.39 (Youssef, 2026-10-22, « Refonte premium de l'espace Progrès », maquette 1): one big ring, three figures, the
 * session to resume when there is one, and the way to each detail. Everything else moved to the detail screens.
 */
export function Stats() {
  const d = useProgressData();
  const { v, sessions, tc, cov, today, p, kb } = d;
  const nav = useNavigate();
  const goals = useGoals((s) => s.goals);
  const mastery = useGoals((s) => s.mastery);
  const resume = useResumable();
  const [periodSheet, setPeriodSheet] = useState(false);

  const disc = v.discipline === 'toutes' ? null : v.discipline;
  const discName = disc ? DISCIPLINES.find((x) => x.id === disc)!.name : 'Toutes disciplines';
  const mine = sessions.filter((s) => !disc || s.discipline === disc);
  const wk = weekKey(new Date().toISOString());
  const week = sessions.filter((s) => weekKey(s.start) === wk);
  const ring = mainRing({
    weeklySessions: goals.weeklySessions,
    weeklyMinutes: goals.weeklyMinutes,
    weekDays: new Set(week.map((s) => localDay(new Date(s.start)))).size,
    weekMin: Math.round(week.reduce((a, s) => a + s.activeSec, 0) / 60),
    studied: cov.studied,
    total: cov.total,
  });
  const run = streak(mine, today);
  const techList = disc ? filterTechniques(techniquesFor(disc), disc, kb) : TECHNIQUES;
  const mc = masteryCount(techList, mastery);
  const presetLabel = v.preset === 'perso' ? (v.custom ? fmtRange(v.custom.from, v.custom.to) : 'Perso') : PERIOD_PRESETS.find((x) => x.id === v.preset)!.label;
  const periodWord = v.preset === 'perso' ? 'sur la période' : `sur ${presetLabel.toLowerCase()}`;
  const practised = new Set(d.cur.map((r) => r.discipline)).size;
  const used = new Set(d.cur.filter((r) => r.exerciseId.startsWith('perso-')).map((r) => r.exerciseId)).size;

  useNavActions(
    {
      period: { run: () => setPeriodSheet(true), pressed: v.preset === 'perso', ariaLabel: `Période : ${presetLabel}`, testId: 'nav-period' },
      stats: { run: () => nav('/stats/activite'), ariaLabel: 'Statistiques détaillées de l’activité', testId: 'nav-stats' },
      history: { run: () => nav('/historique'), ariaLabel: 'Historique des séances', testId: 'nav-history' },
    },
    [
      { id: 'nouvelle-seance', label: 'Nouvelle séance', icon: 'play', run: () => nav('/entrainer') },
      { id: 'objectifs', label: 'Objectifs', icon: { glyph: 'target' }, run: () => nav('/objectifs'), testId: 'goals-link' },
      { id: 'historique-complet', label: 'Historique complet', icon: 'history', run: () => nav('/historique') },
    ],
  );

  const rows: { to: string; icon: GlyphId; title: string; value: string; testId: string }[] = [
    { to: '/stats/activite', icon: 'trend', title: 'Activité', value: `${formatDuration(tc.activeSec)} ${periodWord}`, testId: 'go-activite' },
    { to: '/stats/techniques', icon: 'mastered', title: 'Techniques', value: `${mc.acquises} assimilée${mc.acquises > 1 ? 's' : ''} sur ${mc.total}`, testId: 'go-techniques' },
    { to: '/stats/disciplines', icon: 'grid', title: 'Disciplines', value: `${practised} pratiquée${practised > 1 ? 's' : ''} ${periodWord}`, testId: 'go-disciplines' },
    { to: '/stats/enchainements', icon: 'combos', title: 'Enchaînements', value: `${used} utilisé${used > 1 ? 's' : ''} ${periodWord}`, testId: 'go-enchainements' },
    { to: '/objectifs', icon: 'target', title: 'Objectifs', value: goals.weeklySessions || goals.weeklyMinutes ? 'Objectif de la semaine défini' : 'Aucun objectif défini', testId: 'go-objectifs' },
    { to: '/historique', icon: 'history', title: 'Historique', value: `${sessionCount(sessions)} séance${sessionCount(sessions) > 1 ? 's' : ''} au total`, testId: 'go-historique' },
  ];

  return (
    <div className="page p2" data-testid="progress-overview">
      <PageHead title="Progrès" back={false} />

      <Tabs
        label="Discipline"
        value={v.discipline}
        onChange={(discipline) => v.set({ discipline })}
        items={[
          { id: 'toutes' as const, label: 'Toutes', testId: 'disc-toutes' },
          ...DISCIPLINES.map((x) => ({ id: x.id, label: x.short, icon: <DisciplineIcon id={x.id} size={20} />, testId: `disc-${x.id}` })),
        ]}
      />
      <FilterChips
        label="Période"
        scroll
        testPrefix="period-"
        value={v.preset}
        onChange={(preset: PeriodPreset) => (preset === 'perso' ? setPeriodSheet(true) : v.set({ preset }))}
        options={[
          ...PERIOD_PRESETS.map((x) => ({ id: x.id as PeriodPreset, label: x.label })),
          { id: 'perso' as PeriodPreset, label: v.preset === 'perso' && v.custom ? fmtRange(v.custom.from, v.custom.to) : 'Perso', icon: <AppIcon id="calendar" size={16} /> },
        ]}
      />

      <Link to={ring.kind === 'objectif' ? '/objectifs' : '/stats/techniques'} className="p2-hero" data-testid="main-ring-link" aria-label={`${ring.sub} : ${ring.big} ${ring.caption}${ring.kind === 'parcours' ? ` du parcours ${discName}` : ''}. Voir le détail`}>
        <Ring value={ring.value} size={188} stroke={16} label={`${ring.sub} : ${ring.big} ${ring.caption}`} testId="main-ring">
          <AppIcon id={ring.kind === 'objectif' ? 'target' : 'mastered'} size={24} tone="danger" />
          <b className="p2-big num-figure" data-testid="main-ring-value">
            {ring.big}
          </b>
          <span className="p2-cap">{ring.caption}</span>
        </Ring>
        <span className="p2-sub">
          {ring.sub}
          {ring.kind === 'parcours' ? ` · ${discName}` : ''}
          {ring.value > 0 && <> · {Math.round(Math.min(1, ring.value) * 100)} %</>}
        </span>
      </Link>

      {resume && (
        <Link to={resume.to} className="btn primary block p2-resume" data-testid="p2-resume">
          <AppIcon id="play" size={18} /> {resume.label}
        </Link>
      )}

      <div className="p2-kpis">
        <Link to="/stats/activite" className="p2-kpi" data-testid="kpi-time">
          <AppIcon id="history" size={20} tone="gold" />
          <span className="k">Temps actif</span>
          <b className="num-figure" data-testid="total-time">
            {formatDuration(tc.activeSec)}
          </b>
          <span className="s">{presetLabel}</span>
        </Link>
        <Link to="/stats/activite" className="p2-kpi" data-testid="kpi-sessions">
          <AppIcon id="calendar" size={20} tone="gold" />
          <span className="k">Séances</span>
          <b className="num-figure">{tc.sessions}</b>
          <span className="s">{presetLabel}</span>
        </Link>
        <Link to="/historique" className="p2-kpi" data-testid="kpi-streak">
          <AppIcon id="flame" size={20} tone="orange" />
          <span className="k">Série en cours</span>
          <b className="num-figure">{run ? `${run} j` : '—'}</b>
          <span className="s">{run ? `jour${run > 1 ? 's' : ''} d’affilée` : 'aucune en cours'}</span>
        </Link>
      </div>

      {sessions.length === 0 && (
        <p className="small muted p2-empty" data-testid="p2-empty">
          Pas encore de séance enregistrée. Le temps est compté uniquement pendant l’entraînement actif, sur cet appareil.{' '}
          <Link to="/entrainer">S’entraîner</Link>
        </p>
      )}

      <nav className="p2-rows" aria-label="Détails">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="p2-row" data-testid={r.testId}>
            <AppIcon id={r.icon} size={20} />
            <span className="t">{r.title}</span>
            <span className="v">{r.value}</span>
            <AppIcon id="chevron" size={16} />
          </Link>
        ))}
      </nav>
      <p className="small muted p2-note">
        Période : {fmtRange(p.cur.from, p.cur.to)}
        {p.inProgress ? ' (en cours)' : ''}. Seules les séances réellement enregistrées sont comptées.
      </p>

      {periodSheet && <PeriodSheet today={today} initial={v.custom} onClose={() => setPeriodSheet(false)} onApply={(custom) => (v.set({ preset: 'perso', custom }), setPeriodSheet(false))} />}
    </div>
  );
}
