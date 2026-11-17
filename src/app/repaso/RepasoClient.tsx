'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { playAudioCard } from '@/lib/audio';

type Card = {
  id: number;
  type: string;
  front: string;
  back: string;
  hint: string | null;
  tema_id: number | null;
  section_id: number | null;
  metadata: any;
};

export function RepasoClient() {
  const sp = useSearchParams();
  const tema = sp.get('tema');
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const current = queue[idx];

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (tema) q.set('tema', tema);
    q.set('limit', '20');
    const res = await fetch(`/api/cards/due?${q}`);
    const { cards } = await res.json();
    if (!cards || cards.length === 0) {
      setExhausted(true);
    }
    setQueue(cards ?? []);
    setIdx(0);
    setRevealed(false);
    setLoading(false);
  }, [tema]);

  useEffect(() => { load(); }, [load]);

  async function rate(quality: 0 | 1 | 2 | 3) {
    if (!current) return;
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card_id: current.id, quality }),
    });
    setDone((n) => n + 1);
    if (idx + 1 < queue.length) {
      setIdx((i) => i + 1);
      setRevealed(false);
    } else {
      await load();
    }
  }

  if (loading) return <div className="text-center py-16 text-ink-800/60">Preparando tarjetas…</div>;

  if (exhausted || queue.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🎉</div>
        <div className="font-serif text-xl mb-2">Nada pendiente ahora mismo</div>
        <p className="text-ink-800/60">Vuelve más tarde o prueba un simulador.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-xs text-ink-800/60 mb-3">
        <div>{done} hechas · {queue.length - idx} en cola</div>
        {current.tema_id && <div>TEMA {current.tema_id} · {current.type}</div>}
      </div>

      <div className="border rounded-2xl bg-white p-6 min-h-[260px] flex flex-col pop-in" key={current.id}>
        <div className="flex-1">
          <CardFace side="front" card={current} />
          {revealed && (
            <div className="mt-6 pt-6 border-t">
              <CardFace side="back" card={current} />
            </div>
          )}
        </div>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-4 w-full py-3 rounded-full bg-ink-900 text-white font-medium hover:bg-ink-800"
        >
          Mostrar respuesta  <span className="opacity-60 text-sm">(espacio)</span>
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2 text-sm font-medium">
          <button onClick={() => rate(0)} className="py-3 rounded-full bg-red-500 text-white hover:bg-red-600">Otra vez</button>
          <button onClick={() => rate(1)} className="py-3 rounded-full bg-amber-500 text-white hover:bg-amber-600">Costó</button>
          <button onClick={() => rate(2)} className="py-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-600">Bien</button>
          <button onClick={() => rate(3)} className="py-3 rounded-full bg-sky-500 text-white hover:bg-sky-600">Fácil</button>
        </div>
      )}

      <KeyboardShortcuts onReveal={() => setRevealed(true)} onRate={rate} revealed={revealed} />
    </div>
  );
}

function CardFace({ card, side }: { card: Card; side: 'front' | 'back' }) {
  const text = side === 'front' ? card.front : card.back;

  // Audio cards: show play button on front
  const isAudio = card.type.startsWith('audio_');
  if (side === 'front' && isAudio) {
    return (
      <div className="text-center py-6">
        <button
          onClick={() => playAudioCard(card.type, card.metadata)}
          className="text-5xl hover:scale-110 transition"
          aria-label="Reproducir"
        >
          🔊
        </button>
        <div className="mt-4 font-serif text-xl">{text}</div>
        {card.type === 'audio_interval' && card.metadata?.choices && (
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            {card.metadata.choices.map((c: string) => (
              <div key={c} className="px-3 py-2 rounded-lg border text-ink-800/60">{c}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-serif text-xl leading-relaxed whitespace-pre-wrap">{text}</div>
  );
}

function KeyboardShortcuts({ onReveal, onRate, revealed }: any) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); if (!revealed) onReveal(); }
      if (revealed) {
        if (e.key === '1') onRate(0);
        if (e.key === '2') onRate(1);
        if (e.key === '3') onRate(2);
        if (e.key === '4') onRate(3);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [revealed, onReveal, onRate]);
  return null;
}
