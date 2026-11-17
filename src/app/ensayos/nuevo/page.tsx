import { Suspense } from 'react';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NuevoEnsayoClient } from './NuevoEnsayoClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data: temas } = await supabaseAdmin().from('temas').select('id, title, full_title').order('number');
  return (
    <div className="py-6 max-w-[820px] mx-auto">
      <Suspense><NuevoEnsayoClient temas={(temas ?? []) as any[]} /></Suspense>
    </div>
  );
}
