import { supabaseAdmin } from '@/lib/supabase-server';
import { GameShell } from '@/components/GameShell';
import { FaltaClient } from './FaltaClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data: temas } = await supabaseAdmin().from('temas').select('*').order('number');
  const { data: sections } = await supabaseAdmin().from('sections').select('id, tema_id, number, title, level, order_idx').eq('level', 1).order('order_idx');

  const topByTema: Record<number, any[]> = {};
  for (const s of sections ?? []) (topByTema[s.tema_id] ??= []).push(s);

  return (
    <GameShell title="¿Qué falta?" tag="Estructura">
      <FaltaClient temas={temas ?? []} topByTema={topByTema} />
    </GameShell>
  );
}
