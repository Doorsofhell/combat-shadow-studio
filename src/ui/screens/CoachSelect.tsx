import { ALL_COACHES, CHAMPIONS, championFor, type ChampionCoach } from '../../domain/coaches/catalog';
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

/** The coaches in a grid; nothing is selected until the user taps one. Without props: the stored choice. */
export function CoachPicker({ value, onChange }: { value?: string | null; onChange?: (c: ChampionCoach) => void }) {
  const stored = useChosenCoach();
  const current = value === undefined ? stored : value;
  return (
    <div className="coach-pick" role="radiogroup" aria-label="Choix du coach">
      {COACHES.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={current === c.id}
          className={`coach-card ${current === c.id ? 'on' : ''}`}
          onClick={() => (onChange ?? pickChampion)(ALL_COACHES[i])}
          data-testid={c.id === CHAMPIONS.homme.id ? 'coach-homme' : c.id === CHAMPIONS.femme.id ? 'coach-femme' : `coach-${c.id}`}
        >
          <img src={c.img} alt="" loading="eager" />
          {current === c.id && (
            <span className="tick" aria-hidden>
              <AppIcon id="check" size={18} />
            </span>
          )}
          <span className="lbl">
            {c.name}
            <br />
            <span className="small muted" style={{ fontWeight: 500 }}>
              {c.desc}
            </span>
          </span>
        </button>
      ))}
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
        {chosen ? 'Valider' : 'Choisis un coach pour continuer'}
      </button>
    </div>
  );
}
