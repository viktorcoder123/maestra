import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const tema = url.searchParams.get('tema');
  const list = url.searchParams.get('list');
  let q = sb.from('memory_artifacts').select('*');
  if (kind) q = q.eq('kind', kind);
  if (tema) q = q.eq('tema_id', parseInt(tema, 10));
  if (list) q = q.eq('list_key', list);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifacts: data ?? [] });
}

export async function PUT(req: NextRequest) {
  const { kind, tema_id, list_key, data } = await req.json();
  if (!kind || !data) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  const sb = supabaseAdmin();
  // Supabase upsert needs onConflict set via a unique constraint
  const { data: row, error } = await sb.from('memory_artifacts')
    .upsert({ kind, tema_id: tema_id ?? null, list_key: list_key ?? null, data, updated_at: new Date().toISOString() }, { onConflict: 'kind,tema_id,list_key' })
    .select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifact: row });
}
