import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function Ensayos() {
  const sb = supabaseAdmin();
  const { data: essays } = await sb.from('essays').select('*, temas(title)').order('submitted_at', { ascending: false });
  const { data: temas } = await sb.from('temas').select('*').order('number');

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl">Mis ensayos</h1>
          <p className="text-ink-800/70">Escribe un tema completo y recibe feedback revisado.</p>
        </div>
        <Link href="/ensayos/nuevo" className="px-4 py-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 text-sm">
          ✍️ Escribir nuevo
        </Link>
      </div>

      {(essays ?? []).length === 0 ? (
        <div className="text-center py-12 text-ink-800/60">
          Aún no has enviado ningún ensayo.
          <div className="mt-4">
            <Link href="/ensayos/nuevo" className="underline text-brand-600">Escribe tu primero →</Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {(essays ?? []).map((e: any) => (
            <li key={e.id}>
              <Link href={`/ensayos/${e.id}`} className="block border rounded-2xl p-4 bg-white hover:border-brand-400">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-brand-600">TEMA {e.tema_id} — {e.temas?.title}</div>
                    <div className="text-sm text-ink-800/70 line-clamp-2 mt-1">{e.body.slice(0, 180)}…</div>
                  </div>
                  <StatusPill status={e.status} />
                </div>
                <div className="mt-2 text-xs text-ink-800/50">
                  {new Date(e.submitted_at).toLocaleString('es-ES')}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'reviewed') return <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">✓ Revisado</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">⏳ Esperando feedback</span>;
}
