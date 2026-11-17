import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type Row = {
  section_id: number;
  tema_id: number;
  title: string;
  number: string;
  level: number;
  reviews: number;
  accuracy: number;
  last_reviewed: string | null;
};

export default async function Debilidades() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb.from('section_mastery').select('*');
  const { data: temas } = await sb.from('temas').select('*').order('number');

  const byTema = new Map<number, Row[]>();
  for (const r of (rows as Row[] | null) ?? []) {
    if (!byTema.has(r.tema_id)) byTema.set(r.tema_id, []);
    byTema.get(r.tema_id)!.push(r);
  }

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Puntos débiles</h1>
        <p className="text-ink-800/70 mt-1">
          Cada celda es una sección. Verde = dominas. Rojo = fallas. Gris = sin tocar.
        </p>
      </div>

      {(temas ?? []).map((t: any) => {
        const sections = (byTema.get(t.id) ?? []).sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }));
        return (
          <section key={t.id} className="border rounded-2xl p-5 bg-white">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-xs uppercase text-brand-600">TEMA {t.number}</div>
                <h3 className="font-serif text-lg">{t.title}</h3>
              </div>
              <Link href={`/repaso?tema=${t.id}`} className="text-xs underline">Repasar este tema →</Link>
            </div>
            <div className="grid grid-cols-6 md:grid-cols-10 gap-1.5">
              {sections.map((s) => (
                <SectionCell key={s.section_id} s={s} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SectionCell({ s }: { s: Row }) {
  const touched = s.reviews > 0;
  const bg = !touched
    ? 'bg-ink-100 text-ink-800/40'
    : s.accuracy >= 0.85
      ? 'bg-emerald-500 text-white'
      : s.accuracy >= 0.6
        ? 'bg-emerald-200'
        : s.accuracy >= 0.35
          ? 'bg-amber-300'
          : 'bg-red-400 text-white';
  const title = `${s.number}. ${s.title}\n${s.reviews} revisiones · ${Math.round(s.accuracy * 100)}% acierto`;
  return (
    <div className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono tabular-nums cursor-help ${bg}`} title={title}>
      {s.number}
    </div>
  );
}
