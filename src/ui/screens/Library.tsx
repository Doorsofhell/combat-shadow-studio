import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID, TECHNIQUES, techniquesFor } from '../../domain/techniques';
import { EXERCISES, EXERCISE_BY_ID } from '../../domain/exercises';
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
import { CameraControls, EmptyState, EntryCard, FilterChips, LevelSelector, PageHead, PlaybackControls, SectionHead, Tabs, TechniqueCard } from '../components';
import { ExerciseList, ExerciseSheet } from './Discipline';
import { IconChevron, IconLayers, IconPlay, IconPlus, IconStar, IconStarFilled, IconTrend, IconTrophy } from '../icons';
import { CHAMPIONS_AVAILABLE } from './features';

const CoachStage = lazy(() => import('../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

type HubTab = 'techniques' | 'combinaisons' | 'legendes' | 'createur' | 'favoris' | 'programmes';

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'techniques', label: 'Techniques' },
  { id: 'combinaisons', label: 'Combinaisons' },
  { id: 'legendes', label: 'Légendes' },
  { id: 'createur', label: 'Créateur' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'programmes', label: 'Programmes' },
];

const GLYPH: Record<Technique['category'], string> = {
  garde: 'G',
  poing: 'P',
  pied: 'J',
  genou: 'Ge',
  coude: 'C',
  defense: 'D',
  deplacement: 'Dp',
  lutte: 'L',
  sol: 'S',
  feinte: 'F',
  clinch: 'Cl',
};

/** "Techniques" tab: individual techniques, combinations, legends, creator, favourites, programmes. */
export function Library() {
  const [q, setQ] = useSearchParams();
  const main = useProfile((s) => s.profile.mainDiscipline);
  const tab = (HUB_TABS.some((t) => t.id === q.get('tab')) ? q.get('tab') : 'techniques') as HubTab;
  const d = (DISCIPLINES.some((x) => x.id === q.get('d')) ? q.get('d') : main) as DisciplineId;
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(q);
    n.set(k, v);
    setQ(n, { replace: true });
  };
  return (
    <div className="page">
      <PageHead title="Techniques" eyebrow="Bibliothèque" back={false} />
      <Tabs variant="underline" label="Sections" items={HUB_TABS} value={tab} onChange={(t) => set('tab', t)} />
      <div role="tabpanel" className="stack" style={{ gap: 16 }}>
        {tab === 'techniques' && <TechniquesTab d={d} setD={(x) => set('d', x)} />}
        {tab === 'combinaisons' && <CombosTab d={d} setD={(x) => set('d', x)} />}
        {tab === 'legendes' && <LegendsTab />}
        {tab === 'createur' && <CreatorTab />}
        {tab === 'favoris' && <FavoritesTab />}
        {tab === 'programmes' && <ProgramsTab />}
      </div>
    </div>
  );
}

function DisciplineFilter({ d, setD }: { d: DisciplineId; setD: (d: DisciplineId) => void }) {
  return <Tabs label="Discipline" items={DISCIPLINES.map((x) => ({ id: x.id, label: x.short }))} value={d} onChange={setD} />;
}

function TechniquesTab({ d, setD }: { d: DisciplineId; setD: (d: DisciplineId) => void }) {
  const [cat, setCat] = useState<Technique['category'] | 'tout'>('tout');
  const fav = useGoals((s) => s.favTechniques);
  const list = techniquesFor(d);
  const cats = [...new Set(list.map((t) => t.category))];
  const shown = cat === 'tout' ? list : list.filter((t) => t.category === cat);
  return (
    <>
      <DisciplineFilter d={d} setD={(x) => (setD(x), setCat('tout'))} />
      <FilterChips
        scroll
        label="Catégorie"
        value={cat}
        onChange={setCat}
        options={[{ id: 'tout' as const, label: `Tout (${list.length})` }, ...cats.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))]}
      />
      <div className="stack" style={{ gap: 8 }}>
        {shown.map((t) => (
          <TechniqueCard key={t.id} to={`/techniques/${t.id}?d=${d}`} title={t.name} description={t.description} glyph={GLYPH[t.category]} favorite={fav.includes(t.id)} />
        ))}
      </div>
      <p className="small muted">{TECHNIQUES.length} techniques au total, chacune animée sur ton combattant 3D.</p>
    </>
  );
}

function CombosTab({ d, setD }: { d: DisciplineId; setD: (d: DisciplineId) => void }) {
  const levels = useProfile((s) => s.profile.levels);
  const [lvl, setLvl] = useState<LevelId>(levels[d]);
  const [open, setOpen] = useState<string | null>(null);
  const list = EXERCISES.filter((e) => e.discipline === d && e.level === lvl && e.kind === 'combinaison');
  const ex = open ? EXERCISE_BY_ID.get(open) : undefined;
  return (
    <>
      <DisciplineFilter d={d} setD={(x) => (setD(x), setLvl(levels[x]))} />
      <LevelSelector value={lvl} onChange={setLvl} />
      <ExerciseList list={list} onOpen={setOpen} />
      {ex && <ExerciseSheet ex={ex} onClose={() => setOpen(null)} />}
    </>
  );
}

function LegendsTab() {
  if (CHAMPIONS_AVAILABLE)
    return (
      <>
        <p className="muted">Des enchaînements inspirés du style de grands champions, exécutés par ton combattant.</p>
        <EntryCard to="/champions" icon={<IconTrophy />} tone="gold" title="Combinaisons des légendes" text="Parcourir les champions et leurs combinaisons" testId="open-champions" />
      </>
    );
  return <EmptyState title="Combinaisons des légendes" text="Cette bibliothèque arrive bientôt : des enchaînements inspirés du style de grands champions." />;
}

function CreatorTab() {
  const combos = useCustom((s) => s.combos);
  return (
    <>
      <EntryCard to="/createur" icon={<IconPlus />} tone="red" title="Créer un enchaînement" text="Compose ta combinaison, l’application vérifie qu’elle est réalisable." />
      <SectionHead title="Mes enchaînements" />
      {combos.length === 0 ? (
        <EmptyState title="Aucun enchaînement enregistré" text="Tes créations apparaîtront ici." />
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {combos.map((c) => (
            <Link key={c.id} to={`/entrainement?perso=${c.id}&mode=libre`} className="card link ex-card" aria-label={`Lancer ${c.name}`}>
              <span className="icon-tile" aria-hidden>
                <IconPlay />
              </span>
              <span className="body">
                <span className="title">{c.name}</span>
                <span className="small muted">
                  {DISCIPLINES.find((x) => x.id === c.discipline)!.name} · {c.sequence.length} mouvements
                </span>
              </span>
              <IconChevron />
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
              <TechniqueCard key={t.id} to={`/techniques/${t.id}`} title={t.name} description={t.description} glyph={GLYPH[t.category]} favorite />
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
      <EntryCard to="/programmes" icon={<IconTrend />} tone="red" title="Programmes guidés" text="Séances complètes, de l’échauffement au retour au calme." />
      <EntryCard to="/createur" icon={<IconLayers />} title="Programme personnalisé" text="Crée ton enchaînement et lance-le en boucle ou en rounds." />
      <div className="stack" style={{ gap: 8 }}>
        {PROGRAMS.slice(0, 4).map((p) => (
          <Link key={p.id} to={`/programmes/${p.id}`} className="card link ex-card">
            <span className="body">
              <span className="eyebrow">{p.durationMin} min</span>
              <span className="title">{p.name}</span>
            </span>
            <IconChevron />
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
  const fav = useGoals((s) => (t ? s.favTechniques.includes(t.id) : false));
  const toggleFav = useGoals((s) => s.toggleTechnique);
  const d = ((q.get('d') as DisciplineId) && t?.disciplines.includes(q.get('d') as DisciplineId) ? q.get('d') : t?.disciplines[0]) as DisciplineId;
  const player = useRef<ComboPlayer | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [cam, setCam] = useState(settings.cameraAngle);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const onPlayer = useCallback(
    (p: ComboPlayer) => {
      player.current = p;
      if (!t) return;
      p.speed = speedRef.current;
      p.setSequence(playerSteps([t.id]), 1.2);
      p.play();
    },
    [t],
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
    <div className="page" style={{ gap: 16 }}>
      <PageHead
        title={t.name}
        eyebrow={CATEGORY_LABEL[t.category]}
        fallback="/techniques"
        right={
          <button type="button" className="btn icon ghost" aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggleFav(t.id)} style={{ marginRight: -10 }}>
            {fav ? <IconStarFilled style={{ color: 'var(--gold)' }} /> : <IconStar />}
          </button>
        }
      />
      <div className="preview-stage">
        <Suspense fallback={<div className="hero-loading"><div className="stage-skeleton" /></div>}>
          <CoachStage
            backdrop="dark"
            coach={fighter?.look.sex ?? profile.coach ?? 'homme'}
            discipline={d}
            southpaw={profile.guard === 'gaucher'}
            cameraAngle={cam}
            quality={settings.quality}
            events={events}
            onPlayer={onPlayer}
          />
        </Suspense>
      </div>
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
      />
      <CameraControls value={cam} onChange={setCam} />
      <p>{t.description}</p>
      {t.soloNote && <div className="note">{t.soloNote}</div>}
      <GuideCard id={t.id} southpaw={profile.guard === 'gaucher'} />
      <div className="card stack">
        <h3>Consignes du coach</h3>
        <ul className="plain-list">
          {t.cues.map((k, i) => (
            <li key={i}>{k}</li>
          ))}
        </ul>
      </div>
      <p className="small muted">Disciplines : {t.disciplines.map((x) => DISCIPLINES.find((y) => y.id === x)!.name).join(', ')}</p>
    </div>
  );
}
