import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { review as srsReview, initialState } from '@/lib/srs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { card_id, quality } = body as { card_id: number; quality: 0 | 1 | 2 | 3 };
  if (typeof card_id !== 'number' || ![0, 1, 2, 3].includes(quality)) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: existing } = await sb.from('card_state').select('*').eq('card_id', card_id).maybeSingle();
  const state = existing ?? { ...initialState(), card_id };

  const now = Date.now();
  const next = srsReview(
    {
      ease: state.ease ?? 2.5,
      interval_days: state.interval_days ?? 0,
      reps: state.reps ?? 0,
      lapses: state.lapses ?? 0,
      due_at: state.due_at ? new Date(state.due_at).getTime() : now,
      last_reviewed_at: state.last_reviewed_at ? new Date(state.last_reviewed_at).getTime() : null,
    },
    quality,
    now,
  );

  const upsertPayload = {
    card_id,
    ease: next.ease,
    interval_days: next.interval_days,
    reps: next.reps,
    lapses: next.lapses,
    due_at: new Date(next.due_at).toISOString(),
    last_reviewed_at: new Date(now).toISOString(),
  };

  const [{ error: upsertErr }, { error: insErr }] = await Promise.all([
    sb.from('card_state').upsert(upsertPayload),
    sb.from('reviews').insert({
      card_id,
      reviewed_at: new Date(now).toISOString(),
      quality,
      interval_days: next.interval_days,
      ease: next.ease,
    }),
  ]);

  if (upsertErr || insErr) {
    return NextResponse.json({ error: (upsertErr ?? insErr)!.message }, { status: 500 });
  }

  return NextResponse.json({ next });
}
