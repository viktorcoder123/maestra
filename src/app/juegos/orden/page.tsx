import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabase-server';
import { GameShell } from '@/components/GameShell';
import { OrdenClient } from './OrdenClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const peds = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8')).pedagogos;
  const { data: temas } = await supabaseAdmin().from('temas').select('*').order('number');
  const { data: sections } = await supabaseAdmin().from('sections').select('id, tema_id, number, title, level, order_idx').eq('level', 1).order('order_idx');

  const topByTema: Record<number, any[]> = {};
  for (const s of sections ?? []) {
    (topByTema[s.tema_id] ??= []).push(s);
  }

  return (
    <GameShell title="Ordena el esquema" tag="Estructura">
      <OrdenClient pedagogos={peds} temas={temas ?? []} topByTema={topByTema} />
    </GameShell>
  );
}
