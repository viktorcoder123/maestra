'use client';
import { useEffect, useState } from 'react';
import { playAudioCard } from '@/lib/audio';

type Card = {
  id: number;
  type: string;
  front: string;
  back: string;
  hint: string | null;
  metadata: any;
};

const MODES = [
  { id: 'audio_interval', label: '🎼 Intervalos' },
  { id: 'audio_mode',     label: '🎹 Modos / escalas' },
  { id: 'audio_texture',  label: '🎻 Texturas' },
];

export function OidoClient() {
  const [mode, setMode] = useState('audio_interval');
  const [pool, setPool] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ good: 0, bad: 0 });

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/cards/random?type=${mode}&limit=40`);
      const { cards } = await res.json();
      setPool(cards ?? []);
      setIdx(0);
      setPicked(null);
      setScore({ good: 0, bad: 0 });
    })();
  }, [mode]);

  const current = pool[idx];
  const choices: string[] = current?.metadata?.choices ?? [];

  function choose(c: string) {
    if (picked || !current) return;
    setPicked(c);
    const good = c === current.back;
    setScore((s) => ({ good: s.good + (good ? 1 : 0), bad: s.bad + (good ? 0 : 1) }));
    // Record this as a review too, so the weakness panel knows
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }),
    });
  }

  function next() {
    setPicked(null);
    if (idx + 1 < pool.length) setIdx(idx + 1);
    else setIdx(0);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-4 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              mode === m.id ? 'bg-ink-900 text-white border-ink-900' : 'hover:border-brand-400'
            }`}
          >{m.label}</button>
        ))}
      </div>

      {!current ? (
        <div className="text-center text-ink-800/60 py-12">Cargando…</div>
      ) : (
        <div className="border rounded-2xl bg-white p-6 pop-in" key={current.id}>
          <div className="flex items-center justify-between text-xs text-ink-800/60 mb-4">
            <div>Aciertos: <span className="text-emerald-600 font-semibold">{score.good}</span> · Fallos: <span className="text-red-500 font-semibold">{score.bad}</span></div>
            <button onClick={() => playAudioCard(current.type, current.metadata)} className="px-3 py-1 rounded-full border hover:border-brand-400">🔁 Repetir</button>
          </div>

          <div className="text-center py-6">
            <button
              onClick={() => playAudioCard(current.type, current.metadata)}
              className="text-6xl hover:scale-110 transition"
              aria-label="Reproducir"
            >🔊</button>
            <div className="mt-4 text-ink-800/60 text-sm">{current.front}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {choices.map((c) => {
              const isCorrect = c === current.back;
              const isPicked = picked === c;
              const classes = picked
                ? isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : isPicked
                    ? 'bg-red-500 text-white border-red-500'
                    : 'opacity-50 border-ink-200'
                : 'hover:border-brand-400 border-ink-200';
              return (
                <button
                  key={c}
                  disabled={!!picked}
                  onClick={() => choose(c)}
                  className={`px-4 py-3 rounded-xl border text-sm text-left transition ${classes}`}
                >{c}</button>
              );
            })}
          </div>

          {picked && (
            <div className="mt-4 text-center">
              {current.hint && <div className="text-sm text-ink-800/60 mb-3">💡 {current.hint}</div>}
              <button onClick={next} className="px-6 py-2 rounded-full bg-ink-900 text-white hover:bg-ink-800">
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
