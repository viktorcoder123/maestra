import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const url = new URL(req.url);
  const temaParam = url.searchParams.get('tema');
  const typesParam = url.searchParams.get('types'); // comma-separated
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

  // Pull a generous pool of due cards, then interleave by tema so a single
  // tema can't dominate a session (relevant right after seeding, when every
  // card is "due now" and raw due_at order clumps by insertion).
  const { data: stateRows, error: stateErr } = await sb
    .from('card_state').select('card_id, due_at')
    .lte('due_at', new Date().toISOString())
    .order('due_at').limit(500);
  if (stateErr) return NextResponse.json({ error: stateErr.message }, { status: 500 });
  if (!stateRows || stateRows.length === 0) return NextResponse.json({ cards: [] });

  const ids = stateRows.map((r: any) => r.card_id);
  let q = sb.from('cards').select('*').in('id', ids);
  if (temaParam) q = q.eq('tema_id', parseInt(temaParam, 10));
  if (typesParam) q = q.in('type', typesParam.split(','));
  const { data: cards, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by tema, shuffle within each group, then round-robin
  const byTema = new Map<number | string, any[]>();
  for (const c of cards ?? []) {
    const key = c.tema_id ?? 'none';
    if (!byTema.has(key)) byTema.set(key, []);
    byTema.get(key)!.push(c);
  }
  for (const list of byTema.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  const temaKeys = [...byTema.keys()].sort(() => Math.random() - 0.5);
  const interleaved: any[] = [];
  let anyLeft = true;
  while (anyLeft && interleaved.length < limit) {
    anyLeft = false;
    for (const k of temaKeys) {
      const list = byTema.get(k)!;
      if (list.length > 0) {
        interleaved.push(list.pop());
        anyLeft = true;
        if (interleaved.length >= limit) break;
      }
    }
  }
  return NextResponse.json({ cards: interleaved });
}
