import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID, techniquesFor } from '../../../domain/techniques';
import { DISCIPLINES, type DisciplineId, type TechniqueCategory } from '../../../domain/types';
import { isPlayable, validateSequence } from '../../../domain/transitions';
import { analyseCombo } from '../../../domain/comboAnalysis';
import { filterTechniques } from '../../../domain/kickboxingStyles';
import { useCustom } from '../../../store/custom';
import { useGoals } from '../../../store/goals';
import { useProfile } from '../../../store/profile';
import { useHydrated } from '../../../store/useHydrated';
import { ConfirmDialog, KickboxingStylePicker, PageHead, Tabs, toast, useKbStyle } from '../../components';
import { AppIcon, DisciplineIcon } from '../../icons';
import { NavPanel, usePanel } from '../../nav/NavSheets';
import { fold } from '../../nav/selection';
import { useNavActions } from '../../nav/store';
import { TechniquePicto } from '../../pictos/TechniquePicto';
import { useLeaveGuard } from '../coach/useLeaveGuard';
import { saveCombo } from './actions';
import { ScoreRing, masteryKey } from './shared';
import './creator.css';

const autoName = (seq: readonly string[]) => seq.map((x) => TECHNIQUE_BY_ID.get(x)?.name ?? x).join(' → ');

/**
 * v0.38 (plaquette écran 3): one editor to create (/createur/nouveau?d=) and to modify (/createur/:id/modifier) a
 * sequence. Modifying keeps the id (history and personal status follow); « Enregistrer » writes only a real change.
 * Bar: Retour / Ajouter / Enregistrer / Annuler / Menu.
 */
export function CreatorEditor() {
  // the draft starts from the saved sequence: wait until the saved sequences are read from the device
  const combosReady = useHydrated(useCustom);
  const goalsReady = useHydrated(useGoals);
  const ready = combosReady && goalsReady;
  const { id } = useParams();
  return ready ? <EditorBody key={id ?? 'nouveau'} /> : null;
}

function EditorBody() {
  const { id } = useParams();
  const [q] = useSearchParams();
  const nav = useNavigate();
  const main = useProfile((s) => s.profile.mainDiscipline);
  const existing = useCustom((s) => (id ? s.combos.find((c) => c.id === id) : undefined));
  const mastery = useGoals((s) => (id ? s.mastery[masteryKey(id)] : undefined));
  const toggleMastery = useGoals((s) => s.toggleMastery);
  const initial = useMemo(
    () => ({ name: existing?.name ?? '', discipline: existing?.discipline ?? ((q.get('d') as DisciplineId | null) ?? main), sequence: existing?.sequence ?? [] }),
    // the draft starts from what was saved when the editor opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existing?.id],
  );
  const [name, setName] = useState(initial.name);
  const [d, setD] = useState<DisciplineId>(initial.discipline);
  const [seq, setSeq] = useState<string[]>(initial.sequence);
  const [ask, setAsk] = useState<null | { go: () => void }>(null);
  const picker = usePanel();
  const issues = validateSequence(seq, d);
  const playable = seq.length > 0 && isPlayable(issues);
  const bad = new Set(issues.filter((i) => i.level === 'erreur' && i.index !== undefined).map((i) => i.index));
  const finalName = name.trim() || autoName(seq);
  const dirty = name !== initial.name || d !== initial.discipline || seq.join(',') !== initial.sequence.join(',');
  // the analysis is local and instant: shown while editing, stored on save
  const preview = useMemo(() => (seq.length ? analyseCombo(d, seq) : null), [d, seq]);
  useLeaveGuard(dirty, (go) => setAsk({ go }));

  const save = (then?: (id: string) => void) => {
    if (!playable) return;
    const c = saveCombo({ id: existing?.id, name: finalName, discipline: d, sequence: seq });
    toast(existing ? (dirty ? 'Modifications enregistrées' : 'Aucune modification') : 'Enchaînement enregistré');
    if (then) then(c.id);
    else nav(`/createur/${c.id}`, { replace: true });
  };
  const cancel = () => {
    const go = () => (existing ? nav(`/createur/${existing.id}`, { replace: true }) : nav('/createur', { replace: true }));
    if (dirty) setAsk({ go });
    else go();
  };
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= seq.length) return;
    const n = [...seq];
    [n[i], n[j]] = [n[j], n[i]];
    setSeq(n);
  };

  useNavActions({
    add: { run: picker.show, ariaLabel: 'Ajouter un mouvement', testId: 'nav-add' },
    save: { run: () => save(), disabled: !playable, ariaLabel: playable ? 'Enregistrer l’enchaînement' : 'Enregistrer : l’enchaînement n’est pas encore réalisable', testId: 'nav-save' },
    cancel: { run: cancel, ariaLabel: 'Annuler les modifications', testId: 'nav-cancel' },
  });

  if (id && !existing) {
    return (
      <div className="page">
        <PageHead title="Modifier l’enchaînement" fallback="/createur" />
        <p className="muted" data-testid="combo-missing">
          Cet enchaînement n’existe plus sur cet appareil.
        </p>
      </div>
    );
  }

  return (
    <div className="page creator-editor" data-testid="combo-editor">
      <PageHead title={existing ? 'Modifier l’enchaînement' : 'Nouvel enchaînement'} eyebrow="Créateur" fallback="/createur" />

      <div className="field">
        <label htmlFor="nom">Nom de l’enchaînement</label>
        <input id="nom" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={seq.length ? autoName(seq) : 'Mon enchaînement'} data-testid="combo-name-input" />
      </div>

      <div className="field">
        <span className="label">Discipline</span>
        <Tabs label="Discipline" items={DISCIPLINES.map((x) => ({ id: x.id, label: x.short, icon: <DisciplineIcon id={x.id} size={24} /> }))} value={d} onChange={setD} />
        {d === 'kickboxing' && <KickboxingStylePicker />}
      </div>

      <section className="stack" aria-labelledby="h-seq">
        <div className="row nowrap" style={{ justifyContent: 'space-between' }}>
          <h2 id="h-seq">
            Séquence des mouvements <span className="num-figure muted">({seq.length})</span>
          </h2>
          {preview && <ScoreRing score={preview.score} size={44} />}
        </div>
        {seq.length === 0 && <p className="small muted">Touche « Ajouter un mouvement » puis choisis les techniques dans l’ordre.</p>}
        <ol className="edit-rows" data-testid="builder-seq">
          {seq.map((tid, i) => {
            const t = TECHNIQUE_BY_ID.get(tid);
            return (
              <li key={`${i}-${tid}`} className={`edit-row ${bad.has(i) ? 'bad' : ''}`}>
                <span className="move-num">{i + 1}</span>
                <TechniquePicto id={tid} size={34} />
                <span className="grow">
                  <b>{t?.name ?? 'Technique inconnue'}</b>
                  <br />
                  <span className="small muted">{t ? CATEGORY_LABEL[t.category] : tid}</span>
                </span>
                <button type="button" className="btn icon ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Monter ${t?.name ?? tid}`}>
                  <AppIcon id="chevronDown" size={16} className="rot-up" />
                </button>
                <button type="button" className="btn icon ghost" disabled={i === seq.length - 1} onClick={() => move(i, 1)} aria-label={`Descendre ${t?.name ?? tid}`}>
                  <AppIcon id="chevronDown" size={16} />
                </button>
                <button type="button" className="btn icon ghost danger-ink" onClick={() => setSeq(seq.filter((_, j) => j !== i))} aria-label={`Retirer ${t?.name ?? tid}`}>
                  <AppIcon id="delete" size={18} />
                </button>
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn secondary add-move" onClick={picker.show} data-testid="add-move">
          <AppIcon id="add" size={18} /> Ajouter un mouvement
        </button>
        {seq.length > 0 &&
          issues.map((i, k) => (
            <div key={k} className={`note ${i.level === 'erreur' ? 'err' : i.level === 'attention' ? 'warn' : ''}`}>
              {i.index !== undefined ? `Mouvement ${i.index + 1} : ` : ''}
              {i.message}
            </div>
          ))}
        {preview && (
          <p className="small muted" data-testid="preview-note">
            Aperçu de l’analyse locale : {preview.score}/100 ({preview.verdict}). Le détail est sur la fiche après l’enregistrement.
          </p>
        )}
      </section>

      {existing && (
        <section className="stack" aria-labelledby="h-status">
          <h2 id="h-status">Statut personnel</h2>
          <div className="status-switch">
            <button type="button" className={`chip ${mastery === 'acquise' ? 'on ok' : ''}`} aria-pressed={mastery === 'acquise'} onClick={() => toggleMastery(masteryKey(existing.id), 'acquise')}>
              Acquis
            </button>
            <button type="button" className={`chip ${mastery === 'a-revoir' ? 'on warn' : ''}`} aria-pressed={mastery === 'a-revoir'} onClick={() => toggleMastery(masteryKey(existing.id), 'a-revoir')}>
              Encore du mal
            </button>
          </div>
        </section>
      )}

      <div className="row nowrap">
        <button type="button" className="btn secondary" disabled={!playable} onClick={() => save()} data-testid="save-combo">
          <AppIcon id="save" size={18} /> Enregistrer
        </button>
        <button type="button" className="btn primary" style={{ flex: 1 }} disabled={!playable} onClick={() => save((cid) => nav(`/entrainement?perso=${cid}&mode=libre`))} data-testid="run-custom">
          <AppIcon id="play" /> Enregistrer et lancer
        </button>
      </div>

      {picker.open && <MovePicker d={d} onAdd={(tid) => setSeq((s) => [...s, tid])} onClose={() => picker.hide()} count={seq.length} />}
      {ask && (
        <ConfirmDialog
          title="Modifications non enregistrées"
          message="Abandonner les modifications ? Ce que tu as changé depuis l’ouverture sera perdu."
          confirmLabel="Abandonner"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={() => {
            const go = ask.go;
            setAsk(null);
            setName(initial.name);
            setD(initial.discipline);
            setSeq(initial.sequence);
            // after the reset the guard sees a clean editor
            setTimeout(go, 0);
          }}
        />
      )}
    </div>
  );
}

/** plaquette écran 4: search, families, a grid of neutral pictograms; stays open to add several moves */
function MovePicker({ d, onAdd, onClose, count }: { d: DisciplineId; onAdd: (id: string) => void; onClose: () => void; count: number }) {
  const [kbStyle] = useKbStyle();
  const [text, setText] = useState('');
  const [fam, setFam] = useState<TechniqueCategory | 'toutes'>('toutes');
  const palette = filterTechniques(techniquesFor(d), d, kbStyle);
  const cats = [...new Set(palette.map((t) => t.category))];
  const qf = fold(text);
  const shown = palette.filter((t) => (fam === 'toutes' || t.category === fam) && (qf.length < 2 || fold(t.name).includes(qf)));
  const groups = cats.filter((c) => shown.some((t) => t.category === c));
  return (
    <NavPanel title="Ajouter un mouvement" onClose={onClose} testId="move-picker" wide>
      <input className="nav-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Rechercher une technique…" aria-label="Rechercher une technique" data-testid="picker-search" />
      <div className="nav-chips picker-fams" role="group" aria-label="Famille">
        <button type="button" className={`chip ${fam === 'toutes' ? 'on' : ''}`} aria-pressed={fam === 'toutes'} onClick={() => setFam('toutes')}>
          Toutes
        </button>
        {cats.map((c) => (
          <button key={c} type="button" className={`chip ${fam === c ? 'on' : ''}`} aria-pressed={fam === c} onClick={() => setFam(c)}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      {groups.length === 0 && <p className="small muted">Aucune technique ne porte ce nom dans cette discipline.</p>}
      {groups.map((c) => (
        <div key={c} className="picker-group">
          <h3>{CATEGORY_LABEL[c]}</h3>
          <div className="picker-grid">
            {shown
              .filter((t) => t.category === c)
              .map((t) => (
                <button key={t.id} type="button" className="picker-cell" onClick={() => onAdd(t.id)} data-testid={`add-${t.id}`} aria-label={`Ajouter ${t.name}`}>
                  <TechniquePicto id={t.id} size={40} />
                  <span>{t.name}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
      <div className="nav-actions">
        <button type="button" className="nav-action primary" onClick={onClose} data-testid="picker-done">
          Terminé ({count} mouvement{count > 1 ? 's' : ''})
        </button>
      </div>
    </NavPanel>
  );
}
