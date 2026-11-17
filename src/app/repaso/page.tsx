import { Suspense } from 'react';
import { RepasoClient } from './RepasoClient';

export const dynamic = 'force-dynamic';

export default function Repaso() {
  return (
    <div className="py-6 max-w-[720px] mx-auto">
      <Suspense><RepasoClient /></Suspense>
    </div>
  );
}
