import Link from 'next/link';
import { ReactNode } from 'react';

export function GameShell({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/juegos" className="inline-flex items-center px-4 py-2 rounded-full border border-ink-200 text-sm text-ink-700 hover:border-ink-900">← Juegos</Link>
          <h1 className="font-serif text-[clamp(32px,5vw,44px)] leading-none">{title}</h1>
        </div>
        {tag && <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600">{tag}</div>}
      </div>
      {children}
    </div>
  );
}
