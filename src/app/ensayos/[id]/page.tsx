import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }>; }

export default async function EssayView({ params }: Props) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data: essay } = await sb.from('essays').select('*, temas(title, full_title)').eq('id', parseInt(id,10)).maybeSingle();
  if (!essay) notFound();

  return (
    <div className="py-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <Link href="/ensayos" className="text-xs text-ink-800/60 hover:underline">← Mis ensayos</Link>
        <div className="text-xs uppercase text-brand-600 mt-2">TEMA {essay.tema_id}</div>
        <h1 className="font-serif text-2xl">{essay.temas?.title}</h1>
        <div className="text-xs text-ink-800/50 mt-1">
          Enviado: {new Date(essay.submitted_at).toLocaleString('es-ES')}
          {essay.feedback_at && <> · Revisado: {new Date(essay.feedback_at).toLocaleString('es-ES')}</>}
        </div>
      </div>

      <section className="border rounded-2xl bg-white p-6">
        <div className="text-xs uppercase text-ink-800/50 mb-2">Tu ensayo</div>
        <div className="prose-tema whitespace-pre-wrap">{essay.body}</div>
      </section>

      {essay.status === 'reviewed' && essay.feedback ? (
        <section className="border-2 border-brand-400 rounded-2xl bg-brand-50 p-6">
          <div className="text-xs uppercase text-brand-700 mb-2 font-semibold">📝 Feedback</div>
          <div className="prose-tema whitespace-pre-wrap">{essay.feedback}</div>
        </section>
      ) : (
        <section className="border border-dashed rounded-2xl p-8 text-center text-ink-800/60">
          <div className="text-3xl mb-2">⏳</div>
          <div>Esperando feedback…</div>
          <div className="text-xs mt-1">(el revisor lo verá en /admin)</div>
        </section>
      )}
    </div>
  );
}
