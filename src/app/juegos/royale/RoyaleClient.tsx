'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type Card = { id: number; type: string; front: string; back: string; tema_id: number | null };

export function RoyaleClient() {
  const [status, setStatus] = useState<'idle' | 'play' | 'gameover'>('idle');
  const [pool, setPool] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState(false);
  const timerRef = useRef<any>(null);

  const timeForRound = (r: number) => Math.max(8, 30 - r);

  async function start() {
    const types = 'quote_author,method_author,author_method,definition,law,cloze';
    const res = await fetch(`/api/cards/random?type=${types}&limit=100`);
    const { cards } = await res.json();
    setPool(cards ?? []);
    setStatus('play');
    setIdx(0); setLives(3); setRound(0); setCombo(0); setScore(0);
    beginRound(0);
  }

  function beginRound(r: number) {
    setPicked(null); setReveal(false);
    setTimeLeft(timeForRound(r));
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); onTimeout(); return 0; }
        if (t <= 3) sfx.tick();
        return t - 1;
      });
    }, 1000);
  }

  function stopTimer() { clearInterval(timerRef.current); }

  function onTimeout() {
    if (status !== 'play') return;
    answer(null);
  }

  function answer(choice: string | null) {
    if (picked || status !== 'play') return;
    const current = pool[idx];
    if (!current) return;
    stopTimer();
    const correct = choice !== null && choice === current.back;
    setPicked(choice);
    setReveal(true);

    if (correct) {
      const base = 10 + round * 2;
      const res = registerAnswer('royale', true, base, combo);
      setCombo(res.newCombo);
      setScore((s) => s + res.xpGained);
      setXpGained(res.xpGained);
      setNewAch(res.newAchievements);
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      const counterAch = bumpCounter('royale_rounds');
      if (counterAch.length) setNewAch(counterAch);
    } else {
      sfx.wrong();
      setLives((l) => l - 1);
      setCombo(0);
      registerAnswer('royale', false, 0, combo);
    }

    setTimeout(() => {
      const nextLives = correct ? lives : lives - 1;
      if (nextLives <= 0) { setStatus('gameover'); sfx.gameOver(); return; }
      const nextIdx = (idx + 1) % pool.length;
      setIdx(nextIdx);
      setRound((r) => r + 1);
      beginRound(round + 1);
    }, 1500);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (status === 'idle') {
    return (
      <div className="border-2 border-ink-900 rounded-2xl bg-ink-50 p-10 text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="font-serif text-2xl mb-2">¿Lista?</h2>
        <ul className="text-sm text-ink-800/70 mb-6 inline-block text-left space-y-1">
          <li>❤️❤️❤️ Tres vidas</li>
          <li>⏱ 30s la primera, luego cada ronda 1s menos (mín. 8s)</li>
          <li>🔥 Combos por aciertos seguidos multiplican los puntos</li>
          <li>👑 Aguanta 10 rondas para desbloquear <em>Superviviente</em></li>
        </ul>
        <div><button onClick={start} className="px-8 py-4 rounded-full bg-red-600 text-white text-lg hover:bg-red-700">▶︎ COMIENZA</button></div>
      </div>
    );
  }

  if (status === 'gameover') {
    return (
      <div className="border rounded-2xl bg-white p-10 text-center">
        <div className="text-6xl mb-3">{round >= 20 ? '🏆' : round >= 10 ? '👑' : round >= 5 ? '💪' : '💀'}</div>
        <div className="font-serif text-3xl mb-1">Aguantaste {round} rondas</div>
        <div className="text-sm text-ink-800/60 mb-6">Puntuación total: {score} XP</div>
        <button onClick={start} className="px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700">Reintento</button>
      </div>
    );
  }

  const current = pool[idx];
  if (!current) return null;
  // 4 choices from the whole pool
  const allBacks = [...new Set(pool.map((c) => c.back))].filter((b) => b !== current.back);
  const wrongs = [...allBacks].sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrongs, current.back].sort();

  const isCloze = current.type === 'cloze';

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {[0,1,2].map((i) => (
            <span key={i} className="text-2xl">{i < lives ? '❤️' : '🖤'}</span>
          ))}
        </div>
        <div className="text-sm">Ronda <strong>{round + 1}</strong> · {score} XP</div>
        <div className={`font-mono text-2xl tabular-nums ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : ''}`}>{timeLeft}s</div>
      </div>

      {/* Time bar */}
      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-4">
        <div className={`h-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-brand-500'} transition-all duration-1000 ease-linear`} style={{ width: `${(timeLeft / timeForRound(round)) * 100}%` }} />
      </div>

      <div className="border-2 border-ink-900 rounded-2xl bg-white p-6 pop-in" key={`${current.id}-${round}`}>
        {current.tema_id && <div className="text-xs uppercase text-brand-600 mb-2">TEMA {current.tema_id}</div>}
        <div className="font-serif text-lg whitespace-pre-wrap">{current.front}</div>
        <div className="mt-6 grid grid-cols-1 gap-2">
          {choices.map((c) => {
            const isCorrect = c === current.back;
            const isPicked = picked === c;
            const cls = reveal
              ? isCorrect
                ? 'bg-emerald-500 text-white border-emerald-500'
                : isPicked
                  ? 'bg-red-500 text-white border-red-500'
                  : 'opacity-50 border-ink-200'
              : 'hover:border-brand-400 border-ink-200';
            return (
              <button key={c} disabled={!!picked} onClick={() => answer(c)}
                className={`px-4 py-3 rounded-xl border text-left transition ${cls}`}>
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
