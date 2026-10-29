import { lazy, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { useActiveFighter } from '../../store/fighters';
import { sessionCount, sum, useStats, weekKey } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { DISCIPLINES, LEVELS, TrainingMode } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { recommend } from '../../domain/recommend';
import { championFor } from '../../domain/coaches/catalog';
import type { ComboPlayer, PlayerEvents } from '../../engine';
import { MODE_LABEL } from '../training/plan';
import { ProgressBar } from '../components';
import { defaultFighterName } from '../components/fighter';
import { DisciplineIcon } from '../icons';
import { useNavActions } from '../nav/store';
import { NavPanel, usePanel } from '../nav/NavSheets';
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
  const fighter = useActiveFighter();
  const sessions = useStats((s) => s.sessions);
  const weeklyGoal = useGoals((s) => s.goals.weeklyMinutes);
  const nav = useNavigate();
  const rec = useMemo(() => recommend(profile), [profile]);
  const disc = DISCIPLINES.find((d) => d.id === profile.mainDiscipline)!;
  const level = LEVELS.find((l) => l.id === profile.levels[disc.id])!;
  const premium = settings.coachRender === 'premium';
  // 0.24: the coach on stage is Kadir or Amara; the fallback render keeps the custom fighter
  const coach = premium ? (profile.coach ?? 'homme') : (fighter?.look.sex ?? profile.coach ?? 'homme');
  const name = premium ? championFor(profile.coach, profile.champion).name : (fighter?.name ?? defaultFighterName(profile.coach));

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
  const picker = usePanel();

  // 0.26 quick actions; 1.0.0 (refonte, lot 3, maquette v4): they are the three tiles of the page, and the big
  // button « Reprendre » relaunches the last session (« Commencer » before the first one)
  const [kbStyle] = useKbStyle();
  const main = profile.mainDiscipline;
  const daily = useMemo(() => techniqueOfTheDay(filterTechniques(techniquesFor(main), main, kbStyle)), [main, kbStyle]);
  const resumeNow = () => (resume ? nav(resume) : start());
  useNavActions({
    resume: { label: resume ? 'Reprendre' : 'Commencer', icon: 'play', run: resumeNow, testId: 'home-cta', ariaLabel: resume && last ? `Reprendre : ${last.exerciseName}` : 'Commencer l’entraînement' },
  });
  const goalMin = weeklyGoal;
  const goalSessions = useGoals((s) => s.goals.weeklySessions);
  const weekMin = Math.round(weekSec / 60);
  const weekSessions = sessionCount(week);
  const lastDisc = last ? DISCIPLINES.find((d) => d.id === last.discipline) : undefined;
  const shown = resume && lastDisc ? lastDisc : disc;

  return (
    <div className="page home" style={{ gap: 16 }}>
      {/* 1.3.0 (Youssef, 2026-10-28: « le numéro de version s'affiche sous la photo de profil, positionne-le directement
          après le titre de l'application »): the version follows the name, clear of the photo at the top right */}
      <header className="home-head row" style={{ gap: 8, alignItems: 'baseline', justifyContent: 'flex-start' }}>
        <div className="brand">
          Combat <b>Shadow</b> Studio
        </div>
        <span className="small muted num-figure" data-testid="home-version">
          v{import.meta.env.VITE_APP_VERSION}
        </span>
      </header>

      {/* « Reprendre » : the last session (or the main discipline before the first one); a tap chooses the
          discipline among the six (maquette v4) */}
      <button type="button" className="home-resume" onClick={picker.show} data-testid="resume-last" aria-haspopup="dialog" aria-label={`${resume ? 'Reprendre' : 'Discipline'} : ${shown.name}. Changer de discipline`}>
        <span className="eyebrow">{resume ? 'Reprendre' : 'Ta discipline'}</span>
        <span className="home-resume-disc" data-disc={shown.id}>
          {/* the official icon of the discipline (the home always showed the main discipline's icon, 0.24) */}
          <DisciplineIcon id={shown.id} size={40} />
          {shown.short}
        </span>
        <span className="small">
          {resume && last ? (
            <>
              {last.exerciseName} · {MODE_LABEL[last.mode]}
            </>
          ) : (
            level.name
          )}
        </span>
      </button>

      <section className="hero home-hero" aria-label={`${name}, ${disc.name}`}>
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
        <div className="hero-fade" />
        <div className="hero-info">
          <div className="hero-name" data-testid="fighter-name">
            {name}
          </div>
        </div>
        <div className="hero-top">
          <Link to="/coach" className="chip" aria-label={`Changer de coach (${name})`}>
            Changer de coach
          </Link>
        </div>
      </section>

      <div className="home-tiles">
        <button type="button" className="home-tile" onClick={start} data-testid="tile-quick">
          <span className="eyebrow">Séance rapide</span>
          <b>{recEx ? recEx.name : 'Choisir'}</b>
        </button>
        {daily && (
          <Link to={`/techniques/${daily.id}?d=${main}`} className="home-tile" data-testid="tile-daily">
            <span className="eyebrow">Technique du jour</span>
            <b>{daily.name}</b>
          </Link>
        )}
        <Link to="/chrono" className="home-tile" data-testid="tile-chrono">
          <span className="eyebrow">Chrono</span>
          <b>Seul</b>
        </Link>
      </div>

      {/* the weekly goal, real figures only; the details are in Progrès › Objectifs */}
      <Link to="/objectifs" className="home-goal" data-testid="home-goal">
        <span className="row between">
          <span className="eyebrow">Objectif de la semaine</span>
          <span className="num-figure home-goal-n">
            {goalMin > 0 ? `${weekMin} / ${goalMin} min` : goalSessions > 0 ? `${weekSessions} / ${goalSessions}` : `${weekMin} min`}
          </span>
        </span>
        {goalMin > 0 || goalSessions > 0 ? (
          <ProgressBar
            value={goalMin > 0 ? weekMin / goalMin : weekSessions / goalSessions}
            label="Objectif hebdomadaire"
            tone={(goalMin > 0 ? weekMin >= goalMin : weekSessions >= goalSessions) ? 'gold' : 'red'}
          />
        ) : (
          <span className="small muted">Aucun objectif fixé. Touche ici pour en choisir un.</span>
        )}
      </Link>

      {/* former « Programme recommandé » and « Pour toi aujourd’hui »: one line under the gauge */}
      {(recProg || rec.exercises[1]) && (
        <div className="home-next">
          {recProg && (
            <Link to={`/programmes/${recProg.id}`} className="chip" data-testid="home-prog">
              Programme : {recProg.name}
            </Link>
          )}
          {rec.exercises[1] && (
            <Link to={`/discipline/${rec.exercises[1].discipline}?niveau=${rec.exercises[1].level}&ex=${rec.exercises[1].id}`} className="chip" data-testid="home-foryou">
              Pour toi : {rec.exercises[1].name}
            </Link>
          )}
        </div>
      )}

      {picker.open && (
        <NavPanel title="Choisir la discipline" onClose={() => picker.hide()} testId="disc-picker">
          <div className="home-discs">
            {DISCIPLINES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`home-disc ${d.id === main ? 'on' : ''}`}
                aria-pressed={d.id === main}
                data-testid={`pick-${d.id}`}
                onClick={() => {
                  update({ mainDiscipline: d.id });
                  picker.hide();
                }}
              >
                <DisciplineIcon id={d.id} size={28} />
                <b>{d.short}</b>
              </button>
            ))}
          </div>
        </NavPanel>
      )}
    </div>
  );
}
