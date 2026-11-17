'use client';
import { useEffect, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type Card = { id: number; front: string; back: string; metadata: any };

export function QuienLoDijoClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [score, setScore] = useState({ good: 0, bad: 0 });

  useEffect(() => {
    fetch('/api/cards/random?type=quote_author,method_author,author_method&limit=25')
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []));
  }, []);

  const current = cards[idx];
  if (!current) return <div className="text-ink-800/60">Cargando…</div>;

  const allBacks = [...new Set(cards.map((c) => c.back))];
  const wrongs = allBacks.filter((b) => b !== current.back).sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...wrongs, current.back].sort();

  function choose(c: string) {
    if (picked) return;
    setPicked(c);
    const good = c === current.back;
    const res = registerAnswer('quien_lo_dijo', good, 8, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    setScore((s) => ({ good: s.good + (good ? 1 : 0), bad: s.bad + (good ? 0 : 1) }));
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
    fetch('/api/reviews', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }),
    });
  }

  function next() {
    setPicked(null);
    setIdx((i) => (i + 1) % cards.length);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
      <div className="flex justify-between text-xs text-ink-800/60 mb-3">
        <div>Acierto: <strong className="text-emerald-600">{score.good}</strong> · Falla: <strong className="text-red-500">{score.bad}</strong></div>
        <div>{idx + 1}/{cards.length}</div>
      </div>
      <div className="border rounded-2xl bg-white p-6 pop-in" key={current.id}>
        <div className="font-serif text-xl whitespace-pre-wrap">{current.front}</div>
        <div className="mt-6 grid grid-cols-1 gap-2">
          {choices.map((c) => {
            const isCorrect = c === current.back;
            const isPicked = picked === c;
            const classes = picked
              ? isCorrect
                ? 'bg-emerald-500 text-white border-emerald-500'
                : isPicked
                  ? 'bg-red-500 text-white border-red-500'
                  : 'opacity-60 border-ink-200'
              : 'hover:border-brand-400 border-ink-200';
            return (
              <button key={c} disabled={!!picked} onClick={() => choose(c)}
                className={`px-4 py-3 rounded-xl border text-left transition ${classes}`}>
                {c}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4 text-center">
            <button onClick={next} className="px-6 py-2 rounded-full bg-ink-900 text-white hover:bg-ink-800">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}
