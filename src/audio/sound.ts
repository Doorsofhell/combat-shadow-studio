/**
 * Sound effects synthesised with the Web Audio API (no audio files to download):
 * ring bell, countdown beeps, rest signal, impact tick.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.8;

function ac() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** must be called from a user gesture on mobile browsers */
export function unlockAudio() {
  ac();
}

export function setEffectsVolume(v: number) {
  volume = v;
  if (master) master.gain.value = v;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const c = ac();
  if (!c || !master || volume <= 0) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** boxing ring bell: inharmonic partials with a long decay */
export function bell(times = 1) {
  for (let i = 0; i < times; i++) {
    const s = i * 0.38;
    tone(1180, s, 1.6, 'sine', 0.35);
    tone(1180 * 2.76, s, 0.9, 'sine', 0.12);
    tone(1180 * 5.4, s, 0.4, 'sine', 0.05);
  }
}

export function beep(high = false) {
  tone(high ? 1320 : 880, 0, high ? 0.45 : 0.18, 'square', 0.12);
}

export function restSignal() {
  tone(660, 0, 0.25, 'triangle', 0.25);
  tone(520, 0.28, 0.35, 'triangle', 0.25);
}

export function impact() {
  const c = ac();
  if (!c || !master || volume <= 0) return;
  const len = 0.06;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 900;
  const g = c.createGain();
  g.gain.value = 0.5;
  src.connect(f).connect(g).connect(master);
  src.start();
}
