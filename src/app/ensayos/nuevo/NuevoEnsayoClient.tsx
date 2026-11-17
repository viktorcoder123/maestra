'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

  async function submit() {
    setSubmitting(true);
    const res = await fetch('/api/essays', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tema_id: temaId, prompt, body }),
    });
    const { essay } = await res.json();
    router.push(`/ensayos/${essay.id}`);
  }

  const words = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <select
        value={temaId}
        onChange={(e) => setTemaId(Number(e.target.value))}
        className="w-full border rounded-xl px-4 py-3"
      >
        {temas.map((t) => (
          <option key={t.id} value={t.id}>TEMA {t.id} — {t.title}</option>
        ))}
      </select>

      {current && (
        <div className="p-3 bg-ink-50 border rounded-xl text-xs text-ink-800/70">
          {current.full_title}
        </div>
      )}

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Nota opcional para quien revise (p. ej. 'dudas en 3.2')"
        className="w-full border rounded-xl px-4 py-2 text-sm"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Desarrolla el tema aquí…"
        className="w-full h-[500px] p-4 border rounded-xl text-sm prose-tema"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-ink-800/60">{words} palabras</div>
        <button
          onClick={submit}
          disabled={submitting || body.length < 50}
          className="px-5 py-3 rounded-full bg-brand-500 text-white disabled:opacity-40 hover:bg-brand-600"
        >
          {submitting ? 'Enviando…' : 'Enviar para revisión →'}
        </button>
      </div>
    </div>
  );
}
