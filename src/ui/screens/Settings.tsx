import { championFor } from '../../domain/coaches/catalog';
import { DISCIPLINES, LEVELS } from '../../domain/types';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../../store/settings';
import { useProfile } from '../../store/profile';
import { exportData, useStats } from '../../store/stats';
import { useCustom } from '../../store/custom';
import { useGoals } from '../../store/goals';
import { useFighters } from '../../store/fighters';
import { DEFAULT_CATALOG_USER, useCatalogUser } from '../../store/catalog';
import { bell, unlockAudio } from '../../audio/sound';
import { hasFrenchVoice, say, voiceAvailable } from '../../audio/voice';
import { saveTextFile } from '../../platform/native';
import { ConfirmDialog, LinkRow, PageHead, Panel, PanelRow, Segmented, SliderRow, Toggle, toast } from '../components';
import { CoachLookPicker } from '../components/CoachLookPicker';
import { AppIcon } from '../icons';
import { clearDiag, diagText, readDiag } from '../../three/diag3d';
import { resetStability, stabilityLevel } from '../../three/safe3d';

/**
 * v0.29 (coach that vanished on Youssef's phone): what the 3D did on this device, to copy and send.
 * The journal stays on the phone (src/three/diag3d.ts).
 */
function Diag3dPanel() {
  const [level, setLevel] = useState(stabilityLevel);
  const [entries, setEntries] = useState(readDiag);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(diagText(entries));
      toast('Journal 3D copié');
    } catch {
      toast('Copie impossible : sélectionne le texte du journal');
    }
  };
  return (
    <Panel>
      <PanelRow
        label="Stabilité de la 3D"
        hint={
          level === 0
            ? 'Qualité choisie appliquée, aucun incident graphique récent.'
            : `Qualité allégée (niveau ${level}) après un incident graphique. Elle remonte d’elle-même après 10 minutes sans incident.`
        }
        column
      >
        {level > 0 && (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              resetStability();
              setLevel(0);
              toast('Qualité choisie rétablie');
            }}
          >
            Rétablir la qualité choisie
          </button>
        )}
      </PanelRow>
      <PanelRow label="Journal 3D" hint={`${entries.length} évènement(s) enregistré(s) sur cet appareil, rien n’est envoyé.`} column>
        <details data-testid="diag3d">
          <summary>Voir le journal</summary>
          <pre className="diag3d-log">{diagText(entries)}</pre>
        </details>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn secondary" onClick={copy}>
            Copier le journal
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              clearDiag();
              setEntries([]);
            }}
          >
            Effacer
          </button>
        </div>
      </PanelRow>
    </Panel>
  );
}

const pct = (v: number) => `${Math.round(v * 100)} %`;

export function SettingsPage() {
  const { section } = useParams();
  const { settings, set } = useSettings();
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.update);
  const resetProfile = useProfile((s) => s.reset);
  const stats = useStats();
  const custom = useCustom();
  const clearGoals = useGoals((s) => s.clear);
  const nav = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);

  const doExport = async () => {
    const json = exportData({ sessions: stats.sessions, perExercise: stats.perExercise }, { profile, settings, custom: custom.combos });
    try {
      const m = await saveTextFile(`combat-shadow-studio-${new Date().toISOString().slice(0, 10)}.json`, json);
      setMsg(m);
      toast(m);
    } catch {
      setMsg('L’export a été annulé.');
    }
  };

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      const r = stats.importData(data);
      if (r.ok && Array.isArray(data.custom)) {
        const known = new Set(custom.combos.map((c) => c.id));
        for (const c of data.custom) if (c && typeof c.id === 'string' && Array.isArray(c.sequence) && !known.has(c.id)) custom.save(c);
      }
      setMsg(r.message);
      if (r.ok) toast(r.message);
    } catch {
      setMsg('Le fichier n’a pas pu être lu.');
    }
  };

  const erase = () => {
    stats.clear();
    for (const c of custom.combos) custom.remove(c.id);
    clearGoals();
    resetProfile();
    useFighters.getState().clearAll();
    useCatalogUser.setState({ ...DEFAULT_CATALOG_USER });
    setConfirmErase(false);
    nav('/bienvenue');
  };

  // 0.24 (épuration, captures de référence de Youssef): l’écran principal ne montre que l’essentiel ;
  // les réglages détaillés sont rangés dans des sous-pages, comme dans les applications natives
  if (section === 'voix')
    return (
      <div className="page">
        <PageHead title="Voix et sons" fallback="/reglages" />
        <Panel>
        <Toggle label="Voix du coach" on={settings.voice} onChange={(v) => set({ voice: v })} />
        <Toggle label="Annoncer chaque mouvement" on={settings.announceMoves} onChange={(v) => set({ announceMoves: v })} />
        <Toggle label="Conseils techniques" hint="En mode technique" on={settings.techniqueTips} onChange={(v) => set({ techniqueTips: v })} />
        <Toggle label="Sons d’impact" on={settings.impactSounds} onChange={(v) => set({ impactSounds: v })} />
        <SliderRow id="vv" label="Volume de la voix" value={settings.voiceVolume} min={0} max={1} step={0.05} onChange={(v) => set({ voiceVolume: v })} format={pct} />
        <SliderRow id="fx" label="Volume des effets (cloche, bips)" value={settings.effectsVolume} min={0} max={1} step={0.05} onChange={(v) => set({ effectsVolume: v })} format={pct} />
        <div className="panel-row">
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn secondary sm" onClick={() => (unlockAudio(), say('En garde. Jab, direct.', { interrupt: true }))}>
              Tester la voix
            </button>
            <button type="button" className="btn secondary sm" onClick={() => (unlockAudio(), bell(1))}>
              Tester la cloche
            </button>
          </div>
        </div>
        {voiceAvailable() && !hasFrenchVoice() && <p className="small muted" style={{ padding: '0 0 12px' }}>Aucune voix française n’est installée sur cet appareil : la voix par défaut sera utilisée.</p>}
        {!voiceAvailable() && <p className="small muted" style={{ padding: '0 0 12px' }}>La synthèse vocale n’est pas disponible dans ce navigateur.</p>}
      </Panel>
      </div>
    );
  if (section === 'affichage')
    return (
      <div className="page">
        <PageHead title="Affichage 3D" fallback="/reglages" />
        <Panel>
          <PanelRow label="Rendu des combattants" column>
            <CoachLookPicker />
          </PanelRow>
          <PanelRow label="Qualité" hint="En mode Auto, la qualité baisse d’elle-même si l’appareil n’arrive pas à suivre." column>
            <Segmented
              label="Qualité"
              value={settings.quality}
              onChange={(q) => set({ quality: q })}
              options={[
                { id: 'auto', label: 'Auto' },
                { id: 'haute', label: 'Haute' },
                { id: 'basse', label: 'Économie' },
              ]}
            />
          </PanelRow>
          <PanelRow label="Version du rendu 3D" column>
            <Segmented
              label="Version du rendu 3D"
              value={settings.coachRender}
              onChange={(v) => set({ coachRender: v })}
              options={[
                { id: 'premium', label: 'Nouvelle (0.24)' },
                { id: 'precedent', label: 'Précédente (secours)' },
              ]}
            />
            <p className="small muted">La version précédente reste disponible tant que la nouvelle n’est pas validée sur ton téléphone.</p>
          </PanelRow>
          <PanelRow label="Caméra par défaut" column>
            <Segmented
              label="Caméra par défaut"
              value={settings.cameraAngle}
              onChange={(a) => set({ cameraAngle: a })}
              options={[
                { id: 35, label: '3/4' },
                { id: 0, label: 'Face' },
                { id: 90, label: 'Profil' },
              ]}
            />
          </PanelRow>
        </Panel>
        <Diag3dPanel />
      </div>
    );
  if (section === 'rounds')
    return (
      <div className="page">
        <PageHead title="Rounds par défaut" fallback="/reglages" />
        <Panel>
        <PanelRow label="Durée du round" column>
          <Segmented label="Durée du round" value={settings.defaultRoundSec} onChange={(v) => set({ defaultRoundSec: v })} options={[60, 120, 180, 300].map((s) => ({ id: s, label: `${s / 60} min` }))} />
        </PanelRow>
        <PanelRow label="Repos" column>
          <Segmented label="Repos" value={settings.defaultRestSec} onChange={(v) => set({ defaultRestSec: v })} options={[30, 45, 60, 90].map((s) => ({ id: s, label: `${s} s` }))} />
        </PanelRow>
      </Panel>
      </div>
    );
  if (section === 'donnees')
    return (
      <div className="page">
        <PageHead title="Données" fallback="/reglages" />
        <Panel>
        <LinkRow to="/confidentialite" icon={<AppIcon id="privacy" className="muted" />} label="Confidentialité" hint="Aucune mesure d’audience, aucune publicité ; synchronisation seulement si tu l’actives" />
        <div className="panel-row col">
          <span className="small muted">L’export crée un fichier que tu peux garder ou réimporter sur un autre appareil.</span>
          <div className="grid2">
            <button type="button" className="btn secondary" onClick={doExport}>
              <AppIcon id="download" size={18} /> Exporter
            </button>
            <button type="button" className="btn secondary" onClick={() => file.current?.click()}>
              <AppIcon id="upload" size={18} /> Importer
            </button>
          </div>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          {msg && (
            <div className="note" role="status">
              {msg}
            </div>
          )}
        </div>
        <div className="panel-row">
          <button type="button" className="btn danger block" onClick={() => setConfirmErase(true)}>
            <AppIcon id="delete" size={18} /> Tout effacer
          </button>
        </div>
      </Panel>
        </div>
    );

  const d = profile.mainDiscipline;
  return (
    <div className="page">
      <PageHead title="Réglages" />

      <Panel title="Ton profil" icon="profile" id="p-profil">
        <div className="profile-summary" data-testid="settings-profile-summary">
          <div>
            <span className="muted small">Discipline</span>
            <strong>{DISCIPLINES.find((x) => x.id === d)?.name ?? '—'}</strong>
          </div>
          <div>
            <span className="muted small">Niveau</span>
            <strong>{LEVELS.find((l) => l.id === profile.levels[d])?.name ?? '—'}</strong>
          </div>
          <div>
            <span className="muted small">Garde</span>
            <strong>{profile.guard === 'gaucher' ? 'Gaucher' : 'Orthodoxe'}</strong>
          </div>
          <div>
            <span className="muted small">Coach</span>
            <strong>{championFor(profile.coach).name}</strong>
          </div>
        </div>
        <LinkRow to="/profil" icon={<AppIcon id="edit" />} label="Mon profil et mon compte" />
      </Panel>

      <Panel title="Apparence" icon="theme" id="p-apparence">
        <PanelRow label="Thème des menus" hint="Automatique suit ton téléphone. Le studio d’entraînement reste blanc." column>
          <Segmented
            label="Thème des menus"
            value={settings.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { id: 'clair', label: 'Clair' },
              { id: 'sombre', label: 'Sombre' },
              { id: 'auto', label: 'Automatique' },
            ]}
          />
        </PanelRow>
        <PanelRow label="Rendu des combattants" column>
          <CoachLookPicker testId="settings-coach-look" />
        </PanelRow>
      </Panel>

      <Panel title="Personnalisation" icon="settings" id="p-perso">
        <LinkRow to="/coach" icon={<AppIcon id="fighter" />} label="Mon coach" hint={championFor(profile.coach).name} />
        <LinkRow to="/reglages/voix" icon={<AppIcon id="audio" />} label="Voix et sons" />
        <LinkRow to="/reglages/rounds" icon={<AppIcon id="repeat" />} label="Rounds par défaut" hint={`${settings.defaultRoundSec / 60} min, repos ${settings.defaultRestSec} s`} />
        <LinkRow to="/reglages/affichage" icon={<AppIcon id="display" />} label="Affichage 3D" hint="Qualité, caméra" />
        <button type="button" className="panel-row" onClick={() => (updateProfile({ completed: false }), nav('/bienvenue'))}>
          <AppIcon id="details" />
          <span className="grow">
            Questionnaire et niveaux
            <span className="hint">Refaire l’évaluation de départ</span>
          </span>
          <AppIcon id="chevron" className="muted" />
        </button>
      </Panel>

      <Panel title="Données" icon="privacy" id="p-data">
        <LinkRow to="/reglages/donnees" icon={<AppIcon id="download" />} label="Exporter, importer, effacer" />
        <LinkRow to="/confidentialite" icon={<AppIcon id="privacy" />} label="Confidentialité" />
      </Panel>

      <p className="small muted settings-version">
        Version {import.meta.env.VITE_APP_VERSION}
        <br />
        Combattants 3D générés à partir de MakeHuman (licence CC0), animations produites par le moteur de l’application. Cette application ne remplace pas un entraîneur ni un avis médical.
      </p>
      {confirmErase && (
        <ConfirmDialog
          title="Tout effacer ?"
          message="Les statistiques, enchaînements, objectifs, réponses au questionnaire, combattants personnalisés, favoris, historique, collections et imports de la bibliothèque seront supprimés de cet appareil. Cette action est définitive."
          confirmLabel="Effacer"
          danger
          onConfirm={erase}
          onCancel={() => setConfirmErase(false)}
        />
      )}
    </div>
  );
}
