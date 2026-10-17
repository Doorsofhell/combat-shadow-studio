import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DISCIPLINES, LEVELS } from '../../domain/types';
import type { DisciplineId, LevelId, TrainingMode } from '../../domain/types';
import { TECHNIQUE_BY_ID, techniquesFor } from '../../domain/techniques';
import { sequenceView, stageAzimuth } from '../../domain/camera';
import type { Catalog, CatalogCombo, CatalogGoal, CatalogStatus } from '../../domain/catalog/types';
import { DISTANCE_LABEL, GOAL_LABEL, GUARD_LABEL, STANCE_LABEL, STATUS_HELP, STATUS_LABEL, tagLabel } from '../../domain/catalog/types';
import { LENGTH_BANDS, allTags, catalogCounts, dailyPick, randomPick, recentCombos, searchCombos } from '../../domain/catalog/search';
import type { CatalogQuery, LengthBand } from '../../domain/catalog/search';
import { isPlayable3D } from '../../domain/catalog/validate';
import type { ImportResult } from '../../domain/catalog/import';
import { useCatalog, useCatalogData, useCatalogUser } from '../../store/catalog';
import { useCustom } from '../../store/custom';
import { useSettings } from '../../store/settings';
import { MODE_HELP, MODE_LABEL } from '../training/plan';
import { PageHead } from '../App';
import { IconChevron, IconPlay, IconPlus, IconTrash } from '../icons';

const DISC_NAME = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.name])) as Record<DisciplineId, string>;
const DISC_SHORT = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.short])) as Record<DisciplineId, string>;
const LEVEL_NAME = Object.fromEntries(LEVELS.map((l) => [l.id, l.name])) as Record<LevelId, string>;
const STATUS_CLASS: Record<CatalogStatus, string> = { verifiee: 'badge gold', adaptee: 'badge red', inspiree: 'badge' };
const PAGE = 40;

// ------------------------------------------------------------------ chargement

function Loading({ catalogError, retry }: { catalogError: string | null; retry: () => void }) {
  if (catalogError)
    return (
      <div className="stack">
        <div className="note err">{catalogError}</div>
        <button className="btn" onClick={retry}>
          Réessayer
        </button>
      </div>
    );
  return <div className="loading">Chargement de la bibliothèque…</div>;
}

const useRetry = () => useCatalog();

// ------------------------------------------------------------------ éléments communs

function StatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <span className={STATUS_CLASS[status]} title={STATUS_HELP[status]}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function FavButton({ id, name }: { id: string; name: string }) {
  const fav = useCatalogUser((s) => s.favorites.includes(id));
  const toggle = useCatalogUser((s) => s.toggleFavorite);
  return (
    <button
      className="btn icon ghost"
      aria-pressed={fav}
      aria-label={fav ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      style={{ fontSize: '1.35rem', color: fav ? 'var(--gold)' : 'var(--muted)' }}
    >
      {fav ? '★' : '☆'}
    </button>
  );
}

function ComboRow({ c, catalog, extra }: { c: CatalogCombo; catalog: Catalog; extra?: React.ReactNode }) {
  const ch = catalog.championById.get(c.champion);
  return (
    <div className="panel-row">
      <Link to={`/champions/${c.id}`} className="grow" style={{ color: 'inherit', textDecoration: 'none' }} data-testid={`cat-${c.id}`}>
        <b style={{ display: 'block' }}>{c.name}</b>
        <span className="hint">
          {ch?.name ?? c.champion} · {DISC_SHORT[c.discipline]} · {c.sequence.length} mouvements · {LEVEL_NAME[c.level]}
        </span>
        <span className="row" style={{ gap: 6, marginTop: 4 }}>
          <StatusBadge status={c.status} />
          {catalog.imported.has(c.id) && <span className="badge">Importée</span>}
          {c.guard !== 'les-deux' && <span className="badge">{GUARD_LABEL[c.guard]}</span>}
        </span>
      </Link>
      {extra}
      <FavButton id={c.id} name={c.name} />
    </div>
  );
}

function ComboList({ list, catalog, empty, extra }: { list: CatalogCombo[]; catalog: Catalog; empty: React.ReactNode; extra?: (c: CatalogCombo) => React.ReactNode }) {
  const [n, setN] = useState(PAGE);
  useEffect(() => setN(PAGE), [list]);
  if (!list.length) return <div className="empty">{empty}</div>;
  return (
    <div className="stack">
      <div className="panel">
        {list.slice(0, n).map((c) => (
          <ComboRow key={c.id} c={c} catalog={catalog} extra={extra?.(c)} />
        ))}
      </div>
      {list.length > n && (
        <button className="btn secondary" onClick={() => setN(n + PAGE)}>
          Afficher plus ({list.length - n} restantes)
        </button>
      )}
    </div>
  );
}

function Counters({ list }: { list: CatalogCombo[] }) {
  const n = useMemo(() => catalogCounts(list), [list]);
  const tiles: [string, number, boolean?][] = [
    ['Fiches', n.total],
    ['Vérifiées', n.verifiee, true],
    ['Adaptées', n.adaptee],
    ['Inspirées', n.inspiree],
    ['Jouables en 3D', n.playable],
  ];
  return (
    <div className="stat-tiles" data-testid="cat-counters">
      {tiles.map(([k, v, gold]) => (
        <div key={k} className={`stat-tile ${gold ? 'gold' : ''}`}>
          <span className="v">{v}</span>
          <span className="k">{k}</span>
        </div>
      ))}
    </div>
  );
}

function StatusExplainer() {
  return (
    <details className="note">
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Que signifient les statuts ?</summary>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
        {(['verifiee', 'adaptee', 'inspiree'] as CatalogStatus[]).map((s) => (
          <li key={s}>
            <b>{STATUS_LABEL[s]}</b> : {STATUS_HELP[s]}
          </li>
        ))}
      </ul>
      <p className="small" style={{ margin: '8px 0 0' }}>
        Les fiches livrées avec l’application sont toutes « inspirées » : aucune séquence n’est attribuée à un champion sans source vérifiable. Des fiches vérifiées ou adaptées peuvent être ajoutées par import, avec leur
        référence.
      </p>
    </details>
  );
}

// ------------------------------------------------------------------ page principale

type View = 'explorer' | 'favoris' | 'historique' | 'recents' | 'collections' | 'champions' | 'importer';
const VIEWS: { id: View; label: string }[] = [
  { id: 'explorer', label: 'Explorer' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'historique', label: 'Historique' },
  { id: 'recents', label: 'Récents' },
  { id: 'collections', label: 'Collections' },
  { id: 'champions', label: 'Champions' },
  { id: 'importer', label: 'Importer' },
];

export function Champions() {
  const { catalog, error, retry } = useRetry();
  const [q, setQ] = useSearchParams();
  const view = (q.get('vue') as View) ?? 'explorer';
  const setView = (v: View) => {
    const n = new URLSearchParams(q);
    n.set('vue', v);
    setQ(n, { replace: true });
  };
  return (
    <div className="page">
      <PageHead title="Champions" eyebrow="Bibliothèque des combinaisons" />
      {!catalog ? (
        <Loading catalogError={error} retry={retry} />
      ) : (
        <>
          <Counters list={catalog.combos} />
          <StatusExplainer />
          <div className="utabs" role="tablist" aria-label="Sections de la bibliothèque">
            {VIEWS.map((v) => (
              <button key={v.id} role="tab" className="utab" aria-selected={view === v.id} onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          {view === 'explorer' && <Explorer catalog={catalog} />}
          {view === 'favoris' && <Favorites catalog={catalog} />}
          {view === 'historique' && <HistoryView catalog={catalog} />}
          {view === 'recents' && <ComboList list={recentCombos(catalog.combos, 60)} catalog={catalog} empty="Aucune fiche." />}
          {view === 'collections' && <Collections catalog={catalog} />}
          {view === 'champions' && <ChampionGrid catalog={catalog} />}
          {view === 'importer' && <ImportView catalog={catalog} />}
        </>
      )}
    </div>
  );
}

function Explorer({ catalog }: { catalog: Catalog }) {
  const nav = useNavigate();
  const [q, setQ] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const get = (k: string) => q.get(k) ?? undefined;
  const query: CatalogQuery = {
    text: get('q'),
    discipline: get('d') as DisciplineId | undefined,
    champion: get('champion'),
    technique: get('tech'),
    level: get('niveau') as LevelId | undefined,
    guard: get('garde') as CatalogQuery['guard'],
    length: get('long') as LengthBand | undefined,
    tag: get('tag'),
    goal: get('but') as CatalogGoal | undefined,
    status: get('statut') as CatalogStatus | undefined,
  };
  const setMany = (p: Record<string, string | null | undefined>) => {
    const n = new URLSearchParams(q);
    for (const [k, v] of Object.entries(p)) {
      if (!v) n.delete(k);
      else n.set(k, v);
    }
    setQ(n, { replace: true });
  };
  const set = (k: string, v: string | null | undefined) => setMany({ [k]: v });
  const toggle = (k: string, v: string) => set(k, q.get(k) === v ? null : v);
  const results = useMemo(() => searchCombos(catalog, query), [catalog, q.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const tags = useMemo(() => allTags(catalog.combos), [catalog]);
  const techs = query.discipline ? techniquesFor(query.discipline) : [...TECHNIQUE_BY_ID.values()];
  const today = useMemo(() => dailyPick(catalog.combos), [catalog]);
  const active = ['champion', 'tech', 'niveau', 'garde', 'long', 'tag', 'but', 'statut'].filter((k) => q.get(k)).length;
  const champs = catalog.champions.filter((c) => !query.discipline || c.disciplines.includes(query.discipline)).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <div className="stack">
      {today && (
        <Link to={`/champions/${today.id}`} className="card link stack" style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="cat-daily">
          <span className="eyebrow">Fiche du jour</span>
          <b>{today.name}</b>
          <span className="small muted">
            {catalog.championById.get(today.champion)?.name} · {DISC_NAME[today.discipline]} · {today.sequence.length} mouvements
          </span>
        </Link>
      )}
      <div className="field">
        <label htmlFor="cat-q">Rechercher</label>
        <input id="cat-q" className="input" type="search" value={query.text ?? ''} onChange={(e) => set('q', e.target.value)} placeholder="Champion, technique, objectif… (ex. Tyson, crochet, teep)" />
      </div>
      <div className="chip-scroll" role="group" aria-label="Discipline">
        <button className="chip" aria-pressed={!query.discipline} onClick={() => set('d', null)}>
          Toutes
        </button>
        {DISCIPLINES.map((d) => (
          <button key={d.id} className="chip" aria-pressed={query.discipline === d.id} onClick={() => setMany({ d: query.discipline === d.id ? null : d.id, tech: null, champion: null })}>
            {d.short}
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn sm secondary" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
          Filtres{active ? ` (${active})` : ''}
        </button>
        {active > 0 && (
          <button
            className="btn sm ghost"
            onClick={() => {
              const n = new URLSearchParams(q);
              for (const k of ['champion', 'tech', 'niveau', 'garde', 'long', 'tag', 'but', 'statut']) n.delete(k);
              setQ(n, { replace: true });
            }}
          >
            Effacer les filtres
          </button>
        )}
        <button
          className="btn sm"
          disabled={!results.length}
          onClick={() => {
            const c = randomPick(results);
            if (c) nav(`/champions/${c.id}`);
          }}
          data-testid="cat-random"
        >
          Au hasard
        </button>
      </div>
      {showFilters && (
        <div className="card stack">
          <div className="grid2">
            <div className="field">
              <label htmlFor="cat-champ">Champion</label>
              <select id="cat-champ" className="input" value={query.champion ?? ''} onChange={(e) => set('champion', e.target.value)}>
                <option value="">Tous</option>
                {champs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cat-tech">Technique</label>
              <select id="cat-tech" className="input" value={query.technique ?? ''} onChange={(e) => set('tech', e.target.value)}>
                <option value="">Toutes</option>
                {techs
                  .filter((t) => t.id !== 'garde')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <span className="label">Niveau</span>
          <div className="row" style={{ gap: 6 }}>
            {LEVELS.map((l) => (
              <button key={l.id} className="chip" aria-pressed={query.level === l.id} onClick={() => toggle('niveau', l.id)}>
                {l.name}
              </button>
            ))}
          </div>
          <span className="label">Garde</span>
          <div className="row" style={{ gap: 6 }}>
            {(['orthodoxe', 'gaucher'] as const).map((g) => (
              <button key={g} className="chip" aria-pressed={query.guard === g} onClick={() => toggle('garde', g)}>
                {GUARD_LABEL[g]}
              </button>
            ))}
          </div>
          <span className="label">Longueur</span>
          <div className="row" style={{ gap: 6 }}>
            {LENGTH_BANDS.map((b) => (
              <button key={b.id} className="chip" aria-pressed={query.length === b.id} onClick={() => toggle('long', b.id)}>
                {b.label}
              </button>
            ))}
          </div>
          <span className="label">Objectif</span>
          <div className="row" style={{ gap: 6 }}>
            {(Object.keys(GOAL_LABEL) as CatalogGoal[]).map((g) => (
              <button key={g} className="chip" aria-pressed={query.goal === g} onClick={() => toggle('but', g)}>
                {GOAL_LABEL[g]}
              </button>
            ))}
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="cat-tag">Thème</label>
              <select id="cat-tag" className="input" value={query.tag ?? ''} onChange={(e) => set('tag', e.target.value)}>
                <option value="">Tous</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {tagLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cat-status">Statut</label>
              <select id="cat-status" className="input" value={query.status ?? ''} onChange={(e) => set('statut', e.target.value)}>
                <option value="">Tous</option>
                {(['verifiee', 'adaptee', 'inspiree'] as CatalogStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      <p className="small muted" aria-live="polite">
        {results.length} fiche{results.length > 1 ? 's' : ''}
      </p>
      <ComboList list={results} catalog={catalog} empty={<strong>Aucune fiche ne correspond à ces critères.</strong>} />
    </div>
  );
}

function Favorites({ catalog }: { catalog: Catalog }) {
  const ids = useCatalogUser((s) => s.favorites);
  const list = ids.map((id) => catalog.comboById.get(id)).filter((c): c is CatalogCombo => !!c);
  return (
    <ComboList
      list={list}
      catalog={catalog}
      empty={
        <>
          <strong>Aucun favori pour l’instant.</strong>
          <span>Touche l’étoile d’une fiche pour la retrouver ici.</span>
        </>
      }
    />
  );
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function HistoryView({ catalog }: { catalog: Catalog }) {
  const history = useCatalogUser((s) => s.history);
  const clear = useCatalogUser((s) => s.clearHistory);
  const rows = history.filter((h) => catalog.comboById.has(h.id));
  if (!rows.length)
    return (
      <div className="empty">
        <strong>Historique vide.</strong>
        <span>Les fiches ouvertes et les séances lancées apparaîtront ici.</span>
      </div>
    );
  return (
    <div className="stack">
      <div className="panel">
        {rows.map((h) => (
          <ComboRow
            key={`${h.id}-${h.kind}`}
            c={catalog.comboById.get(h.id)!}
            catalog={catalog}
            extra={
              <span className="small muted" style={{ textAlign: 'right' }}>
                {h.kind === 'entraine' ? 'Entraînée' : 'Ouverte'}
                <br />
                {fmtDate(h.at)}
              </span>
            }
          />
        ))}
      </div>
      <button className="btn secondary" onClick={clear}>
        Effacer l’historique
      </button>
    </div>
  );
}

function Collections({ catalog }: { catalog: Catalog }) {
  const { collections, createCollection, renameCollection, deleteCollection, removeFromCollection } = useCatalogUser();
  const [name, setName] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  return (
    <div className="stack">
      <form
        className="row nowrap"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setOpen(createCollection(name));
          setName('');
        }}
      >
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la nouvelle collection" aria-label="Nom de la nouvelle collection" />
        <button className="btn" type="submit" disabled={!name.trim()}>
          <IconPlus width={18} /> Créer
        </button>
      </form>
      {!collections.length && (
        <div className="empty">
          <strong>Aucune collection.</strong>
          <span>Regroupe tes fiches par thème (ex. « Contres au corps »), puis ajoute-les depuis chaque fiche.</span>
        </div>
      )}
      {collections.map((col) => {
        const list = col.ids.map((id) => catalog.comboById.get(id)).filter((c): c is CatalogCombo => !!c);
        return (
          <div key={col.id} className="card stack">
            {editing?.id === col.id ? (
              <form
                className="row nowrap"
                onSubmit={(e) => {
                  e.preventDefault();
                  renameCollection(col.id, editing.name);
                  setEditing(null);
                }}
              >
                <input className="input" value={editing.name} onChange={(e) => setEditing({ id: col.id, name: e.target.value })} aria-label="Nouveau nom" autoFocus />
                <button className="btn sm" type="submit">
                  OK
                </button>
              </form>
            ) : (
              <div className="row nowrap">
                <button className="btn ghost" style={{ flex: 1, justifyContent: 'flex-start', padding: 0 }} onClick={() => setOpen(open === col.id ? null : col.id)} aria-expanded={open === col.id}>
                  <b>{col.name}</b>
                  <span className="small muted">
                    {list.length} fiche{list.length > 1 ? 's' : ''}
                  </span>
                </button>
                <button className="btn sm" onClick={() => setEditing({ id: col.id, name: col.name })}>
                  Renommer
                </button>
                <button className="btn sm icon" style={{ width: 38 }} onClick={() => window.confirm(`Supprimer la collection « ${col.name} » ?`) && deleteCollection(col.id)} aria-label={`Supprimer ${col.name}`}>
                  <IconTrash width={18} />
                </button>
              </div>
            )}
            {open === col.id && (
              <ComboList
                list={list}
                catalog={catalog}
                empty="Collection vide : ouvre une fiche et touche « Ajouter à une collection »."
                extra={(c) => (
                  <button className="btn sm icon" style={{ width: 38 }} onClick={() => removeFromCollection(col.id, c.id)} aria-label={`Retirer ${c.name} de la collection`}>
                    <IconTrash width={16} />
                  </button>
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChampionGrid({ catalog }: { catalog: Catalog }) {
  const [d, setD] = useState<DisciplineId | null>(null);
  const count = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of catalog.combos) if (!d || c.discipline === d) m.set(c.champion, (m.get(c.champion) ?? 0) + 1);
    return m;
  }, [catalog, d]);
  const list = catalog.champions.filter((c) => !d || c.disciplines.includes(d)).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return (
    <div className="stack">
      <div className="chip-scroll" role="group" aria-label="Discipline">
        <button className="chip" aria-pressed={!d} onClick={() => setD(null)}>
          Toutes
        </button>
        {DISCIPLINES.map((x) => (
          <button key={x.id} className="chip" aria-pressed={d === x.id} onClick={() => setD(x.id)}>
            {x.short}
          </button>
        ))}
      </div>
      <div className="grid2">
        {list.map((c) => (
          <Link key={c.id} to={`/champions/c/${c.id}`} className="champ-card" data-testid={`champ-${c.id}`}>
            <span className="name">{c.name}</span>
            <span className="small muted">{c.disciplines.map((x) => DISC_SHORT[x]).join(' · ')}</span>
            <span className="small">{c.traits.slice(0, 3).join(', ')}</span>
            <span className="badge gold" style={{ alignSelf: 'flex-start' }}>
              {count.get(c.id) ?? 0} fiches
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ImportView({ catalog }: { catalog: Catalog }) {
  const file = useCatalogData((s) => s.file);
  const importFile = useCatalogUser((s) => s.importFile);
  const clearImported = useCatalogUser((s) => s.clearImported);
  const removeImported = useCatalogUser((s) => s.removeImported);
  const imported = useCatalogUser((s) => s.imported);
  const [report, setReport] = useState<ImportResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const onFile = async (f: File | undefined) => {
    setReport(null);
    setReadError(null);
    if (!f || !file) return;
    let data: unknown;
    try {
      data = JSON.parse(await f.text());
    } catch {
      setReadError('Ce fichier n’est pas un JSON valide.');
      return;
    }
    setReport(importFile(file, data));
    if (input.current) input.current.value = '';
  };
  const list = imported.combos.map((c) => catalog.comboById.get(c.id) ?? c);
  return (
    <div className="stack">
      <p className="muted">
        Ajoute des fiches sans mise à jour de l’application : choisis un fichier JSON au même format que le catalogue (<code>schema: 1</code>). Chaque fiche est vérifiée : techniques connues et autorisées dans la discipline,
        champs complets, statut justifié (une fiche vérifiée doit citer le combat et le moment exact), séquence non déjà présente.
      </p>
      <label className="btn primary block" style={{ cursor: 'pointer' }}>
        Choisir un fichier JSON
        <input ref={input} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} data-testid="cat-import" />
      </label>
      {readError && <div className="note err">{readError}</div>}
      {report?.error && <div className="note err">{report.error}</div>}
      {report && !report.error && (
        <div className={`note ${report.rejected.length ? 'warn' : ''}`} role="status">
          <b>
            {report.added.length} fiche{report.added.length > 1 ? 's' : ''} ajoutée{report.added.length > 1 ? 's' : ''}, {report.updated.length} mise{report.updated.length > 1 ? 's' : ''} à jour, {report.rejected.length} refusée
            {report.rejected.length > 1 ? 's' : ''}.
          </b>
          {report.championsAdded.length > 0 && <div>Nouveaux champions : {report.championsAdded.join(', ')}.</div>}
          {report.superseded.length > 0 && <div>{report.superseded.length} fiche(s) inspirée(s) remplacée(s) par une version au statut plus fort.</div>}
          {report.rejected.length > 0 && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {report.rejected.slice(0, 30).map((r) => (
                <li key={r.id}>
                  <b>{r.id}</b> : {r.reasons.join(' ; ')}
                </li>
              ))}
              {report.rejected.length > 30 && <li>… et {report.rejected.length - 30} autres.</li>}
            </ul>
          )}
        </div>
      )}
      <h2>Fiches importées ({list.length})</h2>
      <ComboList
        list={list}
        catalog={catalog}
        empty="Aucune fiche importée."
        extra={(c) => (
          <button className="btn sm icon" style={{ width: 38 }} onClick={() => removeImported(c.id)} aria-label={`Supprimer la fiche importée ${c.name}`}>
            <IconTrash width={16} />
          </button>
        )}
      />
      {list.length > 0 && (
        <button className="btn secondary" onClick={() => window.confirm('Supprimer toutes les fiches importées ?') && clearImported()}>
          Supprimer toutes les fiches importées
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ page d’une fiche

function cameraLabel(az: number, el: number) {
  const a = Math.abs(az);
  const side = az >= 0 ? 'côté avant' : 'côté arrière';
  const base = a < 15 ? 'De face' : a < 56 ? `Trois quarts ${side}` : a < 120 ? `Profil ${side}` : 'De dos';
  return el >= 30 ? `${base}, vue surélevée` : el >= 15 ? `${base}, légèrement au-dessus` : base;
}

const MODES: TrainingMode[] = ['libre', 'technique', 'cardio', 'rounds'];

export function ComboPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { catalog, error, retry } = useRetry();
  const pushHistory = useCatalogUser((s) => s.pushHistory);
  const settings = useSettings((s) => s.settings);
  const saveCustom = useCustom((s) => s.save);
  const [mode, setMode] = useState<TrainingMode>('libre');
  const [round, setRound] = useState(settings.defaultRoundSec);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [rounds, setRounds] = useState(3);
  const [collect, setCollect] = useState(false);
  const c = id ? catalog?.comboById.get(id) : undefined;
  useEffect(() => {
    if (c) pushHistory(c.id, 'ouvert');
  }, [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!catalog)
    return (
      <div className="page">
        <PageHead title="Fiche" eyebrow="Champions" />
        <Loading catalogError={error} retry={retry} />
      </div>
    );
  if (!c)
    return (
      <div className="page">
        <PageHead title="Fiche introuvable" eyebrow="Champions" />
        <div className="empty">
          <strong>Cette fiche n’existe pas ou a été retirée.</strong>
          <Link className="btn" to="/champions">
            Retour à la bibliothèque
          </Link>
        </div>
      </div>
    );

  const ch = catalog.championById.get(c.champion);
  const view = sequenceView(c.sequence);
  const viewAz = Math.round(stageAzimuth(view, c.discipline, false));
  const playable = isPlayable3D(c);
  const train = (m: TrainingMode, study = false) => {
    const p = new URLSearchParams({ cat: c.id, mode: m });
    if (study) p.set('study', '1');
    if (m === 'rounds') {
      p.set('round', String(round));
      p.set('rest', String(rest));
      p.set('rounds', String(rounds));
    }
    pushHistory(c.id, 'entraine');
    nav(`/entrainement?${p}`);
  };
  const duplicate = (sequence: string[], label = c.name) => {
    saveCustom({ id: `cat-${Date.now().toString(36)}`, name: `${label} (copie)`, discipline: c.discipline, sequence: [...sequence], createdAt: new Date().toISOString() });
    nav(`/createur?d=${c.discipline}`);
  };

  return (
    <div className="page">
      <PageHead title={c.name} eyebrow={`${ch?.name ?? c.champion} · ${DISC_NAME[c.discipline]}`} right={<FavButton id={c.id} name={c.name} />} />

      <div className="row" style={{ gap: 6 }}>
        <StatusBadge status={c.status} />
        <span className="badge">{LEVEL_NAME[c.level]}</span>
        <span className="badge">{GUARD_LABEL[c.guard]}</span>
        <span className="badge">Distance {DISTANCE_LABEL[c.distance].toLowerCase()}</span>
        <span className="badge">{c.sequence.length} mouvements</span>
        <span className="badge">≈ {c.estimatedSec} s par répétition</span>
        <span className="badge">{GOAL_LABEL[c.goal]}</span>
        {playable ? <span className="badge gold">Jouable en 3D</span> : <span className="badge red">Animation indisponible</span>}
        {catalog.imported.has(c.id) && <span className="badge">Importée</span>}
      </div>

      <div className={`note ${c.status === 'inspiree' ? 'warn' : ''}`} data-testid="cat-status">
        <b>Statut : {STATUS_LABEL[c.status]}.</b> {STATUS_HELP[c.status]}
        <div className="small" style={{ marginTop: 6 }}>
          Source : {c.source.note}
          {c.source.reference && <> — {c.source.reference}</>}
          {c.source.timestamp && <> ({c.source.timestamp})</>}
          {c.source.url && (
            <>
              {' '}
              <a href={c.source.url} target="_blank" rel="noreferrer noopener">
                lien
              </a>
            </>
          )}
        </div>
      </div>

      <section className="section">
        <h2>Séquence</h2>
        <div className="seq">
          {c.sequence.map((t, i) => (
            <Link key={i} to={`/techniques/${t}?d=${c.discipline}`} className="badge" style={{ textDecoration: 'none' }}>
              {i + 1}. {TECHNIQUE_BY_ID.get(t)?.name ?? t}
            </Link>
          ))}
        </div>
        <p>
          <b>Objectif : </b>
          {c.objective}
        </p>
      </section>

      <div className="grid2">
        <section className="card stack">
          <span className="panel-title" style={{ margin: 0 }}>
            Points clés
          </span>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {c.keyPoints.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </section>
        <section className="card stack">
          <span className="panel-title" style={{ margin: 0 }}>
            Erreurs fréquentes
          </span>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {c.errors.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card stack" data-testid="cat-camera">
        <span className="panel-title" style={{ margin: 0 }}>
          Angle de caméra recommandé
        </span>
        <b>
          {cameraLabel(viewAz, view.el)} <span className="small muted">(azimut {viewAz}°, élévation {view.el}°)</span>
        </b>
        <span className="small">{view.why}</span>
        <span className="small muted">En garde gaucher, l’angle est automatiquement inversé.</span>
      </section>

      <section className="section">
        <h2>Variantes</h2>
        <div className="panel">
          {c.variants.map((v, i) => (
            <div key={i} className="panel-row col">
              <span>{v.label}</span>
              {v.sequence && (
                <>
                  <div className="seq">
                    {v.sequence.map((t, j) => (
                      <span key={j} className="badge">
                        {j + 1}. {TECHNIQUE_BY_ID.get(t)?.name ?? t}
                      </span>
                    ))}
                  </div>
                  <button className="btn sm secondary" style={{ alignSelf: 'flex-start' }} onClick={() => duplicate(v.sequence!, `${c.name} – variante`)}>
                    Dupliquer cette variante dans le créateur
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <span className="label">Mode</span>
        <div className="seg" role="radiogroup" aria-label="Mode d’entraînement">
          {MODES.map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} data-testid={`cat-mode-${m}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="small muted">{MODE_HELP[mode]}</p>
        {mode === 'rounds' && <RoundPicker round={round} rest={rest} rounds={rounds} setRound={setRound} setRest={setRest} setRounds={setRounds} />}
        <button className="btn primary block" disabled={!playable} onClick={() => train(mode)} data-testid="cat-train">
          <IconPlay /> S’entraîner
        </button>
        <div className="grid2">
          <button className="btn" disabled={!playable} onClick={() => train('technique', true)} data-testid="cat-study">
            Décomposer
          </button>
          <button className="btn" onClick={() => duplicate(c.sequence)} data-testid="cat-duplicate">
            Dupliquer dans le créateur
          </button>
        </div>
        <button className="btn secondary" onClick={() => setCollect(true)}>
          <IconPlus width={18} /> Ajouter à une collection
        </button>
      </section>

      {ch && (
        <Link to={`/champions/c/${ch.id}`} className="card link stack" style={{ gap: 6 }}>
          <span className="eyebrow">Profil de style</span>
          <span className="row between nowrap">
            <b>{ch.name}</b>
            <IconChevron />
          </span>
          <span className="small">{ch.style}</span>
          <span className="small muted">{ch.source}</span>
        </Link>
      )}

      <p className="small muted">
        Ajoutée le {new Date(`${c.addedAt}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · réf. {c.id}
      </p>

      {collect && <CollectionSheet comboId={c.id} onClose={() => setCollect(false)} />}
    </div>
  );
}

function RoundPicker(p: { round: number; rest: number; rounds: number; setRound: (n: number) => void; setRest: (n: number) => void; setRounds: (n: number) => void }) {
  return (
    <div className="stack">
      <span className="label">Durée d’un round</span>
      <div className="row" style={{ gap: 6 }}>
        {[60, 120, 180, 300].map((s) => (
          <button key={s} className="chip" aria-pressed={p.round === s} onClick={() => p.setRound(s)}>
            {s / 60} min
          </button>
        ))}
      </div>
      <span className="label">Repos entre les rounds</span>
      <div className="row" style={{ gap: 6 }}>
        {[15, 30, 45, 60, 90].map((s) => (
          <button key={s} className="chip" aria-pressed={p.rest === s} onClick={() => p.setRest(s)}>
            {s} s
          </button>
        ))}
      </div>
      <label className="label" htmlFor="cat-rounds">
        Nombre de rounds : {p.rounds}
      </label>
      <input id="cat-rounds" type="range" min={1} max={12} value={p.rounds} onChange={(e) => p.setRounds(Number(e.target.value))} />
    </div>
  );
}

function CollectionSheet({ comboId, onClose }: { comboId: string; onClose: () => void }) {
  const { collections, createCollection, addToCollection, removeFromCollection } = useCatalogUser();
  const [name, setName] = useState('');
  return (
    <div className="ds-backdrop" onClick={onClose}>
      <div className="ds-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ajouter à une collection">
        <span className="grab" />
        <h2>Ajouter à une collection</h2>
        {collections.length > 0 ? (
          <div className="row" style={{ gap: 6 }}>
            {collections.map((col) => {
              const inside = col.ids.includes(comboId);
              return (
                <button key={col.id} className="chip" aria-pressed={inside} onClick={() => (inside ? removeFromCollection(col.id, comboId) : addToCollection(col.id, comboId))}>
                  {col.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="small muted">Aucune collection : crée la première ci-dessous.</p>
        )}
        <form
          className="row nowrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createCollection(name, [comboId]);
            setName('');
          }}
        >
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle collection" aria-label="Nom de la nouvelle collection" />
          <button className="btn" type="submit" disabled={!name.trim()}>
            Créer
          </button>
        </form>
        <button className="btn block" onClick={onClose}>
          Terminé
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ page d’un champion

export function ChampionPage() {
  const { championId } = useParams();
  const { catalog, error, retry } = useRetry();
  const ch = championId ? catalog?.championById.get(championId) : undefined;
  const [d, setD] = useState<DisciplineId | null>(null);
  if (!catalog)
    return (
      <div className="page">
        <PageHead title="Champion" eyebrow="Champions" />
        <Loading catalogError={error} retry={retry} />
      </div>
    );
  if (!ch)
    return (
      <div className="page">
        <PageHead title="Champion introuvable" eyebrow="Champions" />
        <Link className="btn" to="/champions?vue=champions">
          Tous les champions
        </Link>
      </div>
    );
  const disc = d && ch.disciplines.includes(d) ? d : ch.disciplines[0];
  const all = catalog.combos.filter((c) => c.champion === ch.id);
  const list = all.filter((c) => c.discipline === disc).sort((a, b) => LEVELS.findIndex((l) => l.id === a.level) - LEVELS.findIndex((l) => l.id === b.level) || a.sequence.length - b.sequence.length);
  return (
    <div className="page">
      <PageHead title={ch.name} eyebrow={`Profil de style · ${ch.disciplines.map((x) => DISC_SHORT[x]).join(' · ')}`} />
      <section className="card stack">
        <span>{ch.style}</span>
        <div className="row" style={{ gap: 6 }}>
          {ch.traits.map((t) => (
            <span key={t} className="badge gold">
              {t}
            </span>
          ))}
          {ch.stance && <span className="badge">Garde : {STANCE_LABEL[ch.stance]}</span>}
        </div>
        <span className="small muted">{ch.source}</span>
      </section>
      <Counters list={all} />
      <div className="note small">Les fiches ci-dessous reprennent des traits généraux de ce style. Sauf mention « Vérifiée » ou « Adaptée » avec sa référence, ce ne sont pas des séquences exécutées par le champion en combat.</div>
      {ch.disciplines.length > 1 && (
        <div className="tabs" role="tablist" aria-label="Discipline">
          {ch.disciplines.map((x) => (
            <button key={x} role="tab" className="tab" aria-selected={x === disc} onClick={() => setD(x)}>
              {DISC_NAME[x]} ({all.filter((c) => c.discipline === x).length})
            </button>
          ))}
        </div>
      )}
      <ComboList list={list} catalog={catalog} empty="Aucune fiche pour cette discipline." />
      <Link className="btn secondary" to={`/champions?vue=explorer&champion=${ch.id}&d=${disc}`}>
        Rechercher dans ses fiches
      </Link>
    </div>
  );
}
