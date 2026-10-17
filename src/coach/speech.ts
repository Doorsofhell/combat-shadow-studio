/**
 * Voix du coach IA : saisie vocale (reconnaissance) et lecture des réponses (synthèse).
 *
 * RECONNAISSANCE — aucun moteur réellement hors ligne n’est intégré pour l’instant :
 *  - la Web Speech API (webkitSpeechRecognition) de Chrome envoie l’audio à un service en ligne :
 *    elle n’est proposée qu’en option explicite (désactivée par défaut), libellée comme telle ;
 *  - les options hors ligne (Android SpeechRecognizer en mode sur l’appareil via un plugin Capacitor,
 *    Vosk WASM, whisper.cpp) sont étudiées dans docs/COACH_IA.md ; un futur moteur implémentera
 *    `SpeechInput` avec `offline: true`.
 *
 * SYNTHÈSE — sur le web, seule une voix française locale (`localService: true`) est utilisée, pour
 * ne pas envoyer le texte à un service distant ; sur Android, le moteur de synthèse du système
 * (src/audio/voice.ts).
 */
import { say, stopVoice } from '../audio/voice';
import { isNative } from '../platform/native';
import { useSettings } from '../store/settings';

export interface SpeechInput {
  id: 'web-speech-en-ligne' | 'android-sur-appareil' | 'vosk' | 'whisper';
  /** vrai seulement si l’audio ne quitte jamais l’appareil */
  offline: boolean;
  label: string;
  /** écoute une phrase ; onResult reçoit le texte final */
  start(onResult: (text: string) => void, onError: (message: string) => void, onEnd?: () => void): void;
  stop(): void;
}

export interface SpeechCapabilities {
  /** moteur de reconnaissance hors ligne disponible (aucun pour l’instant) */
  offlineRecognition: boolean;
  /** Web Speech API présente (en ligne dans Chrome) */
  onlineWebSpeech: boolean;
  /** application Android (Capacitor) */
  native: boolean;
  /** une voix française locale existe pour lire les réponses */
  localVoice: boolean;
}

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** voix française fournie par le système (pas un service distant) */
export function localFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.localService && v.lang === 'fr-FR') ?? voices.find((v) => v.localService && v.lang?.toLowerCase().startsWith('fr')) ?? null;
}

export function detectSpeechCapabilities(): SpeechCapabilities {
  const native = safeNative();
  return {
    offlineRecognition: false,
    onlineWebSpeech: !native && !!recognitionCtor(),
    native,
    localVoice: native || !!localFrenchVoice(),
  };
}

function safeNative() {
  try {
    return isNative();
  } catch {
    return false;
  }
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Micro refusé : autorise le micro dans les réglages du navigateur.',
  'service-not-allowed': 'Reconnaissance vocale indisponible dans ce navigateur.',
  network: 'Pas de connexion : la reconnaissance vocale du navigateur fonctionne en ligne uniquement.',
  'no-speech': 'Je n’ai rien entendu.',
  'audio-capture': 'Aucun micro détecté.',
};

/** Web Speech API : EN LIGNE (l’audio est envoyé au service de reconnaissance du navigateur) */
function webSpeechInput(Ctor: RecognitionCtor): SpeechInput {
  let rec: InstanceType<RecognitionCtor> | null = null;
  return {
    id: 'web-speech-en-ligne',
    offline: false,
    label: 'Reconnaissance du navigateur (en ligne)',
    start(onResult, onError, onEnd) {
      try {
        rec = new Ctor();
        rec.lang = 'fr-FR';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.continuous = false;
        rec.onresult = (e) => {
          const r = e.results[e.results.length - 1];
          if (r && r.isFinal !== false && r[0]) onResult(r[0].transcript);
        };
        rec.onerror = (e) => onError(ERRORS[e.error] ?? 'La reconnaissance vocale a échoué.');
        rec.onend = () => onEnd?.();
        rec.start();
      } catch {
        onError('La reconnaissance vocale n’a pas pu démarrer.');
        onEnd?.();
      }
    },
    stop() {
      rec?.stop();
      rec = null;
    },
  };
}

/**
 * Moteur de saisie vocale à proposer, ou null (pas de bouton micro).
 * Aucun moteur hors ligne n’existe encore ; la Web Speech API n’est rendue que si l’utilisateur a
 * explicitement accepté son fonctionnement en ligne (`allowOnline`).
 */
export function getSpeechInput(opts: { allowOnline: boolean }): SpeechInput | null {
  const caps = detectSpeechCapabilities();
  if (opts.allowOnline && caps.onlineWebSpeech) {
    const Ctor = recognitionCtor();
    if (Ctor) return webSpeechInput(Ctor);
  }
  return null;
}

/**
 * Lit une réponse à voix haute. Respecte le réglage « voix » et son volume. Sur le web, ne parle
 * qu’avec une voix locale ; renvoie false si aucune voix locale n’est disponible.
 */
export function speakReply(text: string): boolean {
  const s = useSettings.getState().settings;
  if (!s.voice || s.voiceVolume <= 0) return false;
  const clean = text.replace(/[•→]/g, ' ').replace(/\s*\n\s*/g, '. ').replace(/\.\s*\./g, '.');
  if (safeNative()) {
    say(clean, { interrupt: true, rate: 1 });
    return true;
  }
  const v = localFrenchVoice();
  if (!v || typeof SpeechSynthesisUtterance === 'undefined') return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = v.lang;
  u.voice = v;
  u.volume = s.voiceVolume;
  u.rate = 1;
  speechSynthesis.speak(u);
  return true;
}

export function stopReply() {
  stopVoice();
}
