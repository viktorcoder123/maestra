import { supabaseAdmin } from '@/lib/supabase-server';
import { MemoriaShell } from '@/components/MemoriaShell';
import { PalacioClient } from './PalacioClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = supabaseAdmin();
  const { data: temas } = await sb.from('temas').select('*').order('number');
  const { data: sections } = await sb.from('sections').select('id, tema_id, number, title, level, order_idx').eq('level', 1).order('order_idx');
  const byTema: Record<number, any[]> = {};
  for (const s of sections ?? []) (byTema[s.tema_id] ??= []).push(s);
  return (
    <MemoriaShell title="Palacio de la memoria" tag="Lugares">
      <PalacioClient temas={temas ?? []} topByTema={byTema} />
    </MemoriaShell>
  );
}
