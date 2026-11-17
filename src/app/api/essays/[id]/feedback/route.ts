import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { feedback, admin_password } = await req.json();
  if (admin_password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const sb = supabaseAdmin();
  const { error } = await sb.from('essays').update({
    feedback, status: 'reviewed', feedback_at: new Date().toISOString(),
  }).eq('id', parseInt(id, 10));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
