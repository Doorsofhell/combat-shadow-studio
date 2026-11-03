import { useState } from 'react';
import { ConfirmDialog, EmptyState, PageHead, Panel, PanelRow, Segmented, Toggle } from '../components';
import { detectSpeechCapabilities } from '../../coach/speech';
import { useCoachAi } from '../../store/coachAi';
import { AppIcon } from '../icons';
import '../coach-ai/coachAi.css';

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

/** 1.2.0: the settings of the Coach IA, on its page and in Réglages › Coach IA (the same store, never copied) */
export function CoachAiSettings() {
  const ai = useCoachAi();
  const caps = detectSpeechCapabilities();
  return (
    <>
      <Toggle on={ai.enabled} onChange={(v) => ai.set({ enabled: v })} label="Coach IA" hint="Affiche le bouton « Demande au coach » pendant l’entraînement." />
      <PanelRow label="Longueur des réponses" column>
        <Segmented
          label="Longueur des réponses"
          value={ai.detail}
          onChange={(v) => ai.set({ detail: v })}
          options={[
            { id: 'court', label: 'Courtes' },
            { id: 'detaille', label: 'Détaillées' },
          ]}
        />
      </PanelRow>
      <Toggle
        on={ai.voiceReplies}
        onChange={(v) => ai.set({ voiceReplies: v })}
        label="Lire les réponses à voix haute"
        hint={caps.localVoice ? 'Avec une voix installée sur l’appareil.' : 'Aucune voix française installée sur cet appareil : les réponses resteront écrites.'}
      />
      <Toggle
        on={ai.keepHistory}
        onChange={(v) => ai.set({ keepHistory: v })}
        label="Garder l’historique"
        hint="Les échanges restent sur cet appareil uniquement. Désactiver efface l’historique."
      />
      {caps.onlineWebSpeech && (
        <Toggle
          on={ai.onlineSpeechOptIn}
          onChange={(v) => ai.set({ onlineSpeechOptIn: v })}
          label="Saisie vocale du navigateur (en ligne)"
          hint="En ligne, l’audio est envoyé au service de reconnaissance du navigateur. Désactivée par défaut ; ne fonctionne pas sans connexion."
        />
      )}
      {!caps.onlineWebSpeech && <PanelRow label="Saisie vocale" hint="Pas encore disponible hors ligne sur cet appareil : pose tes questions par écrit." />}
    </>
  );
}

/** Coach IA : réglages et historique local des échanges (thème sombre). Route attendue : /coach-ia */
export function CoachHistory() {
  const ai = useCoachAi();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="page">
      <PageHead title="Coach IA" eyebrow="Questions et réponses" fallback="/" />

      <div className="note small">
        Le coach répond <b>hors ligne</b>, à partir de la bibliothèque de techniques validée de l’application. Il ne te voit pas : il explique, montre et
        propose des exercices, mais ne corrige pas tes mouvements. En cas de douleur, arrête et consulte un professionnel de santé.
      </div>

      <Panel title="Réglages" icon="settings" id="cai-settings">
        <CoachAiSettings />
      </Panel>

      <section className="stack" style={{ gap: 8 }} aria-labelledby="cai-hist">
        <div className="row between">
          <h2 className="panel-title" id="cai-hist">
            Historique
          </h2>
          {ai.history.length > 0 && (
            <button type="button" className="btn ghost sm" onClick={() => setConfirm(true)} data-testid="coach-clear-history">
              <AppIcon id="delete" size={18} /> Effacer
            </button>
          )}
        </div>
        {ai.history.length === 0 ? (
          <EmptyState title="Aucun échange enregistré" text={ai.keepHistory ? 'Tes prochaines questions au coach apparaîtront ici.' : 'Active « Garder l’historique » pour retrouver tes questions ici.'} />
        ) : (
          <ul className="cai-history" data-testid="coach-history">
            {ai.history.map((h) => (
              <li key={h.id}>
                <time dateTime={h.at}>{fmt(h.at)}</time>
                <span className="q">{h.question}</span>
                <span className="a">{h.answer}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirm && (
        <ConfirmDialog
          title="Effacer l’historique ?"
          message="Tous les échanges avec le coach enregistrés sur cet appareil seront supprimés."
          confirmLabel="Effacer"
          danger
          onConfirm={() => {
            ai.clearHistory();
            setConfirm(false);
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
