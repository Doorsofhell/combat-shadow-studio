import { TechThumb, keyTechnique, programTechnique } from '../components/TechThumb';
import { Suspense, lazy, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { useActiveFighter } from '../../store/fighters';
import { formatDuration, sessionCount, sum, useStats, weekKey } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { useCatalog, useCatalogUser } from '../../store/catalog';
import { DISCIPLINES, LEVELS, TrainingMode } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { recommend } from '../../domain/recommend';
import { championFor } from '../../domain/coaches/catalog';
import type { ComboPlayer, PlayerEvents } from '../../engine/player';
import { MODE_LABEL } from '../training/plan';
import { DisciplineLabel, EmptyState, EntryCard, ProgressBar, SectionHead, StatTile } from '../components';
import { defaultFighterName } from '../components/fighter';
import { AppIcon, DisciplineIcon } from '../icons';
import { useActionPill } from '../components/ActionPill';
import { FullscreenStage } from '../fullscreen/FullscreenStage';
import { useKbStyle } from '../components/KickboxingStyle';
import { techniquesFor } from '../../domain/techniques';
import { filterTechniques } from '../../domain/kickboxingStyles';
import { StageGuard } from '../components/StageGuard';
import { techniqueOfTheDay } from '../../domain/quickPicks';

/** the 3D bundle (three.js, R3F) stays out of the main chunk */
const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

const RESUMABLE: TrainingMode[] = ['libre', 'technique', 'cardio', 'rounds'];
const NO_EVENTS: PlayerEvents = {};

function StageFallback() {
  return (
    <div className="hero-loading" role="status" aria-label="Chargement du coach">
      <div className="stage-skeleton" />
    </div>
  );
}

export function Home() {
  const profile = useProfile((s) => s.profile);
  const settings = useSettings((s) => s.settings);
  const fighter = useActiveFighter();
  const sessions = useStats((s) => s.sessions);
  const weeklyGoal = useGoals((s) => s.goals.weeklyMinutes);
  const favEx = useGoals((s) => s.favExercises);
  const favCombos = useCatalogUser((s) => s.favorites);
  // the champions library is only loaded when the user has favourite combinations
  const { catalog } = useCatalog(favCombos.length > 0);
  const legendFavs = catalog ? favCombos.map((id) => catalog.comboById.get(id)).filter((c) => !!c).slice(0, 3) : [];
  const nav = useNavigate();
  const rec = useMemo(() => recommend(profile), [profile]);
  const disc = DISCIPLINES.find((d) => d.id === profile.mainDiscipline)!;
  const level = LEVELS.find((l) => l.id === profile.levels[disc.id])!;
  const premium = settings.coachRender === 'premium';
  // 0.24: the coach on stage is Kadir or Amara; the fallback render keeps the custom fighter
  const coach = premium ? (profile.coach ?? 'homme') : (fighter?.look.sex ?? profile.coach ?? 'homme');
  const name = premium ? championFor(profile.coach).name : (fighter?.name ?? defaultFighterName(profile.coach));

  const thisWeek = weekKey(new Date().toISOString());
  const week = sessions.filter((s) => weekKey(s.start) === thisWeek);
  const weekSec = sum(week);
  const totalSec = sum(sessions);
  const sorted = useMemo(() => [...sessions].sort((a, b) => b.start.localeCompare(a.start)), [sessions]);
  const last = sorted[0];
  const resume = last && EXERCISE_BY_ID.has(last.exerciseId) && RESUMABLE.includes(last.mode) ? `/entrainement?ex=${last.exerciseId}&mode=${last.mode}` : null;
  const recEx = rec.exercises[0];
  const recProg = rec.programs[0];

  const onPlayer = useCallback((p: ComboPlayer) => {
    // natural guard with the engine's discreet idle (breathing, weight shifts)
    p.setSequence([], 0);
    p.play();
  }, []);

  const start = () => {
    if (recEx) nav(`/discipline/${recEx.discipline}?niveau=${recEx.level}&ex=${recEx.id}`);
    else nav('/entrainer');
  };

  // 0.26 action pill (Youssef, mockup C): quick session, resume the last one, technique of the day
  const [kbStyle] = useKbStyle();
  const main = profile.mainDiscipline;
  const daily = useMemo(() => techniqueOfTheDay(filterTechniques(techniquesFor(main), main, kbStyle)), [main, kbStyle]);
  useActionPill([
    { id: 'seance-rapide', label: 'Séance rapide', icon: 'play', primary: true, ariaLabel: recEx ? `Séance rapide : ${recEx.name}` : undefined, onSelect: start },
    resume && last ? { id: 'reprendre', label: 'Reprendre', icon: 'history', ariaLabel: `Reprendre : ${last.exerciseName}`, onSelect: () => nav(resume) } : null,
    daily && { id: 'technique-du-jour', label: 'Technique du jour', icon: 'bolt', ariaLabel: `Technique du jour : ${daily.name}`, onSelect: () => nav(`/techniques/${daily.id}?d=${main}`) },
  ]);

  return (
    <div className="page" style={{ gap: 22 }}>
      <header className="home-head">
        <div className="grow">
          <div className="brand">
            Combat <b>Shadow</b> Studio
          </div>
        </div>
        <Link to="/profil" className="btn icon ghost" aria-label="Mon profil" title="Profil">
          <AppIcon id="profile" />
        </Link>
        <Link to="/reglages" className="btn icon ghost" aria-label="Réglages" title="Réglages" style={{ marginRight: -10 }} data-testid="open-settings">
          <AppIcon id="settings" />
        </Link>
      </header>

      <section className="hero" aria-label={`${name}, ${disc.name}`}>
        {/* 0.27: a double tap shows the coach on the whole screen (Youssef, 2026-10-20 22:09) */}
        <FullscreenStage className="hero-stage" testId="hero-stage">
          {/* v0.29: the guard sits outside the hidden layer, so its message and button can be read and used */}
          <StageGuard place="accueil">
          <div className="hero-stage-3d" aria-hidden>
            <Suspense fallback={<StageFallback />}>
              <CoachStage
                backdrop="dark"
                coach={coach}
                discipline={profile.mainDiscipline}
                southpaw={profile.guard === 'gaucher'}
                cameraAngle={25}
                quality={settings.quality}
                events={NO_EVENTS}
                onPlayer={onPlayer}
              />
            </Suspense>
          </div>
          </StageGuard>
        </FullscreenStage>
        <div className="hero-fade" />
        <div className="hero-info">
          <div>
            <div className="eyebrow disc-label">
              <DisciplineIcon id={disc.id} size={24} />
              <span>
                {disc.name} · {level.name}
              </span>
            </div>
            <div className="hero-name" data-testid="fighter-name">
              {name}
            </div>
          </div>
        </div>
        <div className="hero-top">
          <Link to="/coach" className="chip" aria-label={`Changer de coach (${name})`}>
            Changer de coach
          </Link>
        </div>
      </section>

      <div className="stack" style={{ gap: 10, marginTop: -6 }}>
        <button type="button" className="btn primary block lg" onClick={start} data-testid="home-cta">
          <AppIcon id="play" /> Commencer l’entraînement
        </button>
        {recEx && (
          <p className="small muted" style={{ textAlign: 'center' }}>
            Recommandé : <span style={{ color: 'var(--ink)' }}>{recEx.name}</span>
          </p>
        )}
      </div>

      {resume && last && (
        <Link to={resume} className="card link ex-card" data-testid="resume-last">
          <span className="icon-tile red" aria-hidden>
            <AppIcon id="play" />
          </span>
          <span className="body">
            <span className="eyebrow">Reprendre</span>
            <span className="title">{last.exerciseName}</span>
            <span className="small muted">
              <DisciplineLabel id={last.discipline} name={DISCIPLINES.find((d) => d.id === last.discipline)?.name ?? ''} /> · {MODE_LABEL[last.mode]}
            </span>
          </span>
          <AppIcon id="chevron" />
        </Link>
      )}

      <section className="section" aria-labelledby="h-progress">
        <SectionHead id="h-progress" title="Ta progression" action={<Link to="/stats">Tout voir</Link>} />
        {sessions.length === 0 ? (
          <EmptyState title="Aucune séance pour l’instant" text="Ton temps actif, tes séances et ta progression apparaîtront ici après ton premier entraînement." />
        ) : (
          <>
            <div className="stat-tiles">
              <StatTile value={Math.round(weekSec / 60)} unit="min" label="Cette semaine" />
              <StatTile value={formatDuration(totalSec)} label="Temps cumulé" />
              <StatTile value={sessionCount(sessions)} label="Séances" />
            </div>
            {weeklyGoal > 0 && (
              <div className="card stack" style={{ gap: 8 }}>
                <div className="row between">
                  <span className="small">Objectif de la semaine</span>
                  <span className="small num-figure">
                    {Math.round(weekSec / 60)} / {weeklyGoal} min
                  </span>
                </div>
                <ProgressBar value={weekSec / 60 / weeklyGoal} label="Objectif hebdomadaire" tone={weekSec / 60 >= weeklyGoal ? 'gold' : 'red'} />
              </div>
            )}
            {last && (
              <div className="card row nowrap" style={{ gap: 14 }}>
                <span className="icon-tile" aria-hidden>
                  <AppIcon id="history" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="eyebrow" style={{ display: 'block' }}>
                    Dernière séance
                  </span>
                  <span style={{ fontWeight: 600 }}>{last.exerciseName}</span>
                  <span className="small muted" style={{ display: 'block' }}>
                    {new Date(last.start).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatDuration(last.activeSec)} actives
                  </span>
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {legendFavs.length > 0 && (
        <section className="section" aria-labelledby="h-legend-fav">
          <SectionHead id="h-legend-fav" title="Combinaisons favorites" action={<Link to="/champions">Légendes</Link>} />
          <div className="stack" style={{ gap: 8 }}>
            {legendFavs.map((c) => (
              <Link key={c!.id} to={`/champions/${c!.id}`} className="card link ex-card">
                <TechThumb id={keyTechnique(c!.sequence)} />
                <span className="body">
                  <span className="title">{c!.name}</span>
                  <span className="small muted">{catalog?.championById.get(c!.champion)?.name ?? 'Combinaison des légendes'}</span>
                </span>
                <AppIcon id="chevron" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {favEx.length > 0 && (
        <section className="section" aria-labelledby="h-fav">
          <SectionHead id="h-fav" title="Favoris" action={<Link to="/techniques?tab=favoris">Tous</Link>} />
          <div className="stack" style={{ gap: 8 }}>
            {favEx
              .map((id) => EXERCISE_BY_ID.get(id))
              .filter((e) => !!e)
              .slice(0, 3)
              .map((e) => (
                <Link key={e!.id} to={`/discipline/${e!.discipline}?niveau=${e!.level}&ex=${e!.id}`} className="card link ex-card">
                  <TechThumb id={keyTechnique(e!.sequence)} />
                  <span className="body">
                    <span className="title">{e!.name}</span>
                    <span className="small muted"><DisciplineLabel id={e!.discipline} name={DISCIPLINES.find((d) => d.id === e!.discipline)?.name ?? ''} /></span>
                  </span>
                  <AppIcon id="chevron" />
                </Link>
              ))}
          </div>
        </section>
      )}

      {recProg && (
        <section className="section" aria-labelledby="h-prog">
          <SectionHead id="h-prog" title="Programme recommandé" action={<Link to="/programmes">Programmes</Link>} />
          <EntryCard to={`/programmes/${recProg.id}`} icon={<AppIcon id="programs" />} thumb={programTechnique(recProg)} tone="red" title={recProg.name} text={`${recProg.durationMin} min · ${recProg.frequency}`} />
        </section>
      )}

      {/* 0.24 (épuration) : la grille des disciplines n'est plus répétée ici, elle est dans l'onglet Entraîner */}
      {rec.exercises.length > 1 && (
        <section className="section" aria-labelledby="h-rec">
          <SectionHead id="h-rec" title="Pour toi aujourd’hui" action={<Link to={`/discipline/${disc.id}`}>{disc.short}</Link>} />
          <div className="stack" style={{ gap: 8 }}>
            {rec.exercises.slice(1, 4).map((e) => (
              <Link key={e.id} to={`/discipline/${e.discipline}?niveau=${e.level}&ex=${e.id}`} className="card link ex-card">
                <TechThumb id={keyTechnique(e.sequence)} />
                <span className="body">
                  <span className="eyebrow">{LEVELS.find((l) => l.id === e.level)!.name}</span>
                  <span className="title">{e.name}</span>
                </span>
                <AppIcon id="chevron" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
