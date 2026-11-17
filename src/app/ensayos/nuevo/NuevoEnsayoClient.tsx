'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pill } from '@/components/Pill';
import { Button } from '@/components/Button';

type Tema = { id: number; title: string; full_title: string };

export function NuevoEnsayoClient({ temas }: { temas: Tema[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get('tema');
  const [temaId, setTemaId] = useState<number>(initial ? Number(initial) : temas[0]?.id);
  const [body, setBody] = useState('');
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const current = temas.find((t) => t.id === temaId);
  const words = body.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    setSubmitting(true);
    const res = await fetch('/api/essays', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tema_id: temaId, prompt, body }) });
    const { essay } = await res.json();
    router.push(`/ensayos/${essay.id}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {temas.map((t) => <Pill key={t.id} selected={temaId === t.id} onClick={() => setTemaId(t.id)}>Tema {t.id}</Pill>)}
      </div>

      {current && (
        <>
          <h1 className="font-serif text-[clamp(32px,4.5vw,44px)] leading-tight font-serif-balance">{current.title}</h1>
          <p className="text-sm text-ink-500">{current.full_title}</p>
        </>
      )}

      <input value={prompt} onChange={(e) => setPrompt(e.target.value)}
        placeholder="Nota opcional para quien revise (p. ej. 'dudas en 3.2')"
        className="w-full border border-ink-200 rounded-xl px-4 py-[10px] text-sm" />

      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Desarrolla el tema aquí…"
        className="w-full h-[460px] p-5 border border-ink-200 rounded-2xl prose-essay" />

      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-500">{words} palabras</div>
        <Button variant="primary" disabled={submitting || body.length < 50} onClick={submit}>
          {submitting ? 'Enviando…' : 'Enviar para revisión →'}
        </Button>
      </div>
    </div>
  );
}
