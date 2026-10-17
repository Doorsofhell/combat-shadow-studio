/**
 * French voice coaching with the Web Speech API (speechSynthesis). Uses a French voice when the
 * device has one; the volume is independent from the effects volume.
 */
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isNative } from '../platform/native';

let voice: SpeechSynthesisVoice | null = null;
let volume = 1;
let enabled = true;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'fr-FR' && /google|amélie|thomas|audrey|marie/i.test(v.name)) ??
    voices.find((v) => v.lang?.startsWith('fr')) ??
    null
  );
}

if (typeof speechSynthesis !== 'undefined') {
  voice = pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', () => (voice = pickVoice()));
}

// the Android WebView has no speechSynthesis: the app uses the system text-to-speech engine instead
export const voiceAvailable = () => isNative() || typeof speechSynthesis !== 'undefined';
export const hasFrenchVoice = () => isNative() || !!(voice ?? pickVoice());

export function setVoiceVolume(v: number) {
  volume = v;
}

export function setVoiceEnabled(v: boolean) {
  enabled = v;
  if (!v) stopVoice();
}

/** say a cue; `interrupt` cancels what is being said (keeps cues in sync with the animation) */
export function say(text: string, opts: { interrupt?: boolean; rate?: number } = {}) {
  if (!enabled || volume <= 0) return;
  if (isNative()) {
    const speak = () => TextToSpeech.speak({ text, lang: 'fr-FR', rate: opts.rate ?? 1.1, volume, category: 'playback' }).catch(() => undefined);
    if (opts.interrupt) void TextToSpeech.stop().catch(() => undefined).then(speak);
    else void speak();
    return;
  }
  if (typeof speechSynthesis === 'undefined') return;
  if (opts.interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  if (voice) u.voice = voice;
  u.volume = volume;
  u.rate = opts.rate ?? 1.1;
  speechSynthesis.speak(u);
}

export function stopVoice() {
  if (isNative()) void TextToSpeech.stop().catch(() => undefined);
  else if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
