'use client';
import { useEffect, useMemo, useState } from 'react';
import { TemaPills } from '@/components/TemaPills';
import { Button } from '@/components/Button';
import { saveArtifact, loadArtifact } from '@/lib/memoria';

type Section = { id: number; tema_id: number; parent_id: number | null; number: string; title: string; level: number };
type Node = { id: string; text: string; parent: string | null };

const STOP = new Set(['de','del','la','el','los','las','y','o','un','una','en','al','por','para','a','que','como','su','sus','e','u','con','sin','se','lo','es']);

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s: string) { return normalize(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)); }
function overlap(a: string, b: string): number {
  const ta = new Set(tokens(a)), tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let n = 0; for (const x of ta) if (tb.has(x)) n++;
  return n / Math.min(ta.size, tb.size);
}

export function MapaClient({ temas, sectionsByTema }: { temas: any[]; sectionsByTema: Record<number, Section[]> }) {
  const [temaId, setTemaId] = useState<number>(temas[0]?.id ?? 7);
  const tema = temas.find((t) => t.id === temaId);
  const sections = useMemo(() => (sectionsByTema[temaId] ?? []).filter((s) => !['0','99','100'].includes(s.number)), [sectionsByTema, temaId]);
  const topLevel = sections.filter((s) => s.level === 1);
  const level2 = sections.filter((s) => s.level === 2);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // node id or 'root'
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadArtifact<Node[]>('mapa', temaId);
      setNodes(saved ?? []); setSelected(null); setChecked(false); setInput('');
    })();
  }, [temaId]);

  function add() {
    const t = input.trim(); if (!t) return;
    // selected determines parent: null or 'root' = top; a top node id = child; a child id = sibling under its parent
    let parent: string | null = null;
    if (selected && selected !== 'root') {
      const sel = nodes.find((n) => n.id === selected);
      if (sel) parent = sel.parent ?? sel.id; // if sel is level-1, new = its child; if sel is level-2, new sibling
    }
    const id = `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const next = [...nodes, { id, text: t, parent }];
    setNodes(next); setInput(''); saveArtifact('mapa', next, temaId);
  }
  function removeSelected() {
    if (!selected || selected === 'root') return;
    const next = nodes.filter((n) => n.id !== selected && n.parent !== selected);
    setNodes(next); setSelected(null); saveArtifact('mapa', next, temaId);
  }
  function selectNode(id: string) { setSelected((s) => (s === id ? null : id)); }

  // Matching
  const matches = useMemo(() => {
    if (!checked) return null;
    const topByText = new Map<string, Section>();
    for (const s of topLevel) topByText.set(s.id.toString(), s);
    const matched: Record<string, { section_id: number; status: 'correct' | 'misplaced' } | 'none'> = {};
    const claimed = new Set<number>();
    // First pass: user top-level nodes
    const userTop = nodes.filter((n) => n.parent === null);
    for (const u of userTop) {
      let best: { s: Section; score: number } | null = null;
      for (const s of sections) {
        if (claimed.has(s.id)) continue;
        const score = overlap(u.text, s.title);
        if (score > 0.5 && (!best || score > best.score)) best = { s, score };
      }
      if (best) {
        claimed.add(best.s.id);
        matched[u.id] = { section_id: best.s.id, status: best.s.level === 1 ? 'correct' : 'misplaced' };
      } else {
        matched[u.id] = 'none';
      }
    }
    // Children
    for (const u of nodes.filter((n) => n.parent !== null)) {
      let best: { s: Section; score: number; parentCorrect: boolean } | null = null;
      for (const s of sections) {
        if (claimed.has(s.id)) continue;
        const score = overlap(u.text, s.title);
        if (score > 0.5) {
          const parentMatch = matched[u.parent!];
          const parentCorrect = typeof parentMatch === 'object' && parentMatch.section_id === s.parent_id;
          if (!best || score > best.score) best = { s, score, parentCorrect };
        }
      }
      if (best) {
        claimed.add(best.s.id);
        matched[u.id] = { section_id: best.s.id, status: best.parentCorrect && best.s.level === 2 ? 'correct' : 'misplaced' };
      } else {
        matched[u.id] = 'none';
      }
    }
    const missing = sections.filter((s) => !claimed.has(s.id));
    return { matched, missing, claimed };
  }, [checked, nodes, sections, topLevel]);

  const total = sections.length;
  const correctCount = matches ? Object.values(matches.matched).filter((m) => typeof m === 'object' && m.status === 'correct').length : 0;

  const topLevelNodes = nodes.filter((n) => n.parent === null);
  const childrenOf = (pid: string) => nodes.filter((n) => n.parent === pid);
  const activeParent = selected && selected !== 'root' ? nodes.find((n) => n.id === selected || (n.id === nodes.find((x) => x.id === selected)?.parent)) : null;

  return (
    <div>
      <TemaPills temas={temas} value={temaId} onChange={setTemaId} />
      <p className="text-[16px] text-ink-700 max-w-[720px] mb-5">
        {checked
          ? 'Verde: está y en su sitio. Naranja: está, pero mal colocado. Rojo discontinuo: faltaba.'
          : 'Sin mirar el temario: escribe las secciones principales y, tocando una, sus apartados. Toca el título del tema para volver al primer nivel.'}
      </p>

      <div className="bg-white border border-ink-200 rounded-3xl p-[clamp(18px,4vw,30px)] mb-5">
        <div className="flex justify-center">
          <button onClick={() => setSelected('root')}
            className={`px-5 py-3 rounded-full bg-ink-900 text-ink-50 font-serif text-[clamp(18px,2.6vw,24px)] border-[3px] ${selected === 'root' ? 'border-brand-500' : 'border-ink-900'}`}>
            Tema {tema?.number} · {tema?.title}
          </button>
        </div>
        <div className="mx-auto w-[2px] h-[22px] bg-ink-200" />
        <div className="h-[2px] bg-ink-200 w-full" />

        {topLevelNodes.length === 0 && !checked ? (
          <div className="text-center text-ink-500 py-10">Mapa vacío. Escribe la primera sección principal abajo.</div>
        ) : (
          <div className="flex flex-wrap justify-center gap-[14px] min-h-[90px] pt-4">
            {topLevelNodes.map((n) => {
              const m = matches?.matched[n.id];
              const isCorrect = typeof m === 'object' && m.status === 'correct';
              const isMisplaced = typeof m === 'object' && m.status === 'misplaced';
              const isNone = m === 'none';
              const mSection = typeof m === 'object' ? sections.find((s) => s.id === m.section_id) : null;
              const bg = checked
                ? isCorrect ? 'bg-sage-600 text-white border-sage-600' :
                  isMisplaced ? 'bg-brand-100 text-brand-700 border-brand-400' :
                  isNone ? 'bg-white text-ink-500 border-ink-300' : ''
                : selected === n.id ? 'bg-brand-50 text-ink-900 border-brand-500' : 'bg-white text-ink-900 border-ink-200 hover:border-ink-900';
              return (
                <div key={n.id} className="flex-[0_1_220px] min-w-[170px] flex flex-col gap-2 anim-pop">
                  <button onClick={() => selectNode(n.id)} className={`rounded-[14px] border-2 p-[11px_14px] text-[16px] font-semibold text-left ${bg}`}>
                    {n.text}
                    {checked && isMisplaced && mSection && <div className="text-[12px] font-normal mt-1">va dentro de la sección {mSection.parent_id ? sections.find((s) => s.id === mSection.parent_id)?.number : ''} ({mSection.number})</div>}
                    {checked && isNone && <div className="text-[12px] font-normal mt-1">no está en el esquema</div>}
                  </button>
                  <div className="ml-[14px] pl-3 border-l-2 border-ink-200 flex flex-col gap-[6px]">
                    {childrenOf(n.id).map((c) => {
                      const cm = matches?.matched[c.id];
                      const cok = typeof cm === 'object' && cm.status === 'correct';
                      const cmis = typeof cm === 'object' && cm.status === 'misplaced';
                      const cnone = cm === 'none';
                      const cs = typeof cm === 'object' ? sections.find((s) => s.id === cm.section_id) : null;
                      const cbg = checked
                        ? cok ? 'bg-sage-600 text-white border-sage-600' :
                          cmis ? 'bg-brand-100 text-brand-700 border-brand-400' :
                          cnone ? 'bg-white text-ink-500 border-ink-300' : ''
                        : selected === c.id ? 'bg-brand-50 border-brand-500' : 'bg-white text-ink-900 border-ink-200 hover:border-ink-900';
                      return (
                        <button key={c.id} onClick={() => selectNode(c.id)} className={`rounded-[10px] border-[1.5px] p-[8px_12px] text-[14px] font-medium text-left ${cbg}`}>
                          {c.text}
                          {checked && cmis && cs && <div className="text-[12px] font-normal mt-1">va en la sección {cs.parent_id ? sections.find((s) => s.id === cs.parent_id)?.number : cs.number}</div>}
                          {checked && cnone && <div className="text-[12px] font-normal mt-1">no está en el esquema</div>}
                        </button>
                      );
                    })}
                    {/* Ghost children (missing) */}
                    {checked && matches && (() => {
                      const myRealSid = (matches.matched[n.id] as any)?.section_id;
                      if (!myRealSid) return null;
                      const missingChildren = matches.missing.filter((s) => s.parent_id === myRealSid);
                      return missingChildren.map((s) => (
                        <div key={`ghost-${s.id}`} className="rounded-[10px] border-[1.5px] border-dashed border-bad text-bad p-[8px_12px] text-[14px]">
                          {s.title}
                          <div className="text-[12px] font-normal">faltaba</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              );
            })}
            {/* Ghost top-level */}
            {checked && matches && matches.missing.filter((s) => s.level === 1).map((s) => (
              <div key={`ghost-top-${s.id}`} className="flex-[0_1_220px] min-w-[170px] flex flex-col gap-2">
                <div className="rounded-[14px] border-2 border-dashed border-bad text-bad p-[11px_14px] text-[16px] font-semibold">
                  {s.title}
                  <div className="text-[12px] font-normal mt-1">faltaba</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!checked && (
        <div className="flex gap-2 flex-wrap items-center mb-3">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            placeholder={selected && selected !== 'root' ? `Añadir apartado dentro de «${nodes.find((n) => n.id === selected)?.text ?? ''}»` : 'Añadir sección principal'}
            className="flex-1 min-w-[200px] rounded-[14px] border border-ink-200 px-[18px] py-[13px] text-[16px]" />
          <Button variant="dark" onClick={add} disabled={!input.trim()}>Añadir</Button>
          <Button variant="ghost" onClick={removeSelected} disabled={!selected || selected === 'root'}>Quitar seleccionado</Button>
          <Button variant="primary" onClick={() => setChecked(true)} disabled={nodes.length === 0}>Comparar con el esquema</Button>
        </div>
      )}

      {checked && (
        <>
          <div className="text-[16px] font-medium mb-4">
            {correctCount} de {total} apartados recordados y bien colocados.
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="dark" onClick={() => setChecked(false)}>Seguir editando</Button>
            <Button variant="ghost" onClick={() => { setNodes([]); setChecked(false); setSelected(null); saveArtifact('mapa', [], temaId); }}>Empezar de cero</Button>
          </div>
        </>
      )}
    </div>
  );
}
