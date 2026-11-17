import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type Row = { section_id: number; tema_id: number; title: string; number: string; level: number; reviews: number; accuracy: number; last_reviewed: string | null };

export default async function Debilidades() {
  const sb = supabaseAdmin();
  const { data: rows } = await sb.from('section_mastery').select('*');
  const { data: temas } = await sb.from('temas').select('*').order('number');

  const touched = ((rows as Row[] | null) ?? []).filter((r) => r.reviews > 0);
  const weakest = [...touched].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const byTema = new Map<number, Row[]>();
  for (const r of (rows as Row[] | null) ?? []) {
    if (!byTema.has(r.tema_id)) byTema.set(r.tema_id, []);
    byTema.get(r.tema_id)!.push(r);
  }

  return (
    <div className="py-6 space-y-6">
      <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none">Puntos débiles</h1>

      <div className="flex gap-3 flex-wrap text-[13px] text-ink-500">
        <LegendSwatch color="bg-sage-600" label="Dominas" />
        <LegendSwatch color="bg-sage-300" label="Bien" />
        <LegendSwatch color="bg-brand-100" label="Flojo" />
        <LegendSwatch color="bg-bad" label="Fallas" />
        <LegendSwatch color="bg-ink-100" label="Sin tocar" />
      </div>

      {weakest.length > 0 && (
        <section className="bg-ink-900 text-ink-50 rounded-3xl p-7">
          <div className="text-[12px] uppercase tracking-[.06em] font-semibold text-brand-400 mb-4">Lo más flojo ahora</div>
          <div className="grid gap-4 md:grid-cols-3">
            {weakest.map((w) => (
              <div key={w.section_id}>
                <div className="font-serif text-[44px] leading-none">{Math.round(w.accuracy * 100)}%</div>
                <div className="text-[15px] mt-1">{w.title}</div>
                <div className="text-xs text-ink-50/60 mt-1">Tema {w.tema_id} · sección {w.number}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(temas ?? []).map((t: any) => {
        const sections = (byTema.get(t.id) ?? []).sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }));
        return (
          <section key={t.id} className="bg-white border border-ink-200 rounded-[22px] p-6">
            <div className="flex items-baseline justify-between mb-4 gap-3">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-[48px] text-brand-500 leading-none">{t.number}</span>
                <h3 className="font-serif text-[22px] leading-tight">{t.title}</h3>
              </div>
              <Link href={`/repaso?tema=${t.id}`} className="text-sm text-brand-600 hover:text-brand-700">Repasar →</Link>
            </div>
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
              {sections.map((s) => <Cell key={s.section_id} s={s} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Cell({ s }: { s: Row }) {
  const bg = s.reviews === 0 ? 'bg-ink-100 text-ink-500' :
             s.accuracy >= 0.85 ? 'bg-sage-600 text-white' :
             s.accuracy >= 0.6  ? 'bg-sage-300 text-ink-900' :
             s.accuracy >= 0.35 ? 'bg-brand-100 text-brand-700' :
                                   'bg-bad text-white';
  return (
    <div className={`aspect-square rounded-[9px] flex items-center justify-center text-[13px] font-semibold tabular-nums cursor-help ${bg}`}
      title={`${s.number}. ${s.title}\n${s.reviews} revisiones · ${Math.round(s.accuracy * 100)}% acierto`}>
      {s.number}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-2"><span className={`w-3 h-3 rounded-[3px] ${color}`} />{label}</span>;
}
