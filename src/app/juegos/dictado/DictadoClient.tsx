'use client';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter } from '@/lib/game-state';
import { Pill } from '@/components/Pill';
import { Button } from '@/components/Button';
import { Piano, PIANO_NAMES } from '@/components/Piano';
import { Staff, Notehead, noteheadY, isSharp } from '@/components/Staff';

const WHITES = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76];
const LEVELS = [
  { label: 'Fácil · 3 notas',       count: 3, pool: [60, 62, 64, 65, 67], tempo: 1.0 },
  { label: 'Medio · 4 notas',       count: 4, pool: [60, 62, 64, 65, 67, 69, 71, 72], tempo: 0.8 },
  { label: 'Difícil · 5 cromáticas', count: 5, pool: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76], tempo: 0.7 },
  { label: 'Oposición · 7 notas',    count: 7, pool: [60, 62, 64, 65, 67, 69, 71, 72], tempo: 0.6 },
];

let synth: Tone.Synth | null = null;

type Phase = 'idle' | 'playing' | 'answering' | 'checked';

export function DictadoClient() {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [target, setTarget] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [combo, setCombo] = useState(0);
  const [replayLeft, setReplayLeft] = useState(2);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const flashTimerRef = useRef<any>(null);

  async function ensure() { await Tone.start(); if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination(); }

  async function play(midi: number) {
    await ensure();
    synth!.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), '8n');
    setFlashKey(midi);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashKey((f) => (f === midi ? null : f)), 200);
  }

  async function playSeq(seq: number[]) {
    await ensure();
    const now = Tone.now();
    seq.forEach((m, i) => {
      synth!.triggerAttackRelease(Tone.Frequency(m, 'midi').toNote(), '8n', now + i * level.tempo);
      // Highlight staff slot (NOT the piano key) during playback
      setTimeout(() => setPlayingIdx(i), i * level.tempo * 1000);
    });
    await new Promise((r) => setTimeout(r, seq.length * level.tempo * 1000));
    setPlayingIdx(null);
  }

  async function newRound() {
    const t: number[] = [];
    for (let i = 0; i < level.count; i++) t.push(level.pool[Math.floor(Math.random() * level.pool.length)]);
    setTarget(t); setInput([]); setReplayLeft(2);
    setPhase('playing'); await playSeq(t);
    setPhase('answering');
  }
  async function replay() {
    if (replayLeft <= 0) return;
    setReplayLeft((n) => n - 1);
    setPhase('playing'); await playSeq(target);
    setPhase('answering');
  }
  async function hear() {
    setPhase('playing'); await playSeq(target);
    setPhase('checked');
  }
  function press(midi: number) {
    if (phase !== 'answering') return;
    play(midi);
    const next = [...input, midi]; setInput(next);
    if (next.length >= target.length) check(next);
  }
  function check(final: number[]) {
    const allCorrect = final.every((n, i) => n === target[i]);
    const partial = final.filter((n, i) => n === target[i]).length;
    const base = allCorrect ? 10 * level.count : 2 * partial;
    const res = registerAnswer('dictado', allCorrect, base, combo);
    setCombo(res.newCombo);
    if (allCorrect) {
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      if (level.count >= 7) bumpCounter('dictado_perfect');
    } else { sfx.wrong(); }
    setPhase('checked');
  }

  const promptText = phase === 'idle'     ? `Escucharás ${level.count} notas. Después, tócalas en orden.`
                    : phase === 'playing' ? 'Escucha…'
                    : phase === 'answering' ? `Toca las ${target.length} notas en orden · ${input.length}/${target.length}`
                    : phase === 'checked' ? (input.every((n, i) => n === target[i]) ? 'Perfecto.' : 'Revisa las que fallaste.')
                    : '';

  const CTA = phase === 'idle'     ? <Button variant="primary" onClick={newRound}>Empezar ronda</Button>
             : phase === 'answering' ? <Button variant="ghost-dark" size="sm" disabled={replayLeft <= 0} onClick={replay}>Repetir · quedan {replayLeft}</Button>
             : phase === 'checked' ? <div className="flex gap-2"><Button variant="ghost-dark" size="sm" onClick={hear}>Oír respuesta</Button><Button variant="primary" onClick={newRound}>Nueva ronda →</Button></div>
             : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {LEVELS.map((l, i) => (
          <Pill key={i} selected={levelIdx === i} onClick={() => { setLevelIdx(i); setPhase('idle'); setTarget([]); setInput([]); }}>{l.label}</Pill>
        ))}
      </div>

      <div className="bg-stage text-ink-50 rounded-t-3xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[14px] text-ink-50/80">{promptText}</div>
        <div>{CTA}</div>
      </div>

      <div className="bg-stage relative overflow-hidden" style={{ height: 210 }}>
        <svg viewBox="0 0 100 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          {[60, 76, 92, 108, 124].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} stroke="rgba(250,250,247,0.5)" strokeWidth="0.3" />)}
          <line x1="5" x2="5" y1="60" y2="124" stroke="rgba(250,250,247,0.5)" strokeWidth="0.3" />
          <line x1="95" x2="95" y1="60" y2="124" stroke="rgba(250,250,247,0.5)" strokeWidth="0.3" />
          {target.map((t, i) => {
            const x = target.length === 1 ? 50 : 14 + (i * 72) / (target.length - 1);
            if (phase === 'playing') {
              const active = playingIdx === i;
              return <ellipse key={i} cx={x} cy={92} rx={active ? 4.5 : 3.3} ry={active ? 3 : 2.2} transform={`rotate(-18 ${x} 92)`}
                fill={active ? '#dd5f1b' : 'none'} stroke="rgba(250,250,247,.6)" strokeWidth={0.6} strokeDasharray="1 0.6" />;
            }
            if (phase === 'answering') {
              const played = input[i];
              if (played == null) return null;
              const y = noteheadY(played);
              return <g key={i}>
                {isSharp(played) && <text x={x - 5} y={y + 1.5} fontSize="5" fill="#fafaf7">♯</text>}
                <Notehead x={x} y={y} fill="#fafaf7" />
              </g>;
            }
            if (phase === 'checked') {
              const played = input[i];
              const correct = played === t;
              const yT = noteheadY(t);
              return <g key={i}>
                {isSharp(t) && <text x={x - 5} y={yT + 1.5} fontSize="5" fill={correct ? '#9cc294' : '#f08a6c'}>♯</text>}
                <Notehead x={x} y={yT} fill={correct ? '#9cc294' : '#f08a6c'} />
                {!correct && played != null && noteheadY(played) !== yT && (
                  <Notehead x={x} y={noteheadY(played)} fill="#f08a6c" dashed />
                )}
                <text x={x} y={154} fontSize="4" textAnchor="middle" fill={correct ? '#9cc294' : '#f08a6c'}>{PIANO_NAMES[t]}</text>
              </g>;
            }
            return null;
          })}
        </svg>
      </div>

      <div className="rounded-b-3xl overflow-hidden">
        <Piano whites={WHITES} state={flashKey != null ? { [flashKey]: 'flash' } : {}} onPress={press} height={180} />
      </div>
    </div>
  );
}
