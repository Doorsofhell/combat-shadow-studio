import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import type { CoachId } from '../../domain/types';
import { PageHead } from '../components';
import { chooseCoach } from '../components/fighter';
import { IconCheck } from '../icons';

export const COACHES: { id: CoachId; name: string; desc: string; img: string }[] = [
  { id: 'homme', name: 'Coach homme', desc: 'Athlétique, torse nu, short de combat', img: './coaches/homme.jpg' },
  { id: 'femme', name: 'Coach femme', desc: 'Athlétique, brassière et short de sport', img: './coaches/femme.jpg' },
];

/** The two coaches side by side; nothing is selected until the user taps one. */
export function CoachPicker({ value, onChange }: { value: CoachId | null; onChange: (c: CoachId) => void }) {
  return (
    <div className="coach-pick" role="radiogroup" aria-label="Choix du coach">
      {COACHES.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          className={`coach-card ${value === c.id ? 'on' : ''}`}
          onClick={() => onChange(c.id)}
          data-testid={`coach-${c.id}`}
        >
          <img src={c.img} alt="" loading="eager" />
          {value === c.id && (
            <span className="tick" aria-hidden>
              <IconCheck width={18} height={18} />
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

export function CoachSelect() {
  const [q] = useSearchParams();
  const first = q.get('first') === '1';
  const coach = useProfile((s) => s.profile.coach);
  const nav = useNavigate();
  return (
    <div className="page">
      <PageHead title="Choisis ton coach" eyebrow="Coach" back={!first} />
      <p className="muted">Ton combattant montre chaque mouvement en 3D. Tu peux en changer à tout moment, tes statistiques sont conservées.</p>
      <CoachPicker value={coach} onChange={(c) => chooseCoach(c)} />
      <button type="button" className="btn primary block lg" disabled={!coach} onClick={() => (first ? nav('/', { replace: true }) : nav(-1))}>
        {coach ? 'Valider' : 'Choisis un coach pour continuer'}
      </button>
    </div>
  );
}
