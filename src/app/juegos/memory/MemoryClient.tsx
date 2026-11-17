'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

type P = { id: string; nombre: string; metodo: string };
type Card = { id: string; pid: string; kind: 'name' | 'method'; label: string };

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export function MemoryClient({ pedagogos }: { pedagogos: P[] }) {
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const cards: Card[] = useMemo(() => {
    const chosen = shuffle(pedagogos).slice(0, 6);
    return shuffle(chosen.flatMap((p) => [
      { id: `${p.id}-n`, pid: p.id, kind: 'name',   label: p.nombre },
      { id: `${p.id}-m`, pid: p.id, kind: 'method', label: p.metodo },
    ] as Card[]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string[]>([]);
  const [tries, setTries] = useState(0);

  function flip(c: Card) {
    if (done[c.pid] || open.includes(c.id) || open.length >= 2) return;
    const next = [...open, c.id];
    setOpen(next);
    if (next.length === 2) {
      setTries((t) => t + 1);
      const [a, b] = next.map((id) => cards.find((x) => x.id === id)!);
      if (a.pid === b.pid) {
        setDone((d) => ({ ...d, [a.pid]: true }));
        setOpen([]);
        const nextDone = { ...done, [a.pid]: true };
        const pairsDone = Object.keys(nextDone).length;
        const total = cards.length / 2;
        const res = registerAnswer('memory', true, 6, combo);
        setCombo(res.newCombo);
        sfx.correct();
        if (pairsDone === total) setTimeout(() => sfx.fanfare(), 200);
      } else {
        sfx.wrong();
        setTimeout(() => setOpen([]), 900);
      }
    }
  }

  const pairsDone = Object.keys(done).length;
  const total = cards.length / 2;
  const complete = pairsDone === total;

  return (
    <div>
      <div className="text-sm text-ink-500 mb-4">{pairsDone} de {total} parejas · {tries} intentos</div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, max(150px, 22%)), 1fr))' }}>
        {cards.map((c) => {
          const isDone = done[c.pid];
          const isOpen = open.includes(c.id) || isDone;
          if (!isOpen) {
            return (
              <button key={c.id} onClick={() => flip(c)}
                className="aspect-[4/3] rounded-[18px] bg-stage text-ink-50 flex flex-col justify-center items-center p-4 border border-ink-900 relative overflow-hidden hover:brightness-110">
                <div className="absolute inset-x-6 top-1/2 flex flex-col gap-[6px] -translate-y-1/2">
                  {[0,1,2,3,4].map((i) => <span key={i} className={`h-[1px] ${i === 2 ? 'bg-brand-500' : 'bg-ink-50/50'}`} />)}
                </div>
              </button>
            );
          }
          return (
            <div key={c.id} className={`aspect-[4/3] rounded-[18px] flex flex-col justify-between p-4 border-2 anim-pop
              ${isDone ? 'bg-sage-600 text-white border-sage-600' : 'bg-white border-brand-500'}`}>
              <div className="text-[11px] uppercase tracking-[.06em] font-semibold opacity-80">{c.kind === 'name' ? 'Pedagogo' : 'Método'}</div>
              <div className="font-serif text-[22px] leading-tight font-serif-balance">{c.label}</div>
            </div>
          );
        })}
      </div>
      {complete && (
        <div className="mt-6 text-center">
          <Button variant="primary" onClick={() => { setRound((r) => r + 1); setDone({}); setOpen([]); setTries(0); }}>Otra partida</Button>
        </div>
      )}
    </div>
  );
}
