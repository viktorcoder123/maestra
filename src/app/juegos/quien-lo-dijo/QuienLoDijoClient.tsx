'use client';
import { useEffect, useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';
import { Monogram } from '@/components/Monogram';
import { ProgressDots } from '@/components/ProgressDots';

type Card = { id: number; front: string; back: string; metadata: any };
const TOTAL = 10;

export function QuienLoDijoClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [log, setLog] = useState<boolean[]>([]);

  useEffect(() => {
    fetch(`/api/cards/random?type=quote_author,method_author,author_method&limit=${TOTAL * 2}`)
      .then((r) => r.json()).then((d) => setCards((d.cards ?? []).slice(0, TOTAL)));
  }, []);

  const current = cards[idx];
  const states = useMemo(() => {
    const out: Array<'done-right' | 'done-wrong' | 'current' | 'upcoming'> = [];
    for (let i = 0; i < TOTAL; i++) {
      if (i < log.length) out.push(log[i] ? 'done-right' : 'done-wrong');
      else if (i === idx) out.push('current');
      else out.push('upcoming');
    }
    return out;
  }, [log, idx]);

  if (!current) return <div className="text-ink-500">Cargando…</div>;

  const allBacks = [...new Set(cards.map((c) => c.back))];
  const wrongs = allBacks.filter((b) => b !== current.back).sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrongs, current.back].sort();

  function choose(c: string) {
    if (picked) return;
    setPicked(c);
    const good = c === current.back;
    const res = registerAnswer('quien_lo_dijo', good, 8, combo);
    setCombo(res.newCombo);
    setLog((l) => [...l, good]);
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }) });
  }
  function next() { setPicked(null); setIdx((i) => Math.min(i + 1, cards.length - 1)); }

  // Extract the quote text out of the "¿Quién dijo?\n\n> «…»" format
  const quote = (current.front.match(/"([^"]+)"/) ?? current.front.match(/«([^»]+)»/))?.[1] ?? current.front.replace(/.*\n\n/, '');

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressDots states={states} />
      <div className="bg-brand-100 rounded-3xl p-[clamp(32px,5vw,56px)] mt-5 relative overflow-hidden">
        <span className="absolute left-5 top-0 font-serif text-[280px] leading-none text-brand-500/30 pointer-events-none select-none">“</span>
        <blockquote className="relative font-serif text-[clamp(28px,5vw,52px)] leading-[1.08] font-serif-balance text-ink-900">«{quote}»</blockquote>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mt-6">
        {choices.map((c) => {
          const isCorrect = c === current.back;
          const isPicked = picked === c;
          const state = picked ? (isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim') : 'idle';
          const style = state === 'correct' ? 'bg-sage-600 text-white border-sage-600' :
                         state === 'wrong'   ? 'bg-bad text-white border-bad' :
                         state === 'dim'     ? 'bg-white border-ink-200 opacity-45' :
                                               'bg-white border-ink-200 hover:border-ink-900';
          return (
            <button key={c} disabled={!!picked} onClick={() => choose(c)}
              className={`flex items-center gap-[14px] text-left p-4 rounded-2xl border-[1.5px] transition-colors min-h-[72px] ${style}`}>
              <Monogram name={c} size={52} />
              <span className="flex-1">
                <span className="block text-[17px] font-semibold leading-tight">{c}</span>
              </span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-6 flex justify-end">
          {idx < cards.length - 1 ? <Button variant="dark" onClick={next}>Siguiente →</Button> : null}
        </div>
      )}
    </div>
  );
}
