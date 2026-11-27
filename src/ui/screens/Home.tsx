import { useCallback, useMemo } from 'react';
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
import { NavIcon } from '../nav/NavIcon';
import { useKbStyle } from '../components/KickboxingStyle';
import { techniquesFor } from '../../domain/techniques';
import { filterTechniques } from '../../domain/kickboxingStyles';
import { CoachScreen, useCoachUi } from '../coach-screen/CoachScreen';
import { CoachFace } from '../coach-row/CoachRow';
import { CoachUniverseStage, atmosphereOf, universeVars } from '../coach-universe/CoachUniverse';
import { techniqueOfTheDay } from '../../domain/quickPicks';

/** the 3D bundle (three.js, R3F) stays out of the main chunk */

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
  const champ = championFor(profile.coach, profile.champion);
  // 2.10.5: his universe, the one of the coach choice
  const atmo = atmosphereOf(champ);
  const name = champ.name;
  // 2.7 (option A « Un seul sélecteur »): « Changer » next to the name opens the coach's panel on « Ton coach »
  const coachUi = useCoachUi();

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

  // 2.10.8 (Youssef, 2026-11-27, « Parcours des écrans », conseil 1): « Commencer » opens the session of the recommended
  // exercise straight away, ready to start, in the last mode used (Libre the first time); the mode is changed in the
  // session's « Plus » menu. Before: it opened the exercise sheet of the discipline, one more screen and one more tap.
  const lastMode: TrainingMode = last && RESUMABLE.includes(last.mode) ? last.mode : 'libre';
  const start = () => {
    if (recEx) nav(`/entrainement?ex=${encodeURIComponent(recEx.id)}&mode=${lastMode}`);
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

      {/* 2.11.1 (Youssef, 2026-11-27, proposition 8A): one session shown, one big « Commencer » (in the coach's card).
          « Reprendre ta séance » takes the place of the prepared session when one is in progress. The search is the
          magnifier of the bar; the access that used to crowd this page are one row of four under the coach. */}
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
          <div className="home-row" data-testid="next-session" data-disc={disc.id}>
            <span className="home-row-ico" aria-hidden>
              <NavIcon id="dumbbell" />
            </span>
            <span className="home-row-text">
              <b>{recEx ? recEx.name : disc.name}</b>
              <small>
                Prête à démarrer · {MODE_LABEL[lastMode]} · {level.name}
              </small>
            </span>
          </div>
        )}
      </div>

      {/* 2.10.5 (Youssef, 2026-11-26): the coach stands in his own universe, the same component as the coach choice
          (src/ui/coach-universe): his colours, his emblem with the big name, the light streaks and the ring on the floor */}
      <section className="home-coach home-universe" aria-label={`${name}, ${disc.name}`} style={universeVars(atmo)} data-atmo={atmo.atmosphere.motif} data-testid="home-universe">
        <div className="home-coach-head">
          <span className="eyebrow">Ton coach</span>
          <div className="hero-name" data-testid="fighter-name">
            {name}
          </div>
          {/* 2.8.1 (Youssef, 2026-11-24 17:49: « dans l'écran principal, en cas de changement de coach arriver direct sur
              la fenêtre en grand ») : « Changer » opens the big coach screen; the panel (a tap on the coach) keeps its
              « Ton coach » row, and the other screens keep the 2.7.0 way */}
          <button type="button" className="home-coach-change" onClick={() => nav('/coach')} aria-label={`Changer de coach (${name})`} data-testid="home-change-coach">
            <CoachFace coach={champ} />
            <span>Changer</span>
          </button>
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
            panel={{ advanced: { coach: true, guard: true } }}
            ui={coachUi}
            stage={
              <CoachUniverseStage
                champion={champ}
                discipline={profile.mainDiscipline}
                southpaw={profile.guard === 'gaucher'}
                cameraAngle={25}
                quality={settings.quality}
                events={NO_EVENTS}
                onPlayer={onPlayer}
              />
            }
          />
          {/* 2.4: « Changer de coach » is in the coach's panel (Options avancées), no longer on the coach */}
          <button type="button" className="home-go" onClick={start} data-testid="home-cta" data-action="start" aria-label={recEx ? `Commencer : ${recEx.name}` : 'Commencer l’entraînement'}>
            <NavIcon id="play" />
            Commencer
          </button>
        </div>
      </section>

      <nav className="home-access" aria-label="Accès rapides" data-testid="home-access">
        <Link to={`/techniques?d=${main}`} className="home-access-item" data-testid="home-techniques">
          <NavIcon id="book" />
          Techniques
        </Link>
        <Link to="/chrono" className="home-access-item" data-testid="tile-chrono" aria-label="Chrono seul">
          <NavIcon id="stopwatch" />
          Chrono
        </Link>
        <Link to="/createur" className="home-access-item" data-testid="home-create">
          <NavIcon id="plus" />
          Créer
        </Link>
        <Link to="/coach-ia" className="home-access-item" data-testid="home-coach-ia">
          <NavIcon id="coach" />
          Coach IA
        </Link>
      </nav>

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
          {daily && (
            <Link to={`/techniques/${daily.id}?d=${main}`} className="home-round" data-testid="tile-daily" aria-label={`Technique du jour : ${daily.name}`}>
              <i>
                <NavIcon id="star" />
              </i>
              <span>Technique du jour</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
