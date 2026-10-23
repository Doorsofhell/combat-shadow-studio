import type { ReactNode } from 'react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID, TECHNIQUES, techniquesFor } from '../../domain/techniques';
import { EXERCISES, EXERCISE_BY_ID } from '../../domain/exercises';
import { termForPartner, termForTechnique } from '../../domain/encyclopedia';
import { PARTNER_BY_ID, PARTNER_CATEGORY_LABEL, partnerFor } from '../../domain/partner';
import { SOURCE_BY_ID } from '../../domain/biomech/sources';
import { DISCIPLINES, DisciplineId, LevelId, Technique } from '../../domain/types';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
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
import { useNavActions } from '../nav/store';
import { setSelection, useSelection } from '../nav/selection';
import { LibraryPanels } from './LibraryNav';
import { FullscreenStage } from '../fullscreen/FullscreenStage';
import { StageGuard } from '../components/StageGuard';
import { exerciseForTechnique } from '../../domain/quickPicks';
import { TechniqueFilter, neighbours, parseTechniqueFilter, sheetQuery, techniqueCatalogue } from './techniqueOrder';
import { PremiumMarker } from '../premium/PremiumMarker';

const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

// 0.36 (Youssef, 2026-10-22, « Entraîner = pratiquer et personnaliser, Techniques = apprendre et explorer »): the
// library keeps Techniques, Combinaisons, Légendes and Favoris. The creator and the programmes live in Entraîner
// (Séances, Programmes); their old links here are sent to /createur and /programmes. Légendes is back as a section
// that leads into the legends library (0.27 had removed it while it was a tab of the bar; it is now in the Menu)
type HubTab = 'techniques' | 'combinaisons' | 'legendes' | 'favoris';

const HUB_TABS: { id: HubTab; label: string; icon: ReactNode }[] = [
  { id: 'techniques', label: 'Techniques', icon: <AppIcon id="techniques" size={18} /> },
  { id: 'combinaisons', label: 'Combinaisons', icon: <AppIcon id="combos" size={18} /> },
  { id: 'legendes', label: 'Légendes', icon: <AppIcon id="legends" size={18} /> },
  { id: 'favoris', label: 'Favoris', icon: <AppIcon id="favorite" size={18} /> },
];

/** "Techniques" tab: individual techniques, combinations, legends, favourites. */
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
  // 0.36: the creator and the programmes moved to Entraîner; old links keep working (the discipline goes along)
  if (q.get('tab') === 'createur') return <Navigate to={`/createur${q.get('d') ? `?d=${q.get('d')}` : ''}`} replace />;
  if (q.get('tab') === 'programmes') return <Navigate to="/programmes" replace />;
  return (
    <div className="page">
      <PageHead title="Techniques" eyebrow="Bibliothèque" back={false} />
      <LibraryPanels d={d} setD={(x) => set('d', x)} cat={cat} setCat={(c) => set('cat', c)} tab={tab} />
      <Tabs variant="underline" label="Sections" items={HUB_TABS} value={tab} onChange={(t) => set('tab', t)} />
      <div role="tabpanel" className="stack" style={{ gap: 16 }}>
        {tab === 'techniques' && <TechniquesTab d={d} setD={(x) => set('d', x)} cat={cat} setCat={(c) => set('cat', c)} />}
        {tab === 'combinaisons' && <CombosTab d={d} setD={(x) => set('d', x)} />}
        {tab === 'legendes' && <LegendsTab d={d} />}
        {tab === 'favoris' && <FavoritesTab />}
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
  // 0.26 quick actions (a random technique of the list, the « À revoir » filter): v0.32 commands « Sur cet écran »
  // of the Menu sheet; Rechercher, Filtres and Technique are in the bar (LibraryPanels)
  const selected = useSelection('technique');
  useNavActions({}, [
    shown.length > 0 && {
      id: 'au-hasard',
      label: 'Au hasard',
      icon: { glyph: 'random' },
      run: () => {
        const t = shown[Math.floor(Math.random() * shown.length) % shown.length];
        nav(`/techniques/${t.id}${sheetQuery(d, cat)}`);
      },
    },
    toReview.length > 0 && {
      id: 'a-revoir',
      label: `À revoir (${toReview.length})`,
      icon: { glyph: 'struggling' },
      pressed: cat === 'a-revoir',
      run: () => setCat(cat === 'a-revoir' ? 'tout' : 'a-revoir'),
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
            selected={selected === t.id}
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

/** 0.36: the way into the legends library (combinations inspired by champions), from the library of techniques */
function LegendsTab({ d }: { d: DisciplineId }) {
  const name = DISCIPLINES.find((x) => x.id === d)?.name ?? '';
  return (
    <>
      <p className="small muted" style={{ margin: 0 }}>
        Des combinaisons inspirées du style des grands champions, avec leur fiche et leur démonstration.
      </p>
      <EntryCard to="/champions" icon={<AppIcon id="legends" />} tone="gold" title="Toutes les légendes" text="Combinaison du jour, collections et fiches de chaque légende." testId="legends-all" />
      <EntryCard to={`/champions?vue=champions&d=${d}`} icon={<DisciplineIcon id={d} size={22} />} title={`Légendes : ${name}`} text="Les légendes de la discipline choisie." testId="legends-discipline" />
      <EntryCard to="/champions?vue=favoris" icon={<AppIcon id="favorite" />} title="Mes combinaisons favorites" text="Les combinaisons de légendes que tu as gardées." testId="legends-favorites" />
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
      <p className="small muted premium-line">
        Favoris illimités <PremiumMarker feature="unlimited_favorites" />
      </p>
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
  // v0.32 bar of the sheet (section 5.5): S'entraîner, Ralenti, Maîtrise; the former floating pill is gone
  useEffect(() => {
    if (t) setSelection('technique', t.id);
  }, [t]);
  const toggleSlow = () => {
    if (slowOn) setPlayerSpeed(normalSpeed.current > SLOW ? normalSpeed.current : 0.6);
    else {
      normalSpeed.current = speed;
      setPlayerSpeed(SLOW);
    }
    if (!playing) {
      player.current?.play();
      setPlaying(true);
    }
  };
  useNavActions(
    t
      ? {
          train: drill && { run: () => nav(`/entrainement?ex=${encodeURIComponent(drill.id)}&mode=technique`), ariaLabel: `S’entraîner : ${drill.name}` },
          slow: { run: toggleSlow, pressed: slowOn, ariaLabel: slowOn ? 'Ralenti, activé' : 'Ralenti' },
          mastery: { run: () => toggleMastery(t.id, 'acquise'), pressed: mastery[t.id] === 'acquise', ariaLabel: mastery[t.id] === 'acquise' ? 'Maîtrise : je la maîtrise' : 'Maîtrise : marquer comme maîtrisée' },
        }
      : {},
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
      <UnderstandLink term={termForTechnique(t.id)} />
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

/** 0.46 (« Encyclopédie du combat » §15): from a technique to the sheet that explains its name, when there is one */
function UnderstandLink({ term }: { term?: { id: string; name: string } }) {
  if (!term) return null;
  return (
    <Link to={`/encyclopedie/terme/${term.id}`} className="btn ghost small" style={{ alignSelf: 'flex-start' }} data-testid="understand-term">
      Comprendre ce terme : {term.name}
    </Link>
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
  const navTo = useNavigate();
  useNavActions({ techniques: p && { run: () => navTo(`/techniques?d=${p.discipline}`) } });
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
      <UnderstandLink term={termForPartner(p.id)} />
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
