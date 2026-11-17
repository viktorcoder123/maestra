import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { Section } from '@/lib/types';
import { SectionTree } from './SectionTree';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }>; }

export default async function TemaPage({ params }: Props) {
  const { id } = await params;
  const temaId = parseInt(id, 10);
  const sb = supabaseAdmin();
  const { data: tema } = await sb.from('temas').select('*').eq('id', temaId).maybeSingle();
  if (!tema) notFound();

  const { data: sections } = await sb.from('sections').select('*').eq('tema_id', temaId).order('order_idx');

  return (
    <div className="py-6 space-y-7">
      <div>
        <Link href="/temas" className="inline-flex items-center px-4 py-2 rounded-full border border-ink-200 text-sm text-ink-700 hover:border-ink-900">← Temario</Link>
      </div>
      <div className="flex items-baseline gap-4 sm:gap-6 flex-wrap">
        <span className="font-serif text-[clamp(72px,16vw,120px)] text-brand-500 leading-none">{tema.number}</span>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[clamp(28px,5vw,48px)] leading-[1.05] font-serif-balance">{tema.title}</h1>
          <p className="text-sm text-ink-500 mt-2">{tema.full_title}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href={`/simulador?tema=${tema.id}`} className="px-5 py-3 rounded-full bg-ink-900 text-ink-50 hover:bg-ink-700 text-sm font-semibold">Simular este tema</Link>
        <Link href={`/repaso?tema=${tema.id}`} className="px-5 py-3 rounded-full bg-white border border-ink-200 text-ink-900 hover:border-ink-900 text-sm font-medium">Repasar tarjetas</Link>
        <Link href={`/ensayos/nuevo?tema=${tema.id}`} className="px-5 py-3 rounded-full bg-transparent border border-ink-200 text-ink-900 hover:border-ink-900 text-sm font-medium">Escribir ensayo</Link>
      </div>

      <SectionTree sections={(sections ?? []) as Section[]} />
    </div>
  );
}
