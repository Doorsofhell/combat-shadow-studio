import { useCallback, useEffect, useRef, useState } from 'react';
import type { CoachRig } from '../../engine/rig';
import type { MotionLibrary } from '../../engine/library';
import { STUDY_PHASE_LABEL, StudyPlayer } from '../../engine/study';
import { TECHNIQUE_BY_ID } from '../../domain/techniques';
import { instructionOf } from '../../domain/instructions';
import { CUE_LABEL, CueId, useSettings } from '../../store/settings';
import { AppIcon } from '../icons';
import { say } from '../../audio/voice';

/**
 * State of the "Décomposer" mode: which technique is studied, the study player that drives the
 * coach, and a re-render on each phase change.
 */
export function useStudy(southpawProfile: boolean) {
  // "Comparer les gardes": the study shows the other guard without changing the profile
  const [mirror, setMirror] = useState(false);
  const southpaw = southpawProfile !== mirror;
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
      const t = TECHNIQUE_BY_ID.get(id);
      // a new technique is first shown at real speed, then slowed down phase by phase
      p.preview = prev?.motion?.id !== (t?.motion ?? id) || !prev;
      p.setTechnique(t?.motion ?? id, t?.category, id);
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

  return { study, tech, open: setTech, close: () => (setTech(null), setMirror(false)), onRigReady, ready: () => !!rigLib.current, bump, southpaw, toggleGuard: () => setMirror((m) => !m) };
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
  southpaw,
  onToggleGuard,
}: {
  study: StudyPlayer | null;
  tech: string;
  sequence: string[];
  onPick: (id: string) => void;
  onClose: () => void;
  rotate: number;
  onRotate: (deg: number) => void;
  southpaw?: boolean;
  onToggleGuard?: () => void;
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
  const idx = study?.phaseIndex ?? -1;
  const step = study && idx >= 0 ? study.phases[idx] : undefined;
  const real = study?.phase === 'reel';
  // the coach says the phase once when it starts (the voice setting decides whether it speaks)
  const spoken = useRef('');
  useEffect(() => {
    if (!study || !step || real || !study.playing) return;
    const id = `${tech}:${idx}`;
    if (spoken.current === id) return;
    spoken.current = id;
    say(step.kind === 'cle' && t ? `${step.label}. ${instructionOf(t).main}` : `${step.label}. ${step.text}`, { interrupt: true });
  });
  if (!study) return <div className="cue">Chargement du coach…</div>;
  const phase = study.phase;
  const key = real
    ? 'Le mouvement à vitesse réelle, puis au ralenti, phase par phase.'
    : step
      ? step.kind === 'cle' || step.kind === 'depart'
        ? step.kind === 'depart'
          ? step.text
          : t
            ? instructionOf(t).main
            : ''
        : step.text
      : phase === 'depart'
        ? 'Observe la garde : écart des pieds, mains, menton.'
        : t
          ? instructionOf(t).main
          : '';
  const uniq = [...new Set(sequence)];
  return (
    <div className="study" data-testid="study-panel">
      <div className="row nowrap" style={{ gap: 8, alignItems: 'center' }}>
        <span className={`phase ${phase === 'point' ? 'travail' : 'repos'}`} data-testid="study-phase">
          {!study.playing ? 'Pause sur la posture' : real ? STUDY_PHASE_LABEL.reel : step ? `${idx + 1}. ${step.label}` : STUDY_PHASE_LABEL[phase]}
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
      {study.phases.length > 0 && (
        <div className="study-steps" role="list" aria-label="Phases de la technique" data-testid="study-steps">
          {study.phases.map((p, i) => (
            <button
              key={i}
              role="listitem"
              className={`chip ${i === idx && !real ? 'on' : ''}`}
              onClick={() => {
                study.playPhase(i);
                setTick((x) => x + 1);
              }}
              aria-label={`Rejouer la phase ${i + 1} : ${p.label}`}
              data-testid={`study-step-${i}`}
            >
              {i + 1}. {p.label}
            </button>
          ))}
        </div>
      )}
      <div className={`cue ${phase === 'point' ? 'strong' : ''}`} data-testid="study-text">{key}</div>
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
          <AppIcon id="stepBack" />
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
              <AppIcon id="pause" /> Pause
            </>
          ) : (
            <>
              <AppIcon id="play" /> Lecture
            </>
          )}
        </button>
        <button className="btn icon" onClick={() => study.stepKey(1)} aria-label="Étape clé suivante" data-testid="study-next">
          <AppIcon id="stepForward" />
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
        {onToggleGuard && (
          <button className={`chip ${southpaw ? 'on' : ''}`} onClick={onToggleGuard} data-testid="study-guard" aria-pressed={!!southpaw} aria-label="Comparer les gardes : garde gaucher">
            Gaucher
          </button>
        )}
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
