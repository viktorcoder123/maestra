import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function TemasIndex() {
  const { data: temas } = await supabaseAdmin().from('temas').select('*').order('number');

  return (
    <div className="py-6 space-y-5">
      <h1 className="font-serif text-3xl">Temario</h1>
      <p className="text-ink-800/70">
        Entra en cada tema para ver el árbol completo. La estructura (números de sección) es lo que hay que reproducir el día del examen.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {(temas ?? []).map((t: any) => (
          <Link
            key={t.id}
            href={`/temas/${t.id}`}
            className="block border rounded-2xl p-5 bg-white hover:border-brand-400 hover:-translate-y-0.5 transition"
          >
            <div className="text-xs uppercase tracking-wider text-brand-600 mb-1">TEMA {t.number}</div>
            <div className="font-serif text-lg leading-snug">{t.title}</div>
            <div className="text-xs text-ink-800/60 mt-3 line-clamp-3">{t.full_title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
