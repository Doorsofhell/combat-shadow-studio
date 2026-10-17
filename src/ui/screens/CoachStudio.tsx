import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFighters } from '../../store/fighters';
import { useProfile } from '../../store/profile';
import { useSettings } from '../../store/settings';
import { FighterLook, TattooZone, defaultLook } from '../../editor/look';
import { normalizeLook } from '../../editor/normalize';
import { randomLook } from '../../editor/random';
import type { CoachId } from '../../domain/types';
import { Button, ConfirmDialog, Tabs, toast } from '../components';
import { Preview, PreviewState, ViewMode } from './coach/Preview';
import { BodyPanel, DESIGN_IDS, FacePanel, GearPanel, HairPanel, OutfitPanel, SkinPanel, TattooPanel } from './coach/panels';
import { FighterPanel, NewFighterSheet } from './coach/FighterPanel';
import { useLeaveGuard } from './coach/useLeaveGuard';
import './coach-studio.css';

type TabId = 'combattant' | 'corps' | 'visage' | 'peau' | 'cheveux' | 'tatouages' | 'tenue' | 'equipement';
const TABS: { id: TabId; label: string; testId: string }[] = [
  { id: 'combattant', label: 'Combattant', testId: 'tab-combattant' },
  { id: 'corps', label: 'Corps', testId: 'tab-corps' },
  { id: 'visage', label: 'Visage', testId: 'tab-visage' },
  { id: 'peau', label: 'Peau', testId: 'tab-peau' },
  { id: 'cheveux', label: 'Cheveux', testId: 'tab-cheveux' },
  { id: 'tatouages', label: 'Tatouages', testId: 'tab-tatouages' },
  { id: 'tenue', label: 'Tenue', testId: 'tab-tenue' },
  { id: 'equipement', label: 'Équipement', testId: 'tab-equipement' },
];
const FACE_TABS: TabId[] = ['visage', 'cheveux'];

/** best angle to see a tattoo zone (orthodox: the lead side is the left one) */
function zoneView(z: TattooZone): ViewMode {
  if (z === 'dos') return 'dos';
  if (z === 'poitrine' || z === 'ventre' || z.startsWith('cuisse')) return 'face';
  if (z.startsWith('mollet')) return 'dos';
  return 'profil';
}

type Pending = {
  title: string;
  message: string;
  confirm: string;
  danger?: boolean;
  run: () => void;
};

const sameLook = (a: FighterLook | null, b: FighterLook | null) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Fighter creator ("Coach" tab): live 3D preview on top (left in landscape), editing panel
 * underneath. Edits stay in a draft until "Enregistrer"; everything stays on this device.
 */
export function CoachStudio() {
  const fighters = useFighters((s) => s.fighters);
  const activeId = useFighters((s) => s.activeId);
  const hydrated = useFighters((s) => s.hydrated);
  const store = useFighters.getState;
  const profile = useProfile((s) => s.profile);
  const settings = useSettings((s) => s.settings);
  const setSettings = useSettings((s) => s.set);

  const [editId, setEditId] = useState<string | null>(null);
  const fighter = fighters.find((f) => f.id === editId) ?? fighters.find((f) => f.id === activeId) ?? fighters[0] ?? null;
  const saved = useMemo(() => (fighter ? normalizeLook(fighter.look, fighter.look?.sex ?? profile.coach ?? 'homme', DESIGN_IDS) : null), [fighter, profile.coach]);
  const [draft, setDraft] = useState<FighterLook | null>(saved);
  const [name, setName] = useState(fighter?.name ?? '');
  const [loadedId, setLoadedId] = useState<string | null>(fighter?.id ?? null);
  const [tab, setTab] = useState<TabId>('combattant');
  const [pending, setPending] = useState<Pending | null>(null);
  const [newSheet, setNewSheet] = useState(false);
  const [pv, setPv] = useState<PreviewState>({
    mode: 'trois-quarts',
    faceZoom: false,
    anim: 'garde',
    playing: true,
  });
  const onPv = useCallback((s: Partial<PreviewState>) => setPv((p) => ({ ...p, ...s })), []);

  // an old install may have no fighter yet: create one from the profile's coach
  useEffect(() => {
    if (hydrated && fighters.length === 0) store().create(profile.coach ?? 'homme');
  }, [hydrated, fighters.length, profile.coach, store]);

  // load the fighter into the editor when the edited fighter changes (not on every save)
  if (fighter && fighter.id !== loadedId) {
    setLoadedId(fighter.id);
    setDraft(saved);
    setName(fighter.name);
  }

  const look = draft ?? saved;
  const trimmed = name.trim();
  const dirty = !!fighter && (!sameLook(draft, saved) || (trimmed !== '' && trimmed !== fighter.name));

  const ask = (p: Pending) => setPending(p);
  /** runs `action` now, or after confirming that unsaved changes may be lost */
  const guard = (action: () => void) => {
    if (!dirty) return action();
    ask({
      title: 'Modifications non enregistrées',
      message: 'Tu as modifié ce combattant sans enregistrer. Si tu continues, ces changements seront perdus.',
      confirm: 'Continuer sans enregistrer',
      danger: true,
      run: action,
    });
  };
  useLeaveGuard(dirty, (go) => guard(go));

  const change = useCallback((f: (l: FighterLook) => FighterLook) => setDraft((d) => (d ? f(d) : d)), []);

  if (!hydrated || !fighter || !look) {
    return (
      <div className="loading" role="status">
        <div>
          <div className="spinner" />
          Chargement…
        </div>
      </div>
    );
  }

  const save = () => {
    store().update(fighter.id, look);
    if (trimmed && trimmed !== fighter.name) store().rename(fighter.id, trimmed);
    else setName(fighter.name);
    toast('Combattant enregistré');
  };
  const cancel = () => {
    setDraft(saved);
    setName(fighter.name);
    toast('Modifications annulées');
  };
  const select = (id: string) => {
    if (id === fighter.id) return;
    guard(() => {
      setEditId(id);
      setLoadedId(null);
    });
  };
  const createNew = (sex: CoachId) => {
    setNewSheet(false);
    const prev = store().activeId;
    const id = store().create(sex);
    // a new fighter is not made active behind the user's back
    if (prev) store().setActive(prev);
    setEditId(id);
    toast(sex === 'homme' ? 'Nouveau combattant créé' : 'Nouvelle combattante créée');
  };
  const onTab = (t: TabId) => {
    setTab(t);
    setPv((p) => ({
      ...p,
      faceZoom: FACE_TABS.includes(t),
      mode: FACE_TABS.includes(t) && p.mode !== 'face' && p.mode !== 'trois-quarts' ? 'face' : p.mode,
    }));
  };

  const panel = (() => {
    const p = { look, onChange: change };
    switch (tab) {
      case 'combattant':
        return (
          <FighterPanel
            fighters={fighters}
            editingId={fighter.id}
            activeId={activeId}
            name={name}
            onName={setName}
            onSelect={select}
            onNew={() => guard(() => setNewSheet(true))}
            onDuplicate={() =>
              guard(() => {
                const id = store().duplicate(fighter.id);
                if (id) {
                  setEditId(id);
                  toast('Combattant dupliqué');
                }
              })
            }
            onDelete={() =>
              ask({
                title: `Supprimer ${fighter.name} ?`,
                message: 'Ce combattant et son apparence seront effacés de cet appareil. Cette action est définitive.',
                confirm: 'Supprimer',
                danger: true,
                run: () => {
                  if (store().fighters.length <= 1) return;
                  store().remove(fighter.id);
                  setEditId(null);
                  setLoadedId(null);
                  toast('Combattant supprimé');
                },
              })
            }
            onReset={() =>
              ask({
                title: 'Réinitialiser l’apparence ?',
                message: 'Le corps, le visage, les cheveux, les tatouages, la tenue et l’équipement reviennent aux réglages de départ. Tu pourras encore annuler tant que tu n’as pas enregistré.',
                confirm: 'Réinitialiser',
                danger: true,
                run: () => {
                  setDraft(defaultLook(look.sex));
                  toast('Apparence réinitialisée : enregistre pour la garder');
                },
              })
            }
            onActivate={() => {
              store().setActive(fighter.id);
              toast(`${fighter.name} est ton combattant actif`);
            }}
            onRandom={() => setDraft(randomLook(look.sex, Math.random, DESIGN_IDS))}
          />
        );
      case 'corps':
        return <BodyPanel {...p} />;
      case 'visage':
        return <FacePanel {...p} />;
      case 'peau':
        return <SkinPanel {...p} />;
      case 'cheveux':
        return <HairPanel {...p} />;
      case 'tatouages':
        return <TattooPanel key={fighter.id} {...p} onZone={(z) => setPv((s) => ({ ...s, faceZoom: false, mode: zoneView(z) }))} />;
      case 'tenue':
        return <OutfitPanel {...p} />;
      case 'equipement':
        return <GearPanel {...p} />;
    }
  })();

  return (
    <div className="cs-root">
      <h1 className="sr-only">Créateur de combattant</h1>
      <Preview look={look} discipline={profile.mainDiscipline} southpaw={profile.guard === 'gaucher'} quality={settings.quality} state={pv} onState={onPv} />

      <div className="cs-panel">
        <div className="cs-panel-head">
          <div className="cs-title">
            <span className="eyebrow">{fighter.id === activeId ? 'Combattant actif' : 'Combattant'}</span>
            <span className="cs-name" data-testid="editing-name">
              {trimmed || fighter.name}
            </span>
          </div>
          <Button variant="ghost" onClick={() => setDraft(randomLook(look.sex, Math.random, DESIGN_IDS))} aria-label="Apparence aléatoire">
            Aléatoire
          </Button>
        </div>
        <div className="cs-tabs">
          <Tabs items={TABS} value={tab} onChange={onTab} label="Catégories" variant="underline" />
        </div>
        <div className="cs-scroll" role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label} data-testid="editor-panel">
          {settings.coachStyle !== 'manga' && (
            <div className="note warn cs-note">
              Ton apparence personnalisée s’affiche avec le style de coach « manga ».
              <Button variant="secondary" onClick={() => setSettings({ coachStyle: 'manga' })}>
                Passer au style manga
              </Button>
            </div>
          )}
          {panel}
        </div>
        {dirty && (
          <div className="cs-savebar" role="region" aria-label="Modifications non enregistrées">
            <Button variant="secondary" onClick={cancel} data-testid="cancel-edits">
              Annuler les modifications
            </Button>
            <Button variant="primary" onClick={save} data-testid="save-fighter">
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {newSheet && <NewFighterSheet onPick={createNew} onClose={() => setNewSheet(false)} />}
      {pending && (
        <ConfirmDialog
          title={pending.title}
          message={pending.message}
          confirmLabel={pending.confirm}
          danger={pending.danger}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const run = pending.run;
            setPending(null);
            run();
          }}
        />
      )}
    </div>
  );
}
