import { useEffect, useState } from 'react';
import { useGoals, type Mastery } from '../../store/goals';
import { AppIcon } from '../icons';
import { Segmented } from './Chips';

/** Play / pause and speed slider of a 3D preview. */
export function PlaybackControls({ playing, onToggle, speed, onSpeed, min = 0.2, max = 1.2, extra }: { playing: boolean; onToggle: () => void; speed: number; onSpeed: (v: number) => void; min?: number; max?: number; extra?: React.ReactNode }) {
  return (
    <div className="playback">
      <button type="button" className="btn icon" onClick={onToggle} aria-label={playing ? 'Pause' : 'Lecture'}>
        {playing ? <AppIcon id="pause" /> : <AppIcon id="play" />}
      </button>
      <label className="speed-ctl">
        <span>Vitesse</span>
        <input type="range" min={min} max={max} step={0.05} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="Vitesse de l’animation" />
        <b>×{speed.toFixed(2)}</b>
      </label>
      {extra}
    </div>
  );
}

export const CAMERA_PRESETS: { id: number; label: string }[] = [
  { id: 35, label: '3/4' },
  { id: 0, label: 'Face' },
  { id: 90, label: 'Profil' },
  { id: -35, label: '3/4 opposé' },
];

/** Camera angle presets of a 3D preview. */
export function CameraControls({ value, onChange, presets = CAMERA_PRESETS }: { value: number; onChange: (a: number) => void; presets?: { id: number; label: string }[] }) {
  return <Segmented options={presets} value={value} onChange={onChange} label="Angle de caméra" />;
}

const MASTERY_LABEL: Record<Mastery, string> = { acquise: 'Assimilée', 'a-revoir': 'Encore du mal' };

/**
 * 0.24 (Youssef, option F of 2026-10-20): a small two-icon switch next to the playback bar. the tick marks the
 * technique as assimilated, the circular arrow as still hard; tapping the active one again clears it. The name of the
 * state shows for a moment after a tap.
 */
export function MasterySwitch({ id }: { id: string }) {
  const value = useGoals((s) => s.mastery[id]);
  const toggle = useGoals((s) => s.toggleMastery);
  const [said, setSaid] = useState<string | null>(null);
  useEffect(() => {
    if (!said) return;
    const t = setTimeout(() => setSaid(null), 1400);
    return () => clearTimeout(t);
  }, [said]);
  const tap = (m: Mastery) => {
    toggle(id, m);
    setSaid(value === m ? 'Marque retirée' : MASTERY_LABEL[m]);
  };
  return (
    <div className="mastery-switch" role="group" aria-label="Où en es-tu sur cette technique ?" data-testid="mastery-switch">
      {(['acquise', 'a-revoir'] as const).map((m, i) => (
        <span key={m} className="ms-cell">
          {i === 1 && <span className="ms-sep" aria-hidden />}
          <button type="button" className={`ms-btn ${m} ${value === m ? 'on' : ''}`} aria-pressed={value === m} aria-label={MASTERY_LABEL[m]} title={MASTERY_LABEL[m]} onClick={() => tap(m)} data-testid={`mastery-${m}`}>
            <AppIcon id={m === 'acquise' ? 'mastered' : 'struggling'} size={20} />
          </button>
        </span>
      ))}
      {said && (
        <span className="ms-said" role="status">
          {said}
        </span>
      )}
    </div>
  );
}
