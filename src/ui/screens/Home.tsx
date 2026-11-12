import { lazy, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { sessionCount, sum, useStats, weekKey } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { DISCIPLINES, LEVELS, TrainingMode } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { recommend } from '../../domain/recommend';
import { championFor } from '../../domain/coaches/catalog';
import type { ComboPlayer, PlayerEvents } from '../../engine';
import { MODE_LABEL } from '../training/plan';
import { DisciplineIcon } from '../icons';
import { haptic, openSearch } from '../nav/BottomBar';
import { NavIcon } from '../nav/NavIcon';
import { useKbStyle } from '../components/KickboxingStyle';
import { techniquesFor } from '../../domain/techniques';
import { filterTechniques } from '../../domain/kickboxingStyles';
import { CoachScreen } from '../coach-screen/CoachScreen';
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
  const sessions = useStats((s) => s.sessions);
  const weeklyGoal = useGoals((s) => s.goals.weeklyMinutes);
  const nav = useNavigate();
  const rec = useMemo(() => recommend(profile), [profile]);
  const disc = DISCIPLINES.find((d) => d.id === profile.mainDiscipline)!;
  const level = LEVELS.find((l) => l.id === profile.levels[disc.id])!;
  // 0.24: the coach on stage is Kadir or Amara (1.37: always, the fallback render with the custom fighter is gone)
  const coach = profile.coach ?? 'homme';
  const name = championFor(profile.coach, profile.champion).name;

  const thisWeek = weekKey(new Date().toISOString());
  const week = sessions.filter((s) => weekKey(s.start) === thisWeek);
  const weekSec = sum(week);
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
  const update = useProfile((s) => s.update);

  // 1.30.0 (nouvelle ergonomie, lot 2; maquette validée le 2026-11-11): the six disciplines are tabs at the top, the
  // search is the big bar of the page with the chronometer, then two shortcuts, the coach in its card with
  // « Commencer », and the round shortcuts « Pour toi » (only links to what exists, only real figures)
  const [kbStyle] = useKbStyle();
  const main = profile.mainDiscipline;
  const daily = useMemo(() => techniqueOfTheDay(filterTechniques(techniquesFor(main), main, kbStyle)), [main, kbStyle]);
  const mastery = useGoals((s) => s.mastery);
  const toReview = useMemo(() => techniquesFor(main).filter((t) => mastery[t.id] === 'a-revoir').length, [main, mastery]);
  const goalMin = weeklyGoal;
  const goalSessions = useGoals((s) => s.goals.weeklySessions);
  const weekMin = Math.round(weekSec / 60);
  const weekSessions = sessionCount(week);
  const lastDisc = last ? DISCIPLINES.find((d) => d.id === last.discipline) : undefined;
  const goalOn = goalMin > 0 || goalSessions > 0;
  const goalRatio = goalMin > 0 ? weekMin / goalMin : goalSessions > 0 ? weekSessions / goalSessions : 0;
  const goalDone = goalOn && goalRatio >= 1;
  const goalText = goalMin > 0 ? `${weekMin} / ${goalMin} min` : goalSessions > 0 ? `${weekSessions} / ${goalSessions}` : 'Objectif';

  return (
    <div className="page home home-v2">
      <header className="home-head row" style={{ gap: 8, alignItems: 'baseline', justifyContent: 'flex-start' }}>
        <div className="brand">
          Combat <b>Shadow</b> Studio
        </div>
        <span className="small muted num-figure" data-testid="home-version">
          v{import.meta.env.VITE_APP_VERSION}
        </span>
      </header>

      {/* the six disciplines: one touch changes the discipline of the page (and of the coach) */}
      <div className="home-dtabs" role="group" aria-label="Ta discipline" data-testid="disc-tabs">
        {DISCIPLINES.map((d) => (
          <button key={d.id} type="button" className={`home-dtab ${d.id === main ? 'on' : ''}`} aria-pressed={d.id === main} data-testid={`pick-${d.id}`} onClick={() => d.id !== main && update({ mainDiscipline: d.id })}>
            {/* the six names fit the width of a small phone: only the discipline of the page shows its icon */}
            {d.id === main && <DisciplineIcon id={d.id} size={22} />}
            {d.short}
          </button>
        ))}
      </div>

      {/* the big action bar: the search of the app (« Rechercher ou demander au coach »), the chronometer next to it */}
      <div className="home-ask">
        <button
          type="button"
          className="home-ask-go"
          aria-label="Rechercher ou demander au coach"
          aria-haspopup="dialog"
          data-testid="app-search"
          onClick={() => {
            haptic();
            openSearch();
          }}
        >
          <NavIcon id="search" />
          <span>Que veux-tu travailler ?</span>
        </button>
        <Link to="/chrono" className="home-ask-chip" data-testid="tile-chrono" aria-label="Chrono seul">
          <NavIcon id="stopwatch" />
          Chrono
        </Link>
      </div>

      <div className="home-list">
        {resume && last ? (
          <Link to={resume} className="home-row" data-testid="resume-last" data-disc={last.discipline}>
            <span className="home-row-ico" aria-hidden>
              <NavIcon id="restore" />
            </span>
            <span className="home-row-text">
              <b>Reprendre ta séance</b>
              <small>
                {last.exerciseName} · {MODE_LABEL[last.mode]}
                {lastDisc ? ` · ${lastDisc.short}` : ''}
              </small>
            </span>
            <NavIcon id="chevron" />
          </Link>
        ) : (
          <Link to={`/discipline/${disc.id}`} className="home-row" data-testid="resume-last" data-disc={disc.id}>
            <span className="home-row-ico" aria-hidden>
              <NavIcon id="dumbbell" />
            </span>
            <span className="home-row-text">
              <b>Ta discipline</b>
              <small>
                {disc.name} · {level.name}
              </small>
            </span>
            <NavIcon id="chevron" />
          </Link>
        )}
        {daily && (
          <Link to={`/techniques/${daily.id}?d=${main}`} className="home-row" data-testid="tile-daily">
            <span className="home-row-ico" aria-hidden>
              <NavIcon id="star" />
            </span>
            <span className="home-row-text">
              <b>Technique du jour</b>
              <small>{daily.name}</small>
            </span>
            <NavIcon id="chevron" />
          </Link>
        )}
      </div>

      <section className="home-coach" aria-label={`${name}, ${disc.name}`}>
        <div className="home-coach-head">
          <span className="eyebrow">Ton coach</span>
          <div className="hero-name" data-testid="fighter-name">
            {name}
          </div>
        </div>
        <div className="hero home-hero">
          {/* 1.4.0: the coach screen of the app (the same module everywhere): a tap shows the sound and the
              fullscreen in the zone of the coach; a double tap shows the coach on the whole screen */}
          <CoachScreen
            context="accueil"
            className="hero-stage"
            testId="hero-stage"
            place="accueil"
            stageClassName="hero-stage-3d"
            stageHidden
            fallback={<StageFallback />}
            commands={{ sound: true }}
            stage={
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
            }
          />
          <Link to="/coach" className="chip home-coach-chg" aria-label={`Changer de coach (${name})`}>
            Changer de coach
          </Link>
          <button type="button" className="home-go" onClick={start} data-testid="home-cta" data-action="start" aria-label={recEx ? `Commencer : ${recEx.name}` : 'Commencer l’entraînement'}>
            <NavIcon id="play" />
            Commencer
          </button>
        </div>
      </section>

      <section className="home-foryou" aria-labelledby="home-h-foryou">
        <h2 id="home-h-foryou">Pour toi</h2>
        <div className="home-rounds">
          {/* the weekly goal, real figures only; the details are in Progrès › Objectifs */}
          <Link to="/objectifs" className={`home-round ${goalDone ? 'gold' : ''}`} data-testid="home-goal" aria-label={goalOn ? `Objectif de la semaine : ${goalText}` : 'Objectif de la semaine : aucun objectif fixé'}>
            <i className="home-ring" style={{ ['--p' as string]: Math.min(1, goalRatio) }} role={goalOn ? 'progressbar' : undefined} aria-label={goalOn ? 'Objectif hebdomadaire' : undefined} aria-valuemin={goalOn ? 0 : undefined} aria-valuemax={goalOn ? 100 : undefined} aria-valuenow={goalOn ? Math.round(Math.min(1, goalRatio) * 100) : undefined}>
              <NavIcon id="calendar" />
            </i>
            <span className={goalOn ? 'num-figure' : undefined}>{goalText}</span>
          </Link>
          {recProg && (
            <Link to={`/programmes/${recProg.id}`} className="home-round red" data-testid="home-prog" aria-label={`Programme : ${recProg.name}`}>
              <i>
                <NavIcon id="layers" />
              </i>
              <span>Programme</span>
            </Link>
          )}
          {rec.exercises[1] && (
            <Link to={`/discipline/${rec.exercises[1].discipline}?niveau=${rec.exercises[1].level}&ex=${rec.exercises[1].id}`} className="home-round" data-testid="home-foryou" aria-label={`Autre idée de séance : ${rec.exercises[1].name}`}>
              <i>
                <NavIcon id="sparkle" />
              </i>
              <span>Autre idée</span>
            </Link>
          )}
          {toReview > 0 && (
            <Link to={`/techniques?d=${main}&cat=a-revoir`} className="home-round gold" data-testid="home-review" aria-label={`À revoir : ${toReview} technique${toReview > 1 ? 's' : ''}`}>
              <i>
                <NavIcon id="restore" />
              </i>
              <span>À revoir</span>
            </Link>
          )}
          <Link to="/createur" className="home-round" data-testid="home-create">
            <i>
              <NavIcon id="plus" />
            </i>
            <span>Créer</span>
          </Link>
          <Link to="/coach-ia" className="home-round" data-testid="home-coach-ia">
            <i>
              <NavIcon id="coach" />
            </i>
            <span>Coach IA</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
