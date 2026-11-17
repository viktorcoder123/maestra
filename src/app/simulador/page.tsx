import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SimuladorClient } from './SimuladorClient';

export const dynamic = 'force-dynamic';

export default async function Simulador() {
  const { data: temas } = await supabaseAdmin().from('temas').select('*').order('number');
  return (
    <div className="py-6">
      <Suspense><SimuladorClient temas={(temas ?? []).map((t: any) => ({ id: t.id, title: t.title, full_title: t.full_title }))} /></Suspense>
    </div>
  );
}
