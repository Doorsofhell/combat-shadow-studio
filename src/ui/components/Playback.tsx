import { IconPause, IconPlay } from '../icons';
import { Segmented } from './Chips';

/** Play / pause and speed slider of a 3D preview. */
export function PlaybackControls({ playing, onToggle, speed, onSpeed, min = 0.2, max = 1.2 }: { playing: boolean; onToggle: () => void; speed: number; onSpeed: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="playback">
      <button type="button" className="btn icon" onClick={onToggle} aria-label={playing ? 'Pause' : 'Lecture'}>
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <label className="speed-ctl">
        <span>Vitesse</span>
        <input type="range" min={min} max={max} step={0.05} value={speed} onChange={(e) => onSpeed(Number(e.target.value))} aria-label="Vitesse de l’animation" />
        <b>×{speed.toFixed(2)}</b>
      </label>
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
