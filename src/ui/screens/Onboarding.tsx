import { useSettings } from '../../store/settings';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Profile, SPORT_GOALS, useProfile } from '../../store/profile';
import { useAccount } from '../../account/session';
import { useFighters } from '../../store/fighters';
import { DISCIPLINES, DisciplineId, LEVELS, LevelId } from '../../domain/types';
import type { HairStyle } from '../../editor/look';
import { recommend } from '../../domain/recommend';
import { CoachPicker } from './CoachSelect';
import { DisciplineLabel, DisciplineCard, LevelSelector, OptionGrid } from '../components';
import { chooseCoach } from '../components/fighter';
import { AppIcon } from '../icons';

export const GOALS = SPORT_GOALS;

const EXPERIENCE: { id: Profile['experience']; label: string; sub: string }[] = [
  { id: 'aucune', label: 'Jamais pratiqué', sub: 'Je découvre' },
  { id: 'occasionnelle', label: 'Quelques cours', sub: 'Bases connues' },
  { id: 'reguliere', label: 'Pratique régulière', sub: 'En club ou seul' },
  { id: 'competition', label: 'Compétition', sub: 'Combats officiels' },
];

const SKINS = [
  { id: '#f1c8a8', label: 'Très claire' },
  { id: '#d8a07c', label: 'Claire' },
  { id: '#b97a56', label: 'Mate' },
  { id: '#8d5a3b', label: 'Brune' },
  { id: '#5e3a24', label: 'Foncée' },
  { id: '#3b2416', label: 'Très foncée' },
];

const HAIR_COLORS = [
  { id: '#1c1512', label: 'Noir' },
  { id: '#4a2f1e', label: 'Brun' },
  { id: '#8a5a32', label: 'Châtain' },
  { id: '#c9a063', label: 'Blond' },
  { id: '#9b3b22', label: 'Roux' },
  { id: '#b9b6b0', label: 'Gris' },
];

const HAIR_STYLES: Record<'homme' | 'femme', { id: HairStyle; label: string }[]> = {
  homme: [
    { id: 'rase', label: 'Rasé' },
    { id: 'court', label: 'Court' },
    { id: 'degrade', label: 'Dégradé' },
    { id: 'crete', label: 'Crête' },
    { id: 'afro', label: 'Afro' },
    { id: 'tresses', label: 'Tresses' },
  ],
  femme: [
    { id: 'chignon', label: 'Chignon' },
    { id: 'queue', label: 'Queue' },
    { id: 'tresses', label: 'Tresses' },
    { id: 'afro', label: 'Afro' },
    { id: 'court', label: 'Court' },
  ],
};

const STEPS = ['Bienvenue', 'Coach', 'Apparence', 'Garde', 'Discipline', 'Niveau', 'Objectifs', 'C’est parti'];

function num(v: string) {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || !Number.isFinite(n) ? undefined : n;
}

/** First launch, 7 short steps (8 with the fallback render). Answers stay on this device. */
export function Onboarding() {
  const stored = useProfile((s) => s.profile);
  const update = useProfile((s) => s.update);
  const fighter = useFighters((s) => s.fighters.find((f) => f.id === s.activeId) ?? null);
  const nav = useNavigate();
  const premium = useSettings((s) => s.settings.coachRender === 'premium');
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({ ...stored });
  const [name, setName] = useState('');
  const accountsOn = useAccount((s) => s.capabilities.email && s.status === 'guest');
  const set = (x: Partial<Profile>) => setP((o) => ({ ...o, ...x }));
  const coach = fighter?.look.sex ?? p.coach;
  const canNext = step !== 1 || !!coach;

  const pickCoach = (c: 'homme' | 'femme') => {
    chooseCoach(c, true);
    set({ coach: c });
  };
  const editLook = (fn: (l: NonNullable<typeof fighter>['look']) => NonNullable<typeof fighter>['look']) => {
    if (fighter) useFighters.getState().update(fighter.id, fn(fighter.look));
  };
  // 0.24: the coach is Kadir or Amara, whose look is fixed: the "Apparence" step (custom fighter) is
  // skipped (it stays reachable only with the fallback render)
  const skipLook = premium;
  const shown = skipLook ? STEPS.filter((x) => x !== 'Apparence') : STEPS;
  const shownIdx = skipLook && step > 2 ? step - 1 : step;
  const next = () => {
    if (step === 2 && fighter && name.trim()) useFighters.getState().rename(fighter.id, name);
    setStep(skipLook && step === 1 ? 3 : step + 1);
    window.scrollTo(0, 0);
  };
  const finish = () => {
    update({ ...p, coach: coach ?? p.coach, completed: true });
    nav('/', { replace: true });
  };
  const rec = step === 7 ? recommend(p) : null;

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
            <h1 className="ob-hero">
              Entraîne-toi seul,
              <br />
              <em>guidé par un coach 3D</em>
            </h1>
            <p className="muted">Boxe anglaise, kick-boxing, MMA et muay-thaï, du niveau débutant à expert. Ton coach montre chaque mouvement, tu le suis comme dans un miroir de salle.</p>
            <ul className="feature-list">
              <li>
                <span className="icon-tile red" aria-hidden>
                  <AppIcon id="train" />
                </span>
                <span>Plus de 60 techniques animées et des centaines d’exercices</span>
              </li>
              <li>
                <span className="icon-tile" aria-hidden>
                  <AppIcon id="progress" />
                </span>
                <span>Programmes, rounds chronométrés et suivi de ta progression</span>
              </li>
              <li>
                <span className="icon-tile" aria-hidden>
                  <AppIcon id="privacy" />
                </span>
                <span>
                  Tes réponses restent sur cet appareil. <Link to="/confidentialite">Confidentialité</Link>
                </span>
              </li>
            </ul>
            <div className="field">
              <label htmlFor="pseudo">Comment le coach doit-il t’appeler ?</label>
              <input id="pseudo" className="input" value={p.pseudo} maxLength={24} onChange={(e) => set({ pseudo: e.target.value })} placeholder="Ton pseudo (facultatif)" autoComplete="nickname" data-testid="pseudo" />
            </div>
            {accountsOn && (
              <Link to="/connexion" className="small">
                J’ai déjà un compte
              </Link>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2>Choisis ton coach</h2>
            <p className="muted">Obligatoire pour continuer. Il deviendra ton combattant : tu pourras le personnaliser et en changer à tout moment, sans perdre tes statistiques.</p>
            <CoachPicker value={coach} onChange={pickCoach} />
          </>
        )}

        {step === 2 && fighter && (
          <>
            <h2>Ton combattant</h2>
            <p className="small muted">Une première personnalisation rapide. Tu pourras tout personnaliser plus tard dans l’onglet Coach.</p>
            <div className="field">
              <label htmlFor="fname">Nom</label>
              <input id="fname" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder={fighter.name} autoComplete="off" />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Teint</span>
              <OptionGrid min={84} label="Teint" value={fighter.look.skin} onChange={(v) => editLook((l) => ({ ...l, skin: v }))} options={SKINS.map((s) => ({ ...s, swatch: s.id }))} />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Coupe de cheveux</span>
              <OptionGrid min={84} label="Coupe de cheveux" value={fighter.look.hair.style} onChange={(v) => editLook((l) => ({ ...l, hair: { ...l.hair, style: v } }))} options={HAIR_STYLES[fighter.look.sex]} />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Couleur des cheveux</span>
              <OptionGrid
                min={84}
                label="Couleur des cheveux"
                value={fighter.look.hair.color}
                onChange={(v) => editLook((l) => ({ ...l, hair: { ...l.hair, color: v }, beard: { ...l.beard, color: v } }))}
                options={HAIR_COLORS.map((s) => ({ ...s, swatch: s.id }))}
              />
            </div>
          </>
        )}
        {step === 2 && !fighter && <p className="muted">Préparation de ton combattant…</p>}

        {step === 3 && (
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

        {step === 4 && (
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

        {step === 5 && (
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

        {step === 6 && (
          <>
            <h2>Tes objectifs</h2>
            <div className="choice-grid">
              {GOALS.map((g) => {
                const on = p.goals.includes(g.id);
                return (
                  <button key={g.id} type="button" aria-pressed={on} className="choice" onClick={() => set({ goals: on ? p.goals.filter((x) => x !== g.id) : [...p.goals, g.id] })}>
                    {g.label}
                  </button>
                );
              })}
            </div>
            <div className="field">
              <label htmlFor="jours" className="row between">
                <span>Séances par semaine</span>
                <b className="num-figure" style={{ fontSize: '1.2rem' }}>
                  {p.daysPerWeek}
                </b>
              </label>
              <input id="jours" type="range" min={1} max={7} value={p.daysPerWeek} onChange={(e) => set({ daysPerWeek: Number(e.target.value) })} />
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="label">Durée d’une séance</span>
              <div className="row" role="radiogroup" aria-label="Durée d’une séance" style={{ gap: 8 }}>
                {[10, 15, 20, 30, 45, 60].map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={p.sessionMinutes === m} className={`chip ${p.sessionMinutes === m ? 'on' : ''}`} onClick={() => set({ sessionMinutes: m })}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            <details className="card">
              <summary style={{ cursor: 'pointer', minHeight: 32, fontWeight: 600 }}>Informations facultatives</summary>
              <div className="stack" style={{ marginTop: 12 }}>
                <div className="grid2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="field">
                    <label htmlFor="age">Âge</label>
                    <input id="age" className="input" inputMode="numeric" value={p.age ?? ''} onChange={(e) => set({ age: num(e.target.value) })} placeholder="ans" />
                  </div>
                  <div className="field">
                    <label htmlFor="taille">Taille</label>
                    <input id="taille" className="input" inputMode="numeric" value={p.heightCm ?? ''} onChange={(e) => set({ heightCm: num(e.target.value) })} placeholder="cm" />
                  </div>
                  <div className="field">
                    <label htmlFor="poids">Poids</label>
                    <input id="poids" className="input" inputMode="decimal" value={p.weightKg ?? ''} onChange={(e) => set({ weightKg: num(e.target.value) })} placeholder="kg" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="lim">Limitations physiques ou blessures</label>
                  <textarea id="lim" className="input" value={p.limitations} onChange={(e) => set({ limitations: e.target.value })} placeholder="Par exemple : genou droit fragile" />
                  <span className="small muted">Cette application ne remplace pas un avis médical.</span>
                </div>
              </div>
            </details>
          </>
        )}

        {step === 7 && rec && (
          <>
            <h1 className="ob-hero">
              Prêt,
              <br />
              <em>{fighter?.name ?? 'combattant'}</em>
            </h1>
            <div className="card stack">
              <div className="eyebrow">Point de départ</div>
              <h3>
                <DisciplineLabel id={rec.discipline} name={DISCIPLINES.find((d) => d.id === rec.discipline)?.name ?? ''} /> · {LEVELS.find((l) => l.id === rec.level)!.name}
              </h3>
              <ul className="plain-list small">
                {rec.exercises.map((e) => (
                  <li key={e.id}>{e.name}</li>
                ))}
              </ul>
              <p className="small muted">Vitesse conseillée : ×{rec.speed.toFixed(2)}</p>
            </div>
            {rec.programs.length > 0 && (
              <div className="card stack">
                <div className="eyebrow">Programmes adaptés</div>
                {rec.programs.map((x) => (
                  <div key={x.id}>
                    {x.name} <span className="muted small">· {x.durationMin} min</span>
                  </div>
                ))}
              </div>
            )}
            {rec.notes.map((n, i) => (
              <div key={i} className="note">
                {n}
              </div>
            ))}
            <p className="small muted row nowrap" style={{ gap: 8 }}>
              <AppIcon id="fighter" size={18} /> Tu pourras tout personnaliser plus tard dans l’onglet Coach.
            </p>
          </>
        )}
      </div>

      <div className="ob-foot">
        {step > 0 && (
          <button type="button" className="btn secondary" onClick={() => setStep(skipLook && step === 3 ? 1 : step - 1)}>
            Retour
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn primary" style={{ flex: 1 }} disabled={!canNext} onClick={next} data-testid="next">
            {step === 1 && !coach ? 'Choisis un coach' : step === 0 ? 'Commencer' : 'Continuer'}
          </button>
        ) : (
          <button type="button" className="btn primary" style={{ flex: 1 }} onClick={finish} data-testid="finish">
            Aller à l’accueil
          </button>
        )}
      </div>
    </div>
  );
}
