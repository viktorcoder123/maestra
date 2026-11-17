'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { playAudioCard } from '@/lib/audio';
import { ProgressDots } from '@/components/ProgressDots';
import { Button } from '@/components/Button';

type Card = { id: number; type: string; front: string; back: string; hint: string | null; tema_id: number | null; metadata: any };

export function RepasoClient() {
  const sp = useSearchParams();
  const tema = sp.get('tema');
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<Array<0 | 1 | 2 | 3>>([]);
  const [exhausted, setExhausted] = useState(false);
  const current = queue[idx];

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (tema) q.set('tema', tema);
    q.set('limit', '20');
    const res = await fetch(`/api/cards/due?${q}`);
    const { cards } = await res.json();
    if (!cards || cards.length === 0) setExhausted(true);
    setQueue(cards ?? []); setIdx(0); setRevealed(false); setLog([]); setLoading(false);
  }, [tema]);

  useEffect(() => { load(); }, [load]);

  async function rate(q: 0 | 1 | 2 | 3) {
    if (!current) return;
    await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ card_id: current.id, quality: q }) });
    setLog((l) => [...l, q]);
    if (idx + 1 < queue.length) { setIdx((i) => i + 1); setRevealed(false); }
    else { await load(); }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') { e.preventDefault(); if (!revealed) setRevealed(true); }
      if (revealed) {
        if (e.key === '1') rate(0);
        if (e.key === '2') rate(1);
        if (e.key === '3') rate(2);
        if (e.key === '4') rate(3);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [revealed, rate]);

  if (loading) return <div className="text-center py-16 text-ink-500">Preparando tarjetas…</div>;
  if (exhausted || queue.length === 0) {
    return (
      <div className="bg-sage-100 rounded-3xl p-10 text-center">
        <h1 className="font-serif text-[44px] leading-none mb-2">Repaso</h1>
        <p className="text-ink-500 mb-6">Nada pendiente ahora mismo.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/simulador"><Button variant="primary">Simulador</Button></Link>
          <Link href="/juegos"><Button variant="ghost">Juegos</Button></Link>
        </div>
      </div>
    );
  }

  const done = log.length;
  const left = queue.length - idx;
  const states: Array<'done-right' | 'done-wrong' | 'current' | 'upcoming'> = [];
  for (let i = 0; i < queue.length; i++) {
    if (i < log.length) states.push(log[i] >= 2 ? 'done-right' : 'done-wrong');
    else if (i === idx) states.push('current');
    else states.push('upcoming');
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h1 className="font-serif text-[44px] leading-none">Repaso</h1>
        <div className="text-sm text-ink-500">{done} hechas · {left} en cola</div>
      </div>
      <ProgressDots states={states} />

      <div className="relative mt-6 mb-2">
        <div className="hidden sm:block absolute inset-0 rounded-3xl bg-ink-200 translate-x-[8px] translate-y-[8px]" />
        <div className="hidden sm:block absolute inset-0 rounded-3xl bg-ink-100 translate-x-[4px] translate-y-[4px]" />
        <div className="relative bg-white rounded-3xl border border-ink-200 p-5 md:p-8 min-h-[280px] flex flex-col">
          <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600 mb-3">
            Tema {current.tema_id} · {current.type.replace('_', ' ')}
          </div>
          <CardFace card={current} side="front" />
          {revealed && (
            <div className="mt-6 pt-6 border-t border-dashed border-ink-200">
              <CardFace card={current} side="back" />
            </div>
          )}
        </div>
      </div>

      {!revealed ? (
        <Button variant="dark" className="w-full mt-5" onClick={() => setRevealed(true)}>
          Mostrar respuesta · espacio
        </Button>
      ) : (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-semibold">
          <button onClick={() => rate(0)} className="py-3 rounded-2xl bg-bad text-white hover:opacity-90">Otra vez<span className="hidden sm:block text-[11px] opacity-80">tecla 1</span></button>
          <button onClick={() => rate(1)} className="py-3 rounded-2xl bg-brand-400 text-white hover:opacity-90">Costó<span className="hidden sm:block text-[11px] opacity-80">tecla 2</span></button>
          <button onClick={() => rate(2)} className="py-3 rounded-2xl bg-sage-600 text-white hover:opacity-90">Bien<span className="hidden sm:block text-[11px] opacity-80">tecla 3</span></button>
          <button onClick={() => rate(3)} className="py-3 rounded-2xl bg-ink-900 text-ink-50 hover:bg-ink-700">Fácil<span className="hidden sm:block text-[11px] opacity-80">tecla 4</span></button>
        </div>
      )}
    </div>
  );
}

function CardFace({ card, side }: { card: Card; side: 'front' | 'back' }) {
  const text = side === 'front' ? card.front : card.back;
  const isAudio = card.type.startsWith('audio_');

  if (side === 'front' && isAudio) {
    return (
      <div className="text-center py-4">
        <button onClick={() => playAudioCard(card.type, card.metadata)} aria-label="Reproducir"
          className="w-[132px] h-[132px] rounded-full border-2 border-brand-500 bg-brand-500 text-white font-serif text-[22px] hover:scale-105 transition-transform">
          Escuchar
        </button>
        <div className="mt-4 font-serif text-[22px] text-ink-500">{text}</div>
      </div>
    );
  }
  return (
    <div className={`font-serif leading-[1.15] whitespace-pre-wrap font-serif-balance ${side === 'back' ? 'text-sage-600' : ''}`}
      style={{ fontSize: side === 'back' ? 'clamp(24px,3.6vw,36px)' : 'clamp(30px,4.6vw,44px)' }}>
      {text}
    </div>
  );
}
