import type { ReactNode } from 'react';
import { TechThumb, keyTechnique, programTechnique } from '../components/TechThumb';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID, TECHNIQUES, techniquesFor } from '../../domain/techniques';
import { EXERCISES, EXERCISE_BY_ID } from '../../domain/exercises';
import { PARTNER_BY_ID, PARTNER_CATEGORY_LABEL, partnerFor } from '../../domain/partner';
import { SOURCE_BY_ID } from '../../domain/biomech/sources';
import { PROGRAMS } from '../../domain/programs';
import { DISCIPLINES, DisciplineId, LevelId, Technique } from '../../domain/types';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { useCustom } from '../../store/custom';
import { useGoals } from '../../store/goals';
import { useActiveFighter } from '../../store/fighters';
import type { ComboPlayer, PlayerEvents } from '../../engine/player';
import { playerSteps } from '../training/plan';
import { say } from '../../audio/voice';
import { GuideCard } from '../GuideCard';
import { MasterySwitch } from '../components/Playback';
import { AnimationBadge, DisciplineLabel, ModeBadge, CameraControls, EmptyState, EntryCard, FilterChips, KbOnlyBadge, KickboxingRulesCard, KickboxingStylePicker, LevelSelector, PageHead, PlaybackControls, SectionHead, Tabs, TechniqueCard, useKbStyle } from '../components';
import { filterExercises, filterTechniques } from '../../domain/kickboxingStyles';
import { ExerciseList, ExerciseSheet } from './Discipline';
import { AppIcon, DisciplineIcon } from '../icons';
import { useActionPill } from '../components/ActionPill';
import { FullscreenStage } from '../fullscreen/FullscreenStage';
import { StageGuard } from '../components/StageGuard';
import { exerciseForTechnique } from '../../domain/quickPicks';
import { TechniqueFilter, neighbours, parseTechniqueFilter, sheetQuery, techniqueCatalogue } from './techniqueOrder';

const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

// 0.27 (Youssef, 2026-10-20 21:56: « Retire légendes des techniques vu qu'ils ont leur menu »): no Légendes section
// here any more, the Légendes tab of the bottom bar is the one way in; old links are sent there (see Library)
type HubTab = 'techniques' | 'combinaisons' | 'createur' | 'favoris' | 'programmes';

const HUB_TABS: { id: HubTab; label: string; icon: ReactNode }[] = [
  { id: 'techniques', label: 'Techniques', icon: <AppIcon id="techniques" size={18} /> },
  { id: 'combinaisons', label: 'Combinaisons', icon: <AppIcon id="combos" size={18} /> },
  { id: 'createur', label: 'Créateur', icon: <AppIcon id="compose" size={18} /> },
  { id: 'favoris', label: 'Favoris', icon: <AppIcon id="favorite" size={18} /> },
  { id: 'programmes', label: 'Programmes', icon: <AppIcon id="programs" size={18} /> },
];

/** "Techniques" tab: individual techniques, combinations, creator, favourites, programmes. */
export function Library() {
  const [q, setQ] = useSearchParams();
  const main = useProfile((s) => s.profile.mainDiscipline);
  const tab = (HUB_TABS.some((t) => t.id === q.get('tab')) ? q.get('tab') : 'techniques') as HubTab;
  const d = (DISCIPLINES.some((x) => x.id === q.get('d')) ? q.get('d') : main) as DisciplineId;
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(q);
    n.set(k, v);
    // a new discipline starts on its whole list
    if (k === 'd') n.delete('cat');
    if (k === 'cat' && v === 'tout') n.delete('cat');
    setQ(n, { replace: true });
  };
  // 0.25: the category filter is in the URL, so the technique sheets follow that list and Back finds it again
  const cat = parseTechniqueFilter(q.get('cat'), Object.keys(CATEGORY_LABEL));
  // the former Légendes section (bookmarks, history, older answers of the coach): straight to the Légendes tab
  if (q.get('tab') === 'legendes') return <Navigate to="/champions" replace />;
  return (
    <div className="page">
      <PageHead title="Techniques" eyebrow="Bibliothèque" back={false} />
      <Tabs variant="underline" label="Sections" items={HUB_TABS} value={tab} onChange={(t) => set('tab', t)} />
      <div role="tabpanel" className="stack" style={{ gap: 16 }}>
        {tab === 'techniques' && <TechniquesTab d={d} setD={(x) => set('d', x)} cat={cat} setCat={(c) => set('cat', c)} />}
        {tab === 'combinaisons' && <CombosTab d={d} setD={(x) => set('d', x)} />}
        {tab === 'createur' && <CreatorTab />}
        {tab === 'favoris' && <FavoritesTab />}
        {tab === 'programmes' && <ProgramsTab />}
      </div>
    </div>
  );
}

function DisciplineFilter({ d, setD }: { d: DisciplineId; setD: (d: DisciplineId) => void }) {
  return <Tabs label="Discipline" items={DISCIPLINES.map((x) => ({ id: x.id, label: x.short, icon: <DisciplineIcon id={x.id} size={24} /> }))} value={d} onChange={setD} />;
}

function TechniquesTab({ d, setD, cat, setCat }: { d: DisciplineId; setD: (d: DisciplineId) => void; cat: TechniqueFilter; setCat: (c: TechniqueFilter) => void }) {
  const fav = useGoals((s) => s.favTechniques);
  const mastery = useGoals((s) => s.mastery);
  const [kbStyle] = useKbStyle();
  const list = filterTechniques(techniquesFor(d), d, kbStyle);
  const cats = [...new Set(list.map((t) => t.category))];
  const toReview = list.filter((t) => mastery[t.id] === 'a-revoir');
  const shown = cat === 'tout' ? list : cat === 'a-revoir' ? toReview : list.filter((t) => t.category === cat);
  const partner = partnerFor(d);
  const nav = useNavigate();
  // 0.26 action pill: a random technique of the list on screen, and the « À revoir » filter in one tap
  // (the catalogue has no text search, so no « Rechercher » button)
  useActionPill([
    shown.length > 0 && {
      id: 'au-hasard',
      label: 'Au hasard',
      icon: 'random',
      ariaLabel: 'Au hasard : ouvrir une technique de la liste',
      onSelect: () => {
        const t = shown[Math.floor(Math.random() * shown.length) % shown.length];
        nav(`/techniques/${t.id}${sheetQuery(d, cat)}`);
      },
    },
    toReview.length > 0 && {
      id: 'a-revoir',
      label: 'À revoir',
      icon: 'struggling',
      ariaLabel: `À revoir : ${toReview.length} technique${toReview.length > 1 ? 's' : ''}`,
      pressed: cat === 'a-revoir',
      onSelect: () => setCat(cat === 'a-revoir' ? 'tout' : 'a-revoir'),
    },
  ]);
  return (
    <>
      <DisciplineFilter d={d} setD={setD} />
      {d === 'kickboxing' && <KickboxingStylePicker />}
      <FilterChips
        scroll
        label="Catégorie"
        value={cat}
        onChange={setCat}
        options={[
          { id: 'tout' as const, label: `Tout (${list.length})` },
          // 0.24: the techniques the user still finds hard, in one tap
          ...(toReview.length > 0 ? [{ id: 'a-revoir' as const, label: `À revoir (${toReview.length})` }] : []),
          ...cats.map((c) => ({ id: c, label: CATEGORY_LABEL[c] })),
        ]}
      />
      <div className="tech-grid">
        {shown.map((t) => (
          <TechniqueCard
            tile
            key={t.id}
            to={`/techniques/${t.id}${sheetQuery(d, cat)}`}
            title={t.name}
            description={t.description}
            thumb={t.id}
            favorite={fav.includes(t.id)}
            mastery={mastery[t.id]}
            meta={d === 'kickboxing' ? <KbOnlyBadge id={t.id} /> : undefined}
          />
        ))}
      </div>
      <p className="small muted">{TECHNIQUES.length} techniques au total, chacune animée sur ton coach 3D.</p>
      {partner.length > 0 && (
        <section className="section" data-testid="partner-section">
          <SectionHead title="Avec un partenaire réel" />
          <p className="small muted">Projections, contrôles et soumissions : expliqués ici, à pratiquer uniquement au club avec un enseignant. Pas d’exercice solo ni d’animation pour l’instant.</p>
          <div className="stack" style={{ gap: 8 }}>
            {partner.map((p) => (
              <TechniqueCard key={p.id} to={`/partenaire/${p.id}`} title={p.name} description={p.description} glyph="à 2" testId={`partner-${p.id}`} meta={<span className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}><ModeBadge mode={p.mode} /><span className="badge">{PARTNER_CATEGORY_LABEL[p.category]}</span></span>} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function CombosTab({ d, setD }: { d: DisciplineId; setD: (d: DisciplineId) => void }) {
  const levels = useProfile((s) => s.profile.levels);
  const [lvl, setLvl] = useState<LevelId>(levels[d]);
  const [open, setOpen] = useState<string | null>(null);
  const [kbStyle] = useKbStyle();
  const list = filterExercises(EXERCISES.filter((e) => e.discipline === d && e.level === lvl && e.kind === 'combinaison'), kbStyle);
  const ex = open ? EXERCISE_BY_ID.get(open) : undefined;
  return (
    <>
      <DisciplineFilter d={d} setD={(x) => (setD(x), setLvl(levels[x]))} />
      {d === 'kickboxing' && <KickboxingStylePicker />}
      <LevelSelector value={lvl} onChange={setLvl} />
      <ExerciseList list={list} onOpen={setOpen} />
      {ex && <ExerciseSheet ex={ex} onClose={() => setOpen(null)} />}
    </>
  );
}

function CreatorTab() {
  const combos = useCustom((s) => s.combos);
  return (
    <>
      <EntryCard to="/createur" icon={<AppIcon id="compose" />} tone="red" title="Créer un enchaînement" text="Compose ta combinaison, l’application vérifie qu’elle est réalisable." />
      <SectionHead title="Mes enchaînements" />
      {combos.length === 0 ? (
        <EmptyState title="Aucun enchaînement enregistré" text="Tes créations apparaîtront ici." />
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
              <AppIcon id="chevron" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function FavoritesTab() {
  const favT = useGoals((s) => s.favTechniques);
  const favE = useGoals((s) => s.favExercises);
  const [open, setOpen] = useState<string | null>(null);
  const techs = favT.map((id) => TECHNIQUE_BY_ID.get(id)).filter((t): t is Technique => !!t);
  const exs = favE.map((id) => EXERCISE_BY_ID.get(id)).filter((e) => !!e);
  const ex = open ? EXERCISE_BY_ID.get(open) : undefined;
  if (!techs.length && !exs.length)
    return <EmptyState title="Aucun favori pour l’instant" text="Touche l’étoile d’une technique ou d’un exercice pour le retrouver ici." />;
  return (
    <>
      {exs.length > 0 && (
        <section className="section">
          <SectionHead title="Exercices et combinaisons" />
          <ExerciseList list={exs as NonNullable<(typeof exs)[number]>[]} onOpen={setOpen} />
        </section>
      )}
      {techs.length > 0 && (
        <section className="section">
          <SectionHead title="Techniques" />
          <div className="stack" style={{ gap: 8 }}>
            {techs.map((t) => (
              <TechniqueCard key={t.id} to={`/techniques/${t.id}`} title={t.name} description={t.description} thumb={t.id} favorite />
            ))}
          </div>
        </section>
      )}
      {ex && <ExerciseSheet ex={ex} onClose={() => setOpen(null)} />}
    </>
  );
}

function ProgramsTab() {
  return (
    <>
      <EntryCard to="/programmes" icon={<AppIcon id="programs" />} tone="red" title="Programmes guidés" text="Séances complètes, de l’échauffement au retour au calme." />
      <EntryCard to="/createur" icon={<AppIcon id="compose" />} title="Programme personnalisé" text="Crée ton enchaînement et lance-le en boucle ou en rounds." />
      <div className="stack" style={{ gap: 8 }}>
        {PROGRAMS.slice(0, 4).map((p) => (
          <Link key={p.id} to={`/programmes/${p.id}`} className="card link ex-card">
            <TechThumb id={programTechnique(p)} />
            <span className="body">
              <span className="eyebrow">{p.durationMin} min</span>
              <span className="title">{p.name}</span>
            </span>
            <AppIcon id="chevron" />
          </Link>
        ))}
      </div>
    </>
  );
}

export function TechniquePage() {
  const { id } = useParams();
  const [q] = useSearchParams();
  const t = id ? TECHNIQUE_BY_ID.get(id) : undefined;
  const profile = useProfile((s) => s.profile);
  const settings = useSettings((s) => s.settings);
  const fighter = useActiveFighter();
  const render = useSettings((st) => st.settings.coachRender);
  const fav = useGoals((s) => (t ? s.favTechniques.includes(t.id) : false));
  const toggleFav = useGoals((s) => s.toggleTechnique);
  const d = ((q.get('d') as DisciplineId) && t?.disciplines.includes(q.get('d') as DisciplineId) ? q.get('d') : t?.disciplines[0]) as DisciplineId;
  const player = useRef<ComboPlayer | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [cam, setCam] = useState(settings.cameraAngle);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const nav = useNavigate();
  const [kbStyle] = useKbStyle();
  const mastery = useGoals((s) => s.mastery);

  // the technique played by the coach; previous / next keep the same stage and change only the move
  const tId = t?.id;
  const shown = useRef<string | undefined>(undefined);
  const play = useCallback((p: ComboPlayer, id: string) => {
    shown.current = id;
    p.speed = speedRef.current;
    p.setSequence(playerSteps([id]), 1.2);
    p.play();
  }, []);
  const tRef = useRef(tId);
  tRef.current = tId;
  const onPlayer = useCallback(
    (p: ComboPlayer) => {
      player.current = p;
      if (tRef.current) play(p, tRef.current);
    },
    [play],
  );
  useEffect(() => {
    const p = player.current;
    if (!p || !tId || shown.current === tId) return;
    play(p, tId);
    setPlaying(true);
  }, [tId, play]);

  // 0.25 (Youssef, 2026-10-20 12:30): previous / next technique without leaving the sheet, in the order of
  // the catalogue list the user came from (discipline, kick-boxing style, category or « À revoir »)
  const cat = parseTechniqueFilter(q.get('cat'), Object.keys(CATEGORY_LABEL));
  const list = useMemo(() => (d ? techniqueCatalogue(d, kbStyle, cat, mastery).map((x) => x.id) : []), [d, kbStyle, cat, mastery]);
  // a technique marked « acquise » leaves the « À revoir » list: the sheet keeps the list it was opened in
  const kept = useRef<string[]>([]);
  if (tId && list.includes(tId)) kept.current = list;
  const order = tId ? (list.includes(tId) ? list : kept.current.includes(tId) ? kept.current : null) : null;
  const near = order && tId ? neighbours(order, tId) : null;
  // replace: Back returns to the catalogue, not through every technique seen
  const go = (to?: string) => to && nav(`/techniques/${to}${sheetQuery(d, cat)}`, { replace: true });
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement;
    // the 3D stage turns with the finger, sliders and scrolling rows keep their own gesture
    if (e.touches.length !== 1 || el.closest('.preview-stage, input, textarea, select, [data-no-swipe]') || scrollsSideways(el)) {
      swipe.current = null;
      return;
    }
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0 || !near) return;
    const dx = e.changedTouches[0].clientX - s0.x;
    const dy = e.changedTouches[0].clientY - s0.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    go(dx < 0 ? near.next : near.prev);
  };
  const nameOf = (id: string) => TECHNIQUE_BY_ID.get(id)?.name ?? id;

  // 0.26 action pill: train this technique (the programme's exercise that works it the most directly),
  // slow motion on the sheet, « Je la maîtrise » (the tick of the mastery switch)
  const toggleMastery = useGoals((s) => s.toggleMastery);
  const drill = useMemo(() => (t && d ? exerciseForTechnique(filterExercises(EXERCISES.filter((e) => e.discipline === d), kbStyle), t.id, profile.levels[d]) : undefined), [t, d, kbStyle, profile.levels]);
  const SLOW = 0.25;
  const slowOn = speed <= SLOW + 1e-3;
  const setPlayerSpeed = (v: number) => {
    setSpeed(v);
    if (player.current) player.current.speed = v;
  };
  const normalSpeed = useRef(0.6);
  useActionPill(
    t
      ? [
          drill && {
            id: 'entrainer',
            label: 'S’entraîner',
            icon: 'play',
            primary: true,
            ariaLabel: `S’entraîner : ${drill.name}`,
            onSelect: () => nav(`/entrainement?ex=${encodeURIComponent(drill.id)}&mode=technique`),
          },
          {
            id: 'ralenti',
            label: 'Ralenti',
            icon: 'slow',
            pressed: slowOn,
            onSelect: () => {
              if (slowOn) setPlayerSpeed(normalSpeed.current > SLOW ? normalSpeed.current : 0.6);
              else {
                normalSpeed.current = speed;
                setPlayerSpeed(SLOW);
              }
              if (!playing) {
                player.current?.play();
                setPlaying(true);
              }
            },
          },
          {
            id: 'maitrise',
            label: 'Je la maîtrise',
            icon: 'mastered',
            pressed: mastery[t.id] === 'acquise',
            onSelect: () => toggleMastery(t.id, 'acquise'),
          },
        ]
      : null,
  );
  const events = useMemo<PlayerEvents>(
    () => ({
      onStep: () => {
        if (t && settings.voice && settings.announceMoves) say(t.call, { interrupt: true });
      },
    }),
    [t, settings.voice, settings.announceMoves],
  );

  if (!t) return <EmptyState title="Technique introuvable" action={<Link to="/techniques" className="btn">Retour aux techniques</Link>} />;
  return (
    <div className="page" style={{ gap: 16 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="technique-page">
      <PageHead
        title={t.name}
        eyebrow={CATEGORY_LABEL[t.category]}
        fallback="/techniques"
        right={
          <button type="button" className="btn icon ghost" aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggleFav(t.id)} style={{ marginRight: -10 }}>
            {fav ? <AppIcon id="favorite" tone="accent" /> : <AppIcon id="favoriteOutline" />}
          </button>
        }
      />
      {/* 0.27: a double tap shows the coach on the whole screen (Youssef, 2026-10-20 22:09) */}
      <FullscreenStage className="preview-stage" testId="technique-stage">
        <StageGuard place="fiche technique">
        <Suspense fallback={<div className="hero-loading"><div className="stage-skeleton" /></div>}>
          <CoachStage
            backdrop="dark"
            coach={(render === 'premium' ? null : fighter?.look.sex) ?? profile.coach ?? 'homme'}
            discipline={d}
            southpaw={profile.guard === 'gaucher'}
            cameraAngle={cam}
            quality={settings.quality}
            events={events}
            onPlayer={onPlayer}
          />
        </Suspense>
        </StageGuard>
      </FullscreenStage>
      {near && near.total > 1 && (
        <nav className="tech-step" aria-label="Techniques de la liste" data-testid="technique-step">
          <button
            type="button"
            className="btn icon ghost"
            disabled={!near.prev}
            aria-label={near.prev ? `Technique précédente : ${nameOf(near.prev)}` : 'Technique précédente'}
            onClick={() => go(near.prev)}
            data-testid="technique-prev"
          >
            <AppIcon id="stepBack" size={20} />
          </button>
          <span className="tech-step-pos" aria-live="polite" data-testid="technique-position">
            {near.index + 1} / {near.total}
          </span>
          <button
            type="button"
            className="btn icon ghost"
            disabled={!near.next}
            aria-label={near.next ? `Technique suivante : ${nameOf(near.next)}` : 'Technique suivante'}
            onClick={() => go(near.next)}
            data-testid="technique-next"
          >
            <AppIcon id="stepForward" size={20} />
          </button>
        </nav>
      )}
      <PlaybackControls
        playing={playing}
        onToggle={() => {
          if (playing) player.current?.pause();
          else player.current?.play();
          setPlaying(!playing);
        }}
        speed={speed}
        onSpeed={(v) => {
          setSpeed(v);
          if (player.current) player.current.speed = v;
        }}
        extra={<MasterySwitch id={t.id} />}
      />
      <CameraControls value={cam} onChange={setCam} />
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <ModeBadge mode={t.mode} />
        <AnimationBadge id={t.id} />
      </div>
      <p>{t.description}</p>
      {t.soloNote && <div className="note">{t.soloNote}</div>}
      {t.notes?.[d] && (
        <div className="card stack" data-testid="technique-discipline-note">
          <h3>{d === 'mma' ? 'En MMA' : `En ${DISCIPLINES.find((y) => y.id === d)!.name.toLowerCase()}`}</h3>
          <p>{t.notes[d]}</p>
        </div>
      )}
      {t.safety && (
        <div className="card stack" style={{ borderLeft: '3px solid var(--red)' }} data-testid="technique-safety">
          <h3>Sécurité</h3>
          <p>{t.safety}</p>
        </div>
      )}
      <GuideCard id={t.id} southpaw={profile.guard === 'gaucher'} />
      {d === 'kickboxing' && <KickboxingRulesCard id={t.id} />}
      <div className="card stack">
        <h3>Consignes du coach</h3>
        <ul className="plain-list">
          {t.cues.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      </div>
      <p className="small muted">Disciplines : {t.disciplines.map((x) => DISCIPLINES.find((y) => y.id === x)!.name).join(', ')}</p>
      {t.sources && t.sources.length > 0 && (
        <p className="small muted" data-testid="technique-sources">
          Sources :{' '}
          {t.sources.map((id, i) => {
            const src = SOURCE_BY_ID.get(id);
            return (
              <span key={id}>
                {i > 0 && ' ; '}
                {src ? (
                  <a href={src.url} target="_blank" rel="noreferrer">
                    {src.by}, « {src.title} »
                  </a>
                ) : (
                  id
                )}
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

/** true when the touch starts in a row that scrolls sideways (chips, steps): its swipe is its own */
function scrollsSideways(el: HTMLElement | null): boolean {
  for (let e = el; e && !e.classList.contains('page'); e = e.parentElement) {
    const ox = getComputedStyle(e).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && e.scrollWidth > e.clientWidth + 1) return true;
  }
  return false;
}

/** Fiche of a technique that needs a real partner: explanation and safety only, no animation, no solo drill. */
export function PartnerPage() {
  const { id } = useParams();
  const p = id ? PARTNER_BY_ID.get(id) : undefined;
  if (!p) return <EmptyState title="Fiche introuvable" action={<Link to="/techniques" className="btn">Retour aux techniques</Link>} />;
  const disc = DISCIPLINES.find((x) => x.id === p.discipline)!;
  const prep = p.prep ? TECHNIQUE_BY_ID.get(p.prep) : undefined;
  return (
    <div className="page" style={{ gap: 16 }} data-testid="partner-page">
      <PageHead title={p.name} eyebrow={PARTNER_CATEGORY_LABEL[p.category]} fallback={`/techniques?d=${p.discipline}`} />
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <ModeBadge mode={p.mode} />
        <AnimationBadge id={p.id} />
        <DisciplineLabel id={p.discipline} name={disc.name} />
      </div>
      <p>{p.description}</p>
      <div className="card stack" style={{ borderLeft: '3px solid var(--red)' }} data-testid="partner-safety">
        <h3>Sécurité</h3>
        <ul className="plain-list">
          {p.safety.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      </div>
      <div className="card stack">
        <h3>Étapes</h3>
        <ol className="plain-list" data-testid="partner-phases">
          {p.phases.map((ph, i) => (
            <li key={i}>
              <strong>{ph.label}</strong> : {ph.text}
            </li>
          ))}
        </ol>
      </div>
      <div className="card stack">
        <h3>Points clés</h3>
        <ul className="plain-list">
          {p.keyPoints.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      </div>
      <p className="small muted">Pas d’animation à deux pour cette technique pour l’instant : elle demande une démonstration avec un partenaire virtuel, en préparation.</p>
      {prep && (
        <EntryCard to={`/techniques/${prep.id}?d=${p.discipline}`} icon={<AppIcon id="techniques" />} title={`Préparation en solo : ${prep.name}`} text="Le seul travail que tu peux faire seul, animé sur ton coach." testId="partner-prep" />
      )}
    </div>
  );
}
