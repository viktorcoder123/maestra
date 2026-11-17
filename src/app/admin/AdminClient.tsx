'use client';
import { useEffect, useState } from 'react';

type Essay = {
  id: number;
  tema_id: number;
  prompt: string;
  body: string;
  submitted_at: string;
  status: string;
  feedback: string | null;
};

const CLAUDE_INSTRUCTIONS = `Actúa como preparador de oposiciones para Maestro/a de Primaria especialidad Música (España, LOMLOE).

Evalúa el siguiente desarrollo del tema. Da feedback en español, estructurado así:

1. **Puntos fuertes** (3-5 bullets)
2. **A mejorar** (bullets concretos con referencias a la sección del tema)
3. **Fallos factuales u omisiones** (autores que faltan, normativa mal citada, conceptos imprecisos)
4. **Nota orientativa (0-10)** con breve justificación
5. **Siguiente paso concreto** (p.ej. "repasar sección 3.2 — ritmo libre vs rítmico vs métrico")

Sé específico, exigente pero constructivo. No reescribas el tema; corrígelo.`;

export function AdminClient() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [selected, setSelected] = useState<Essay | null>(null);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('maestra:admin');
    if (stored) {
      setPassword(stored);
      setAuthed(true);
    }
  }, []);

  useEffect(() => { if (authed) refresh(); }, [authed]);

  async function refresh() {
    const res = await fetch('/api/essays');
    const { essays } = await res.json();
    setEssays(essays ?? []);
  }

  function copyToClipboard(text: string, tag: string) {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1400);
  }

  async function publish() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/essays/${selected.id}/feedback`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ feedback, admin_password: password }),
    });
    if (!res.ok) { alert('Error — revisa la contraseña'); setSaving(false); return; }
    await refresh();
    setSelected(null);
    setFeedback('');
    setSaving(false);
  }

  if (!authed) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); localStorage.setItem('maestra:admin', password); setAuthed(true); }} className="max-w-sm space-y-3">
        <p className="text-sm text-ink-800/70">Introduce la contraseña de admin (<code>ADMIN_PASSWORD</code> en .env.local).</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Contraseña"/>
        <button className="px-5 py-3 rounded-full bg-ink-900 text-white">Entrar</button>
      </form>
    );
  }

  const pending = essays.filter((e) => e.status === 'pending_review');
  const done = essays.filter((e) => e.status === 'reviewed');

  if (selected) {
    const fullBundle = `${CLAUDE_INSTRUCTIONS}\n\n---\n**TEMA ${selected.tema_id}**\n\n${selected.prompt ? `Nota de la alumna: ${selected.prompt}\n\n` : ''}${selected.body}`;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="text-sm underline">← Volver</button>
          <div className="text-xs text-ink-800/60">TEMA {selected.tema_id} · {new Date(selected.submitted_at).toLocaleString('es-ES')}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="border rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase text-ink-800/60">Ensayo</div>
              <button onClick={() => copyToClipboard(fullBundle, 'bundle')} className="text-xs px-3 py-1 rounded-full border hover:border-brand-400">
                {copied === 'bundle' ? '✓ Copiado' : 'Copiar prompt completo para Claude'}
              </button>
            </div>
            {selected.prompt && <div className="text-xs text-ink-800/60 italic mb-2">Nota: {selected.prompt}</div>}
            <div className="prose-tema whitespace-pre-wrap text-sm max-h-[520px] overflow-auto">{selected.body}</div>
          </section>

          <section className="border rounded-2xl bg-white p-4">
            <div className="text-xs uppercase text-ink-800/60 mb-2">Pegar aquí la respuesta de Claude</div>
            <textarea
              value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="1. Puntos fuertes…"
              className="w-full h-[460px] p-3 border rounded-xl text-sm prose-tema"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-ink-800/60">{feedback.length} caracteres</div>
              <button
                disabled={saving || feedback.length < 20}
                onClick={publish}
                className="px-5 py-2 rounded-full bg-brand-500 text-white disabled:opacity-40"
              >{saving ? 'Guardando…' : 'Publicar feedback'}</button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-lg mb-3">⏳ Pendientes ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="text-ink-800/50 text-sm">Nada pendiente.</div>
        ) : (
          <ul className="space-y-2">
            {pending.map((e) => <EssayRow key={e.id} essay={e} onClick={() => { setSelected(e); setFeedback(''); }} />)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg mb-3">✓ Revisados ({done.length})</h2>
        {done.length === 0 ? (
          <div className="text-ink-800/50 text-sm">Todavía nada.</div>
        ) : (
          <ul className="space-y-2">
            {done.slice(0, 10).map((e) => <EssayRow key={e.id} essay={e} onClick={() => { setSelected(e); setFeedback(e.feedback ?? ''); }} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function EssayRow({ essay, onClick }: { essay: Essay; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="w-full text-left border rounded-xl p-3 bg-white hover:border-brand-400">
        <div className="flex justify-between gap-2">
          <div className="text-xs uppercase text-brand-600">TEMA {essay.tema_id}</div>
          <div className="text-xs text-ink-800/50">{new Date(essay.submitted_at).toLocaleString('es-ES')}</div>
        </div>
        <div className="text-sm text-ink-800/70 line-clamp-1 mt-1">{essay.body.slice(0, 160)}</div>
      </button>
    </li>
  );
}
