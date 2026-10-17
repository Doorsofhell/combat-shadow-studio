import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../store/settings';
import { useProfile } from '../../store/profile';
import { exportData, useStats } from '../../store/stats';
import { useCustom } from '../../store/custom';
import { useGoals } from '../../store/goals';
import { useActiveFighter, useFighters } from '../../store/fighters';
import { DEFAULT_CATALOG_USER, useCatalogUser } from '../../store/catalog';
import { bell, unlockAudio } from '../../audio/sound';
import { hasFrenchVoice, say, voiceAvailable } from '../../audio/voice';
import { saveTextFile } from '../../platform/native';
import { ConfirmDialog, LinkRow, PageHead, Panel, PanelRow, Segmented, SliderRow, Toggle, toast } from '../components';
import { defaultFighterName } from '../components/fighter';
import { IconDownload, IconFighter, IconShield, IconTrash, IconUpload, IconUser } from '../icons';

const pct = (v: number) => `${Math.round(v * 100)} %`;

export function SettingsPage() {
  const { settings, set } = useSettings();
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.update);
  const resetProfile = useProfile((s) => s.reset);
  const fighter = useActiveFighter();
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

  return (
    <div className="page">
      <PageHead title="Réglages" />

      <Panel title="Profil" id="p-profil">
        <LinkRow to="/profil" icon={<IconUser className="muted" />} label="Mon profil et mon compte" hint="Informations, profil sportif, export et suppression de tes données" />
        <LinkRow to="/combattant" icon={<IconFighter className="muted" />} label={fighter?.name ?? defaultFighterName(profile.coach)} hint="Personnaliser ton combattant" />
        <LinkRow to="/coach" label="Coach" hint={profile.coach === 'femme' ? 'Coach femme' : 'Coach homme'} />
        <PanelRow label="Garde">
          <Segmented
            label="Garde"
            value={profile.guard}
            onChange={(g) => updateProfile({ guard: g })}
            options={[
              { id: 'orthodoxe', label: 'Orthodoxe' },
              { id: 'gaucher', label: 'Gaucher' },
            ]}
          />
        </PanelRow>
        <button type="button" className="panel-row" onClick={() => (updateProfile({ completed: false }), nav('/bienvenue'))}>
          <span className="grow">
            Questionnaire et niveaux
            <span className="hint">Refaire l’évaluation de départ</span>
          </span>
          <span className="small muted">Modifier</span>
        </button>
      </Panel>

      <Panel title="Voix et sons" id="p-voix">
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

      <Panel title="Affichage 3D" id="p-3d">
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
        <PanelRow label="Rendu des combattants" column>
          <Segmented
            label="Rendu des combattants"
            value={settings.coachStyle}
            onChange={(v) => set({ coachStyle: v })}
            options={[
              { id: 'manga', label: 'Manga' },
              { id: 'realiste', label: 'Réaliste' },
            ]}
          />
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

      <Panel title="Rounds par défaut" id="p-rounds">
        <PanelRow label="Durée du round" column>
          <Segmented label="Durée du round" value={settings.defaultRoundSec} onChange={(v) => set({ defaultRoundSec: v })} options={[60, 120, 180, 300].map((s) => ({ id: s, label: `${s / 60} min` }))} />
        </PanelRow>
        <PanelRow label="Repos" column>
          <Segmented label="Repos" value={settings.defaultRestSec} onChange={(v) => set({ defaultRestSec: v })} options={[30, 45, 60, 90].map((s) => ({ id: s, label: `${s} s` }))} />
        </PanelRow>
      </Panel>

      <Panel title="Données et confidentialité" id="p-data">
        <LinkRow to="/confidentialite" icon={<IconShield className="muted" />} label="Confidentialité" hint="Aucune mesure d’audience, aucune publicité ; synchronisation seulement si tu l’actives" />
        <div className="panel-row col">
          <span className="small muted">L’export crée un fichier que tu peux garder ou réimporter sur un autre appareil.</span>
          <div className="grid2">
            <button type="button" className="btn secondary" onClick={doExport}>
              <IconDownload width={18} /> Exporter
            </button>
            <button type="button" className="btn secondary" onClick={() => file.current?.click()}>
              <IconUpload width={18} /> Importer
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
            <IconTrash width={18} /> Tout effacer
          </button>
        </div>
      </Panel>

      <Panel title="À propos" id="p-about">
        <p className="small muted" style={{ padding: '12px 0' }}>
          Combat Shadow Studio, version {import.meta.env.VITE_APP_VERSION} (développement). Combattants 3D générés à partir de MakeHuman (licence CC0), animations produites par le moteur de l’application. Cette application ne
          remplace pas un entraîneur ni un avis médical.
        </p>
      </Panel>

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
