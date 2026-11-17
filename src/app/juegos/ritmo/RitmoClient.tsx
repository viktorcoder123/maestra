'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type Pattern = { name: string; beats: number[]; bpm: number; label: string };

// Beats as fractions of a bar (0 = downbeat).
const PATTERNS: Pattern[] = [
  { name: 'Negras',          beats: [0, 0.25, 0.5, 0.75], bpm: 90,  label: '♩ ♩ ♩ ♩' },
  { name: 'Corcheas',        beats: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875], bpm: 90, label: '♫ ♫ ♫ ♫' },
  { name: 'Ta-ti-ti',        beats: [0, 0.25, 0.375, 0.5, 0.75, 0.875], bpm: 90, label: '♩ ♫ ♩ ♫' },
  { name: 'Síncopa',         beats: [0, 0.1875, 0.5, 0.625, 0.75], bpm: 85, label: '♪.♩ ♫ ♩' },
  { name: 'Tresillo',        beats: [0, 1/6, 2/6, 0.5, 0.75], bpm: 80, label: '3-illo ♩ ♩' },
];

const TOL_PERFECT = 90;  // ms
const TOL_GOOD = 180;
const TOL_OK = 300;

export function RitmoClient() {
  const [patternIdx, setPatternIdx] = useState(0);
  const pattern = PATTERNS[patternIdx];
  const [status, setStatus] = useState<'idle' | 'listen' | 'tap' | 'result'>('idle');
  const [taps, setTaps] = useState<number[]>([]);
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [best, setBest] = useState<number | null>(null);
  const startedRef = useRef<number>(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (status === 'tap') tap(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [status]);

  const barMs = () => (60_000 / pattern.bpm) * 4; // 4-beat bar

  async function listenThenTap() {
    setStatus('listen');
    setTaps([]);
    const dur = barMs();
    // Play the pattern (demo) twice
    for (let bar = 0; bar < 2; bar++) {
      pattern.beats.forEach((frac) => {
        setTimeout(() => { sfx.drum(); setPulse(true); setTimeout(() => setPulse(false), 80); }, bar * dur + frac * dur);
      });
      await new Promise((r) => setTimeout(r, dur));
    }
    // Then she taps along with metronome (silent, visual only)
    setStatus('tap');
    startedRef.current = performance.now();
    // Count-in metronome on beats
    for (let i = 0; i < 4; i++) {
      const t = dur + (i * dur / 4);
      setTimeout(() => { setPulse(true); setTimeout(() => setPulse(false), 80); if (i < 3) sfx.tick(); }, t);
    }
    // End of tap window
    setTimeout(() => finish(), dur * 2 + dur); // 1 count-in bar + 1 target bar
  }

  function tap() {
    const now = performance.now() - startedRef.current;
    sfx.click();
    setTaps((t) => [...t, now]);
  }

  function finish() {
    setStatus('result');
    const dur = barMs();
    // Target times (inside the "target bar" i.e. offset by dur*2 from startedRef)
    const targets = pattern.beats.map((f) => dur * 2 + f * dur);
    // Match each tap to nearest target
    const results = taps.map((tapTime) => {
      const nearest = targets.reduce((a, b) => Math.abs(b - tapTime) < Math.abs(a - tapTime) ? b : a, targets[0]);
      const dev = Math.abs(nearest - tapTime);
      let score: 'perfect' | 'good' | 'ok' | 'miss';
      if (dev < TOL_PERFECT) score = 'perfect';
      else if (dev < TOL_GOOD) score = 'good';
      else if (dev < TOL_OK) score = 'ok';
      else score = 'miss';
      return { dev, score, target: nearest };
    });

    const perfect = results.filter((r) => r.score === 'perfect').length;
    const good = results.filter((r) => r.score === 'good').length;
    const ok = results.filter((r) => r.score === 'ok').length;
    const points = perfect * 10 + good * 5 + ok * 2;
    const totallyCorrect = perfect === pattern.beats.length && taps.length === pattern.beats.length;
    const roundCorrect = perfect + good + ok >= pattern.beats.length * 0.6 && taps.length === pattern.beats.length;

    const res = registerAnswer('ritmo', roundCorrect, Math.max(1, points), combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    (window as any).__ritmoResults = results;

    roundCorrect ? sfx.correct() : sfx.wrong();
    if (totallyCorrect) sfx.fanfare();
    const avg = results.length ? results.reduce((a, r) => a + r.dev, 0) / results.length : null;
    if (avg !== null) setBest((b) => (b === null ? avg : Math.min(b, avg)));
  }

  function restart() { setStatus('idle'); setTaps([]); }

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select value={patternIdx} onChange={(e) => setPatternIdx(Number(e.target.value))} disabled={status === 'listen' || status === 'tap'}
          className="border rounded-xl px-3 py-2 text-sm">
          {PATTERNS.map((p, i) => <option key={i} value={i}>{p.name} ({p.bpm} bpm)</option>)}
        </select>
        {best !== null && (
          <div className="text-sm text-ink-800/60">Mejor precisión media: <strong>{Math.round(best)} ms</strong></div>
        )}
      </div>

      <div className={`border-2 rounded-2xl p-10 text-center transition-all ${pulse ? 'border-brand-500 bg-brand-100 scale-[1.02]' : 'border-ink-200 bg-white'}`}>
        <div className="text-5xl mb-3">{pattern.label}</div>

        {status === 'idle' && (
          <button onClick={listenThenTap} className="px-6 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">▶︎ Empezar</button>
        )}

        {status === 'listen' && <div className="text-ink-800/70">🎧 Escucha el patrón…</div>}

        {status === 'tap' && (
          <div>
            <div className="text-ink-800/70 mb-3">Pulsa <kbd className="px-2 py-0.5 border rounded">espacio</kbd> con cada pulso</div>
            <button onClick={tap} className="px-10 py-6 rounded-3xl bg-brand-500 text-white text-2xl hover:bg-brand-600 active:scale-95">TAP</button>
            <div className="mt-3 text-sm text-ink-800/60">Taps: {taps.length}</div>
          </div>
        )}

        {status === 'result' && (() => {
          const results = (window as any).__ritmoResults as { dev: number; score: string }[] ?? [];
          return (
            <div>
              <div className="flex justify-center gap-1 mb-3">
                {results.map((r, i) => (
                  <div key={i} className={`px-2 py-1 rounded-lg text-xs font-mono ${
                    r.score === 'perfect' ? 'bg-emerald-500 text-white' :
                    r.score === 'good' ? 'bg-lime-400' :
                    r.score === 'ok' ? 'bg-amber-300' :
                    'bg-red-500 text-white'
                  }`}>
                    {r.score === 'perfect' ? '●' : r.score === 'good' ? '◉' : r.score === 'ok' ? '○' : '✗'}
                    <div className="opacity-70">{Math.round(r.dev)}ms</div>
                  </div>
                ))}
              </div>
              <button onClick={restart} className="px-5 py-2 rounded-full bg-ink-900 text-white hover:bg-ink-800">Otra vez</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
