'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Pill } from '@/components/Pill';
import { Button } from '@/components/Button';

type Pattern = { name: string; beats: number[]; bpm: number; label: string };

const PATTERNS: Pattern[] = [
  { name: 'Negras',    beats: [0, 0.25, 0.5, 0.75], bpm: 90,  label: '♩ ♩ ♩ ♩' },
  { name: 'Corcheas',  beats: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875], bpm: 90, label: '♫ ♫ ♫ ♫' },
  { name: 'Ta-ti-ti', beats: [0, 0.25, 0.375, 0.5, 0.75, 0.875], bpm: 90, label: '♩ ♫ ♩ ♫' },
  { name: 'Síncopa',  beats: [0, 0.1875, 0.5, 0.625, 0.75], bpm: 85, label: '♪.♩ ♫ ♩' },
  { name: 'Tresillo', beats: [0, 1/6, 2/6, 0.5, 0.75], bpm: 80, label: '3-illo' },
];

const TOL_PERFECT = 90;
const TOL_GOOD = 180;
const TOL_OK = 300;

type Phase = 'idle' | 'listen' | 'countin' | 'tap' | 'result';

export function RitmoClient() {
  const [patternIdx, setPatternIdx] = useState(0);
  const pattern = PATTERNS[patternIdx];
  const [phase, setPhase] = useState<Phase>('idle');
  const [taps, setTaps] = useState<number[]>([]);
  const [combo, setCombo] = useState(0);
  const [results, setResults] = useState<Array<{ dev: number; score: 'perfect' | 'good' | 'ok' | 'miss' }>>([]);
  const [verdict, setVerdict] = useState<string>('');
  const startedRef = useRef<number>(0);
  const [playhead, setPlayhead] = useState(0); // 0..1 across target bar
  const [playedDot, setPlayedDot] = useState<number | null>(null);
  const [countNum, setCountNum] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); if (phase === 'tap') tap(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase]);

  const barMs = () => (60_000 / pattern.bpm) * 4;

  async function run() {
    setTaps([]); setResults([]); setVerdict('');
    const dur = barMs();
    // Listen 2 bars
    setPhase('listen');
    for (let bar = 0; bar < 2; bar++) {
      pattern.beats.forEach((frac, i) => {
        setTimeout(() => { sfx.drum(); setPlayedDot(i); setTimeout(() => setPlayedDot(null), 100); }, bar * dur + frac * dur);
      });
      await new Promise((r) => setTimeout(r, dur));
    }
    // Count-in
    setPhase('countin');
    for (let i = 0; i < 4; i++) {
      setTimeout(() => { setCountNum(i + 1); if (i < 3) sfx.tick(); }, (i * dur) / 4);
    }
    await new Promise((r) => setTimeout(r, dur));
    // Tap bar
    setPhase('tap');
    startedRef.current = performance.now();
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / dur;
      if (t >= 1) { setPlayhead(1); finish(); return; }
      setPlayhead(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function tap() {
    const t = performance.now() - startedRef.current;
    if (t < -160) return;
    sfx.click();
    setTaps((arr) => [...arr, t]);
  }

  function finish() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase('result');
    const dur = barMs();
    const targets = pattern.beats.map((f) => f * dur);
    const r = taps.map((tt) => {
      const nearest = targets.reduce((a, b) => Math.abs(b - tt) < Math.abs(a - tt) ? b : a, targets[0]);
      const dev = Math.abs(nearest - tt);
      let score: 'perfect' | 'good' | 'ok' | 'miss' = 'miss';
      if (dev < TOL_PERFECT) score = 'perfect';
      else if (dev < TOL_GOOD) score = 'good';
      else if (dev < TOL_OK) score = 'ok';
      return { dev, score };
    });
    setResults(r);

    const perfect = r.filter((x) => x.score === 'perfect').length;
    const good = r.filter((x) => x.score === 'good').length;
    const ok = r.filter((x) => x.score === 'ok').length;
    const totallyClean = perfect === pattern.beats.length && taps.length === pattern.beats.length;
    const roundOk = (perfect + good + ok) >= pattern.beats.length * 0.6 && taps.length === pattern.beats.length;
    const points = perfect * 10 + good * 5 + ok * 2;

    const res = registerAnswer('ritmo', roundOk, Math.max(1, points), combo);
    setCombo(res.newCombo);
    roundOk ? sfx.correct() : sfx.wrong();
    if (totallyClean) sfx.fanfare();

    const avg = r.length ? Math.round(r.reduce((a, x) => a + x.dev, 0) / r.length) : 0;
    const v = totallyClean ? 'Clavado.' : roundOk ? 'Bien llevado.' : taps.length !== pattern.beats.length ? `${taps.length} pulsaciones, eran ${pattern.beats.length}.` : 'Fuera de pulso.';
    setVerdict(`${v} ${perfect} perfectas · ${good} cerca · desviación media ${avg} ms`);
  }

  function reset() { setPhase('idle'); setTaps([]); setResults([]); setVerdict(''); setPlayhead(0); setCountNum(0); }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {PATTERNS.map((p, i) => (
          <Pill key={i} selected={patternIdx === i} onClick={() => { setPatternIdx(i); reset(); }}>{p.name} · {p.bpm} bpm</Pill>
        ))}
      </div>

      <div className="bg-stage text-ink-50 rounded-3xl p-[clamp(24px,5vw,40px)]">
        {phase === 'idle' && (
          <>
            <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">Patrón</div>
            <div className="font-serif text-[clamp(48px,8vw,96px)] leading-none mt-3 mb-6">{pattern.label}</div>
            <Button variant="primary" onClick={run}>Empezar</Button>
          </>
        )}
        {(phase === 'listen' || phase === 'countin' || phase === 'tap') && (
          <>
            <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">
              {phase === 'listen' ? 'Escucha el patrón' : phase === 'countin' ? 'Prepárate…' : 'Toca el patrón'}
            </div>
            {phase === 'countin' && (
              <div className="flex gap-6 my-6 justify-center">
                {[1,2,3,4].map((n) => (
                  <div key={n} className={`font-serif text-[36px] leading-none transition-colors ${countNum === n ? 'text-brand-500' : 'text-ink-50/40'}`}>{n}</div>
                ))}
              </div>
            )}
            {/* Two lanes */}
            <Lane label="Patrón" beats={pattern.beats} activeIdx={phase === 'listen' ? playedDot : null} />
            <div className="mt-3" />
            <Lane label="Tú" beats={pattern.beats} taps={taps} tapsBarMs={barMs()} phase={phase} results={results} playhead={phase === 'tap' ? playhead : null} />

            {phase === 'tap' && (
              <div className="mt-6 flex justify-center">
                <button onPointerDown={tap} className="w-[132px] h-[132px] rounded-full bg-brand-500 text-white font-serif text-[24px] active:scale-95 transition-transform">TAP</button>
              </div>
            )}
          </>
        )}
        {phase === 'result' && (
          <>
            <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">Resultado</div>
            <div className="font-serif text-[clamp(28px,4vw,38px)] leading-none mt-3 mb-5 font-serif-balance">{verdict.split(' · ')[0]}</div>
            <Lane label="Patrón" beats={pattern.beats} activeIdx={null} />
            <div className="mt-3" />
            <Lane label="Tú" beats={pattern.beats} taps={taps} tapsBarMs={barMs()} phase={phase} results={results} playhead={null} />
            <div className="text-[13px] text-ink-50/70 mt-4">{verdict.split('.').slice(1).join('.').trim()}</div>
            <div className="mt-6 flex gap-3">
              <Button variant="primary" onClick={run}>Otra vez</Button>
              <Button variant="ghost-dark" onClick={reset}>Cambiar patrón</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Lane({ label, beats, activeIdx, taps, tapsBarMs, phase, results, playhead }: {
  label: string; beats: number[]; activeIdx?: number | null;
  taps?: number[]; tapsBarMs?: number; phase?: Phase;
  results?: Array<{ dev: number; score: 'perfect' | 'good' | 'ok' | 'miss' }>;
  playhead?: number | null;
}) {
  const xFor = (f: number) => `${4 + f * 92}%`;
  return (
    <div className="relative h-14 rounded-xl bg-ink-50/[0.07] border border-ink-50/15">
      <span className="absolute top-1 left-2 text-[11px] text-ink-50/60 uppercase tracking-[.06em] font-semibold">{label}</span>
      {label === 'Patrón' && beats.map((f, i) => {
        const active = activeIdx === i;
        return <span key={i} className={`absolute top-1/2 w-[26px] h-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${active ? 'bg-brand-500 scale-[1.45]' : 'bg-ink-50'}`} style={{ left: xFor(f) }} />;
      })}
      {label === 'Tú' && beats.map((f, i) => (
        <span key={i} className="absolute top-1/2 w-[26px] h-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-dashed border-ink-50/30" style={{ left: xFor(f) }} />
      ))}
      {label === 'Tú' && taps?.map((t, i) => {
        const frac = Math.max(0, Math.min(1, t / (tapsBarMs ?? 1)));
        const r = results?.[i];
        const col = r?.score === 'perfect' ? 'bg-ok-dark' : r?.score === 'good' ? 'bg-near' : r?.score === 'ok' ? 'bg-brand-400' : 'bg-bad-dark';
        return <span key={i} className={`absolute top-1/2 w-[20px] h-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full ${r ? col : 'bg-ink-50'}`} style={{ left: xFor(frac) }} />;
      })}
      {playhead !== null && playhead !== undefined && (
        <span className="absolute top-0 bottom-0 w-[2px] bg-brand-500" style={{ left: xFor(playhead) }} />
      )}
    </div>
  );
}
