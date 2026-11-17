import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function TemasIndex() {
  const sb = supabaseAdmin();
  const { data: temas } = await sb.from('temas').select('*').order('number');

  // For each tema, compute mastery (accuracy bucket counts from section_mastery view)
  const { data: mastery } = await sb.from('section_mastery').select('tema_id, section_id, number, accuracy, reviews');
  const byTema = new Map<number, any[]>();
  for (const m of mastery ?? []) {
    if (!byTema.has(m.tema_id)) byTema.set(m.tema_id, []);
    byTema.get(m.tema_id)!.push(m);
  }

  return (
    <div className="py-6">
      <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none">Temario</h1>
      <p className="text-ink-500 mt-3 mb-8">La estructura del temario — el día del examen se reproduce su esqueleto de memoria.</p>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-[14px]">
        {(temas ?? []).map((t: any) => {
          const sections = byTema.get(t.id) ?? [];
          const touched = sections.filter((s) => s.reviews > 0);
          const good = touched.filter((s) => s.accuracy >= 0.6);
          const pct = sections.length === 0 ? 0 : Math.round((good.length / sections.length) * 100);
          return (
            <Link key={t.id} href={`/temas/${t.id}`} className="group bg-white border border-ink-200 rounded-[22px] p-5 hover:border-ink-900 transition-colors">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-[72px] text-brand-500 leading-none">{t.number}</span>
                <span className="flex-1">
                  <div className="font-serif text-[22px] leading-tight">{t.title}</div>
                  <div className="text-[13px] text-ink-500 mt-1">{sections.length} secciones · {pct}% dominado</div>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-[3px]">
                {sections.slice(0, 48).map((s) => {
                  const bg = s.reviews === 0 ? 'bg-ink-100' :
                    s.accuracy >= 0.85 ? 'bg-sage-600' :
                    s.accuracy >= 0.6  ? 'bg-sage-300' :
                    s.accuracy >= 0.35 ? 'bg-brand-100' :
                                          'bg-bad';
                  return <span key={s.section_id} className={`w-3 h-3 rounded-[5px] ${bg}`} />;
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
