import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { Section } from '@/lib/types';
import { SectionTree } from './SectionTree';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemaPage({ params }: Props) {
  const { id } = await params;
  const temaId = parseInt(id, 10);
  const sb = supabaseAdmin();
  const { data: tema } = await sb.from('temas').select('*').eq('id', temaId).maybeSingle();
  if (!tema) notFound();

  const { data: sections } = await sb
    .from('sections')
    .select('*')
    .eq('tema_id', temaId)
    .order('order_idx');

  return (
    <div className="py-6 space-y-6">
      <div>
        <Link href="/temas" className="text-xs text-ink-800/60 hover:underline">← Temario</Link>
        <div className="text-xs uppercase tracking-wider text-brand-600 mt-2">TEMA {tema.number}</div>
        <h1 className="font-serif text-2xl md:text-3xl leading-tight">{tema.title}</h1>
        <p className="text-sm text-ink-800/60 mt-2">{tema.full_title}</p>
      </div>

      <div className="flex gap-2 flex-wrap text-sm">
        <Link href={`/simulador?tema=${tema.id}`} className="px-3 py-1.5 rounded-full border hover:border-brand-400">
          ⏱️ Simular este tema
        </Link>
        <Link href={`/repaso?tema=${tema.id}`} className="px-3 py-1.5 rounded-full border hover:border-brand-400">
          🧠 Repasar tarjetas de este tema
        </Link>
        <Link href={`/ensayos/nuevo?tema=${tema.id}`} className="px-3 py-1.5 rounded-full border hover:border-brand-400">
          ✍️ Escribir ensayo
        </Link>
      </div>

      <SectionTree sections={(sections ?? []) as Section[]} />
    </div>
  );
}
