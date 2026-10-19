import { TechThumb, keyTechnique } from '../components/TechThumb';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DISCIPLINES, DisciplineId, Exercise, LEVELS, LevelId, TrainingMode } from '../../domain/types';
import { EXERCISE_BY_ID, exercisesFor } from '../../domain/exercises';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { formatDuration, useStats } from '../../store/stats';
import { useGoals } from '../../store/goals';
import { MODE_HELP, MODE_LABEL } from '../training/plan';
import { DisciplineArtwork, EmptyState, FilterChips, KickboxingStylePicker, LevelSelector, PageHead, Segmented, Sheet, useKbStyle } from '../components';
import { filterExercises } from '../../domain/kickboxingStyles';
import { AppIcon, DisciplineIcon } from '../icons';

export const KIND_LABEL: Record<Exercise['kind'], string> = {
  technique: 'Technique',
  combinaison: 'Combinaison',
  defense: 'Défense',
  deplacement: 'Déplacement',
  cardio: 'Cardio',
  round: 'Round',
};

type KindFilter = Exercise['kind'] | 'tout';

/** exercise list of one discipline and level */
export function ExerciseList({ list, onOpen }: { list: Exercise[]; onOpen: (id: string) => void }) {
  const perExercise = useStats((s) => s.perExercise);
  const fav = useGoals((s) => s.favExercises);
  if (!list.length) return <EmptyState title="Aucun exercice pour ce filtre" text="Essaie une autre catégorie ou un autre niveau." />;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {list.map((e, i) => (
        <button key={e.id} type="button" className="card link ex-card" onClick={() => onOpen(e.id)} data-testid={`ex-${e.id}`}>
          <TechThumb id={keyTechnique(e.sequence)}>
            <span className="num">{i + 1}</span>
          </TechThumb>
          <span className="body">
            <span className="title">
              {e.name}
              {fav.includes(e.id) && <AppIcon id="favorite" size={14} tone="accent" label="Favori" style={{ marginLeft: 6, verticalAlign: -1 }} />}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <span className="badge">{KIND_LABEL[e.kind]}</span>
              <span className="small muted">
                {e.sequence.length} mouvement{e.sequence.length > 1 ? 's' : ''}
              </span>
              {perExercise[e.id] ? <span className="small muted">· {formatDuration(perExercise[e.id])} pratiquées</span> : null}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function DisciplinePage() {
  const { id } = useParams();
  const [q, setQ] = useSearchParams();
  const profile = useProfile((s) => s.profile);
  const [kind, setKind] = useState<KindFilter>('tout');
  const [kbStyle] = useKbStyle();
  const disc = DISCIPLINES.find((d) => d.id === id);
  if (!disc) return <EmptyState title="Discipline introuvable" action={<Link to="/entrainer" className="btn">Retour</Link>} />;
  const level = (q.get('niveau') as LevelId) ?? profile.levels[disc.id];
  const lvl = LEVELS.find((l) => l.id === level) ?? LEVELS[0];
  const all = filterExercises(exercisesFor(disc.id, lvl.id), kbStyle);
  const kinds = [...new Set(all.map((e) => e.kind))];
  const list = kind === 'tout' ? all : all.filter((e) => e.kind === kind);
  const open = q.get('ex') ? EXERCISE_BY_ID.get(q.get('ex')!) : undefined;
  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(q);
    if (v === null) n.delete(k);
    else n.set(k, v);
    setQ(n, { replace: true });
  };

  return (
    <div className="page">
      <PageHead title={disc.name} eyebrow="Discipline" fallback="/entrainer" />
      <div className="disc-card dark-scope banner" style={{ pointerEvents: 'none' }} aria-hidden>
        <DisciplineArtwork id={disc.id} format="cover" eager />
        <DisciplineIcon id={disc.id} size={56} />
        <span className="bar" />
        <span className="name" style={{ fontSize: '1.1rem' }}>
          {all.length} exercices
        </span>
        <span className="sub" style={{ fontSize: '0.88rem' }}>
          {disc.tagline}
        </span>
      </div>
      <section className="stack" aria-label="Niveau">
        <LevelSelector value={lvl.id} onChange={(l) => (setParam('niveau', l), setKind('tout'))} />
        <p className="small muted">{lvl.goal}</p>
      </section>
      {disc.id === 'kickboxing' && <KickboxingStylePicker />}
      <FilterChips
        scroll
        label="Type d’exercice"
        value={kind}
        onChange={setKind}
        options={[{ id: 'tout' as KindFilter, label: `Tout (${all.length})` }, ...kinds.map((k) => ({ id: k as KindFilter, label: KIND_LABEL[k] }))]}
      />
      <ExerciseList list={list} onOpen={(x) => setParam('ex', x)} />
      <div className="grid2">
        <Link className="btn secondary" to={`/createur?d=${disc.id}`}>
          <AppIcon id="add" size={18} /> Créer
        </Link>
        <Link className="btn secondary" to={`/techniques?d=${disc.id}`}>
          Techniques
        </Link>
      </div>
      {open && <ExerciseSheet ex={open} onClose={() => setParam('ex', null)} />}
    </div>
  );
}

const MODES: TrainingMode[] = ['libre', 'technique', 'cardio', 'rounds'];

export function ExerciseSheet({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const nav = useNavigate();
  const settings = useSettings((s) => s.settings);
  const fav = useGoals((s) => s.favExercises.includes(ex.id));
  const toggleFav = useGoals((s) => s.toggleExercise);
  const [mode, setMode] = useState<TrainingMode>('libre');
  const [round, setRound] = useState(settings.defaultRoundSec);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [rounds, setRounds] = useState(3);
  const go = () => {
    const p = new URLSearchParams({ ex: ex.id, mode });
    if (mode === 'rounds') {
      p.set('round', String(round));
      p.set('rest', String(rest));
      p.set('rounds', String(rounds));
    }
    nav(`/entrainement?${p}`);
  };
  return (
    <Sheet
      title={ex.name}
      eyebrow={`${DISCIPLINES.find((d) => d.id === ex.discipline)!.name} · ${LEVELS.find((l) => l.id === ex.level)!.name}`}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block lg" onClick={go} data-testid="go-training">
          <AppIcon id="play" /> S’entraîner
        </button>
      }
    >
      <p className="muted">{ex.description}</p>
      <div className="seq" aria-label="Mouvements">
        {ex.sequence.map((id, i) => (
          <Link key={i} to={`/techniques/${id}?d=${ex.discipline}`} className="badge" style={{ textDecoration: 'none', minHeight: 32 }}>
            {i + 1}. {TECHNIQUE_BY_ID.get(id)?.name}
          </Link>
        ))}
      </div>
      {ex.instructions.length > 0 && (
        <ul className="plain-list small">
          {ex.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      {ex.soloNote && <div className="note">{ex.soloNote}</div>}
      <button type="button" className="btn ghost" style={{ alignSelf: 'flex-start', marginLeft: -12 }} aria-pressed={fav} onClick={() => toggleFav(ex.id)}>
        {fav ? <AppIcon id="favorite" tone="accent" /> : <AppIcon id="favoriteOutline" />}
        {fav ? 'Dans tes favoris' : 'Ajouter aux favoris'}
      </button>
      <div className="stack">
        <span className="label" id="mode-label">
          Mode
        </span>
        <div className="row" role="radiogroup" aria-labelledby="mode-label" style={{ gap: 8 }}>
          {MODES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={`chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} data-testid={`mode-${m}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="small muted">{MODE_HELP[mode]}</p>
      </div>
      {mode === 'rounds' && <RoundOptions round={round} rest={rest} rounds={rounds} setRound={setRound} setRest={setRest} setRounds={setRounds} />}
    </Sheet>
  );
}

export function RoundOptions(p: {
  round: number;
  rest: number;
  rounds: number;
  setRound: (n: number) => void;
  setRest: (n: number) => void;
  setRounds: (n: number) => void;
}) {
  const presets = [60, 120, 180, 300];
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Durée d’un round</span>
        <div className="row" style={{ gap: 8 }}>
          <Segmented label="Durée d’un round" value={presets.includes(p.round) ? p.round : -1} onChange={(v) => v > 0 && p.setRound(v)} options={presets.map((s) => ({ id: s, label: `${s / 60} min` }))} />
          <label className="row nowrap small muted" style={{ gap: 6 }}>
            <input
              className="input"
              style={{ width: 92 }}
              type="number"
              min={10}
              max={1800}
              value={p.round}
              onChange={(e) => p.setRound(Math.max(10, Number(e.target.value) || 10))}
              aria-label="Durée personnalisée en secondes"
            />
            s
          </label>
        </div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">Repos entre les rounds</span>
        <Segmented label="Repos entre les rounds" value={p.rest} onChange={p.setRest} options={[15, 30, 45, 60, 90].map((s) => ({ id: s, label: `${s} s` }))} />
      </div>
      <div className="field">
        <label htmlFor="nb-rounds" className="row between">
          <span>Nombre de rounds</span>
          <b className="num-figure" style={{ fontSize: '1.2rem' }}>
            {p.rounds}
          </b>
        </label>
        <input id="nb-rounds" type="range" min={1} max={12} value={p.rounds} onChange={(e) => p.setRounds(Number(e.target.value))} />
      </div>
    </div>
  );
}

export type { DisciplineId };
