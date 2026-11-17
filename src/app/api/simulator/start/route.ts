import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { tema_id } = await req.json();
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('simulator_runs').insert({ tema_id, started_at: new Date().toISOString() }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run: data });
}
