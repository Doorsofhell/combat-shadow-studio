import { useNavActions } from '../nav/store';
import { TechThumb, programTechnique } from '../components/TechThumb';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PROGRAMS, PROGRAM_BY_ID, programSeconds } from '../../domain/programs';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { DISCIPLINES, ProgramBlock } from '../../domain/types';
import { DisciplineLabel, EmptyState, PageHead } from '../components';
import { AppIcon } from '../icons';

const PHASE_LABEL: Record<ProgramBlock['phase'], string> = {
  echauffement: 'Échauffement',
  technique: 'Technique',
  combinaisons: 'Combinaisons',
  cardio: 'Cardio',
  recuperation: 'Récupération',
};

const discName = (d: string) => (d === 'mixte' ? 'Multi-disciplines' : DISCIPLINES.find((x) => x.id === d)!.name);

export function Programs() {
  return (
    <div className="page">
      <PageHead title="Programmes" eyebrow="Séances guidées" fallback="/entrainer" />
      <p className="muted">Des séances complètes, de l’échauffement au retour au calme. Durées et fréquences indicatives : adapte-les à ta condition physique.</p>
      <div className="stack" style={{ gap: 8 }}>
        {PROGRAMS.map((p) => (
          <Link key={p.id} to={`/programmes/${p.id}`} className="card link ex-card">
            <TechThumb id={programTechnique(p)} />
            <span className="body">
              <span className="eyebrow">
                {p.discipline === 'mixte' ? discName(p.discipline) : <DisciplineLabel id={p.discipline} name={discName(p.discipline)} />} · {p.durationMin} min
              </span>
              <span className="title">
                {p.name}
              </span>
              <span className="small muted">{p.frequency}</span>
            </span>
            <AppIcon id="chevron" />
          </Link>
        ))}
      </div>
      <Link to="/createur/nouveau" className="btn secondary block">
        <AppIcon id="add" size={18} /> Créer mon propre enchaînement
      </Link>
    </div>
  );
}

export function ProgramPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const p = id ? PROGRAM_BY_ID.get(id) : undefined;
  // v0.32 bar: « Démarrer » starts the programme, as the button of the page
  useNavActions({ start: p && { run: () => nav(`/entrainement?prog=${p.id}`), ariaLabel: `Démarrer : ${p.name}` } });
  if (!p) return <EmptyState title="Programme introuvable" action={<Link to="/programmes" className="btn">Voir les programmes</Link>} />;
  const total = Math.round(programSeconds(p) / 60);
  return (
    <div className="page">
      <PageHead title={p.name} eyebrow={`${discName(p.discipline)} · environ ${total} min de travail`} fallback="/programmes" />
      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="v">
            {total}
            <small>min</small>
          </div>
          <div className="k">Travail effectif</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.blocks.length}</div>
          <div className="k">Blocs</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.blocks.reduce((a, b) => a + b.rounds, 0)}</div>
          <div className="k">Rounds</div>
        </div>
      </div>
      <div className="card stack">
        <div>
          <span className="label">Fréquence : </span>
          {p.frequency}
        </div>
        <div>
          <span className="label">Objectifs : </span>
          {p.goals.join(' · ')}
        </div>
        <div>
          <span className="label">Progression : </span>
          {p.progression}
        </div>
      </div>
      <div className="panel">
        {p.blocks.map((b, i) => {
          const e = EXERCISE_BY_ID.get(b.exercise);
          return (
            <div key={i} className="list-row">
              <span className="badge" style={{ width: 108, justifyContent: 'center', flex: 'none' }}>
                {PHASE_LABEL[b.phase]}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontWeight: 600 }}>{b.label}</b>
                <br />
                <span className="small muted">
                  {b.rounds} × {b.work >= 60 ? `${b.work / 60} min` : `${b.work} s`}
                  {b.rounds > 1 && b.rest ? ` · repos ${b.rest} s` : ''}
                  {e ? ` · ${e.sequence.length} mouvements` : ''}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn primary block lg" onClick={() => nav(`/entrainement?prog=${p.id}`)} data-testid="start-program">
        <AppIcon id="play" /> Lancer le programme
      </button>
    </div>
  );
}
