'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Button } from '@/components/Button';

type P = { id: string; nombre: string; metodo: string };

export function RelampagoClient({ pedagogos }: { pedagogos: P[] }) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(60);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
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
    if (!current || !running || picked) return;
    const good = p.id === current.id;
    const res = registerAnswer('relampago', good, 5, combo);
    setCombo(res.newCombo);
    if (good) setScore((s) => s + 1);
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    setPicked(p.id);
    setTimeout(() => { setPicked(null); setIdx((i) => (i + 1) % order.length); }, 320);
  }

  if (!running && left === 60) {
    return (
      <div className="bg-white border border-ink-200 rounded-3xl p-10 text-center">
        <h2 className="font-serif text-[36px] mb-3 leading-none font-serif-balance">Sesenta segundos. Cuántos emparejas.</h2>
        <p className="text-ink-500 mb-6">Elige el autor del método que aparece.</p>
        <Button variant="primary" onClick={start}>Empezar</Button>
      </div>
    );
  }
  if (!running && left === 0) {
    return (
      <div className="bg-white border border-ink-200 rounded-3xl p-10 text-center">
        <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-600">Resultado</div>
        <div className="font-serif text-[64px] leading-none mt-2">{score} aciertos</div>
        <div className="mt-6"><Button variant="dark" onClick={start}>Otra vez</Button></div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-brand-500 text-white rounded-t-3xl p-6 flex items-center justify-between gap-5 flex-wrap">
        <div className="font-serif leading-none" style={{ fontSize: 'clamp(90px,16vw,170px)' }}>{left}</div>
        <div className="text-[18px]"><strong className="text-[28px] block">{score}</strong> aciertos</div>
        <div className="basis-full h-[10px] rounded-full bg-white/30 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${(left / 60) * 100}%` }} />
        </div>
      </div>
      {current && (
        <div className="bg-white border border-ink-200 border-t-0 rounded-b-3xl p-6">
          <div className="text-[13px] uppercase text-ink-500 mb-1 font-semibold tracking-[.06em]">¿Quién creó…?</div>
          <div className="font-serif text-[clamp(28px,4vw,40px)] mb-6 leading-[1.1]">{current.metodo}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {choices.map((c) => {
              const is = picked === c.id;
              const good = c.id === current.id;
              const state = picked ? (good ? 'correct' : is ? 'wrong' : 'dim') : 'idle';
              return <ChoiceButton key={c.id} onClick={() => choose(c)} state={state as any}>{c.nombre}</ChoiceButton>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
