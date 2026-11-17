'use client';
import { useState, useMemo } from 'react';
import type { Section, SectionNode } from '@/lib/types';

function buildTree(sections: Section[]): SectionNode[] {
  const map = new Map<number, SectionNode>();
  sections.forEach((s) => map.set(s.id, { ...s, children: [] }));
  const roots: SectionNode[] = [];
  for (const s of sections) {
    const n = map.get(s.id)!;
    if (s.parent_id && map.has(s.parent_id)) {
      map.get(s.parent_id)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  return roots;
}

export function SectionTree({ sections }: { sections: Section[] }) {
  const tree = useMemo(() => buildTree(sections), [sections]);
  const [expandAll, setExpandAll] = useState(false);
  const [contentOn, setContentOn] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button
          onClick={() => setExpandAll((x) => !x)}
          className="px-3 py-1.5 rounded-full border hover:border-brand-400"
        >
          {expandAll ? 'Plegar todo' : 'Desplegar todo'}
        </button>
        <button
          onClick={() => setContentOn((x) => !x)}
          className="px-3 py-1.5 rounded-full border hover:border-brand-400"
        >
          {contentOn ? 'Ocultar contenido' : 'Mostrar contenido'}
        </button>
      </div>
      <div className="border-l-2 border-ink-200 pl-4 space-y-1">
        {tree.map((n) => (
          <Node key={n.id} node={n} depth={0} expandAll={expandAll} contentOn={contentOn} />
        ))}
      </div>
    </div>
  );
}

function Node({
  node,
  depth,
  expandAll,
  contentOn,
}: {
  node: SectionNode;
  depth: number;
  expandAll: boolean;
  contentOn: boolean;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const effectivelyOpen = expandAll || open;

  return (
    <div className="pop-in">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left py-1.5 flex items-start gap-2 hover:bg-ink-100 rounded-lg px-2 transition"
      >
        <span className="text-ink-800/40 mt-0.5 w-6 text-right tabular-nums text-sm">{node.number}</span>
        <span className={depth === 0 ? 'font-serif font-medium' : ''}>{node.title}</span>
        {hasChildren && (
          <span className="ml-auto text-ink-800/40 text-xs">{effectivelyOpen ? '▾' : '▸'}</span>
        )}
      </button>
      {effectivelyOpen && contentOn && node.content && (
        <div className="ml-8 my-2 p-3 rounded-lg bg-ink-50 border border-ink-100 text-sm prose-tema whitespace-pre-wrap">
          {node.content.length > 1200 ? node.content.slice(0, 1200) + '…' : node.content}
        </div>
      )}
      {effectivelyOpen && hasChildren && (
        <div className="ml-6 border-l border-ink-100 pl-2 space-y-1">
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} expandAll={expandAll} contentOn={contentOn} />
          ))}
        </div>
      )}
    </div>
  );
}
