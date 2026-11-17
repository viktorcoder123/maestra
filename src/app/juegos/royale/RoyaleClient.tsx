'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter } from '@/lib/game-state';
import { Stage } from '@/components/Stage';
import { Button } from '@/components/Button';
import { ChoiceButton } from '@/components/ChoiceButton';

type Card = { id: number; type: string; front: string; back: string; tema_id: number | null };

export function RoyaleClient() {
  const [status, setStatus] = useState<'idle' | 'play' | 'gameover'>('idle');
  const [pool, setPool] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
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
        if (t <= 1) { clearInterval(timerRef.current); answer(null); return 0; }
        if (t <= 3) sfx.tick();
        return t - 1;
      });
    }, 1000);
  }
  function stopTimer() { clearInterval(timerRef.current); }

  function answer(choice: string | null) {
    if (picked || status !== 'play') return;
    const current = pool[idx]; if (!current) return;
    stopTimer();
    const correct = choice !== null && choice === current.back;
    setPicked(choice); setReveal(true);
    if (correct) {
      const base = 10 + round * 2;
      const res = registerAnswer('royale', true, base, combo);
      setCombo(res.newCombo);
      setScore((s) => s + res.xpGained);
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      bumpCounter('royale_rounds');
    } else {
      sfx.wrong();
      setLives((l) => l - 1);
      setCombo(0);
      registerAnswer('royale', false, 0, combo);
    }
    setTimeout(() => {
      const nextLives = correct ? lives : lives - 1;
      if (nextLives <= 0) { setStatus('gameover'); sfx.gameOver(); return; }
      setIdx((i) => (i + 1) % pool.length);
      setRound((r) => r + 1);
      beginRound(round + 1);
    }, 1500);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (status === 'idle') {
    return (
      <Stage>
        <div className="flex gap-2 mb-6">
          {[0,1,2].map((i) => <span key={i} className="w-[22px] h-[22px] rounded-full bg-brand-500" />)}
        </div>
        <h2 className="font-serif text-[clamp(34px,5vw,56px)] leading-[1.08] font-serif-balance mb-5">Tres vidas. Cada ronda, un segundo menos.</h2>
        <p className="text-ink-50/80 max-w-xl mb-6 leading-[1.6]">
          Empiezas con 30 segundos por pregunta y bajas hasta 8. Las rachas multiplican los puntos. Aguanta 10 rondas para el logro Superviviente.
        </p>
        <Button variant="primary" onClick={start}>Comenzar</Button>
      </Stage>
    );
  }
  if (status === 'gameover') {
    return (
      <Stage>
        <div className="text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">Resultado</div>
          <div className="font-serif text-[clamp(44px,6vw,64px)] leading-none mt-2">Aguantaste {round} rondas.</div>
          <div className="text-ink-50/70 mt-2">{score} XP ganados</div>
          <div className="mt-6"><Button variant="primary" onClick={start}>Reintentar</Button></div>
        </div>
      </Stage>
    );
  }

  const current = pool[idx]; if (!current) return null;
  const allBacks = [...new Set(pool.map((c) => c.back))].filter((b) => b !== current.back);
  const wrongs = [...allBacks].sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrongs, current.back].sort();
  const progress = (timeLeft / timeForRound(round)) * 100;
  const urgent = timeLeft <= 5;
  const ringColor = urgent ? '#f08a6c' : '#eb7a3a';

  return (
    <Stage>
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          {[0,1,2].map((i) => (
            <span key={i} className={`w-[18px] h-[18px] rounded-full ${i < lives ? 'bg-brand-500' : 'border-2 border-brand-500'}`} />
          ))}
        </div>
        <div className="text-[13px] text-ink-50/70">Ronda {round + 1} · <span className="text-ink-50">{score} XP</span></div>
        <div className="w-[132px] h-[132px] rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${ringColor} ${progress}%, rgba(250,250,247,.14) 0)` }}>
          <div className="w-[108px] h-[108px] rounded-full bg-stage text-ink-50 flex items-center justify-center font-serif text-[48px]">{timeLeft}</div>
        </div>
      </div>
      <div className="mt-6">
        {current.tema_id && <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-400 mb-2">TEMA {current.tema_id}</div>}
        <div className="font-serif text-[clamp(26px,3.6vw,38px)] leading-[1.15] font-serif-balance whitespace-pre-wrap mb-6">{current.front}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {choices.map((c) => {
            const isCorrect = c === current.back; const isPicked = picked === c;
            const state = reveal ? (isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim') : 'idle';
            return <ChoiceButton key={c} stage state={state as any} disabled={!!picked} onClick={() => answer(c)}>{c}</ChoiceButton>;
          })}
        </div>
      </div>
    </Stage>
  );
}
