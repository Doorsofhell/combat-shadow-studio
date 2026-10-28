import { championFor } from '../../domain/coaches/catalog';
import { DISCIPLINES, LEVELS } from '../../domain/types';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LATEST_RELEASE, hasUnseenRelease } from '../../domain/releases';
import { openNews } from '../nav/BottomBar';
import { CONSIGNE_SECS, PULSE_STYLES, PulseStyle, useSettings } from '../../store/settings';
import { useProfile } from '../../store/profile';
import { exportData, useStats } from '../../store/stats';
import { useCustom } from '../../store/custom';
import { useGoals } from '../../store/goals';
import { useFighters } from '../../store/fighters';
import { DEFAULT_CATALOG_USER, useCatalogUser } from '../../store/catalog';
import { bell, unlockAudio } from '../../audio/sound';
import { hasFrenchVoice, say, voiceAvailable } from '../../audio/voice';
import { saveTextFile } from '../../platform/native';
import { ConfirmDialog, PageHead, PanelRow, SetAction, SetGroup, SetItem, SetLink, SettingsList, Segmented, SliderRow, Toggle, toast } from '../components';
import { CoachLookPicker } from '../components/CoachLookPicker';
import { CoachPicker } from './CoachSelect';
import { chooseCoach } from '../components/fighter';
import { CoachAiSettings } from './CoachHistory';
import { AccountDataBody } from './account/Profile';
import { useCoachAi } from '../../store/coachAi';
import { AppIcon } from '../icons';
import { clearDiag, diagText, readDiag } from '../../three/diag3d';
import { resetStability, stabilityLevel } from '../../three/safe3d';
import { PremiumMarker } from '../premium/PremiumMarker';

/**
 * v0.29 (coach that vanished on Youssef's phone): what the 3D did on this device, to copy and send.
 * The journal stays on the phone (src/three/diag3d.ts).
 */
function Diag3dRows() {
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
    <>
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
    </>
  );
}

const pct = (v: number) => `${Math.round(v * 100)} %`;
const PULSE_LABEL: Record<PulseStyle, string> = { contour: 'Contour lumineux', fond: 'Fond qui respire', chrono: 'Chrono seul', off: 'Coupée' };

export function SettingsPage() {
  const { section } = useParams();
  const { settings, set } = useSettings();
  const unseen = hasUnseenRelease(settings.newsSeenVersion);
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
  // v0.32 bar of the settings: « Caméra » opens the display settings on the camera row
  const loc = useLocation();
  useEffect(() => {
    if (section !== 'affichage' || new URLSearchParams(loc.search).get('focus') !== 'camera') return;
    const id = requestAnimationFrame(() => document.getElementById('reglage-camera')?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(id);
  }, [section, loc.search, loc.key]);

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

  const d = profile.mainDiscipline;
  const coach = championFor(profile.coach);
  const looks: Record<string, string> = { realiste: 'Ultra-réaliste', encre: 'Anime', manga: 'Anime' };
  const ai = useCoachAi();
  const textSize = profile.display.textSize === 'grand' ? 'texte grand' : 'texte normal';
  const theme = settings.theme === 'clair' ? 'Jour' : settings.theme === 'auto' ? 'Auto' : 'Nuit';
  const quality = settings.quality === 'haute' ? 'Haute' : settings.quality === 'basse' ? 'Économie' : 'Auto';

  /*
   * 1.2.0 (Youssef, 2026-10-28: « Reglages avec tous le reste … une page avec toutes les options en liste bien
   * présentées qui se déploient quand on clique dessus », proposition B « Groupes Android »): everything of the former
   * Réglages, Mon coach and Coach IA tabs, and the display, Coach IA and data parts of Mes infos, in one list. The
   * former sub-pages (/reglages/voix, /affichage, /rounds, /donnees) open the same list with their row open.
   */
  return (
    <div className="page">
      <PageHead title="Réglages" />
      <SettingsList initial={section ?? null} testId="reglages-list">
        <SetGroup title="Abonnement et nouveautés">
          <SetAction icon="premium" tone="premium" title="Premium" summary="Avantages, FAQ, restaurer un achat" to="/premium" testId="reglages-premium" />
          <SetAction
            icon="notifications"
            title="Nouveautés"
            summary={`Version ${LATEST_RELEASE.version}${unseen ? ' · à découvrir' : ''}`}
            dot={unseen}
            dotTestId="news-dot"
            onClick={openNews}
            testId="reglages-nouveautes"
            ariaLabel={unseen ? 'Nouveautés, nouvelle version' : 'Nouveautés'}
          />
        </SetGroup>

        <SetGroup title="Coach et entraînement">
          <SetItem id="coach" icon="fighter" title="Mon coach" summary={`${coach.name} · ${looks[settings.coachStyle] ?? 'Ultra-réaliste'}`}>
            <p className="small muted">Ton coach montre chaque mouvement en 3D. Tu peux en changer à tout moment, tes statistiques sont conservées.</p>
            <CoachPicker value={profile.coach} onChange={(c) => chooseCoach(c)} />
            <PanelRow label="Rendu des combattants" column>
              <CoachLookPicker testId="settings-coach-look" />
            </PanelRow>
          </SetItem>
          <SetItem id="voix" icon="audio" title="Voix et sons" summary={`${settings.voice ? 'Voix activée' : 'Voix coupée'} · voix ${pct(settings.voiceVolume)} · effets ${pct(settings.effectsVolume)}`}>
        <Toggle label="Voix du coach" on={settings.voice} onChange={(v) => set({ voice: v })} />
        <Toggle label="Annoncer chaque mouvement" on={settings.announceMoves} onChange={(v) => set({ announceMoves: v })} />
        <Toggle label="Conseils techniques" hint="En mode technique" on={settings.techniqueTips} onChange={(v) => set({ techniqueTips: v })} extra={<PremiumMarker feature="advanced_voice" />} />
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
          </SetItem>
          <SetItem id="rounds" icon="repeat" title="Rounds par défaut" summary={`${settings.defaultRoundSec / 60} min, repos ${settings.defaultRestSec} s`}>
        <PanelRow label="Durée du round" column>
          <Segmented label="Durée du round" value={settings.defaultRoundSec} onChange={(v) => set({ defaultRoundSec: v })} options={[60, 120, 180, 300].map((s) => ({ id: s, label: `${s / 60} min` }))} />
        </PanelRow>
        <PanelRow label="Repos" column>
          <Segmented label="Repos" value={settings.defaultRestSec} onChange={(v) => set({ defaultRestSec: v })} options={[30, 45, 60, 90].map((s) => ({ id: s, label: `${s} s` }))} />
        </PanelRow>
          </SetItem>
          {/* 1.3.0: how the instructions are shown under the coach during the session */}
          <SetItem id="consignes" icon="list" title="Consignes pendant la séance" summary={settings.consignes === 'point' ? 'Point du moment seulement' : `Enchaînées · ${String(settings.consigneSec).replace('.', ',')} s par consigne`}>
        <PanelRow label="Affichage" column>
          <Segmented
            label="Affichage des consignes"
            value={settings.consignes}
            onChange={(v) => set({ consignes: v })}
            options={[
              { id: 'enchainees', label: 'Enchaînées' },
              { id: 'point', label: 'Point du moment' },
            ]}
          />
        </PanelRow>
        <p className="small muted" style={{ padding: '0 0 8px' }}>
          {settings.consignes === 'point'
            ? 'Sous le coach, seulement le point clé de la phase qu’il joue, comme avant la 1.3.0.'
            : 'Sous le coach, une consigne à la fois : la consigne principale, puis chaque point clé, puis on recommence. La pause les arrête.'}
        </p>
        {settings.consignes === 'enchainees' && (
          <PanelRow label="Temps par consigne" column>
            <Segmented label="Temps par consigne" value={settings.consigneSec} onChange={(v) => set({ consigneSec: v })} options={CONSIGNE_SECS.map((s) => ({ id: s, label: `${String(s).replace('.', ',')} s` }))} />
          </PanelRow>
        )}
          </SetItem>
          {/* 1.4.0 (Youssef, 2026-10-28: « Toute l'interface doit pulser ou clignoter discrètement au rythme du bip du
              round ou de l'annonce vocale des combinaisons ») */}
          <SetItem id="pulsation" icon="notifications" title="Pulsation pendant la séance" summary={settings.pulse === 'off' ? 'Coupée' : `${PULSE_LABEL[settings.pulse]} · ${pct(settings.pulseIntensity)}`}>
            <PanelRow label="Style" column>
              <Segmented
                label="Style de la pulsation"
                value={settings.pulse}
                onChange={(v) => set({ pulse: v })}
                options={PULSE_STYLES.map((id) => ({ id, label: PULSE_LABEL[id] }))}
              />
            </PanelRow>
            {settings.pulse !== 'off' && <SliderRow id="pi" label="Intensité" value={settings.pulseIntensity} min={0.3} max={1} step={0.1} onChange={(v) => set({ pulseIntensity: v })} format={pct} />}
            <p className="small muted" style={{ padding: '0 0 8px' }}>
              L’écran s’éclaire brièvement à chaque signal de la séance : gong, décompte, annonce d’un coup. Jamais plus de 3 éclairs par seconde.
            </p>
          </SetItem>
          <SetItem id="coach-ia" icon="coachAi" title="Coach IA" summary={`Répond sur le téléphone · historique ${ai.keepHistory ? 'gardé' : 'désactivé'}`}>
            <Toggle
              label="M’appeler par mon pseudo"
              hint={profile.pseudo ? `Le coach t’appelle « ${profile.pseudo} »` : 'Renseigne un pseudo dans Mes infos'}
              on={profile.coachAi.usePseudo}
              onChange={(v) => updateProfile({ coachAi: { ...profile.coachAi, usePseudo: v } })}
            />
            <CoachAiSettings />
            <PanelRow label="Tes questions restent sur cet appareil" hint="Le coach IA répond sur l’appareil : aucune question n’est envoyée sur internet." />
            <SetLink to="/coach-ia" label="Historique des échanges" hint="Historique local désactivé par défaut, effaçable à tout moment" testId="reglages-coach-ia-history" />
          </SetItem>
          <SetItem id="questionnaire" icon="details" title="Questionnaire et niveaux" summary={`${DISCIPLINES.find((x) => x.id === d)?.name ?? '—'} · ${LEVELS.find((l) => l.id === profile.levels[d])?.name ?? '—'} · ${profile.guard === 'gaucher' ? 'gaucher' : 'orthodoxe'}`}>
            <p className="small muted">Refaire l’évaluation de départ : tes réponses actuelles restent tant que tu ne valides pas le nouveau questionnaire.</p>
            <button type="button" className="btn secondary" onClick={() => (updateProfile({ completed: false }), nav('/bienvenue'))} data-testid="reglages-questionnaire">
              Refaire le questionnaire
            </button>
          </SetItem>
        </SetGroup>

        <SetGroup title="Affichage">
          <SetItem id="apparence" icon="theme" title="Apparence" summary={`${theme} · ${textSize} · français`}>
            <PanelRow label="Thème" hint="Nuit par défaut. Auto suit ton téléphone." column>
              <Segmented
                label="Thème"
                value={settings.theme}
                onChange={(v) => set({ theme: v })}
                options={[
                  // 1.0.0 (refonte ergonomique): Nuit first and by default, Jour, Auto
                  { id: 'sombre', label: 'Nuit' },
                  { id: 'clair', label: 'Jour' },
                  { id: 'auto', label: 'Auto' },
                ]}
              />
            </PanelRow>
            <PanelRow label="Taille du texte" column>
              <Segmented
                label="Taille du texte"
                value={profile.display.textSize}
                onChange={(v) => updateProfile({ display: { ...profile.display, textSize: v } })}
                options={[
                  { id: 'normal', label: 'Normale' },
                  { id: 'grand', label: 'Grande' },
                ]}
              />
            </PanelRow>
            <Toggle label="Réduire les animations" hint="Écrans et transitions sans mouvement" on={profile.display.reduceMotion} onChange={(v) => updateProfile({ display: { ...profile.display, reduceMotion: v } })} />
            <PanelRow label="Langue" hint="Français (seule langue disponible pour l’instant)" />
          </SetItem>
          <SetItem id="affichage" icon="display" title="Affichage 3D" summary={`Qualité ${quality.toLowerCase()} · tenue ${settings.coachOutfit ? 'de la discipline' : 'de base'}`}>
          {/* v0.31: discipline outfits of the Ultra-réaliste coaches (on by default) */}
          <Toggle
            on={settings.coachOutfit}
            onChange={(v) => set({ coachOutfit: v })}
            label="Tenue de la discipline"
            hint="En Ultra-réaliste, le coach porte la tenue de la discipline : gants, short, kimono… Désactivée, il s’entraîne en tenue de base."
          />
          {settings.coachOutfit && (
            <PanelRow label="Jiu-jitsu brésilien" column>
              <Segmented
                label="Tenue de jiu-jitsu brésilien"
                value={settings.bjjOutfit}
                onChange={(v) => set({ bjjOutfit: v })}
                options={[
                  { id: 'gi', label: 'Kimono (gi)' },
                  { id: 'nogi', label: 'Sans kimono (no-gi)' },
                ]}
              />
            </PanelRow>
          )}
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
          {settings.coachStyle === 'realiste' && settings.coachRender === 'premium' && (
            <PanelRow label="Lumière du coach" column>
              <Segmented
                label="Lumière du coach"
                value={settings.coachLight}
                onChange={(v) => set({ coachLight: v })}
                options={[
                  { id: 'studio', label: 'Studio' },
                  { id: 'vive', label: 'Vive (fond sombre)' },
                ]}
              />
              <p className="small muted">« Vive » reprend la lumière du labo CME : plus claire, avec un contour bleuté, et un fond sombre pendant l’entraînement.</p>
            </PanelRow>
          )}
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
          <div id="reglage-camera" data-testid="settings-camera" />
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
            <Diag3dRows />
          </SetItem>
        </SetGroup>

        <SetGroup title="Données">
          <SetItem id="donnees" icon="privacy" title="Données et confidentialité" summary="Sur ce téléphone · exporter, importer, effacer">
            <AccountDataBody />
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
          </SetItem>
          <SetItem id="a-propos" icon="info" title="À propos" summary={`Version ${import.meta.env.VITE_APP_VERSION}`}>
            <p className="small muted settings-version">
              Version {import.meta.env.VITE_APP_VERSION}
              <br />
              Combattants 3D générés à partir de MakeHuman (licence CC0), animations produites par le moteur de l’application. Cette application ne remplace pas un entraîneur ni un avis médical.
            </p>
          </SetItem>
        </SetGroup>
      </SettingsList>
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
