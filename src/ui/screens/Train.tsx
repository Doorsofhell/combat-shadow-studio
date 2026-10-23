import { useNavActions } from '../nav/store';
import { TechThumb, keyTechnique, programTechnique } from '../components/TechThumb';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../../store/profile';
import { useCustom } from '../../store/custom';
import { PictoStrip } from './creator/shared';
import './creator/creator.css';
import { useSettings } from '../../store/settings';
import { useStats, formatDuration } from '../../store/stats';
import { useResume } from '../../store/resume';
import { DISCIPLINES, DisciplineId, Exercise, LEVELS, LevelId, Program } from '../../domain/types';
import { EXERCISE_BY_ID, exercisesFor } from '../../domain/exercises';
import { PROGRAMS, PROGRAM_BY_ID, programProgress, programQuery } from '../../domain/programs';
import { NavPanel, usePanel } from '../nav/NavSheets';
import { recommend } from '../../domain/recommend';
import { ResumeCardState, ResumeSnapshot, pickCard, progressRatio } from '../../domain/resume';
import {
  DURATION_LABEL,
  DurationBucket,
  EQUIPMENT_LABEL,
  EquipmentNeed,
  NO_PROGRAM_FILTER,
  OBJECTIVE_LABEL,
  ProgramFilters,
  ProgramObjective,
  activeFilterCount,
  filterPrograms,
  programLevel,
  programObjective,
} from '../../domain/programMeta';
import { championFor } from '../../domain/coaches/catalog';
import { DisciplineLabel, EmptyState, FilterChips, PageHead, SectionHead } from '../components';
import { ExerciseSheet } from './Discipline';
import { AppIcon, DisciplineIcon, LevelIcon } from '../icons';
import { DisciplineEmblem } from '../emblems';
import { useHydrated } from '../../store/useHydrated';
import './train.css';

type Space = 'seances' | 'disciplines' | 'programmes';
const SPACES: { id: Space; label: string }[] = [
  { id: 'seances', label: 'Séances' },
  { id: 'disciplines', label: 'Disciplines' },
  { id: 'programmes', label: 'Programmes' },
];

const discName = (d: string) => (d === 'mixte' ? 'Multi-disciplines' : DISCIPLINES.find((x) => x.id === d)!.name);
const levelName = (l: LevelId) => LEVELS.find((x) => x.id === l)!.name;

/**
 * 0.33 (Youssef, 2026-10-22 « Refonte premium de l'écran Entraîner »): the training centre in three spaces under one
 * segmented control (Séances / Disciplines / Programmes). It is not a second navigation bar: the bottom bar stays
 * the only global navigation, and the last space opened is remembered.
 */
export function Train() {
  const [q, setQ] = useSearchParams();
  const saved = useSettings((s) => s.settings.trainSpace);
  const setSettings = useSettings((s) => s.set);
  const asked = q.get('espace') as Space | null;
  const space: Space = asked && SPACES.some((s) => s.id === asked) ? asked : saved;
  const choose = (s: Space) => {
    setSettings({ trainSpace: s });
    if (asked) setQ({}, { replace: true });
  };
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + SPACES.length) % SPACES.length;
    choose(SPACES[j].id);
    tabs.current[j]?.focus();
  };

  const profile = useProfile((s) => s.profile);
  const rec = useMemo(() => recommend(profile), [profile]);
  const [open, setOpen] = useState<string | null>(null);
  const openEx = open ? EXERCISE_BY_ID.get(open) : undefined;
  const quick = rec.exercises.slice(0, 2);
  // v0.32 bar: « Démarrer » opens the recommended session (first card of « Démarrage rapide »)
  useNavActions({ start: quick[0] && { run: () => setOpen(quick[0].id), ariaLabel: `Démarrer : ${quick[0].name}` } });

  return (
    <div className="page train-page">
      <PageHead title="Entraîner" eyebrow="Ton centre d’entraînement" back={false} />
      <div className="train-seg" role="tablist" aria-label="Espaces d’entraînement" data-active={space}>
        {SPACES.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={space === s.id}
            aria-controls={`panel-${s.id}`}
            tabIndex={space === s.id ? 0 : -1}
            className={space === s.id ? 'on' : ''}
            onClick={() => choose(s.id)}
            onKeyDown={(e) => onKey(e, i)}
            data-testid={`space-${s.id}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${space}`} aria-labelledby={`tab-${space}`} className="train-panel" key={space}>
        {space === 'seances' && <Sessions quick={quick} recommended={rec.exercises[0]} onOpen={setOpen} />}
        {space === 'disciplines' && <Disciplines />}
        {space === 'programmes' && <Programmes />}
      </div>

      {openEx && <ExerciseSheet ex={openEx} onClose={() => setOpen(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- Séances

function Sessions({ quick, recommended, onOpen }: { quick: Exercise[]; recommended?: Exercise; onOpen: (id: string) => void }) {
  const combos = useCustom((s) => s.combos);
  // 0.36 (Youssef, refonte Entraîner / Techniques): 1. the session that can be resumed, 2. the creator, 3. my
  // combinations, 4. quick start. The card of a first or new session (nothing to resume) opens the quick start.
  return (
    <>
      <ResumeCard recommended={recommended} onOpen={onOpen} only="resume" />

      <CreatorCard />

      <section className="section" aria-labelledby="h-perso" data-testid="my-combos">
        <SectionHead
          id="h-perso"
          title="Mes enchaînements"
          action={
            combos.length > 0 ? (
              <Link to="/createur" data-testid="manage-combos">
                Gérer
              </Link>
            ) : undefined
          }
        />
        {combos.length === 0 ? (
          // compact: the creator card just above already holds the one « Créer » button
          <p className="small muted perso-empty" data-testid="combos-empty">
            Aucun enchaînement enregistré pour l’instant. Tes créations apparaîtront ici, prêtes à lancer.
          </p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {combos.map((c) => (
              <Link key={c.id} to={`/entrainement?perso=${c.id}&mode=libre`} className="card link ex-card" aria-label={`Lancer ${c.name}`} data-testid={`combo-${c.id}`}>
                {/* 0.38: the neutral pictograms of the moves, never a picture of the coach (plaquette Créateur V2) */}
                <span className="body">
                  <span className="title">{c.name}</span>
                  <PictoStrip sequence={c.sequence} size={26} />
                  <span className="small muted">
                    <DisciplineLabel id={c.discipline} name={DISCIPLINES.find((x) => x.id === c.discipline)?.name ?? ''} /> · {c.sequence.length} mouvements
                  </span>
                </span>
                <AppIcon id="play" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section" aria-labelledby="h-quick">
        <SectionHead id="h-quick" title="Démarrage rapide" />
        <ResumeCard recommended={recommended} onOpen={onOpen} only="start" />
        {quick.length > 0 && (
          <div className="quick-grid">
            {quick.map((e, i) => (
              <button key={e.id} type="button" className="quick-card" onClick={() => onOpen(e.id)} data-testid={`quick-${e.id}`}>
                <TechThumb id={keyTechnique(e.sequence)} size="sm" />
                <span className="quick-body">
                  <span className="eyebrow">
                    <DisciplineIcon id={e.discipline} size={16} /> {i === 0 ? 'Recommandé' : DISCIPLINES.find((d) => d.id === e.discipline)!.short}
                  </span>
                  <span className="quick-title">{e.name}</span>
                  <span className="quick-meta">
                    <LevelIcon level={e.level} size={12} /> {levelName(e.level)}
                  </span>
                </span>
                <span className="quick-go" aria-hidden>
                  <AppIcon id="play" size={18} />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/** 0.36: the creator of combinations, put forward in Séances; 0.38: it opens the editor of a new sequence (/createur/nouveau) */
function CreatorCard() {
  return (
    <article className="creator-card" data-testid="creator-card" aria-labelledby="creator-title">
      <span className="creator-icon" aria-hidden>
        <AppIcon id="compose" size={26} />
      </span>
      <div className="creator-body">
        <h2 id="creator-title">Crée tes propres enchaînements</h2>
        <p>Choisis tes techniques, organise tes mouvements et regarde ton combattant 3D exécuter tes enchaînements.</p>
      </div>
      <Link to="/createur/nouveau" className="btn primary creator-cta" data-testid="create-combo">
        <AppIcon id="add" size={18} /> Créer un enchaînement
      </Link>
    </article>
  );
}

/** a suggestion that follows the history: the last discipline trained, the first exercise of the level not done yet */
function historySuggestion(sessions: { discipline: DisciplineId; start: string }[], perExercise: Record<string, number>, levels: Record<DisciplineId, LevelId>) {
  const last = [...sessions].sort((a, b) => b.start.localeCompare(a.start))[0];
  if (!last) return undefined;
  const list = exercisesFor(last.discipline, levels[last.discipline]);
  return list.find((e) => !perExercise[e.id]) ?? list[0];
}

/**
 * `only` (0.36): « resume » shows the card only when something can be resumed (a session, a programme), at the top of
 * Séances; « start » shows the first or new session card, at the head of the quick start. Same choice (pickCard).
 */
function ResumeCard({ recommended, onOpen, only }: { recommended?: Exercise; onOpen: (id: string) => void; only: 'resume' | 'start' }) {
  const nav = useNavigate();
  const ready = useHydrated(useResume);
  const statsReady = useHydrated(useStats);
  const snapshots = useResume((s) => s.snapshots);
  const programs = useResume((s) => s.programs);
  const sessions = useStats((s) => s.sessions);
  const perExercise = useStats((s) => s.perExercise);
  const combos = useCustom((s) => s.combos);
  const levels = useProfile((s) => s.profile.levels);
  const [busy, setBusy] = useState(false);

  const card: ResumeCardState = useMemo(
    () =>
      pickCard({
        snapshots,
        programs,
        hasHistory: sessions.length > 0,
        available: (s) => {
          const p = new URLSearchParams(s.query);
          if (p.get('prog')) return PROGRAM_BY_ID.has(p.get('prog')!);
          if (p.get('perso')) return combos.some((c) => c.id === p.get('perso'));
          if (p.get('ex')) return EXERCISE_BY_ID.has(p.get('ex')!);
          return !!p.get('cat');
        },
        programExists: (id) => PROGRAM_BY_ID.has(id),
        now: new Date(),
      }),
    [snapshots, programs, sessions.length, combos],
  );
  // (the stores load in a few milliseconds; no placeholder, which would push the creator down then up again)
  if (!ready || !statsReady) return null;
  const resumable = card.kind === 'reprendre' || card.kind === 'programme';
  if ((only === 'resume') !== resumable) return null;

  // one tap only: a second tap while the session opens does nothing
  const go = (to: string) => {
    if (busy) return;
    setBusy(true);
    nav(to);
  };

  if (card.kind === 'reprendre') return <ResumeSnapshotCard s={card.snapshot} busy={busy} onGo={() => go(`/entrainement?${card.snapshot.query}&reprise=1`)} />;

  if (card.kind === 'programme') {
    const p = PROGRAM_BY_ID.get(card.programId)!;
    return (
      <article className="resume-card" data-testid="resume-card" data-state="programme" aria-labelledby="resume-title">
        <TechThumb id={programTechnique(p)} />
        <div className="resume-body">
          <span className="eyebrow">{discName(p.discipline)}</span>
          <h2 id="resume-title">Continuer mon programme</h2>
          <p className="resume-name">{p.name}</p>
          <p className="resume-meta">
            Séance {card.run.count + 1} · {p.durationMin} min · {p.frequency}
          </p>
          <p className="small muted">Dernière séance terminée le {new Date(card.run.lastDone).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.</p>
          <button type="button" className="btn primary" disabled={busy} onClick={() => go(`/entrainement?${programQuery(p, programProgress(p, card.run.count).next)}`)} data-testid="resume-action">
            <AppIcon id="play" size={18} /> Continuer
          </button>
        </div>
      </article>
    );
  }

  const first = card.kind === 'premiere';
  const ex = first ? recommended : historySuggestion(sessions, perExercise, levels) ?? recommended;
  return (
    <article className="resume-card" data-testid="resume-card" data-state={card.kind} aria-labelledby="resume-title">
      {ex && <TechThumb id={keyTechnique(ex.sequence)} />}
      <div className="resume-body">
        <span className="eyebrow">{ex ? discName(ex.discipline) : 'Entraînement'}</span>
        <h2 id="resume-title">{first ? 'Commence ton premier entraînement' : 'Prêt pour une nouvelle séance ?'}</h2>
        {ex && <p className="resume-name">{ex.name}</p>}
        <p className="resume-meta">{first ? 'Une séance courte, adaptée à ton niveau, pour découvrir le coach.' : 'Une suite logique de ta dernière séance.'}</p>
        {ex && (
          <button type="button" className="btn primary" onClick={() => onOpen(ex.id)} data-testid="resume-action">
            <AppIcon id="play" size={18} /> {first ? 'Choisir une séance' : 'Commencer une séance'}
          </button>
        )}
      </div>
    </article>
  );
}

function ResumeSnapshotCard({ s, busy, onGo }: { s: ResumeSnapshot; busy: boolean; onGo: () => void }) {
  const ratio = progressRatio(s);
  const coach = championFor(s.coach);
  const round = s.rounds > 1 ? ` · round ${s.round}/${s.rounds}` : '';
  // the block in progress, when the session has several (programme, exercises of a level)
  const block = s.itemCount > 1 && s.itemName !== s.title ? s.itemName : '';
  const status = s.phase === 'repos' ? 'En pause pendant le repos' : s.phase === 'pret' ? 'En pause avant l’exercice suivant' : 'En pause';
  return (
    <article className="resume-card" data-testid="resume-card" data-state="reprendre" aria-labelledby="resume-title">
      <TechThumb id={s.thumb} />
      <div className="resume-body">
        <span className="eyebrow">
          <DisciplineIcon id={s.discipline} size={16} /> {discName(s.discipline)}
        </span>
        <h2 id="resume-title">Reprendre mon entraînement</h2>
        <p className="resume-name" data-testid="resume-name">
          {s.title}
        </p>
        {(block || round) && <p className="resume-meta">{block ? `${block}${round}` : round.slice(3)}</p>}
        <dl className="resume-facts">
          <div>
            <dt>Coach</dt>
            <dd>{coach.name}</dd>
          </div>
          <div>
            <dt>Déjà fait</dt>
            <dd data-testid="resume-done">{formatDuration(s.sessionSec)}</dd>
          </div>
          {s.plannedSec && (
            <div>
              <dt>Durée prévue</dt>
              <dd>{formatDuration(s.plannedSec)}</dd>
            </div>
          )}
        </dl>
        {ratio !== null && (
          <div className="resume-progress" role="progressbar" aria-label="Progression de la séance" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} data-testid="resume-progress">
            <span style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
        )}
        <p className="small muted">
          {status}
          {ratio !== null ? ` · ${Math.round(ratio * 100)} % du travail prévu` : ' · pratique libre, sans durée prévue'}
        </p>
        <button type="button" className="btn primary" disabled={busy} onClick={onGo} data-testid="resume-action">
          <AppIcon id="play" size={18} /> Reprendre
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------------------------- Disciplines

function Disciplines() {
  const levels = useProfile((s) => s.profile.levels);
  const perExercise = useStats((s) => s.perExercise);
  return (
    <div className="disc-grid train-disc-grid">
      {DISCIPLINES.map((d) => {
        const level = levels[d.id];
        const list = exercisesFor(d.id, level);
        const done = list.filter((e) => (perExercise[e.id] ?? 0) > 0).length;
        return (
          <Link key={d.id} to={`/discipline/${d.id}`} className="disc-card dark-scope train-disc" data-testid={`disc-${d.id}`}>
            <span className="disc-emblem" aria-hidden>
              <DisciplineEmblem id={d.id} size={72} variant="detaille" />
            </span>
            <span className="bar" aria-hidden />
            <span className="name">{d.name}</span>
            <span className="sub">{d.tagline}</span>
            <span className="lvl">
              <LevelIcon level={level} />
              {levelName(level)}
            </span>
            {list.length > 0 && (
              <span className="disc-progress" aria-label={`${done} exercice${done > 1 ? 's' : ''} pratiqué${done > 1 ? 's' : ''} sur ${list.length} au niveau ${levelName(level)}`}>
                <span className="track" aria-hidden>
                  <span style={{ width: `${Math.round((done / list.length) * 100)}%` }} />
                </span>
                <span className="n">
                  {done}/{list.length}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- Programmes

function programStatus(p: Program, snapshots: ResumeSnapshot[], runs: Record<string, { count: number }>) {
  const s = snapshots.find((x) => x.programId === p.id);
  const pr = programProgress(p, runs[p.id]?.count ?? 0);
  if (s) {
    const r = progressRatio(s);
    return { key: 'en-cours', label: r !== null ? `Séance en cours · ${Math.round(r * 100)} %` : 'Séance en cours', ratio: r };
  }
  // v0.41: the real progress, from the sessions finished (never estimated)
  if (pr.total !== null && pr.done) return { key: pr.finished ? 'fait' : 'en-cours', label: pr.finished ? `Terminé · ${pr.total} séances sur ${pr.total}` : `${pr.done} séance${pr.done > 1 ? 's' : ''} sur ${pr.total} · semaine ${pr.week}`, ratio: pr.done / pr.total };
  if (pr.done) return { key: 'fait', label: `Fait ${pr.done} fois`, ratio: null };
  return { key: 'nouveau', label: 'Pas encore commencé', ratio: null };
}

/** v0.41: the filters stay as they were while the user moves around the app (not saved on the device) */
let keptFilters: ProgramFilters = NO_PROGRAM_FILTER;

/** `thumbs`: the catalogue page (/programmes) shows the coach doing the key technique, as before 0.41 */
export function Programmes({ thumbs = false }: { thumbs?: boolean }) {
  const [f, setF] = useState<ProgramFilters>(keptFilters);
  const panel = usePanel();
  const snapshots = useResume((s) => s.snapshots);
  const runs = useResume((s) => s.programs);
  const list = filterPrograms(PROGRAMS, f);
  const set = (p: Partial<ProgramFilters>) =>
    setF((x) => {
      keptFilters = { ...x, ...p };
      return keptFilters;
    });
  const reset = () => ((keptFilters = NO_PROGRAM_FILTER), setF(NO_PROGRAM_FILTER));
  const n = activeFilterCount(f);
  const disciplines = ['tous', ...new Set(PROGRAMS.map((p) => p.discipline))];
  const discOptions = disciplines.map((d) => ({
    id: d,
    label: d === 'tous' ? 'Toutes' : d === 'mixte' ? 'Multi' : DISCIPLINES.find((x) => x.id === d)!.short,
    icon: d !== 'tous' && d !== 'mixte' ? <DisciplineEmblem id={d as DisciplineId} size={18} variant="contour" /> : undefined,
  }));
  // v0.41 (Youssef, « Enrichissement des programmes » §6): « Filtres » is in the bar, in place of « Programmes »
  // (the space is already open); the panel holds every filter
  const filterAction = { run: panel.show, icon: 'filter' as const, label: 'Filtrer', pressed: n > 0, ariaLabel: n ? `Filtrer les programmes, ${n} filtre${n > 1 ? 's' : ''} actif${n > 1 ? 's' : ''}` : 'Filtrer les programmes', testId: 'nav-prog-filters' };
  useNavActions({ 'nav:/programmes': filterAction, filters: filterAction });
  const chips = <T extends string>(label: string, value: T, options: { id: T; label: string }[], prefix: string, on: (v: T) => void) => (
    <div className="nav-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="nav-chips">
        {options.map((o) => (
          <button key={o.id} type="button" className={`chip ${value === o.id ? 'on' : ''}`} aria-pressed={value === o.id} onClick={() => on(o.id)} data-testid={`${prefix}${o.id}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <div className="prog-filters" role="group" aria-label="Discipline des programmes">
        <FilterChips scroll label="Discipline" value={f.discipline} onChange={(v) => set({ discipline: v })} testPrefix="pf-d-" options={discOptions} />
        <div className="prog-count">
          <span className="small muted" data-testid="prog-count" aria-live="polite">
            {list.length} programme{list.length > 1 ? 's' : ''} sur {PROGRAMS.length}
          </span>
          {n > 0 && (
            <button type="button" className="btn ghost small" onClick={reset} data-testid="pf-reset">
              Réinitialiser ({n})
            </button>
          )}
        </div>
      </div>
      {panel.open && (
        <NavPanel title="Filtrer les programmes" onClose={panel.hide} testId="prog-filters-panel">
          {chips('Discipline', f.discipline, discOptions.map(({ id, label }) => ({ id, label })), 'pp-d-', (v) => set({ discipline: v }))}
          {chips('Niveau', f.level, [{ id: 'tous' as const, label: 'Tous' }, ...LEVELS.filter((l) => PROGRAMS.some((p) => programLevel(p) === l.id)).map((l) => ({ id: l.id, label: l.name }))], 'pf-l-', (v) => set({ level: v }))}
          {chips('Durée d’une séance', f.duration, [{ id: 'tous' as const, label: 'Toutes' }, ...(Object.keys(DURATION_LABEL) as DurationBucket[]).map((k) => ({ id: k, label: DURATION_LABEL[k] }))], 'pf-t-', (v) => set({ duration: v }))}
          {chips('Objectif', f.objective, [{ id: 'tous' as const, label: 'Tous' }, ...(Object.keys(OBJECTIVE_LABEL) as ProgramObjective[]).map((k) => ({ id: k, label: OBJECTIVE_LABEL[k] }))], 'pf-o-', (v) => set({ objective: v }))}
          {chips('Matériel', f.equipment, [{ id: 'tous' as const, label: 'Tous' }, ...(Object.keys(EQUIPMENT_LABEL) as EquipmentNeed[]).map((k) => ({ id: k, label: EQUIPMENT_LABEL[k] }))], 'pf-m-', (v) => set({ equipment: v }))}
          <div className="nav-actions">
            {n > 0 && (
              <button type="button" className="nav-action" onClick={reset} data-testid="pp-reset">
                Réinitialiser
              </button>
            )}
            <button type="button" className="nav-action primary" onClick={() => panel.hide()} data-testid="pp-close">
              Voir les résultats ({list.length})
            </button>
          </div>
        </NavPanel>
      )}
      {list.length === 0 ? (
        <EmptyState
          title="Aucun programme pour ces filtres"
          action={
            <button type="button" className="btn secondary" onClick={reset}>
              Réinitialiser les filtres
            </button>
          }
        />
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {list.map((p) => {
            const st = programStatus(p, snapshots, runs);
            const lvl = programLevel(p);
            return (
              <Link key={p.id} to={`/programmes/${p.id}`} className="card link prog-card" data-testid={`prog-${p.id}`} data-status={st.key}>
                {thumbs ? (
                  <TechThumb id={programTechnique(p)} />
                ) : (
                  <span className="prog-emblem" aria-hidden>
                    {p.discipline === 'mixte' ? <AppIcon id="programs" size={28} /> : <DisciplineIcon id={p.discipline} size={40} />}
                  </span>
                )}
                <span className="body">
                  <span className="eyebrow">{thumbs && p.discipline !== 'mixte' ? <DisciplineLabel id={p.discipline} name={discName(p.discipline)} /> : discName(p.discipline)}</span>
                  <span className="title">{p.name}</span>
                  <span className="prog-tags">
                    <span>{p.durationMin} min</span>
                    <span>
                      <LevelIcon level={lvl} size={12} /> {levelName(lvl)}
                    </span>
                    <span>{OBJECTIVE_LABEL[programObjective(p)]}</span>
                  </span>
                  <span className="small muted">{p.frequency}</span>
                  <span className={`prog-status ${st.key}`}>{st.label}</span>
                  {st.ratio !== null && (
                    <span className="track" aria-hidden>
                      <span style={{ width: `${Math.round(st.ratio * 100)}%` }} />
                    </span>
                  )}
                </span>
                <AppIcon id="chevron" />
              </Link>
            );
          })}
        </div>
      )}
      <p className="small muted prog-note">Durées calculées à partir des blocs, des repos et des transitions. Fréquences indicatives : adapte-les à ta condition physique.</p>
    </>
  );
}
