import { Component, ReactNode, Suspense, lazy, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ComboPlayer, PlayerEvents } from '../../../engine/player';
import type { StageView } from '../../../three/StudioStage';
import type { DisciplineId } from '../../../domain/types';
import type { FighterLook } from '../../../editor/look';
import { TECHNIQUE_BY_ID } from '../../../domain/techniques';
import { oriented } from '../../../domain/camera';
import { AppIcon } from '../../icons';

const CoachStage = lazy(() => import('../../../three/CoachStage').then((m) => ({ default: m.CoachStage })));

export type ViewMode = 'trois-quarts' | 'face' | 'profil' | 'dos' | 'libre';

export const VIEW_BUTTONS: {
  id: Exclude<ViewMode, 'libre'>;
  label: string;
  az: number;
}[] = [
  { id: 'face', label: 'Face', az: 0 },
  { id: 'profil', label: 'Profil', az: 90 },
  { id: 'dos', label: 'Dos', az: 180 },
  { id: 'trois-quarts', label: '3/4', az: 35 },
];

/** animations the preview can play: the engine's guard idle, then single techniques and one combination */
/** reference postures (idle, no sequence) then techniques */
const ANIMS: { id: string; label: string; seq: string[]; idle?: string }[] = [
  { id: 'neutre', label: 'Posture neutre', seq: [], idle: 'neutre' },
  { id: 'garde', label: 'Garde (repos)', seq: [] },
  { id: 'jab', label: 'Jab', seq: ['jab'] },
  { id: 'direct', label: 'Direct', seq: ['direct'] },
  { id: 'crochet', label: 'Crochet', seq: ['crochet-avant'] },
  { id: 'uppercut', label: 'Uppercut', seq: ['uppercut-arriere'] },
  { id: 'esquive', label: 'Esquive', seq: ['esquive-droite'] },
  { id: 'low-kick', label: 'Low kick', seq: ['low-kick-arriere'] },
  { id: 'middle-kick', label: 'Middle kick', seq: ['middle-kick-arriere'] },
  { id: 'high-kick', label: 'High kick', seq: ['high-kick-arriere'] },
  { id: 'teep', label: 'Teep', seq: ['teep-avant'] },
  { id: 'genou', label: 'Genou', seq: ['genou-direct-arriere'] },
  { id: 'coude', label: 'Coude', seq: ['coude-horizontal-arriere'] },
  { id: 'sprawl', label: 'Sprawl', seq: ['sprawl'] },
  {
    id: 'combo',
    label: 'Jab, direct, middle kick',
    seq: ['jab', 'direct', 'middle-kick-arriere'],
  },
].filter((a) => a.seq.every((id) => TECHNIQUE_BY_ID.has(id)));

const steps = (seq: string[]) =>
  seq.map((id) => ({
    techniqueId: id,
    motionId: TECHNIQUE_BY_ID.get(id)?.motion ?? 'garde',
  }));
const NO_EVENTS: PlayerEvents = {};

class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <div className="hero-loading small">Affichage 3D indisponible sur cet appareil. Tes réglages sont quand même enregistrés.</div>;
    return this.props.children;
  }
}

export interface PreviewState {
  mode: ViewMode;
  faceZoom: boolean;
  anim: string;
  playing: boolean;
}

/**
 * Live 3D preview of the look being edited, on the dark stage: one finger turns around the
 * fighter (360°), pinch or the wheel zooms, buttons give the classic angles and a close-up on
 * the face; the fighter plays the chosen animation.
 */
export function Preview({
  look,
  discipline,
  southpaw,
  quality,
  state,
  onState,
}: {
  look: FighterLook;
  discipline: DisciplineId;
  southpaw: boolean;
  quality: 'auto' | 'haute' | 'basse';
  state: PreviewState;
  onState: (s: Partial<PreviewState>) => void;
}) {
  const player = useRef<ComboPlayer | null>(null);
  const anim = ANIMS.find((a) => a.id === state.anim) ?? ANIMS[1];
  const stateRef = useRef({ anim, playing: state.playing });
  stateRef.current = { anim, playing: state.playing };

  const start = useCallback((p: ComboPlayer) => {
    const { anim: a, playing } = stateRef.current;
    p.setIdle(a.idle ?? 'garde');
    p.restart();
    p.setSequence(steps(a.seq), a.seq.length ? 0.9 : 0);
    if (playing) p.play();
    else p.pause();
  }, []);

  // a new player exists after a sex or leg-length change: it resumes the current animation
  const onPlayer = useCallback(
    (p: ComboPlayer) => {
      player.current = p;
      start(p);
    },
    [start],
  );
  useEffect(() => {
    if (player.current) start(player.current);
  }, [anim, start]);
  useEffect(() => {
    if (!player.current) return;
    if (state.playing) player.current.play();
    else player.current.pause();
  }, [state.playing]);

  const view = useMemo<StageView>(() => {
    const base = VIEW_BUTTONS.find((b) => b.id === state.mode) ?? VIEW_BUTTONS[3];
    const az = oriented({ az: base.az }, southpaw);
    if (state.faceZoom) return { az, el: 4, zoom: 3.4, focus: 0.92, closeUp: true };
    return { az, el: state.mode === 'dos' ? 10 : 6, zoom: 0.9, focus: 0.52 };
  }, [state.mode, state.faceZoom, southpaw]);

  const onUserOrbit = useCallback(() => onState({ mode: 'libre' }), [onState]);
  // the guard is framed from the real animation too, so a tall fighter or a helmet is never cropped
  const frameIds = useMemo(() => (anim.seq.length ? anim.seq : ['garde']), [anim]);

  return (
    <div className="cs-preview">
      <div className="cs-stage" role="img" aria-label="Aperçu 3D de ton combattant. Fais glisser pour tourner autour, pince ou utilise la molette pour zoomer.">
        <StageBoundary>
          <Suspense
            fallback={
              <div className="hero-loading" role="status" aria-label="Chargement du combattant">
                <div className="stage-skeleton" />
              </div>
            }
          >
            <CoachStage
              backdrop="dark"
              coach={look.sex}
              look={look}
              discipline={discipline}
              southpaw={southpaw}
              view={view}
              free={state.mode === 'libre'}
              onUserOrbit={onUserOrbit}
              frameIds={frameIds}
              quality={quality}
              events={NO_EVENTS}
              onPlayer={onPlayer}
            />
          </Suspense>
        </StageBoundary>
      </div>

      <div className="cs-views" role="group" aria-label="Angle de vue">
        {VIEW_BUTTONS.map((b) => (
          <button key={b.id} type="button" className="cs-view-btn" aria-pressed={state.mode === b.id} onClick={() => onState({ mode: b.id })} data-testid={`view-${b.id}`}>
            {b.label}
          </button>
        ))}
        <button
          type="button"
          className="cs-view-btn"
          aria-pressed={state.faceZoom}
          onClick={() =>
            onState({
              faceZoom: !state.faceZoom,
              mode: state.mode === 'libre' ? 'face' : state.mode,
            })
          }
          data-testid="face-zoom"
        >
          Visage
        </button>
      </div>

      <div className="cs-anim">
        <button
          type="button"
          className="cs-play"
          onClick={() => onState({ playing: !state.playing })}
          aria-label={state.playing ? 'Mettre l’animation en pause' : 'Lancer l’animation'}
          data-testid="anim-play"
        >
          {state.playing ? <AppIcon id="pause" /> : <AppIcon id="play" />}
        </button>
        <label className="sr-only" htmlFor="cs-anim-select">
          Animation
        </label>
        <select id="cs-anim-select" className="cs-anim-select" value={anim.id} onChange={(e) => onState({ anim: e.target.value, playing: true })} data-testid="anim-select">
          {ANIMS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      {state.mode === 'libre' && <span className="cs-free-tag">Vue libre 360°</span>}
    </div>
  );
}
