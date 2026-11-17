'use client';
import { useMemo, useState } from 'react';
import type { Section, SectionNode } from '@/lib/types';

function buildTree(sections: Section[]): SectionNode[] {
  const map = new Map<number, SectionNode>();
  sections.forEach((s) => map.set(s.id, { ...s, children: [] }));
  const roots: SectionNode[] = [];
  for (const s of sections) {
    const n = map.get(s.id)!;
    if (s.parent_id && map.has(s.parent_id)) map.get(s.parent_id)!.children.push(n);
    else roots.push(n);
  }
  return roots;
}

export function SectionTree({ sections }: { sections: Section[] }) {
  const tree = useMemo(() => buildTree(sections), [sections]);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const toggle = (id: number) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="bg-white border border-ink-200 rounded-[22px] overflow-hidden">
      {tree.map((n, i) => {
        const isOpen = open[n.id] ?? false;
        return (
          <div key={n.id} className={i > 0 ? 'border-t border-ink-200' : ''}>
            <button onClick={() => toggle(n.id)} className="w-full text-left flex items-center gap-5 py-5 px-5 hover:bg-ink-100 transition-colors">
              <span className="font-serif text-[30px] text-brand-500 w-[52px] flex-none">{n.number}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[18px] font-semibold leading-tight">{n.title}</span>
                <span className="block text-[13px] text-ink-500 mt-1">{n.children.length} apartados</span>
              </span>
              <span className="text-[22px] text-ink-500 font-serif">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && n.children.length > 0 && (
              <div className="pl-[88px] pr-6 pb-5 border-l-[2px] border-ink-200 ml-[52px] space-y-[6px]">
                {n.children.map((c) => (
                  <div key={c.id} className="flex items-baseline gap-3 py-2">
                    <span className="font-semibold text-brand-600 text-[14px] w-[48px] flex-none tabular-nums">{c.number}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[16px] text-ink-900">{c.title}</span>
                      {c.content && c.content.length > 0 && (
                        <span className="block text-[14px] text-ink-500 mt-1 line-clamp-2">{c.content.slice(0, 200)}{c.content.length > 200 ? '…' : ''}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
