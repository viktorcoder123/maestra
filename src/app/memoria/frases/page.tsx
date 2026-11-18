import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabase-server';
import { MemoriaShell } from '@/components/MemoriaShell';
import { FrasesClient } from './FrasesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sb = supabaseAdmin();
  const { data: temas } = await sb.from('temas').select('*').order('number');
  const { data: sections } = await sb.from('sections').select('id, tema_id, number, title, level, order_idx').order('order_idx');
  const peds = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8')).pedagogos;
  const audio = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'audio-bank.json'), 'utf-8'));

  const lists: Array<{ key: string; label: string; items: string[] }> = [];

  // Pedagogue halves
  const first = ['dalcroze','kodaly','orff','willems','martenot','ward','suzuki','chevais','montessori'];
  const second = ['elizalde','schafer','wuytack','aschero','bapne','hemsy'];
  lists.push({
    key: 'ped-1',
    label: 'Métodos activos · 1.ª mitad',
    items: first.map((id) => peds.find((p: any) => p.id === id)?.nombre.split(' ').slice(-1)[0]).filter(Boolean),
  });
  lists.push({
    key: 'ped-2',
    label: 'Segunda mitad y tendencias',
    items: second.map((id) => peds.find((p: any) => p.id === id)?.nombre.split(' ').slice(-1)[0]).filter(Boolean),
  });

  // Top-level sections of each tema
  for (const t of temas ?? []) {
    const rows = (sections ?? []).filter((s: any) => s.tema_id === t.id && s.level === 1 && !['0','99','100'].includes(s.number));
    if (rows.length >= 3) {
      lists.push({ key: `t${t.id}`, label: `Secciones del Tema ${t.id}`, items: rows.map((s: any) => s.title) });
    }
  }

  // Texturas / formas
  lists.push({ key: 'texturas', label: 'Texturas', items: audio.texturas.map((x: any) => x.nombre) });
  lists.push({ key: 'formas', label: 'Formas musicales', items: audio.formas.map((x: any) => x.nombre) });

  return (
    <MemoriaShell title="Acrónimos y frases" tag="Mnemotecnia">
      <FrasesClient lists={lists} />
    </MemoriaShell>
  );
}
