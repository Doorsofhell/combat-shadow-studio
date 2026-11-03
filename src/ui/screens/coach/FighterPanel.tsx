import type { Fighter } from '../../../store/fighters';
import type { CoachId } from '../../../domain/types';
import { Button, Sheet } from '../../components';
import { AppIcon } from '../../icons';
import { Group } from './controls';

export function FighterPanel({
  fighters,
  editingId,
  activeId,
  name,
  onName,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
  onReset,
  onActivate,
  onRandom,
}: {
  fighters: Fighter[];
  editingId: string;
  activeId: string | null;
  name: string;
  onName: (n: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReset: () => void;
  onActivate: () => void;
  onRandom: () => void;
}) {
  const isActive = editingId === activeId;
  return (
    <>
      <Group title="Identité">
        <div className="cs-field">
          <label className="cs-label" htmlFor="cs-name">
            Nom du combattant
          </label>
          <input id="cs-name" className="input" value={name} maxLength={32} onChange={(e) => onName(e.target.value)} autoComplete="off" data-testid="fighter-name-input" />
        </div>
        {isActive ? (
          <p className="cs-active-note" data-testid="active-badge">
            <AppIcon id="check" size={18} /> C’est ton combattant actif : il te coache dans toutes les disciplines.
          </p>
        ) : (
          <Button variant="secondary" block onClick={onActivate} data-testid="set-active">
            Définir comme combattant actif
          </Button>
        )}
        <div className="cs-actions">
          <Button variant="secondary" onClick={onRandom} data-testid="random-look">
            Aléatoire
          </Button>
          <Button variant="secondary" onClick={onDuplicate} data-testid="duplicate-fighter">
            <AppIcon id="duplicate" size={18} /> Dupliquer
          </Button>
          <Button variant="secondary" onClick={onReset} data-testid="reset-look">
            Réinitialiser l’apparence
          </Button>
          <Button
            variant="danger"
            icon={<AppIcon id="delete" />}
            onClick={onDelete}
            disabled={fighters.length <= 1}
            data-testid="delete-fighter"
            title={fighters.length <= 1 ? 'Il te faut au moins un combattant' : undefined}
          >
            Supprimer
          </Button>
        </div>
        {fighters.length <= 1 && <p className="cs-hint">Ton seul combattant ne peut pas être supprimé.</p>}
      </Group>

      <Group
        title={`Mes combattants (${fighters.length})`}
        action={
          <Button variant="secondary" icon={<AppIcon id="add" />} onClick={onNew} data-testid="new-fighter">
            Nouveau
          </Button>
        }
      >
        <ul className="cs-fighters" aria-label="Combattants enregistrés">
          {fighters.map((f) => (
            <li key={f.id}>
              <button type="button" className="cs-fighter" aria-pressed={f.id === editingId} onClick={() => onSelect(f.id)} data-testid="fighter-card">
                <span className="cs-fighter-dot" style={{ background: f.look?.skin ?? '#888' }} aria-hidden />
                <span className="grow">
                  <b className="cs-fighter-name">{f.name}</b>
                  <span className="small muted">
                    {f.look?.sex === 'femme' ? 'Femme' : 'Homme'}
                    {f.id === editingId ? ' · en cours d’édition' : ''}
                  </span>
                </span>
                {f.id === activeId && <span className="cs-badge">Actif</span>}
              </button>
            </li>
          ))}
        </ul>
      </Group>
    </>
  );
}

export function NewFighterSheet({ onPick, onClose }: { onPick: (sex: CoachId) => void; onClose: () => void }) {
  return (
    <Sheet title="Nouveau combattant" eyebrow="Créateur" onClose={onClose} center>
      <p className="muted">Choisis la morphologie de départ. Tu pourras tout personnaliser ensuite.</p>
      <div className="choice-grid" role="group" aria-label="Morphologie">
        <button type="button" className="choice" onClick={() => onPick('homme')} data-testid="new-homme">
          Homme
          <span className="sub">Silhouette masculine</span>
        </button>
        <button type="button" className="choice" onClick={() => onPick('femme')} data-testid="new-femme">
          Femme
          <span className="sub">Silhouette féminine</span>
        </button>
      </div>
    </Sheet>
  );
}
