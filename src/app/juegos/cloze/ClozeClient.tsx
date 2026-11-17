'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

type Card = { id: number; front: string; back: string; tema_id: number | null };
function normalize(s: string) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

export function ClozeClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<'good' | 'bad' | null>(null);
  const [combo, setCombo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/cards/random?type=cloze&limit=30').then((r) => r.json()).then((d) => setCards(d.cards ?? []));
  }, []);
  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  const current = cards[idx];
  if (!current) return <div className="text-ink-500">Cargando…</div>;

  // Split front into: prefix / blank / suffix. Our cloze markdown always uses **____**.
  const [prefix, suffix] = current.front.split('**____**');
  const answer = current.back;

  function check() {
    if (picked) return;
    const good = normalize(input) === normalize(answer);
    const res = registerAnswer('cloze', good, 10, combo);
    setCombo(res.newCombo);
    setPicked(good ? 'good' : 'bad');
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }) });
  }
  function next() { setPicked(null); setInput(''); setIdx((i) => (i + 1) % cards.length); }

  // Render letter boxes
  const boxes = [];
  for (let i = 0; i < answer.length; i++) {
    const ch = answer[i];
    if (ch === ' ') { boxes.push(<span key={i} className="w-3" />); continue; }
    const typed = input[boxes.filter((b: any) => b.props?.className?.includes('w-3') === false).length];
    const isCurrent = !picked && input.length === i;
    boxes.push(
      <span key={i} className={`inline-flex items-center justify-center w-[0.72em] h-[1.12em] rounded-[7px] border-2 font-serif
        ${picked === 'good' ? 'bg-sage-600 text-white border-sage-600' :
          picked === 'bad' ? 'bg-bad text-white border-bad' :
          typed ? 'bg-ink-900 text-ink-50 border-ink-900' :
          isCurrent ? 'border-brand-500 bg-white' : 'border-ink-200 bg-white'}`}
      >{picked ? answer[i] : (typed ?? '')}</span>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-brand-50 rounded-3xl p-[clamp(24px,5vw,44px)]">
        <div className="font-serif text-[clamp(26px,3.8vw,40px)] leading-[1.25] font-serif-balance">
          {prefix}
          <span className="inline-flex gap-[3px] align-middle mx-1">{boxes}</span>
          {suffix}
        </div>
        <div className="mt-6 flex gap-2 items-center flex-wrap">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => !picked && setInput(e.target.value.slice(0, answer.length))}
            onKeyDown={(e) => { if (e.key === 'Enter') picked ? next() : check(); }}
            disabled={!!picked}
            placeholder="Escribe aquí"
            className="flex-1 min-w-[180px] px-4 py-3 border border-ink-200 rounded-xl text-ink-900 font-medium"
          />
          {picked ? (
            <Button variant="dark" onClick={next}>Siguiente →</Button>
          ) : (
            <Button variant="primary" onClick={check}>Comprobar</Button>
          )}
          <span className="text-sm text-ink-500">{answer.length} letras</span>
        </div>
        {picked === 'bad' && (
          <div className="mt-4 text-[15px] text-bad">No era «{input}». La palabra es «{answer}».</div>
        )}
      </div>
    </div>
  );
}
