import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DISCIPLINES, type DisciplineId } from '../../../domain/types';
import { analysisState } from '../../../domain/comboAnalysis';
import { useCustom, type CustomCombo } from '../../../store/custom';
import { useGoals } from '../../../store/goals';
import { useHydrated } from '../../../store/useHydrated';
import { ConfirmDialog, PageHead, toast } from '../../components';
import { AppIcon, DisciplineIcon } from '../../icons';
import { NavPanel, usePanel } from '../../nav/NavSheets';
import { fold } from '../../nav/selection';
import { useNavActions } from '../../nav/store';
import { MasteryBadge, PictoStrip, ScoreRing, comboName, dateFr, masteryKey, useUsage, type ComboUsage } from './shared';
import { deleteCombo } from './actions';
import './creator.css';

export type Sort = 'recents' | 'utilises' | 'evaluations';
export type StatusFilter = 'tous' | 'acquise' | 'a-revoir';
const SORT_LABEL: Record<Sort, string> = { recents: 'Plus récents', utilises: 'Plus utilisés', evaluations: 'Meilleures évaluations' };
const DISC_NAME = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.name])) as Record<DisciplineId, string>;

/** the order and filters of the list, pure so it can be tested */
export function arrange(combos: readonly CustomCombo[], o: { d: DisciplineId | 'toutes'; sort: Sort; status: StatusFilter; text: string; usage: (id: string) => ComboUsage; mastery: Record<string, string> }) {
  const q = fold(o.text);
  const score = (c: CustomCombo) => (analysisState(c) === 'ok' ? c.analysis!.score : -1);
  const touched = (c: CustomCombo) => c.updatedAt ?? c.createdAt;
  return combos
    .filter((c) => o.d === 'toutes' || c.discipline === o.d)
    .filter((c) => o.status === 'tous' || o.mastery[masteryKey(c.id)] === o.status)
    .filter((c) => q.length < 2 || fold(comboName(c)).includes(q))
    .sort((a, b) => {
      if (o.sort === 'utilises') return o.usage(b.id).count - o.usage(a.id).count || touched(b).localeCompare(touched(a));
      if (o.sort === 'evaluations') return score(b) - score(a) || touched(b).localeCompare(touched(a));
      return touched(b).localeCompare(touched(a));
    });
}

/**
 * v0.38 (Youssef, 2026-10-22, « Créateur d'enchaînements V2 », plaquette écran 1): the user's sequences as tiles.
 * Tap = the sheet; pencil = edit; trash = delete after confirmation. Reached from Entraîner only (decision
 * « Entraîner seul »). Bar: Retour / Rechercher / Filtrer / Créer / Menu.
 */
export function CreatorList() {
  const nav = useNavigate();
  const [q, setQ] = useSearchParams();
  const ready = useHydrated(useCustom);
  const combos = useCustom((s) => s.combos);
  const mastery = useGoals((s) => s.mastery);
  const usage = useUsage();
  const d = (q.get('d') as DisciplineId | null) ?? 'toutes';
  const sort = (q.get('tri') as Sort | null) ?? 'recents';
  const status = (q.get('statut') as StatusFilter | null) ?? 'tous';
  const [text, setText] = useState('');
  const [doomed, setDoomed] = useState<CustomCombo | null>(null);
  const search = usePanel();
  const filters = usePanel();
  const set = (k: string, v: string, def: string) => {
    const n = new URLSearchParams(q);
    if (v === def) n.delete(k);
    else n.set(k, v);
    setQ(n, { replace: true });
  };
  const list = useMemo(() => arrange(combos, { d, sort, status, text, usage, mastery }), [combos, d, sort, status, text, usage, mastery]);
  const count = (x: DisciplineId) => combos.filter((c) => c.discipline === x).length;

  useNavActions({
    search: { run: search.show, testId: 'nav-search', ariaLabel: text ? `Rechercher : « ${text} »` : 'Rechercher un enchaînement' },
    filters: { run: filters.show, testId: 'nav-filters', ariaLabel: `Filtrer : ${SORT_LABEL[sort]}${status !== 'tous' ? `, ${status === 'acquise' ? 'acquis' : 'encore du mal'}` : ''}` },
  });

  return (
    <div className="page creator-list">
      <PageHead title="Mes enchaînements" eyebrow="Créateur" fallback="/entrainer" />

      <Link to={`/createur/nouveau${d !== 'toutes' ? `?d=${d}` : ''}`} className="creator-new card link" data-testid="create-combo">
        <span className="creator-icon" aria-hidden>
          <AppIcon id="compose" size={24} />
        </span>
        <span className="body">
          <b>Créer un enchaînement</b>
          <span className="small muted">Compose ta combinaison, l’application vérifie qu’elle est réalisable.</span>
        </span>
        <AppIcon id="chevron" size={18} />
      </Link>

      <div className="creator-filter-head">
        <h2>
          Mes enchaînements <span className="num-figure muted">({combos.length})</span>
        </h2>
        <button type="button" className="btn sm ghost" onClick={filters.show} data-testid="sort-open">
          {SORT_LABEL[sort]} <AppIcon id="chevronDown" size={14} />
        </button>
      </div>
      <div className="creator-chips" role="group" aria-label="Discipline">
        <button type="button" className={`chip ${d === 'toutes' ? 'on' : ''}`} aria-pressed={d === 'toutes'} onClick={() => set('d', 'toutes', 'toutes')} data-testid="filter-d-toutes">
          Tous ({combos.length})
        </button>
        {DISCIPLINES.map((x) => (
          <button key={x.id} type="button" className={`chip ${d === x.id ? 'on' : ''}`} aria-pressed={d === x.id} onClick={() => set('d', x.id, 'toutes')} data-testid={`filter-d-${x.id}`}>
            <DisciplineIcon id={x.id} size={18} /> {x.short} ({count(x.id)})
          </button>
        ))}
      </div>
      {(status !== 'tous' || text) && (
        <p className="small muted" data-testid="active-filters">
          {status !== 'tous' && <>Statut : {status === 'acquise' ? 'Acquis' : 'Encore du mal'}. </>}
          {text && <>Recherche : « {text} ». </>}
          <button type="button" className="link-btn" onClick={() => (setText(''), set('statut', 'tous', 'tous'))}>
            Tout afficher
          </button>
        </p>
      )}

      {!ready ? null : combos.length === 0 ? (
        <p className="muted" data-testid="combos-empty">
          Aucun enchaînement pour l’instant. Touche « Créer un enchaînement » pour composer le premier.
        </p>
      ) : list.length === 0 ? (
        <p className="muted" data-testid="combos-none">
          Aucun enchaînement ne correspond à ces filtres.
        </p>
      ) : (
        <ul className="combo-tiles" data-testid="combo-tiles">
          {list.map((c) => (
            <ComboTile key={c.id} c={c} usage={usage(c.id)} mastery={mastery[masteryKey(c.id)] as 'acquise' | 'a-revoir' | undefined} onOpen={() => nav(`/createur/${c.id}`)} onEdit={() => nav(`/createur/${c.id}/modifier`)} onDelete={() => setDoomed(c)} />
          ))}
        </ul>
      )}

      {doomed && (
        <ConfirmDialog
          title="Supprimer"
          message={`Supprimer définitivement cet enchaînement ? « ${comboName(doomed)} » sera retiré de cet appareil et de ton compte s’il est synchronisé. Ton historique d’entraînement est conservé.`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setDoomed(null)}
          onConfirm={() => {
            deleteCombo(doomed.id);
            setDoomed(null);
            toast('Enchaînement supprimé');
          }}
        />
      )}

      {search.open && (
        <NavPanel title="Rechercher un enchaînement" onClose={search.hide} testId="search-panel">
          <input className="nav-search" type="search" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Nom de l’enchaînement" aria-label="Nom de l’enchaînement" data-testid="search-input" />
          <div className="nav-actions">
            <button type="button" className="nav-action primary" onClick={() => search.hide()} data-testid="search-close">
              Voir les résultats ({list.length})
            </button>
          </div>
        </NavPanel>
      )}
      {filters.open && (
        <NavPanel title="Filtrer" onClose={filters.hide} testId="filters-panel">
          <div className="nav-field" role="group" aria-label="Trier par">
            <span>Trier par</span>
            <div className="nav-chips">
              {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                <button key={s} type="button" className={`chip ${sort === s ? 'on' : ''}`} aria-pressed={sort === s} onClick={() => set('tri', s, 'recents')} data-testid={`sort-${s}`}>
                  {SORT_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-field" role="group" aria-label="Statut">
            <span>Statut</span>
            <div className="nav-chips">
              {(['tous', 'acquise', 'a-revoir'] as StatusFilter[]).map((s) => (
                <button key={s} type="button" className={`chip ${status === s ? 'on' : ''}`} aria-pressed={status === s} onClick={() => set('statut', s, 'tous')} data-testid={`status-${s}`}>
                  {s === 'tous' ? 'Tous' : s === 'acquise' ? 'Acquis' : 'Encore du mal'}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-field" role="group" aria-label="Discipline">
            <span>Discipline</span>
            <div className="nav-chips">
              <button type="button" className={`chip ${d === 'toutes' ? 'on' : ''}`} aria-pressed={d === 'toutes'} onClick={() => set('d', 'toutes', 'toutes')}>
                Toutes
              </button>
              {DISCIPLINES.map((x) => (
                <button key={x.id} type="button" className={`chip ${d === x.id ? 'on' : ''}`} aria-pressed={d === x.id} onClick={() => set('d', x.id, 'toutes')}>
                  {x.short}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-actions">
            <button type="button" className="nav-action primary" onClick={() => filters.hide()} data-testid="filters-close">
              Voir les résultats ({list.length})
            </button>
          </div>
        </NavPanel>
      )}
    </div>
  );
}

function ComboTile({ c, usage, mastery, onOpen, onEdit, onDelete }: { c: CustomCombo; usage: ComboUsage; mastery: 'acquise' | 'a-revoir' | undefined; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const name = comboName(c);
  return (
    <li className="combo-tile" data-testid={`tile-${c.id}`}>
      <button type="button" className="combo-tile-open" onClick={onOpen} aria-label={`Ouvrir ${name}`} data-testid={`open-${c.id}`}>
        <span className="combo-tile-art" aria-hidden>
          <DisciplineIcon id={c.discipline} size={34} />
        </span>
        <span className="combo-tile-body">
          <span className="combo-tile-title">{name}</span>
          <span className="disc-tag">{DISC_NAME[c.discipline]}</span>
          <span className="combo-tile-moves">
            <PictoStrip sequence={c.sequence} />
            <span className="small muted">
              {c.sequence.length} mouvement{c.sequence.length > 1 ? 's' : ''}
            </span>
          </span>
          <span className="combo-tile-meta small muted">
            <span>Créé le {dateFr(c.createdAt)}</span>
            {c.updatedAt && <span>Modifié le {dateFr(c.updatedAt)}</span>}
            <span data-testid="tile-last">{usage.last ? `Utilisé le ${dateFr(usage.last)}` : 'Jamais utilisé'}</span>
            <span data-testid="tile-count">
              {usage.count} entraînement{usage.count > 1 ? 's' : ''}
            </span>
          </span>
        </span>
        <span className="combo-tile-side">
          <ScoreRing combo={c} />
          <MasteryBadge m={mastery} />
        </span>
      </button>
      <span className="combo-tile-actions">
        <button type="button" className="btn icon ghost" onClick={onEdit} aria-label={`Modifier ${name}`} data-testid={`edit-${c.id}`}>
          <AppIcon id="edit" size={18} />
        </button>
        <button type="button" className="btn icon ghost danger-ink" onClick={onDelete} aria-label={`Supprimer ${name}`} data-testid={`delete-${c.id}`}>
          <AppIcon id="delete" size={18} />
        </button>
      </span>
    </li>
  );
}
