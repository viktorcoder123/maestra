import { supabaseAdmin } from '@/lib/supabase-server';
import { MemoriaShell } from '@/components/MemoriaShell';
import { MapaClient } from './MapaClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = supabaseAdmin();
  const { data: temas } = await sb.from('temas').select('*').order('number');
  const { data: sections } = await sb.from('sections').select('id, tema_id, parent_id, number, title, level, order_idx').order('tema_id').order('order_idx');
  const byTema: Record<number, any[]> = {};
  for (const s of sections ?? []) (byTema[s.tema_id] ??= []).push(s);
  return (
    <MemoriaShell title="Mapa mental propio" tag="Recuerdo libre">
      <MapaClient temas={temas ?? []} sectionsByTema={byTema} />
    </MemoriaShell>
  );
}
