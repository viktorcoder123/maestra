import Link from 'next/link';
import { ReactNode } from 'react';

export function MemoriaShell({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
          <Link href="/memoria" className="inline-flex items-center px-3 sm:px-4 py-[6px] sm:py-2 rounded-full border border-ink-200 text-[13px] sm:text-sm text-ink-700 hover:border-ink-900">← Memoria</Link>
          <h1 className="font-serif text-[clamp(26px,5vw,44px)] leading-none">{title}</h1>
        </div>
        {tag && <div className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600">{tag}</div>}
      </div>
      {children}
    </div>
  );
}
