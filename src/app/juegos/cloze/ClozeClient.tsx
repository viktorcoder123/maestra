'use client';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type Card = { id: number; front: string; back: string; tema_id: number | null };

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

export function ClozeClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [picked, setPicked] = useState<'good' | 'bad' | null>(null);
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [score, setScore] = useState({ good: 0, bad: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/cards/random?type=cloze&limit=30').then((r) => r.json()).then((d) => setCards(d.cards ?? []));
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, [idx]);

  const current = cards[idx];
  if (!current) return <div className="text-ink-800/60">Cargando…</div>;

  function check() {
    if (picked) return;
    const good = normalize(input) === normalize(current.back);
    const res = registerAnswer('cloze', good, 10, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    setPicked(good ? 'good' : 'bad');
    setScore((s) => ({ good: s.good + (good ? 1 : 0), bad: s.bad + (good ? 0 : 1) }));
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    fetch('/api/reviews', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }),
    });
  }

  function next() {
    setPicked(null); setInput('');
    setIdx((i) => (i + 1) % cards.length);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
      <div className="flex justify-between text-xs text-ink-800/60 mb-3">
        <div>✓ {score.good} · ✗ {score.bad}</div>
        <div>TEMA {current.tema_id}</div>
      </div>
      <div className="border rounded-2xl bg-white p-6 pop-in" key={current.id}>
        <div className="prose-tema whitespace-pre-wrap">{current.front}</div>
        <div className="mt-6 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') picked ? next() : check(); }}
            disabled={!!picked}
            placeholder="Tu respuesta…"
            className="flex-1 px-4 py-3 border rounded-xl font-serif"
          />
          {picked ? (
            <button onClick={next} className="px-5 py-3 rounded-xl bg-ink-900 text-white">Siguiente</button>
          ) : (
            <button onClick={check} className="px-5 py-3 rounded-xl bg-brand-500 text-white">Comprobar</button>
          )}
        </div>
        {picked && (
          <div className={`mt-4 p-3 rounded-xl ${picked === 'good' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="text-sm">
              {picked === 'good' ? '✓ ¡Correcto!' : '✗ No era eso.'} La respuesta: <strong>{current.back}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
