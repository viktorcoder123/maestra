import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SimuladorClient } from './SimuladorClient';

export const dynamic = 'force-dynamic';

export default async function Simulador() {
  const { data: temas } = await supabaseAdmin().from('temas').select('*').order('number');
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Simulador de oposición</h1>
      <p className="text-ink-800/70 mb-6">
        Tiempo real: 10 min para el esquema, 90 min para desarrollar. Al terminar, un informe de cobertura.
      </p>
      <Suspense>
        <SimuladorClient temas={(temas ?? []).map((t: any) => ({ id: t.id, title: t.title, full_title: t.full_title }))} />
      </Suspense>
    </div>
  );
}
