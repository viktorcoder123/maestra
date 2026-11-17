'use client';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

const WHITES = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76]; // C D E F G A B C D E
const BLACKS: Record<number, number> = { 60: 61, 62: 63, 65: 66, 67: 68, 69: 70, 72: 73, 74: 75 };
const NOTE_NAMES: Record<number, string> = {
  60: 'Do', 61: 'Do#', 62: 'Re', 63: 'Re#', 64: 'Mi', 65: 'Fa', 66: 'Fa#',
  67: 'Sol', 68: 'Sol#', 69: 'La', 70: 'La#', 71: 'Si',
  72: 'Do', 73: 'Do#', 74: 'Re', 75: 'Re#', 76: 'Mi',
};

const LEVELS = [
  { label: 'Fácil (3 notas, escala)',    count: 3, pool: [60, 62, 64, 65, 67], tempo: 1.0 },
  { label: 'Medio (4 notas, escala)',    count: 4, pool: [60, 62, 64, 65, 67, 69, 71, 72], tempo: 0.8 },
  { label: 'Difícil (5 notas, cromática)', count: 5, pool: Object.keys(NOTE_NAMES).map(Number), tempo: 0.7 },
  { label: 'Oposición (7 notas)',         count: 7, pool: [60, 62, 64, 65, 67, 69, 71, 72], tempo: 0.6 },
];

let synth: Tone.Synth | null = null;

export function DictadoClient() {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [target, setTarget] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [status, setStatus] = useState<'idle' | 'playing' | 'answering' | 'checked'>('idle');
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [score, setScore] = useState({ good: 0, bad: 0 });
  const [replayCount, setReplayCount] = useState(0);
  const flashing = useRef<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  async function ensure() {
    await Tone.start();
    if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  }

  async function playNote(midi: number, dur = '8n') {
    await ensure();
    synth!.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), dur);
    flashing.current = midi;
    setFlash(midi);
    setTimeout(() => setFlash((f) => (f === midi ? null : f)), 200);
  }

  async function newRound() {
    const target: number[] = [];
    for (let i = 0; i < level.count; i++) {
      target.push(level.pool[Math.floor(Math.random() * level.pool.length)]);
    }
    setTarget(target);
    setInput([]);
    setReplayCount(0);
    await playSequence(target);
    setStatus('answering');
  }

  async function playSequence(seq: number[]) {
    setStatus('playing');
    await ensure();
    const now = Tone.now();
    seq.forEach((m, i) => {
      synth!.triggerAttackRelease(Tone.Frequency(m, 'midi').toNote(), '8n', now + i * level.tempo);
      setTimeout(() => setFlash(m), i * level.tempo * 1000);
      setTimeout(() => setFlash((f) => (f === m ? null : f)), i * level.tempo * 1000 + 220);
    });
    await new Promise((r) => setTimeout(r, seq.length * level.tempo * 1000));
  }

  async function replay() {
    if (replayCount >= 2) return;
    setReplayCount((c) => c + 1);
    await playSequence(target);
    setStatus('answering');
  }

  function press(midi: number) {
    if (status !== 'answering') return;
    playNote(midi);
    const next = [...input, midi];
    setInput(next);
    if (next.length >= target.length) check(next);
  }

  function check(final: number[]) {
    const allCorrect = final.every((n, i) => n === target[i]);
    const partial = final.filter((n, i) => n === target[i]).length;
    const correct = allCorrect;
    const base = correct ? 10 * level.count : 2 * partial;
    const res = registerAnswer('dictado', correct, base, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    setScore((s) => ({ good: s.good + (correct ? 1 : 0), bad: s.bad + (correct ? 0 : 1) }));
    setStatus('checked');
    if (correct) {
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      if (level.count >= 7) {
        const a = bumpCounter('dictado_perfect');
        if (a.length) setNewAch(a);
      }
    } else {
      sfx.wrong();
    }
  }

  function reveal() {
    (async () => { await playSequence(target); })();
  }

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select value={levelIdx} onChange={(e) => { setLevelIdx(Number(e.target.value)); setStatus('idle'); }}
          disabled={status !== 'idle' && status !== 'checked'}
          className="border rounded-xl px-3 py-2 text-sm">
          {LEVELS.map((l, i) => <option key={i} value={i}>{l.label}</option>)}
        </select>
        <div className="text-sm text-ink-800/60">
          <span className="text-emerald-600">✓ {score.good}</span> · <span className="text-red-500">✗ {score.bad}</span>
        </div>
      </div>

      <div className="border rounded-2xl bg-white p-6 mb-4">
        {status === 'idle' && (
          <div className="text-center py-8">
            <button onClick={newRound} className="px-6 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">▶︎ Empezar ronda</button>
          </div>
        )}

        {status === 'playing' && (
          <div className="text-center py-8 text-ink-800/70">🎧 Escucha…</div>
        )}

        {status === 'answering' && (
          <div className="text-center">
            <div className="text-sm text-ink-800/60 mb-2">
              Toca las {target.length} notas en orden · {input.length}/{target.length}
            </div>
            <div className="flex justify-center gap-1.5 mb-3">
              {Array.from({ length: target.length }).map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg border-2 ${i < input.length ? 'bg-brand-500 border-brand-500' : 'border-ink-200'}`} />
              ))}
            </div>
            {replayCount < 2 && (
              <button onClick={replay} className="text-sm px-4 py-1.5 rounded-full border hover:border-brand-400">
                🔁 Repetir ({2 - replayCount} restantes)
              </button>
            )}
          </div>
        )}

        {status === 'checked' && (
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-3">
              {target.map((t, i) => {
                const good = input[i] === t;
                return (
                  <div key={i} className={`px-2 py-1 rounded-lg text-xs font-mono ${good ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {NOTE_NAMES[t]}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <button onClick={reveal} className="px-4 py-2 rounded-full border hover:border-brand-400 text-sm">🔊 Oír respuesta</button>
              <button onClick={newRound} className="px-4 py-2 rounded-full bg-ink-900 text-white hover:bg-ink-800 text-sm">Nueva ronda →</button>
            </div>
          </div>
        )}
      </div>

      <Piano flash={flash} onPress={press} />
    </div>
  );
}

function Piano({ flash, onPress }: { flash: number | null; onPress: (m: number) => void }) {
  return (
    <div className="relative select-none">
      <div className="flex">
        {WHITES.map((m) => (
          <button
            key={m}
            onMouseDown={() => onPress(m)}
            className={`relative flex-1 h-40 border border-ink-800/30 rounded-b-lg ${flash === m ? 'bg-brand-300' : 'bg-white hover:bg-ink-100'} transition`}
          >
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-ink-800/50">{NOTE_NAMES[m]}</span>
          </button>
        ))}
      </div>
      <div className="absolute top-0 left-0 w-full flex pointer-events-none">
        {WHITES.map((m, idx) => {
          const black = BLACKS[m];
          if (!black) return <div key={m} className="flex-1" />;
          return (
            <div key={m} className="flex-1 relative">
              <button
                onMouseDown={() => onPress(black)}
                className={`pointer-events-auto absolute -right-[12%] w-[24%] h-24 rounded-b-md border ${flash === black ? 'bg-brand-400' : 'bg-ink-900 hover:bg-ink-800'} z-10`}
                style={{ zIndex: 2 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
