import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Button } from '@/components/Button';

export const dynamic = 'force-dynamic';

export default async function Ensayos() {
  const sb = supabaseAdmin();
  const { data: essays } = await sb.from('essays').select('*, temas(title)').order('submitted_at', { ascending: false });

  return (
    <div className="py-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-7">
        <div>
          <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none">Mis ensayos</h1>
          <p className="text-ink-500 mt-2">Escribe un tema completo y recibe feedback revisado.</p>
        </div>
        <Link href="/ensayos/nuevo"><Button variant="primary">Escribir nuevo</Button></Link>
      </div>

      {(essays ?? []).length === 0 ? (
        <div className="bg-sage-100 rounded-3xl p-10 text-center">
          <p className="text-ink-500">Aún no has enviado ningún ensayo.</p>
          <div className="mt-4"><Link href="/ensayos/nuevo"><Button variant="primary">Escribe el primero</Button></Link></div>
        </div>
      ) : (
        <ul className="space-y-3">
          {(essays ?? []).map((e: any) => (
            <li key={e.id}>
              <Link href={`/ensayos/${e.id}`} className="flex items-center gap-5 bg-white border border-ink-200 rounded-[20px] p-5 hover:border-ink-900 transition-colors">
                <span className="font-serif text-[56px] text-brand-500 leading-none w-16 flex-none">{e.tema_id}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-serif text-[20px] leading-tight">{e.temas?.title}</span>
                  <span className="block text-sm text-ink-500 mt-1 line-clamp-2">{e.body.slice(0, 150)}…</span>
                  <span className="block text-[12px] text-ink-500 mt-2">{new Date(e.submitted_at).toLocaleString('es-ES')}</span>
                </span>
                <StatusPill status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'reviewed') return <span className="text-[12px] font-semibold uppercase tracking-[.06em] px-3 py-[6px] rounded-full bg-sage-100 text-sage-700 whitespace-nowrap">Revisado</span>;
  return <span className="text-[12px] font-semibold uppercase tracking-[.06em] px-3 py-[6px] rounded-full bg-brand-100 text-brand-700 whitespace-nowrap">Esperando feedback</span>;
}
