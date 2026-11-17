import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { run_id, outline, body, elapsed_seconds } = await req.json();
  const sb = supabaseAdmin();

  // Fetch expected sections for coverage check
  const { data: run } = await sb.from('simulator_runs').select('*').eq('id', run_id).single();
  if (!run) return NextResponse.json({ error: 'run not found' }, { status: 404 });

  const { data: sections } = await sb
    .from('sections').select('number, title, level')
    .eq('tema_id', run.tema_id)
    .order('order_idx');

  const all = (sections ?? []) as any[];
  const top = all.filter((s) => s.level === 1);

  const combined = (outline + '\n' + body).toLowerCase();

  function normalize(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  const normalizedText = normalize(combined);

  const topReport = top.map((s) => {
    const titleHit = normalize(s.title).split(/[\s,·:;\-]+/)
      .filter((w: string) => w.length > 4)
      .some((w: string) => normalizedText.includes(w));
    const numberHit = normalizedText.includes(`${s.number}.`) || normalizedText.includes(`${s.number} `);
    return { number: s.number, title: s.title, covered: titleHit || numberHit };
  });

  const subReport = all.filter((s) => s.level === 2).map((s) => {
    const titleWords = normalize(s.title).split(/[\s,·:;\-]+/).filter((w: string) => w.length > 4);
    const hit = titleWords.length > 0 && titleWords.some((w: string) => normalizedText.includes(w));
    return { number: s.number, title: s.title, covered: hit };
  });

  const coverage = {
    top_sections: topReport,
    sub_sections: subReport,
    top_pct: topReport.filter((r) => r.covered).length / Math.max(1, topReport.length),
    sub_pct: subReport.filter((r) => r.covered).length / Math.max(1, subReport.length),
    word_count: body.trim().split(/\s+/).filter(Boolean).length,
  };

  const { error } = await sb.from('simulator_runs')
    .update({
      outline, body, elapsed_seconds,
      submitted_at: new Date().toISOString(),
      coverage_report: coverage,
    })
    .eq('id', run_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coverage });
}
