/** Tiny synthesized sound effects (Web Audio) — no audio files to download or cache. */
export type SoundName = 'tap' | 'correct' | 'wrong' | 'win' | 'badge';

let context: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) { enabled = on; }

function tone(ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.12) {
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + duration + 0.03);
}

export function playSound(name: SoundName) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    context ??= new Ctor();
    if (context.state === 'suspended') void context.resume();
    const ctx = context;
    switch (name) {
      case 'tap': tone(ctx, 520, 0, 0.06, 'triangle', 0.05); break;
      case 'correct': tone(ctx, 660, 0, 0.12, 'triangle'); tone(ctx, 880, 0.1, 0.18, 'triangle'); break;
      case 'wrong': tone(ctx, 300, 0, 0.16, 'sine', 0.09); tone(ctx, 240, 0.13, 0.22, 'sine', 0.09); break;
      case 'badge': [784, 988, 1175].forEach((f, i) => tone(ctx, f, i * 0.09, 0.2, 'triangle')); break;
      case 'win': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.11, 0.24, 'triangle')); break;
    }
  } catch { /* audio is a nice-to-have */ }
}

export function speak(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/×/g, ' כפול ').replace(/÷/g, ' חלקי ').replace(/−/g, ' פחות ').replace(/\+/g, ' ועוד ').replace(/=/g, ' שווה ').replace(/[□_?]+/g, ' '));
  utterance.lang = 'he-IL'; utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
  return true;
}
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
