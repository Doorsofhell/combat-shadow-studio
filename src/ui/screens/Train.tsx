import { TechThumb, keyTechnique, programTechnique } from '../components/TechThumb';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useCustom } from '../../store/custom';
import { DISCIPLINES, DisciplineId } from '../../domain/types';
import { EXERCISE_BY_ID } from '../../domain/exercises';
import { PROGRAMS } from '../../domain/programs';
import { recommend } from '../../domain/recommend';
import { DisciplineLabel, DisciplineCard, EmptyState, FilterChips, PageHead, SectionHead } from '../components';
import { ExerciseSheet } from './Discipline';
import { IconChevron, IconPlus } from '../icons';

type ProgFilter = DisciplineId | 'mixte' | 'tous';

/** "Entraîner" tab: fast start, the four disciplines, programmes and the user's own combinations. */
export function Train() {
  const profile = useProfile((s) => s.profile);
  const combos = useCustom((s) => s.combos);
  const rec = useMemo(() => recommend(profile), [profile]);
  const [open, setOpen] = useState<string | null>(null);
  const [pf, setPf] = useState<ProgFilter>('tous');
  const progs = pf === 'tous' ? PROGRAMS : PROGRAMS.filter((p) => p.discipline === pf);
  const quick = rec.exercises.slice(0, 2);
  const openEx = open ? EXERCISE_BY_ID.get(open) : undefined;

  return (
    <div className="page">
      <PageHead title="Entraîner" eyebrow="Choisis ta séance" back={false} />

      {quick.length > 0 && (
        <section className="section" aria-labelledby="h-quick">
          <SectionHead id="h-quick" title="Démarrage rapide" />
          <div className="stack" style={{ gap: 8 }}>
            {quick.map((e, i) => (
              <button key={e.id} type="button" className="card link ex-card" onClick={() => setOpen(e.id)} data-testid={`quick-${e.id}`}>
                <TechThumb id={keyTechnique(e.sequence)} />
                <span className="body">
                  <span className="eyebrow">{i === 0 ? 'Recommandé' : DISCIPLINES.find((d) => d.id === e.discipline)!.short}</span>
                  <span className="title">{e.name}</span>
                </span>
                <IconChevron />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="h-disc">
        <SectionHead id="h-disc" title="Disciplines" />
        <div className="disc-grid">
          {DISCIPLINES.map((d) => (
            <DisciplineCard key={d.id} id={d.id} level={profile.levels[d.id]} to={`/discipline/${d.id}`} testId={`disc-${d.id}`} tall />
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="h-prog">
        <SectionHead id="h-prog" title="Programmes" action={<Link to="/programmes">Tout voir</Link>} />
        <FilterChips
          scroll
          label="Filtrer les programmes"
          value={pf}
          onChange={setPf}
          options={[{ id: 'tous' as ProgFilter, label: 'Tous' }, ...DISCIPLINES.map((d) => ({ id: d.id as ProgFilter, label: d.short })), { id: 'mixte' as ProgFilter, label: 'Multi' }]}
        />
        {progs.length === 0 ? (
          <EmptyState title="Aucun programme pour ce filtre" />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {progs.map((p) => (
              <Link key={p.id} to={`/programmes/${p.id}`} className="card link ex-card">
                <TechThumb id={programTechnique(p)} />
                <span className="body">
                  <span className="eyebrow">{p.durationMin} min</span>
                  <span className="title">{p.name}</span>
                  <span className="small muted">{p.frequency}</span>
                </span>
                <IconChevron />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="h-perso">
        <SectionHead id="h-perso" title="Mes enchaînements" action={<Link to="/createur">Créateur</Link>} />
        {combos.length === 0 ? (
          <EmptyState
            title="Aucun enchaînement personnel"
            text="Compose ta propre combinaison, le coach l’exécute."
            action={
              <Link to="/createur" className="btn secondary">
                <IconPlus width={18} /> Créer un enchaînement
              </Link>
            }
          />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {combos.map((c) => (
              <Link key={c.id} to={`/entrainement?perso=${c.id}&mode=libre`} className="card link ex-card" aria-label={`Lancer ${c.name}`}>
                <TechThumb id={keyTechnique(c.sequence)} />
                <span className="body">
                  <span className="title">{c.name}</span>
                  <span className="small muted">
                    <DisciplineLabel id={c.discipline} name={DISCIPLINES.find((x) => x.id === c.discipline)?.name ?? ''} /> · {c.sequence.length} mouvements
                  </span>
                </span>
                <IconChevron />
              </Link>
            ))}
          </div>
        )}
      </section>

      {openEx && <ExerciseSheet ex={openEx} onClose={() => setOpen(null)} />}
    </div>
  );
}
