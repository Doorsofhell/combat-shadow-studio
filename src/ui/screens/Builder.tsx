import { useNavActions } from '../nav/store';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID, techniquesFor } from '../../domain/techniques';
import { DISCIPLINES, DisciplineId, TrainingMode } from '../../domain/types';
import { isPlayable, validateSequence } from '../../domain/transitions';
import { useCustom } from '../../store/custom';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { DisciplineLabel, KickboxingStylePicker, PageHead, Segmented, Tabs, toast, useKbStyle } from '../components';
import { filterTechniques } from '../../domain/kickboxingStyles';
import { RoundOptions } from './Discipline';
import { AppIcon, DisciplineIcon } from '../icons';

export function Builder() {
  const [q] = useSearchParams();
  const main = useProfile((s) => s.profile.mainDiscipline);
  const settings = useSettings((s) => s.settings);
  const { combos, save, remove } = useCustom();
  const nav = useNavigate();
  const [d, setD] = useState<DisciplineId>((q.get('d') as DisciplineId) ?? main);
  const [seq, setSeq] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [mode, setMode] = useState<TrainingMode>('libre');
  const [round, setRound] = useState(settings.defaultRoundSec);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [rounds, setRounds] = useState(3);
  const issues = validateSequence(seq, d);
  const playable = seq.length > 0 && isPlayable(issues);
  const bad = new Set(issues.filter((i) => i.level === 'erreur' && i.index !== undefined).map((i) => i.index));
  const [kbStyle] = useKbStyle();
  const palette = filterTechniques(techniquesFor(d), d, kbStyle);
  const cats = [...new Set(palette.map((t) => t.category))];

  const store = () => {
    const id = editId ?? `${Date.now().toString(36)}`;
    const label = name.trim() || seq.map((x) => TECHNIQUE_BY_ID.get(x)?.name).join(' → ');
    save({ id, name: label, discipline: d, sequence: seq, createdAt: new Date().toISOString() });
    setEditId(id);
    return id;
  };
  const run = () => {
    const id = store();
    const p = new URLSearchParams({ perso: id, mode });
    if (mode === 'rounds') {
      p.set('round', String(round));
      p.set('rest', String(rest));
      p.set('rounds', String(rounds));
    }
    nav(`/entrainement?${p}`);
  };

  // v0.32 bar: « Lancer » saves and starts the sequence, as the button at the bottom of the page
  useNavActions({ start: { run, disabled: !playable, ariaLabel: 'Lancer l’enchaînement' } });

  return (
    <div className="page">
      <PageHead title="Créateur d’enchaînements" eyebrow="Personnalisé" fallback="/techniques?tab=createur" />
      <Tabs label="Discipline" items={DISCIPLINES.map((x) => ({ id: x.id, label: x.short, icon: <DisciplineIcon id={x.id} size={24} /> }))} value={d} onChange={setD} />
      {d === 'kickboxing' && <KickboxingStylePicker />}

      <div className="stack">
        <span className="label">
          Ton enchaînement <span className="num-figure">({seq.length})</span>
        </span>
        <div className="builder-seq" data-testid="builder-seq">
          {seq.length === 0 && <span className="small muted">Touche les mouvements ci-dessous pour les ajouter. Touche un mouvement ajouté pour le retirer.</span>}
          {seq.map((id, i) => (
            <button key={i} className={`chip ${bad.has(i) ? 'bad' : ''}`} onClick={() => setSeq(seq.filter((_, j) => j !== i))} aria-label={`Retirer ${TECHNIQUE_BY_ID.get(id)?.name}`}>
              {i + 1}. {TECHNIQUE_BY_ID.get(id)?.name ?? id} <AppIcon id="close" size={14} />
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn sm secondary" disabled={!seq.length} onClick={() => setSeq(seq.slice(0, -1))}>
            Annuler le dernier
          </button>
          <button type="button" className="btn sm ghost" disabled={!seq.length} onClick={() => (setSeq([]), setEditId(null), setName(''))}>
            Tout effacer
          </button>
        </div>
        {seq.length > 0 &&
          issues.map((i, k) => (
            <div key={k} className={`note ${i.level === 'erreur' ? 'err' : i.level === 'attention' ? 'warn' : ''}`}>
              {i.index !== undefined ? `Mouvement ${i.index + 1} : ` : ''}
              {i.message}
            </div>
          ))}
      </div>

      {cats.map((c) => (
        <div key={c} className="stack">
          <span className="label">{CATEGORY_LABEL[c]}</span>
          <div className="row" style={{ gap: 8 }}>
            {palette
              .filter((t) => t.category === c)
              .map((t) => (
                <button key={t.id} type="button" className="chip" onClick={() => setSeq([...seq, t.id])} data-testid={`add-${t.id}`}>
                  + {t.name}
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="card stack">
        <div className="field">
          <label htmlFor="nom">Nom</label>
          <input id="nom" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon enchaînement" />
        </div>
        <Segmented
          label="Mode"
          value={mode}
          onChange={setMode}
          options={(['libre', 'technique', 'rounds'] as TrainingMode[]).map((m) => ({ id: m, label: m === 'libre' ? 'En boucle' : m === 'technique' ? 'Lent et commenté' : 'Rounds' }))}
        />
        {mode === 'rounds' && <RoundOptions round={round} rest={rest} rounds={rounds} setRound={setRound} setRest={setRest} setRounds={setRounds} />}
        <div className="row nowrap">
          <button type="button" className="btn secondary" disabled={!playable} onClick={() => (store(), toast('Enchaînement enregistré'))}>
            <AppIcon id="save" size={18} /> Enregistrer
          </button>
          <button type="button" className="btn primary" style={{ flex: 1 }} disabled={!playable} onClick={run} data-testid="run-custom">
            <AppIcon id="play" /> Lancer
          </button>
        </div>
      </div>

      {combos.length > 0 && (
        <div className="stack">
          <h2>Mes enchaînements</h2>
          <div className="panel">
            {combos.map((c) => (
              <div key={c.id} className="list-row">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontWeight: 600 }}>{c.name}</b>
                  <br />
                  <span className="small muted">
                    <DisciplineLabel id={c.discipline} name={DISCIPLINES.find((x) => x.id === c.discipline)?.name ?? ''} /> · {c.sequence.length} mouvements
                  </span>
                </span>
                <button type="button" className="btn sm ghost" onClick={() => (setD(c.discipline), setSeq(c.sequence), setName(c.name), setEditId(c.id))}>
                  <AppIcon id="edit" size={16} /> Modifier
                </button>
                <button type="button" className="btn icon ghost" onClick={() => nav(`/entrainement?perso=${c.id}&mode=libre`)} aria-label={`Lancer ${c.name}`}>
                  <AppIcon id="play" size={18} />
                </button>
                <button type="button" className="btn icon ghost" onClick={() => remove(c.id)} aria-label={`Supprimer ${c.name}`}>
                  <AppIcon id="delete" size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
