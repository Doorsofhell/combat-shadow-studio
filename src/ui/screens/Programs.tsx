import { useNavActions } from '../nav/store';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PROGRAM_BY_ID, programProgress, programQuery, programSeconds, programSessions } from '../../domain/programs';
import { EQUIPMENT_LABEL, OBJECTIVE_LABEL, programEquipment, programLevel, programObjective } from '../../domain/programMeta';
import { programSource } from '../../domain/programSources';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { DISCIPLINES, LEVELS, ProgramBlock } from '../../domain/types';
import { EmptyState, PageHead } from '../components';
import { AppIcon, LevelIcon } from '../icons';
import { useResume } from '../../store/resume';
import { Programmes } from './Train';
import { PremiumMarker } from '../premium/PremiumMarker';
import './train.css';

const PHASE_LABEL: Record<ProgramBlock['phase'], string> = {
  echauffement: 'Échauffement',
  technique: 'Technique',
  combinaisons: 'Combinaisons',
  cardio: 'Cardio',
  recuperation: 'Récupération',
};

const discName = (d: string) => (d === 'mixte' ? 'Multi-disciplines' : DISCIPLINES.find((x) => x.id === d)!.name);
const dur = (s: number) => (s >= 60 ? `${s % 60 ? (s / 60).toFixed(1).replace('.', ',') : s / 60} min` : `${s} s`);

/** v0.41: the catalogue, with the same filters (in the bar) as the Programmes space of Entraîner */
export function Programs() {
  return (
    <div className="page">
      <PageHead title="Programmes" eyebrow="Séances guidées" fallback="/entrainer" badge={<PremiumMarker feature="all_programs" />} />
      <Programmes thumbs />
      <Link to="/createur/nouveau" className="btn secondary block">
        <AppIcon id="add" size={18} /> Créer mon propre enchaînement
      </Link>
    </div>
  );
}

function Blocks({ blocks }: { blocks: readonly ProgramBlock[] }) {
  return (
    <div className="panel">
      {blocks.map((b, i) => {
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
                {b.rounds} × {dur(b.work)}
                {b.rounds > 1 && b.rest ? ` · repos ${b.rest} s` : ''}
                {e ? ` · ${e.name}` : ''}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * v0.41 (Youssef, « Enrichissement des programmes » §5): the full sheet of a programme. Every figure is computed from
 * the blocks (durations, rounds) or read from the user's finished sessions (progress); nothing is estimated.
 */
export function ProgramPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const p = id ? PROGRAM_BY_ID.get(id) : undefined;
  const runs = useResume((s) => s.programs);
  const pr = p ? programProgress(p, runs[p.id]?.count ?? 0) : null;
  const start = () => p && pr && nav(`/entrainement?${programQuery(p, pr.next)}`);
  // v0.32 bar: « Démarrer » starts the programme (its next session), as the button of the page
  useNavActions({ start: p && { run: start, ariaLabel: `Démarrer : ${p.name}` } });
  if (!p || !pr) return <EmptyState title="Programme introuvable" action={<Link to="/programmes" className="btn">Voir les programmes</Link>} />;
  const sessions = programSessions(p);
  const total = Math.round(programSeconds(p, pr.next) / 60);
  const lvl = programLevel(p);
  const levelName = LEVELS.find((l) => l.id === lvl)?.name ?? lvl;
  const exercises = [...new Set(sessions.flatMap((s) => s.blocks.map((b) => b.exercise)))].map((x) => EXERCISE_BY_ID.get(x)).filter((e) => !!e);
  const warm = sessions[0].blocks.filter((b) => b.phase === 'echauffement');
  const cool = sessions[0].blocks.filter((b) => b.phase === 'recuperation');
  return (
    <div className="page prog-page">
      <PageHead title={p.name} eyebrow={`${discName(p.discipline)} · ${levelName}`} fallback="/programmes" />
      {p.description && <p data-testid="prog-description">{p.description}</p>}
      <div className="stat-tiles">
        <div className="stat-tile">
          <div className="v">
            {p.durationMin}
            <small>min</small>
          </div>
          <div className="k">{sessions.length > 1 ? 'Moyenne par séance' : 'Par séance'}</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.perWeek ?? '–'}</div>
          <div className="k">Séances / semaine</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.weeks ?? '–'}</div>
          <div className="k">Semaines</div>
        </div>
      </div>

      <div className="card stack" data-testid="prog-progress">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>Ma progression</b>
          <span className="small muted">
            {pr.total !== null ? `${pr.done} séance${pr.done > 1 ? 's' : ''} faite${pr.done > 1 ? 's' : ''} sur ${pr.total}` : pr.done ? `Fait ${pr.done} fois` : 'Pas encore commencé'}
          </span>
        </div>
        {pr.total !== null && (
          <span className="track" aria-hidden>
            <span style={{ width: `${Math.round((pr.done / pr.total) * 100)}%` }} />
          </span>
        )}
        <span className="small muted" data-testid="prog-next">
          {pr.finished ? 'Programme terminé : tu peux le refaire ou passer au niveau suivant.' : pr.remaining !== null ? `Il reste ${pr.remaining} séance${pr.remaining > 1 ? 's' : ''}. Prochaine : semaine ${pr.week}.` : 'Refais-le autant que tu veux.'}
        </span>
      </div>

      <button type="button" className="btn primary block lg" onClick={start} data-testid="start-program">
        <AppIcon id="play" /> {pr.done && !pr.finished ? `Continuer · semaine ${pr.week}` : 'Lancer le programme'}
      </button>

      <section className="card stack" aria-labelledby="pg-about">
        <h2 id="pg-about">
          Présentation
        </h2>
        <div>
          <span className="label">Niveau : </span>
          <LevelIcon level={lvl} size={12} /> {levelName}
        </div>
        <div>
          <span className="label">Objectif principal : </span>
          {OBJECTIVE_LABEL[programObjective(p)]}
        </div>
        <div>
          <span className="label">Objectifs : </span>
          {p.goals.join(' · ')}
        </div>
        <div>
          <span className="label">Fréquence : </span>
          {p.frequency}
        </div>
        <div>
          <span className="label">Durée de la prochaine séance : </span>
          {total} min (blocs, repos et transitions compris)
        </div>
        {p.prerequisites?.length ? (
          <div>
            <span className="label">Prérequis : </span>
            {p.prerequisites.join(' · ')}
          </div>
        ) : null}
        <div>
          <span className="label">Matériel : </span>
          {p.equipment?.length ? p.equipment.join(' · ') : EQUIPMENT_LABEL[programEquipment(p)]}
        </div>
        <div>
          <span className="label">Progression : </span>
          {p.progression}
        </div>
      </section>

      {(warm.length > 0 || cool.length > 0) && (
        <section className="card stack" aria-labelledby="pg-warm">
          <h2 id="pg-warm">
            Échauffement et retour au calme
          </h2>
          {warm.map((b, i) => (
            <div key={`w${i}`} className="small">
              <b>Échauffement : </b>
              {b.label} · {b.rounds} × {dur(b.work)}
            </div>
          ))}
          {cool.map((b, i) => (
            <div key={`c${i}`} className="small">
              <b>Retour au calme : </b>
              {b.label} · {b.rounds} × {dur(b.work)}
            </div>
          ))}
        </section>
      )}

      <section className="stack" aria-labelledby="pg-plan" data-testid="prog-plan">
        <h2 id="pg-plan">
          {sessions.length > 1 ? 'Planning semaine par semaine' : 'Déroulé de la séance'}
        </h2>
        {sessions.map((s, i) => (
          <details key={i} className="card prog-week" open={i === pr.next} data-testid={`prog-week-${s.week}`}>
            <summary>
              <b>{sessions.length > 1 ? `Semaine ${s.week}` : 'Séance'}</b>
              <span className="small muted"> · {Math.round(programSessionMinutes(p, i))} min</span>
              {i === pr.next && !pr.finished && <span className="badge"> Prochaine</span>}
              {s.focus && <span className="small muted block">{s.focus}</span>}
            </summary>
            <Blocks blocks={s.blocks} />
          </details>
        ))}
      </section>

      <section className="card stack" aria-labelledby="pg-ex">
        <h2 id="pg-ex">
          Exercices utilisés ({exercises.length})
        </h2>
        <ul className="small prog-ex">
          {exercises.map((e) => (
            <li key={e.id}>{e.name}</li>
          ))}
        </ul>
      </section>

      {p.safety?.length ? (
        <section className="card stack" aria-labelledby="pg-safe">
          <h2 id="pg-safe">
            Sécurité
          </h2>
          <ul className="small">
            {p.safety.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card stack" aria-labelledby="pg-src" data-testid="prog-sources">
        <h2 id="pg-src">
          Origine et sources
        </h2>
        <p className="small" data-testid="prog-origin">
          {p.origin === 'adapte'
            ? 'Programme adapté d’un document cité ci-dessous.'
            : 'Programme original de Combat Shadow Studio : il n’est pas un programme officiel d’une fédération. Il suit les principes des documents cités.'}
        </p>
        {p.sources?.length ? (
          <ul className="small">
            {p.sources.map((r) => {
              const s = programSource(r.id);
              return (
                <li key={r.id}>
                  {s ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.by} – {s.title}
                    </a>
                  ) : (
                    r.id
                  )}
                  {' : '}
                  {r.usage}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="small muted">Pas de source écrite citée pour ce programme : il assemble les exercices de l’application.</p>
        )}
      </section>
    </div>
  );
}

const programSessionMinutes = (p: Parameters<typeof programSeconds>[0], i: number) => programSeconds(p, i) / 60;
