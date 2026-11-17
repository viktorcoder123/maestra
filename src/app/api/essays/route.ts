import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { tema_id, prompt, body } = await req.json();
  if (!tema_id || !body) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('essays').insert({
    tema_id, prompt: prompt ?? '', body,
    submitted_at: new Date().toISOString(),
    status: 'pending_review',
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ essay: data });
}

export async function GET() {
  const { data, error } = await supabaseAdmin().from('essays').select('*').order('submitted_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ essays: data });
}
