import { useSettings } from '../../store/settings';
import { toast } from '../components';

/** 1.3.0: the four steps of the button: off, low, medium, loud (volume of the coach's voice) */
export const SOUND_STEPS = [0, 0.35, 0.7, 1] as const;
const LABEL = ['Son coupé', 'Volume faible', 'Volume moyen', 'Volume fort'];

/** the step shown for the saved settings (the voice off is step 0 whatever its volume) */
export function soundLevel(voice: boolean, volume: number): 0 | 1 | 2 | 3 {
  if (!voice || volume <= 0) return 0;
  return volume <= 0.45 ? 1 : volume <= 0.8 ? 2 : 3;
}

/** the speaker of Windows: its body, one wave per step, a cross when the sound is off */
export function SpeakerIcon({ level, size = 22 }: { level: number; size?: number }) {
  const waves = ['M15.5 9.5a3.5 3.5 0 0 1 0 5', 'M18 7a7 7 0 0 1 0 10', 'M20.5 4.5a10.5 10.5 0 0 1 0 15'];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5h3.5L11 5.5v13l-4.5-4H3z" fill="currentColor" />
      {level === 0 ? <path d="M16 9l5 6M21 9l-5 6" /> : waves.slice(0, level).map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/**
 * 1.3.0 (Youssef, 2026-10-28: « l'icône comme sur Windows pour couper le son », « je ne veux pas de 2 clics… par
 * succession de clics j'augmente le volume ou je coupe le son. L'intensité du volume devrait être visible dans
 * l'icône », « en dessous des deux options déjà présentes… à droite de l'écran »): one button, each tap goes to the
 * next step: off → low → medium → loud → off. The waves of the icon show the step. It sets the coach's voice (the
 * same settings as Réglages › Voix et sons).
 */
export function SoundButton() {
  const voice = useSettings((s) => s.settings.voice);
  const volume = useSettings((s) => s.settings.voiceVolume);
  const set = useSettings((s) => s.set);
  const level = soundLevel(voice, volume);
  const next = ((level + 1) % 4) as 0 | 1 | 2 | 3;
  return (
    <button
      type="button"
      className={`btn sound-btn ${level === 0 ? 'off' : ''}`}
      onClick={() => {
        set(next === 0 ? { voice: false } : { voice: true, voiceVolume: SOUND_STEPS[next] });
        toast(LABEL[next]);
      }}
      aria-label={`Son du coach : ${LABEL[level].toLowerCase()}. Toucher pour passer à : ${LABEL[next].toLowerCase()}`}
      data-testid="sound"
      data-level={level}
    >
      <SpeakerIcon level={level} />
      <span className="sound-steps" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
    </button>
  );
}
