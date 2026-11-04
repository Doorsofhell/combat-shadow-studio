import { ALL_COACHES, CHAMPIONS, SKILLS, championById, championFor, type ChampionCoach } from '../../domain/coaches/catalog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { PageHead } from '../components';
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
              data-testid={x.id === CHAMPIONS.homme.id ? 'coach-homme' : x.id === CHAMPIONS.femme.id ? 'coach-femme' : `coach-${x.id}`}
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
              <span className="row">
                <b>Poids</b>
                <span>{c.weightKg ? `${c.weightKg} kg` : 'non mesuré'}</span>
              </span>
              <span className="bar" aria-hidden>
                {c.weightKg ? <span style={{ width: `${pct(c.weightKg, 45, 105)}%` }} /> : null}
              </span>
            </span>
          </div>
          <div className="skills" aria-label="Profil de style sur 10">
            <span className="cap">
              Profil de style <i>(indicatif, sur 10)</i>
            </span>
            {SKILLS.map((k) => {
              const v = c.skills[k.id];
              return (
                <span className="skill" key={k.id}>
                  <span className="k">{k.label}</span>
                  <span className="cells" aria-hidden>
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i} className={i < v ? (v >= 8 ? 'top' : 'on') : ''} />
                    ))}
                  </span>
                  <span className="v">{v}</span>
                </span>
              );
            })}
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

/** Youssef 2026-10-28 18:41: « Quand je clique sur changer de coach, je ne veux voir que la liste des coachs, rien d'autre. » */
export function CoachSelect() {
  const [q] = useSearchParams();
  const first = q.get('first') === '1';
  const chosen = useChosenCoach();
  const nav = useNavigate();
  return (
    <div className="page coach-select">
      <PageHead title="Choisis ton coach" eyebrow="Coach" back={!first} />
      <CoachPicker />
      <button type="button" className="btn primary block lg" disabled={!chosen} onClick={() => (first ? nav('/', { replace: true }) : nav(-1))} data-testid="coach-valider">
        {chosen ? `Valider ${championById(chosen)?.name ?? ''}` : 'Choisis un coach pour continuer'}
      </button>
    </div>
  );
}
