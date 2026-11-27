import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Profile, SPORT_GOALS, useProfile } from '../../store/profile';
import { useAccount } from '../../account/session';
import { useFighters } from '../../store/fighters';
import { DISCIPLINES, DisciplineId, LEVELS, LevelId } from '../../domain/types';
import { CoachPicker } from './CoachSelect';
import { championFor, type ChampionCoach } from '../../domain/coaches/catalog';
import { DisciplineCard, LevelSelector } from '../components';
import { chooseCoach } from '../components/fighter';
import { useSettings } from '../../store/settings';
import { LATEST_RELEASE_VERSION } from '../../domain/releaseNotice';

export const GOALS = SPORT_GOALS;

const EXPERIENCE: { id: Profile['experience']; label: string; sub: string }[] = [
  { id: 'aucune', label: 'Jamais pratiqué', sub: 'Je découvre' },
  { id: 'occasionnelle', label: 'Quelques cours', sub: 'Bases connues' },
  { id: 'reguliere', label: 'Pratique régulière', sub: 'En club ou seul' },
  { id: 'competition', label: 'Compétition', sub: 'Combats officiels' },
];

const STEPS = ['Coach', 'Garde', 'Discipline', 'Niveau'];

/** First launch, 4 short steps (2.11.1): coach, guard, discipline, level; goals and body data are asked later in Compte. Answers stay on this device. */
export function Onboarding() {
  const stored = useProfile((s) => s.profile);
  const update = useProfile((s) => s.update);
  const fighter = useFighters((s) => s.fighters.find((f) => f.id === s.activeId) ?? null);
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ ...stored });
  const accountsOn = useAccount((s) => s.capabilities.email && s.status === 'guest');
  const set = (x: Partial<Profile>) => setP((o) => ({ ...o, ...x }));
  const coach = fighter?.look.sex ?? p.coach;
  const canNext = step !== 0 || !!coach;

  const pickCoach = (c: ChampionCoach) => {
    chooseCoach(c.coach, true);
    set({ coach: c.coach, champion: c.id });
  };
  // 0.24: the coach is Kadir or Amara, whose look is fixed; 1.37: the « Apparence » step (custom fighter, kept
  // for the fallback render « Précédente ») is removed with that render
  const shown = STEPS;
  const shownIdx = step;
  const next = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  const finish = () => {
    update({ ...p, coach: coach ?? p.coach, completed: true });
    // 2.10.8 (conseil 4): the very first launch has nothing « new » to discover; the dot on Compte starts with the next version
    const st = useSettings.getState();
    if (st.settings.newsSeenVersion == null) st.set({ newsSeenVersion: LATEST_RELEASE_VERSION });
    nav('/', { replace: true });
  };

  return (
    <div className="page no-nav ob">
      <header className="page-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <div className="row between nowrap">
          <div className="brand">
            Combat <b>Shadow</b> Studio
          </div>
          <span className="small muted num-figure" aria-hidden>
            {shownIdx + 1}/{shown.length}
          </span>
        </div>
        <div className="ob-progress" role="progressbar" aria-label={`Étape ${shownIdx + 1} sur ${shown.length} : ${STEPS[step]}`} aria-valuemin={1} aria-valuemax={shown.length} aria-valuenow={shownIdx + 1}>
          {shown.map((_, i) => (
            <i key={i} className={i <= shownIdx ? 'done' : ''} />
          ))}
        </div>
        <div className="eyebrow">{STEPS[step]}</div>
      </header>

      <div className="ob-body" key={step}>
        {step === 0 && (
          <>
            <h2>Choisis ton coach</h2>
            <p className="muted">Il t’accompagne à chaque séance. Tu pourras en changer à tout moment, sans perdre tes statistiques.</p>
            <CoachPicker value={coach ? championFor(coach, p.champion).id : null} onChange={pickCoach} />
            {/* 2.11.1 (2A): the welcome page is gone; the two things it carried that still matter stay here */}
            <p className="small muted">
              Tes réponses restent sur cet appareil. <Link to="/confidentialite">Confidentialité</Link>
              {accountsOn && (
                <>
                  {' · '}
                  <Link to="/connexion">J’ai déjà un compte</Link>
                </>
              )}
            </p>
          </>
        )}


        {step === 1 && (
          <>
            <h2>Ta garde</h2>
            <div className="choice-grid" role="radiogroup" aria-label="Garde">
              <button type="button" role="radio" aria-checked={p.guard === 'orthodoxe'} className="choice" onClick={() => set({ guard: 'orthodoxe' })} data-testid="guard-orthodoxe">
                Orthodoxe
                <span className="sub">Pied gauche devant (droitier)</span>
              </button>
              <button type="button" role="radio" aria-checked={p.guard === 'gaucher'} className="choice" onClick={() => set({ guard: 'gaucher' })} data-testid="guard-gaucher">
                Gaucher
                <span className="sub">Pied droit devant</span>
              </button>
            </div>
            <p className="small muted">Ton combattant adopte la même garde que toi pour que tu puisses copier ses mouvements comme dans un miroir.</p>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Ta discipline principale</h2>
            <p className="small muted">Toutes les disciplines restent accessibles ; celle-ci sert à te proposer des exercices.</p>
            <div className="disc-grid two" role="group" aria-label="Discipline principale">
              {DISCIPLINES.map((d) => (
                <DisciplineCard key={d.id} id={d.id} selected={p.mainDiscipline === d.id} onClick={() => set({ mainDiscipline: d.id })} testId={`main-${d.id}`} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Ton niveau</h2>
            <div className="choice-grid" role="radiogroup" aria-label="Expérience des sports de combat">
              {EXPERIENCE.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={p.experience === x.id} className="choice" onClick={() => set({ experience: x.id })}>
                  {x.label}
                  <span className="sub">{x.sub}</span>
                </button>
              ))}
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Niveau en {DISCIPLINES.find((d) => d.id === p.mainDiscipline)!.name.toLowerCase()}</span>
              <LevelSelector value={p.levels[p.mainDiscipline]} onChange={(l) => set({ levels: { ...p.levels, [p.mainDiscipline]: l } })} />
              <p className="small muted">{LEVELS.find((l) => l.id === p.levels[p.mainDiscipline])!.goal}</p>
            </div>
            <details className="card">
              <summary style={{ cursor: 'pointer', minHeight: 32, fontWeight: 600 }}>Autres disciplines</summary>
              <div className="stack" style={{ marginTop: 12 }}>
                {DISCIPLINES.filter((d) => d.id !== p.mainDiscipline).map((d) => (
                  <div key={d.id} className="field">
                    <label htmlFor={`lvl-${d.id}`}>{d.name}</label>
                    <select id={`lvl-${d.id}`} className="input" value={p.levels[d.id]} onChange={(e) => set({ levels: { ...p.levels, [d.id as DisciplineId]: e.target.value as LevelId } })}>
                      {LEVELS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}

      </div>

      <div className="ob-foot">
        {step > 0 && (
          <button type="button" className="btn secondary" onClick={() => setStep(step - 1)}>
            Retour
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn primary" style={{ flex: 1 }} disabled={!canNext} onClick={next} data-testid="next">
            {step === 0 && !coach ? 'Choisis un coach' : 'Continuer'}
          </button>
        ) : (
          <button type="button" className="btn primary" style={{ flex: 1 }} onClick={finish} data-testid="finish">
            Commencer
          </button>
        )}
      </div>
    </div>
  );
}
