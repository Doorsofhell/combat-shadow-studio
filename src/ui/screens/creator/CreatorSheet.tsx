import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_LABEL, TECHNIQUE_BY_ID } from '../../../domain/techniques';
import { DISCIPLINES, type TrainingMode } from '../../../domain/types';
import { analyseCombo, analysisState } from '../../../domain/comboAnalysis';
import { useCustom } from '../../../store/custom';
import { useGoals } from '../../../store/goals';
import { useSettings } from '../../../store/settings';
import { useHydrated } from '../../../store/useHydrated';
import { ConfirmDialog, PageHead, Segmented, toast } from '../../components';
import { AppIcon, DisciplineIcon } from '../../icons';
import { useNavActions } from '../../nav/store';
import { TechniquePicto } from '../../pictos/TechniquePicto';
import { RoundOptions } from '../Discipline';
import { analyseSaved, deleteCombo, duplicateCombo } from './actions';
import { MasteryBadge, ScoreRing, comboName, dateFr, masteryKey, useComboMastery, useUsage } from './shared';
import './creator.css';
import { PremiumMarker } from '../../premium/PremiumMarker';

const DISC_NAME = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.name])) as Record<string, string>;

/**
 * v0.38 (plaquette écran 2): the sheet of one sequence: every move in order (tap = the technique sheet), Exécuter /
 * Modifier / Dupliquer / Supprimer, the full local analysis, the real dates and the personal status.
 */
export function CreatorSheet() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const ready = useHydrated(useCustom);
  const combo = useCustom((s) => s.combos.find((c) => c.id === id));
  const usage = useUsage()(id);
  const mastery = useComboMastery(id);
  const toggleMastery = useGoals((s) => s.toggleMastery);
  const settings = useSettings((s) => s.settings);
  const [mode, setMode] = useState<TrainingMode>('libre');
  const [round, setRound] = useState(settings.defaultRoundSec);
  const [rest, setRest] = useState(settings.defaultRestSec);
  const [rounds, setRounds] = useState(3);
  const [confirm, setConfirm] = useState(false);
  const state = combo ? analysisState(combo) : 'none';
  // deterministic: the same moves always give the same result, so the stored score and the detail always agree
  const analysis = useMemo(() => (combo && state === 'ok' ? analyseCombo(combo.discipline, combo.sequence) : null), [combo, state]);

  const run = () => {
    if (!combo) return;
    const p = new URLSearchParams({ perso: combo.id, mode });
    if (mode === 'rounds') {
      p.set('round', String(round));
      p.set('rest', String(rest));
      p.set('rounds', String(rounds));
    }
    nav(`/entrainement?${p}`);
  };
  const edit = () => combo && nav(`/createur/${combo.id}/modifier`);
  useNavActions({
    run: { run, disabled: !combo, ariaLabel: 'Exécuter l’enchaînement', testId: 'nav-run' },
    edit: { run: edit, disabled: !combo, ariaLabel: 'Modifier l’enchaînement', testId: 'nav-edit' },
    delete: { run: () => setConfirm(true), disabled: !combo, ariaLabel: 'Supprimer l’enchaînement', testId: 'nav-delete' },
  });

  if (!ready) return null;
  if (!combo) {
    return (
      <div className="page">
        <PageHead title="Enchaînement" fallback="/createur" />
        <p className="muted" data-testid="combo-missing">
          Cet enchaînement n’existe plus sur cet appareil (supprimé ici ou sur un autre appareil).
        </p>
        <Link className="btn secondary" to="/createur">
          Voir mes enchaînements
        </Link>
      </div>
    );
  }
  const name = comboName(combo);

  return (
    <div className="page creator-sheet" data-testid="combo-sheet">
      <PageHead title="Enchaînement" eyebrow="Créateur" fallback="/createur" />

      <section className="card combo-head">
        <span className="combo-tile-art" aria-hidden>
          <DisciplineIcon id={combo.discipline} size={40} />
        </span>
        <div className="grow">
          <h1 className="combo-title" data-testid="combo-name">
            {name}
          </h1>
          <span className="disc-tag">{DISC_NAME[combo.discipline]}</span>
          <p className="small muted">
            {combo.sequence.length} mouvement{combo.sequence.length > 1 ? 's' : ''} <MasteryBadge m={mastery} />
          </p>
        </div>
        <ScoreRing combo={combo} size={68} />
      </section>

      <div className="combo-actions">
        <button type="button" className="btn primary" onClick={run} data-testid="combo-run">
          <AppIcon id="play" size={18} /> Exécuter
        </button>
        <button type="button" className="btn secondary" onClick={edit} data-testid="combo-edit">
          <AppIcon id="edit" size={18} /> Modifier
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            const copy = duplicateCombo(combo.id);
            if (copy) {
              toast('Copie créée');
              nav(`/createur/${copy.id}`, { replace: false });
            }
          }}
          data-testid="combo-duplicate"
        >
          <AppIcon id="duplicate" size={18} /> Dupliquer
        </button>
        <button type="button" className="btn danger-soft" onClick={() => setConfirm(true)} data-testid="combo-delete">
          <AppIcon id="delete" size={18} /> Supprimer
        </button>
      </div>

      <div className="card stack" style={{ gap: 10 }}>
        <Segmented
          label="Mode"
          value={mode}
          onChange={setMode}
          options={(['libre', 'technique', 'rounds'] as TrainingMode[]).map((m) => ({ id: m, label: m === 'libre' ? 'En boucle' : m === 'technique' ? 'Lent et commenté' : 'Rounds' }))}
        />
        {mode === 'rounds' && <RoundOptions round={round} rest={rest} rounds={rounds} setRound={setRound} setRest={setRest} setRounds={setRounds} />}
      </div>

      <section className="stack" aria-labelledby="h-moves">
        <h2 id="h-moves">
          Mouvements <span className="num-figure muted">({combo.sequence.length})</span>
        </h2>
        <ol className="move-strip" data-testid="combo-moves">
          {combo.sequence.map((tid, i) => {
            const t = TECHNIQUE_BY_ID.get(tid);
            const body = (
              <>
                <span className="move-num">{i + 1}</span>
                <TechniquePicto id={tid} size={44} />
                <b>{t?.name ?? 'Technique inconnue'}</b>
                <span className="small muted">{t ? CATEGORY_LABEL[t.category] : tid}</span>
              </>
            );
            return (
              <li key={i}>
                {t ? (
                  <Link className="move-card" to={`/techniques/${tid}?d=${combo.discipline}`} aria-label={`${i + 1}. ${t.name} : ouvrir la fiche`}>
                    {body}
                  </Link>
                ) : (
                  <span className="move-card unknown">{body}</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card stack combo-analysis" aria-labelledby="h-analysis" data-testid="combo-analysis">
        <div className="row nowrap" style={{ justifyContent: 'space-between' }}>
          <h2 id="h-analysis">
            Analyse de l’enchaînement <PremiumMarker feature="advanced_combo_builder" />
          </h2>
          <span className="tag-local">Calcul local</span>
        </div>
        {!analysis ? (
          <>
            <p className="muted" data-testid="analysis-missing">
              {state === 'stale' ? 'L’enchaînement a changé depuis la dernière analyse : la note affichée avant ne le décrit plus.' : 'Non analysé : cet enchaînement a été enregistré avant l’analyse.'}
            </p>
            <button type="button" className="btn secondary" onClick={() => analyseSaved(combo.id)} data-testid="analyse-now">
              <AppIcon id="target" size={18} /> Analyser maintenant
            </button>
          </>
        ) : (
          <>
            <div className="analysis-top">
              <ScoreRing score={analysis.score} size={96} />
              <div>
                <b className="analysis-verdict">{analysis.verdict}</b>
                <p className="small muted">Analysé le {dateFr(combo.analysis?.at)}</p>
              </div>
            </div>
            <ul className="criteria" data-testid="analysis-criteria">
              {analysis.criteria.map((c) => (
                <li key={c.id}>
                  <span className="crit-head">
                    <span>{c.label}</span>
                    <b className="num-figure">{c.score}</b>
                  </span>
                  <span className="crit-bar" aria-hidden>
                    <span style={{ width: `${c.score}%` }} className={c.score >= 80 ? 'good' : c.score >= 60 ? 'mid' : 'low'} />
                  </span>
                  <span className="small muted">
                    {c.detail} <i>(poids {Math.round(c.weight * 100)} %)</i>
                  </span>
                </li>
              ))}
            </ul>
            {analysis.strengths.length > 0 && (
              <div>
                <h3>Points forts</h3>
                <ul className="bullets" data-testid="analysis-strengths">
                  {analysis.strengths.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.weaknesses.length > 0 && (
              <div>
                <h3>Points faibles</h3>
                <ul className="bullets" data-testid="analysis-weaknesses">
                  {analysis.weaknesses.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3>Conseils</h3>
              <ul className="bullets" data-testid="analysis-recos">
                {analysis.recommendations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <details className="analysis-how">
              <summary>Comment cette note est calculée</summary>
              <p className="small">{analysis.explanation}</p>
              <h3>Limites</h3>
              <ul className="bullets small" data-testid="analysis-limits">
                {analysis.limits.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>

      <section className="card stack" aria-labelledby="h-info">
        <h2 id="h-info">Informations</h2>
        <dl className="combo-info" data-testid="combo-info">
          <dt>Créé le</dt>
          <dd>{dateFr(combo.createdAt)}</dd>
          <dt>Modifié le</dt>
          <dd>{combo.updatedAt ? dateFr(combo.updatedAt) : 'Jamais modifié'}</dd>
          <dt>Dernière utilisation</dt>
          <dd data-testid="info-last">{usage.last ? dateFr(usage.last) : 'Jamais utilisé'}</dd>
          <dt>Nombre d’entraînements</dt>
          <dd data-testid="info-count">{usage.count}</dd>
        </dl>
      </section>

      <section className="card stack" aria-labelledby="h-status">
        <h2 id="h-status">Statut personnel</h2>
        <div className="status-switch" role="group" aria-labelledby="h-status">
          <button type="button" className={`chip ${mastery === 'acquise' ? 'on ok' : ''}`} aria-pressed={mastery === 'acquise'} onClick={() => toggleMastery(masteryKey(combo.id), 'acquise')} data-testid="status-acquis">
            Acquis
          </button>
          <button type="button" className={`chip ${mastery === 'a-revoir' ? 'on warn' : ''}`} aria-pressed={mastery === 'a-revoir'} onClick={() => toggleMastery(masteryKey(combo.id), 'a-revoir')} data-testid="status-mal">
            Encore du mal
          </button>
        </div>
      </section>

      {confirm && (
        <ConfirmDialog
          title="Supprimer"
          message={`Supprimer définitivement cet enchaînement ? « ${name} » sera retiré de cet appareil et de ton compte s’il est synchronisé. Ton historique d’entraînement est conservé.`}
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            deleteCombo(combo.id);
            setConfirm(false);
            toast('Enchaînement supprimé');
            nav('/createur', { replace: true });
          }}
        />
      )}
    </div>
  );
}
