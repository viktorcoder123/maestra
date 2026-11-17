'use client';
// Tiny Web Audio FX bank. No files — synthesized on the fly.

let ctx: AudioContext | null = null;

function ensure(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'triangle', gain = 0.12, delay = 0) {
  const c = ensure();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  correct() {
    tone(880, 0.1, 'sine', 0.15);
    tone(1320, 0.16, 'sine', 0.12, 0.08);
  },
  wrong() {
    tone(200, 0.18, 'sawtooth', 0.12);
    tone(140, 0.22, 'sawtooth', 0.10, 0.06);
  },
  combo(n: number) {
    const base = 660 + Math.min(n, 8) * 55;
    tone(base, 0.08, 'triangle', 0.1);
    tone(base * 1.5, 0.1, 'triangle', 0.09, 0.05);
    tone(base * 2, 0.12, 'triangle', 0.08, 0.1);
  },
  levelUp() {
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((n, i) => tone(n, 0.18, 'triangle', 0.14, i * 0.07));
  },
  tick() {
    tone(1100, 0.03, 'square', 0.04);
  },
  drum() {
    tone(90, 0.1, 'sine', 0.3);
  },
  click() {
    tone(1600, 0.02, 'square', 0.05);
  },
  fanfare() {
    const notes = [523, 659, 784, 659, 784, 1047]; // C E G E G C
    notes.forEach((n, i) => tone(n, 0.16, 'triangle', 0.14, i * 0.1));
  },
  gameOver() {
    tone(392, 0.2, 'triangle', 0.14);
    tone(370, 0.22, 'triangle', 0.14, 0.14);
    tone(330, 0.26, 'triangle', 0.14, 0.3);
    tone(294, 0.4, 'triangle', 0.15, 0.5);
  },
};
