'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type P = { id: string; nombre: string; metodo: string };

export function RelampagoClient({ pedagogos }: { pedagogos: P[] }) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(60);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [order, setOrder] = useState<P[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<any>(null);

  function start() {
    setRunning(true); setLeft(60); setScore(0); setIdx(0); setCombo(0);
    setOrder([...pedagogos].sort(() => Math.random() - 0.5));
    timer.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(timer.current); setRunning(false); sfx.gameOver(); return 0; }
        if (l <= 5) sfx.tick();
        return l - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(timer.current), []);

  const current = order[idx];
  const choices = current ? [...pedagogos].filter((p) => p.id !== current.id).sort(() => Math.random() - 0.5).slice(0, 3).concat(current).sort(() => Math.random() - 0.5) : [];

  function choose(p: P) {
    if (!current || !running) return;
    const good = p.id === current.id;
    const res = registerAnswer('relampago', good, 5, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    if (good) setScore((s) => s + 1);
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    setPicked(p.id);
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => (i + 1) % order.length);
    }, 280);
  }

  if (!running && left === 60) {
    return (
      <div className="text-center py-16">
        <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
        <button onClick={start} className="px-8 py-4 rounded-full bg-brand-500 text-white text-lg hover:bg-brand-600">▶︎ Empezar</button>
      </div>
    );
  }

  if (!running && left === 0) {
    return (
      <div className="text-center py-12">
        <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
        <div className="text-6xl mb-3">{score >= 15 ? '🏆' : score >= 10 ? '💪' : '📚'}</div>
        <div className="font-serif text-3xl">{score} aciertos</div>
        <button onClick={start} className="mt-6 px-6 py-3 rounded-full bg-ink-900 text-white hover:bg-ink-800">Otra vez</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
      <div className="flex justify-between font-mono mb-4">
        <div className={`text-2xl ${left <= 5 ? 'text-red-600 animate-pulse' : ''}`}>⏱ {left}s</div>
        <div className="text-2xl">✓ {score}</div>
      </div>
      {current && (
        <div className="border rounded-2xl bg-white p-6 pop-in" key={current.id}>
          <div className="text-xs text-ink-800/60 mb-1">¿Qué autor/a creó…?</div>
          <div className="font-serif text-2xl mb-6">{current.metodo}</div>
          <div className="grid grid-cols-2 gap-2">
            {choices.map((c) => {
              const is = picked === c.id;
              const good = c.id === current.id;
              const cls = picked
                ? good ? 'bg-emerald-500 text-white border-emerald-500' : is ? 'bg-red-500 text-white border-red-500' : 'border-ink-200'
                : 'hover:border-brand-400 border-ink-200';
              return (
                <button key={c.id} onClick={() => choose(c)} className={`px-3 py-3 rounded-xl border text-sm text-left ${cls}`}>
                  {c.nombre}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
