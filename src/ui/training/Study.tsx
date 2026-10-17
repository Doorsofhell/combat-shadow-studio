import { useCallback, useEffect, useRef, useState } from 'react';
import type { CoachRig } from '../../engine/rig';
import type { MotionLibrary } from '../../engine/library';
import { STUDY_PHASE_LABEL, StudyPlayer } from '../../engine/study';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { instructionOf } from '../../domain/instructions';
import { CUE_LABEL, CueId, useSettings } from '../../store/settings';
import { IconNext, IconPause, IconPlay, IconPrev } from '../icons';

/**
 * State of the "Décomposer" mode: which technique is studied, the study player that drives the
 * coach, and a re-render on each phase change.
 */
export function useStudy(southpaw: boolean) {
  const rigLib = useRef<{ rig: CoachRig; lib: MotionLibrary } | null>(null);
  const study = useRef<StudyPlayer | null>(null);
  const [tech, setTech] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => (t + 1) % 1e9), []);

  const build = useCallback(
    (id: string | null) => {
      const r = rigLib.current;
      if (!id || !r) {
        study.current = null;
        return;
      }
      const prev = study.current;
      const p = new StudyPlayer(r.rig, r.lib, southpaw);
      p.onChange = bump;
      if (prev) {
        p.speed = prev.speed;
      }
      p.setTechnique(TECHNIQUE_BY_ID.get(id)?.motion ?? id);
      study.current = p;
      bump();
    },
    [southpaw, bump],
  );

  const onRigReady = useCallback(
    (rig: CoachRig, lib: MotionLibrary) => {
      rigLib.current = { rig, lib };
      if (tech) build(tech);
    },
    [tech, build],
  );

  useEffect(() => build(tech), [tech, build]);

  return { study, tech, open: setTech, close: () => setTech(null), onRigReady, ready: () => !!rigLib.current, bump };
}

/** controls of the "Décomposer" mode, shown in place of the training controls */
export function StudyPanel({
  study,
  tech,
  sequence,
  onPick,
  onClose,
  rotate,
  onRotate,
}: {
  study: StudyPlayer | null;
  tech: string;
  sequence: string[];
  onPick: (id: string) => void;
  onClose: () => void;
  rotate: number;
  onRotate: (deg: number) => void;
}) {
  const t = TECHNIQUE_BY_ID.get(tech);
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const [showCues, setShowCues] = useState(false);
  const [, setTick] = useState(0);
  // the slider position follows the motion
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => (x + 1) % 1e9), 120);
    return () => window.clearInterval(id);
  }, []);
  if (!study) return <div className="cue">Chargement du coach…</div>;
  const phase = study.phase;
  const key = phase === 'depart' ? 'Observe la garde : écart des pieds, mains, menton.' : t ? instructionOf(t).main : '';
  const uniq = [...new Set(sequence)];
  return (
    <div className="study" data-testid="study-panel">
      <div className="row nowrap" style={{ gap: 8, alignItems: 'center' }}>
        <span className={`phase ${phase === 'point' ? 'travail' : 'repos'}`} data-testid="study-phase">
          {study.playing ? STUDY_PHASE_LABEL[phase] : 'Pause sur la posture'}
        </span>
        <b style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.name}</b>
        <button className="btn sm" onClick={onClose} data-testid="study-close">
          Terminer
        </button>
      </div>
      {uniq.length > 1 && (
        <div className="row" style={{ gap: 6 }}>
          {uniq.map((id) => (
            <button key={id} className={`chip ${id === tech ? 'on' : ''}`} onClick={() => onPick(id)}>
              {TECHNIQUE_BY_ID.get(id)?.name ?? id}
            </button>
          ))}
        </div>
      )}
      <div className={`cue ${phase === 'point' ? 'strong' : ''}`}>{key}</div>
      <input
        type="range"
        min={0}
        max={study.duration}
        step={0.005}
        value={study.t}
        onChange={(e) => {
          study.playing = false;
          study.seek(Number(e.target.value));
          setTick((x) => x + 1);
        }}
        aria-label="Position dans le mouvement"
      />
      <div className="controls study-controls">
        <button className="btn icon" onClick={() => study.stepKey(-1)} aria-label="Étape clé précédente" data-testid="study-prev">
          <IconPrev />
        </button>
        <button
          className={`btn ${study.playing ? 'dark' : 'primary'}`}
          onClick={() => {
            study.playing = !study.playing;
            setTick((x) => x + 1);
          }}
          data-testid="study-play"
        >
          {study.playing ? (
            <>
              <IconPause /> Pause
            </>
          ) : (
            <>
              <IconPlay /> Lecture
            </>
          )}
        </button>
        <button className="btn icon" onClick={() => study.stepKey(1)} aria-label="Étape clé suivante" data-testid="study-next">
          <IconNext />
        </button>
      </div>
      <div className="study-speeds">
        {[0.25, 0.5, 1].map((v) => (
          <button
            key={v}
            className={`chip ${study.speed === v ? 'on' : ''}`}
            onClick={() => {
              study.speed = v;
              setTick((x) => x + 1);
            }}
          >
            {v === 1 ? '×1 normal' : `×${v}`}
          </button>
        ))}
        <button className={`chip ${showCues ? 'on' : ''}`} onClick={() => setShowCues(!showCues)}>
          Repères
        </button>
      </div>
      {!study.playing && (
        <div className="speed">
          <span>Tourner</span>
          <input type="range" min={-180} max={180} step={5} value={rotate} onChange={(e) => onRotate(Number(e.target.value))} aria-label="Tourner autour du coach" />
          <b>{rotate}°</b>
        </div>
      )}
      {showCues && (
        <div className="row" style={{ gap: 6 }}>
          {(Object.keys(CUE_LABEL) as CueId[]).map((c) => (
            <button key={c} className={`chip ${settings.cues[c] ? 'on' : ''}`} onClick={() => set({ cues: { ...settings.cues, [c]: !settings.cues[c] } })}>
              {CUE_LABEL[c]}
            </button>
          ))}
          <button className={`chip ${settings.seeThroughGear ? 'on' : ''}`} onClick={() => set({ seeThroughGear: !settings.seeThroughGear })}>
            Protections transparentes
          </button>
        </div>
      )}
    </div>
  );
}
