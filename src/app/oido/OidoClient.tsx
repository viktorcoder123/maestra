'use client';
import { useEffect, useState } from 'react';
import { playAudioCard } from '@/lib/audio';
import { Pill } from '@/components/Pill';
import { Stage } from '@/components/Stage';
import { ChoiceButton } from '@/components/ChoiceButton';
import { Button } from '@/components/Button';
import { sfx } from '@/lib/sfx';

type Card = { id: number; type: string; front: string; back: string; hint: string | null; metadata: any };

const MODES = [
  { id: 'audio_interval', label: 'Intervalos' },
  { id: 'audio_mode',     label: 'Modos y escalas' },
  { id: 'audio_texture',  label: 'Texturas' },
];

export function OidoClient() {
  const [mode, setMode] = useState('audio_interval');
  const [pool, setPool] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ good: 0, bad: 0 });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/cards/random?type=${mode}&limit=40`);
      const { cards } = await res.json();
      setPool(cards ?? []); setIdx(0); setPicked(null); setScore({ good: 0, bad: 0 });
    })();
  }, [mode]);

  const current = pool[idx];
  const choices: string[] = current?.metadata?.choices ?? [];

  async function play() {
    if (!current) return;
    setPlaying(true);
    await playAudioCard(current.type, current.metadata);
    setTimeout(() => setPlaying(false), 1500);
  }

  function choose(c: string) {
    if (picked || !current) return;
    setPicked(c);
    const good = c === current.back;
    setScore((s) => ({ good: s.good + (good ? 1 : 0), bad: s.bad + (good ? 0 : 1) }));
    good ? sfx.correct() : sfx.wrong();
    fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ card_id: current.id, quality: good ? 2 : 0 }) });
  }

  function next() { setPicked(null); setIdx((i) => (i + 1 < pool.length ? i + 1 : 0)); }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {MODES.map((m) => <Pill key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</Pill>)}
      </div>

      {!current ? (
        <div className="text-center text-ink-500 py-16">Cargando…</div>
      ) : (
        <Stage>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div className="text-sm text-ink-50/70">{current.front}</div>
            <div className="text-sm text-ink-50/70">
              <strong className="text-ink-50">{score.good}</strong> aciertos · <strong className="text-ink-50">{score.bad}</strong> fallos
            </div>
          </div>
          <div className="text-center my-6">
            <button onClick={play}
              className="relative w-[190px] h-[190px] rounded-full inline-flex items-center justify-center group"
              aria-label="Escuchar">
              <span className={`absolute inset-0 rounded-full border-[2px] transition-colors ${playing ? 'border-brand-500' : 'border-ink-50/40'}`} />
              <span className={`absolute inset-6 rounded-full border-[2px] transition-colors ${playing ? 'border-brand-500' : 'border-ink-50/30'}`} />
              <span className="w-[98px] h-[98px] rounded-full bg-brand-500 text-white font-serif text-[18px] flex items-center justify-center">
                {playing ? 'Sonando' : 'Escuchar'}
              </span>
            </button>
          </div>
          {picked && current.hint && (
            <div className="text-center text-sm text-ink-50/70 mb-4">{current.hint}</div>
          )}
        </Stage>
      )}

      {current && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mt-4">
          {choices.map((c) => {
            const isCorrect = c === current.back; const isPicked = picked === c;
            const state = picked ? (isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim') : 'idle';
            return <ChoiceButton key={c} disabled={!!picked} onClick={() => choose(c)} state={state as any}>{c}</ChoiceButton>;
          })}
        </div>
      )}

      {picked && (
        <div className="mt-6 flex justify-end">
          <Button variant="dark" onClick={next}>Siguiente →</Button>
        </div>
      )}
    </div>
  );
}
