import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }>; }

export default async function EssayView({ params }: Props) {
  const { id } = await params;
  const { data: essay } = await supabaseAdmin().from('essays').select('*, temas(title, full_title)').eq('id', parseInt(id, 10)).maybeSingle();
  if (!essay) notFound();

  return (
    <div className="py-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/ensayos" className="inline-flex items-center px-4 py-2 rounded-full border border-ink-200 text-sm text-ink-700 hover:border-ink-900">← Mis ensayos</Link>
      </div>
      <div className="flex items-baseline gap-5 flex-wrap">
        <span className="font-serif text-[88px] text-brand-500 leading-none">{essay.tema_id}</span>
        <div>
          <h1 className="font-serif text-[clamp(28px,4vw,40px)] leading-tight">{essay.temas?.title}</h1>
          <div className="text-[13px] text-ink-500 mt-2">
            Enviado: {new Date(essay.submitted_at).toLocaleString('es-ES')}
            {essay.feedback_at && <> · Revisado: {new Date(essay.feedback_at).toLocaleString('es-ES')}</>}
          </div>
        </div>
      </div>

      <section className="bg-white border border-ink-200 rounded-3xl p-7">
        <div className="text-[12px] uppercase tracking-[.06em] font-semibold text-ink-500 mb-3">Tu ensayo</div>
        <div className="prose-essay whitespace-pre-wrap">{essay.body}</div>
      </section>

      {essay.status === 'reviewed' && essay.feedback ? (
        <section className="bg-brand-50 border-[1.5px] border-brand-400 rounded-3xl p-7">
          <div className="text-[12px] uppercase tracking-[.06em] font-semibold text-brand-700 mb-3">Feedback</div>
          <div className="prose-essay whitespace-pre-wrap">{essay.feedback}</div>
        </section>
      ) : (
        <section className="border-2 border-dashed border-ink-300 rounded-3xl p-10 text-center text-ink-500">
          Esperando feedback…
        </section>
      )}
    </div>
  );
}
