import { Suspense } from 'react';
import { RepasoClient } from './RepasoClient';

export const dynamic = 'force-dynamic';

export default function Repaso() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-4">Repaso inteligente</h1>
      <Suspense>
        <RepasoClient />
      </Suspense>
    </div>
  );
}
