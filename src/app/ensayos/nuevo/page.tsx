import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NuevoEnsayoClient } from './NuevoEnsayoClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data: temas } = await supabaseAdmin().from('temas').select('id, title, full_title').order('number');
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Nuevo ensayo</h1>
      <p className="text-ink-800/70 mb-6">
        Escribe un desarrollo del tema. Se guarda para revisión — tu marido te devolverá el feedback con Claude.
      </p>
      <Suspense>
        <NuevoEnsayoClient temas={(temas ?? []) as any[]} />
      </Suspense>
    </div>
  );
}
