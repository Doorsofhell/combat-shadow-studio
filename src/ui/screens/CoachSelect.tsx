import { ALL_COACHES, CHAMPIONS, championFor, type ChampionCoach } from '../../domain/coaches/catalog';
import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { techniquesFor } from '../../domain/techniques';
import type { ComboPlayer, PlayerEvents } from '../../engine';
import { playerSteps } from '../training/plan';
import { NavIcon } from '../nav/NavIcon';
import { chooseCoach } from '../components/fighter';
import { AppIcon } from '../icons';

/** 1.5: the four coaches (Kadir, Axel, Amara, Kaila). The stored coach stays 'homme' / 'femme', the profile's
 * `champion` names the coach of that body type. */
export const COACHES = ALL_COACHES.map((c) => ({ id: c.id, coach: c.coach, name: `${c.name}\u00a0«\u00a0${c.nickname}\u00a0»`, desc: c.style, img: c.portrait }));

/** the coach the user chose, or null before the first choice */
export function useChosenCoach(): string | null {
  const coach = useProfile((s) => s.profile.coach);
  const champion = useProfile((s) => s.profile.champion);
  return coach ? championFor(coach, champion).id : null;
}

export function pickChampion(c: ChampionCoach) {
  chooseCoach(c.coach);
  const st = useProfile.getState();
  st.update({ coach: c.coach, champion: c.id });
}

const heightM = (h: string) => Number(h.replace(/[^0-9,]/g, '').replace(',', '.'));
const pct = (x: number, lo: number, hi: number) => Math.max(4, Math.min(100, ((x - lo) / (hi - lo)) * 100));

/**
 * 1.13 (Youssef 2026-11-04, option B: « des barres comme des barres de progression pour les habiletés, poids,
 * taille, poings, pieds, lutte »): a fighting-game selection screen. The chosen coach's sheet on top (portrait, name,
 * nickname, style, height and weight bars) and its style profile in bars of ten, under the six coaches in a row (on
 * top, so the row does not move when the sheet appears during the first launch); a tap on one chooses it and shows
 * its sheet. Height and weight are measured on the 3D models; the bars of ten are a style
 * profile, said so on screen. Without props: the stored choice.
 */
export function CoachPicker({ value, onChange }: { value?: string | null; onChange?: (c: ChampionCoach) => void }) {
  const stored = useChosenCoach();
  const current = value === undefined ? stored : value;
  const c = ALL_COACHES.find((x) => x.id === current) ?? null;
  return (
    <div className="coach-sel">
      <div className="coach-pick" role="radiogroup" aria-label="Choix du coach">
        {ALL_COACHES.map((x) => {
          const on = current === x.id;
          return (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${x.name} « ${x.nickname} »`}
              className={`coach-card ${on ? 'on' : ''}`}
              onClick={() => (onChange ?? pickChampion)(x)}
              data-testid={testIdOf(x)}
            >
              <img src={x.portrait} alt="" loading="eager" />
              <span className="lbl">{x.name}</span>
              {on && (
                <span className="tick" aria-hidden>
                  <AppIcon id="check" size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {c ? (
        <section className="coach-sheet" data-testid={`coach-details-${c.id}`} aria-live="polite" aria-label={`Fiche de ${c.name}`}>
          <img src={c.portrait} alt="" />
          <div className="who">
            <span className="name">{c.name}</span>
            <span className="nick">« {c.nickname} »</span>
            <span className="style">{c.style}</span>
            <span className="gab">
              <span className="row">
                <b>Taille</b>
                <span>{c.height}</span>
              </span>
              <span className="bar" aria-hidden>
                <span style={{ width: `${pct(heightM(c.height), 1.5, 2.0)}%` }} />
              </span>
              {c.weightKg ? (
                <>
                  <span className="row">
                    <b>Poids</b>
                    <span>{c.weightKg} kg</span>
                  </span>
                  <span className="bar" aria-hidden>
                    <span style={{ width: `${pct(c.weightKg, 45, 105)}%` }} />
                  </span>
                </>
              ) : null}
            </span>
          </div>
          {/* 1.32.0 (Youssef, 2026-11-11): the bars « profil de style sur 10 » were estimates, not measures: the sheet
              keeps what is real, the guard of the coach and its three strengths */}
          <div className="coach-facts" data-testid="coach-facts">
            <span className="cap">Sa garde</span>
            <span>{c.guard}</span>
            <span className="cap">Ses points forts</span>
            <span className="coach-chips">
              {c.strengths.map((x) => (
                <i key={x}>{x}</i>
              ))}
            </span>
          </div>
        </section>
      ) : (
        <section className="coach-sheet empty" data-testid="coach-details-none">
          Touche un coach pour voir sa fiche.
        </section>
      )}
    </div>
  );
}

const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));
const NO_EVENTS: PlayerEvents = {};
const testIdOf = (c: ChampionCoach) => (c.id === CHAMPIONS.homme.id ? 'coach-homme' : c.id === CHAMPIONS.femme.id ? 'coach-femme' : `coach-${c.id}`);

/**
 * 1.32.0 (Youssef, 2026-11-11: « je n'aime pas trop le choix des coachs », « la présentation genre jeux vidéo »,
 * maquette A « La vedette » chosen): a fighting-game selection screen of our own. The coach looked at stands in real
 * 3D under a red and gold halo (it turns under the finger), in the outfit of the user's discipline; the arrows, the
 * strip of six portraits or a swipe on the sheet change it; « Le voir bouger » plays a technique of the discipline;
 * nothing changes before « Choisir ». Only real facts: guard and strengths of the catalogue, height and weight
 * measured on the 3D models (the weight only when it is measured).
 */
export function CoachSelect() {
  const [q] = useSearchParams();
  const first = q.get('first') === '1';
  const chosen = useChosenCoach();
  const nav = useNavigate();
  const profile = useProfile((s) => s.profile);
  const settings = useSettings((s) => s.settings);
  const [viewId, setViewId] = useState<string>(chosen ?? ALL_COACHES[0].id);
  const i = Math.max(0, ALL_COACHES.findIndex((x) => x.id === viewId));
  const c = ALL_COACHES[i];
  const show = (id: string) => {
    if (id === viewId) return;
    player.current = null;
    setReady(false);
    setMoving(false);
    setViewId(id);
  };
  const go = (d: number) => show(ALL_COACHES[(i + d + ALL_COACHES.length) % ALL_COACHES.length].id);
  const disc = profile.mainDiscipline;
  // what the icon « le voir bouger » plays: the first three techniques of the discipline that are not the guard, a
  // step or a fall (jab, direct, jab au corps in boxing), in a loop
  const demo = useMemo(
    () =>
      techniquesFor(disc)
        .filter((t) => !['garde', 'deplacement', 'chute'].includes(t.category))
        .slice(0, 3),
    [disc],
  );
  const player = useRef<ComboPlayer | null>(null);
  const [moving, setMoving] = useState(false);
  const [ready, setReady] = useState(false);
  const onPlayer = useCallback((p: ComboPlayer) => {
    player.current = p;
    setReady(true);
    // the guard with the engine's discreet idle, as on the home
    p.setSequence([], 0);
    p.play();
    setMoving(false);
  }, []);
  const toggleMove = () => {
    const p = player.current;
    if (!p || !demo.length) return;
    if (moving) p.setSequence([], 0);
    else p.setSequence(playerSteps(demo.map((t) => t.id)), 1.2);
    p.play();
    setMoving(!moving);
  };
  // a horizontal swipe on the sheet shows the next or the previous coach (the stage itself turns the coach)
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };
  const mine = chosen === c.id;
  const done = () => {
    if (!mine) pickChampion(c);
    if (first) nav('/', { replace: true });
    else nav(-1);
  };
  const live3d = settings.coachRender === 'premium';
  return (
    <div className="page coach-select coach-star" data-testid="coach-star" data-coach={c.id}>
      <h1 className="sr-only">Choisis ton coach</h1>
      <div className="star-stage" data-testid="star-stage" data-ready={ready}>
        <span className="star-halo" aria-hidden />
        <span className="star-ghost" aria-hidden>
          {c.name}
        </span>
        {live3d ? (
          <Suspense fallback={<img className="star-still" src={c.portrait} alt="" />}>
            <div className="star-3d">
              <CoachStage backdrop="dark" coach={c.coach} champion={c.id} discipline={disc} southpaw={profile.guard === 'gaucher'} cameraAngle={35} free quality={settings.quality} events={NO_EVENTS} onPlayer={onPlayer} />
            </div>
          </Suspense>
        ) : (
          <img className="star-still" src={c.portrait} alt="" />
        )}
        {mine && (
          <span className="star-mine" data-testid="star-mine">
            Ton coach
          </span>
        )}
        <button type="button" className="star-arrow l" onClick={() => go(-1)} aria-label="Coach précédent" data-testid="star-prev">
          <NavIcon id="back" />
        </button>
        <button type="button" className="star-arrow r" onClick={() => go(1)} aria-label="Coach suivant" data-testid="star-next">
          <NavIcon id="chevron" />
        </button>
      </div>

      <section className="star-info" data-testid={`coach-details-${c.id}`} aria-live="polite" aria-label={`Fiche de ${c.name}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="star-row">
          <div className="star-who">
            <span className="star-nick">
              « {c.nickname} »{' '}
              <span className="star-facts num-figure" data-testid="star-facts">
                {c.height}
                {c.weightKg ? ` · ${c.weightKg} kg` : ''}
              </span>
            </span>
            <div className="star-name">{c.name}</div>
          </div>
          {live3d && demo.length > 0 && (
            // Youssef, 2026-11-11: « je veux faire bouger en une icône, pas texte, pour que ça prenne moins de place »
            <button type="button" className="star-see" onClick={toggleMove} aria-pressed={moving} disabled={!ready} aria-label={moving ? 'Revenir en garde' : 'Le voir bouger'} title={moving ? 'Revenir en garde' : 'Le voir bouger'} data-testid="star-move">
              <NavIcon id={moving ? 'pause' : 'play'} />
            </button>
          )}
        </div>
        <span className="star-style">{c.style}</span>
        <div className="coach-chips">
          {c.strengths.map((x) => (
            <i key={x}>{x}</i>
          ))}
        </div>
      </section>

      <div className="star-strip" role="radiogroup" aria-label="Les six coachs">
        {ALL_COACHES.map((x) => {
          const on = x.id === c.id;
          return (
            <button key={x.id} type="button" role="radio" aria-checked={on} aria-label={`${x.name} « ${x.nickname} »${chosen === x.id ? ', ton coach' : ''}`} className={`star-thumb ${on ? 'on' : ''} ${chosen === x.id ? 'mine' : ''}`} onClick={() => show(x.id)} data-testid={testIdOf(x)}>
              <img src={x.portrait} alt="" loading="eager" />
            </button>
          );
        })}
      </div>

      <button type="button" className={`btn block lg star-cta ${mine ? 'secondary' : 'primary'}`} onClick={done} data-testid="coach-valider">
        {mine ? `Garder ${c.name}` : `Choisir ${c.name}`}
      </button>
    </div>
  );
}
