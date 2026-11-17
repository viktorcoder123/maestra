'use client';
import { useEffect, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

type Block = { id: string; name: string; subs: number[]; dotSize: number };
const BLOCKS: Block[] = [
  { id: 'negra',    name: 'Negra',         subs: [0],               dotSize: 30 },
  { id: 'corcheas', name: 'Corcheas',      subs: [0, 0.5],          dotSize: 20 },
  { id: 'tresillo', name: 'Tresillo',      subs: [0, 1/3, 2/3],     dotSize: 14 },
  { id: 'semi',     name: 'Semicorcheas',  subs: [0, 0.25, 0.5, 0.75], dotSize: 10 },
  { id: 'silencio', name: 'Silencio',      subs: [],                dotSize: 0 },
];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

function freshTarget(): string[] {
  const out: string[] = [];
  while (out.length < 4) {
    const b = pick(BLOCKS);
    if (out.length === 0 && b.id === 'silencio') continue;
    out.push(b.id);
  }
  return out;
}

export function DictritmoClient() {
  const [combo, setCombo] = useState(0);
  const [target, setTarget] = useState<string[]>(() => freshTarget());
  const [input, setInput] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  async function play() {
    const beatMs = 600;
    for (let i = 0; i < target.length; i++) {
      const blk = BLOCKS.find((b) => b.id === target[i])!;
      setTimeout(() => sfx.tick(), i * beatMs);
      blk.subs.forEach((s) => {
        setTimeout(() => sfx.drum(), i * beatMs + s * beatMs);
      });
    }
  }

  function addBlock(id: string) {
    if (checked) return;
    if (input.length >= 4) return;
    sfx.click();
    setInput((a) => {
      const next = [...a, id];
      if (next.length === 4) setTimeout(() => autoCheck(next), 120);
      return next;
    });
  }
  function clearAll() { if (checked) return; setInput([]); }

  function autoCheck(final: string[]) {
    setChecked(true);
    const correct = final.filter((v, i) => v === target[i]).length;
    const perfect = correct === 4;
    const res = registerAnswer('dictritmo', perfect, correct * 5, combo);
    setCombo(res.newCombo);
    perfect ? sfx.correct() : sfx.wrong();
  }

  function next() { setTarget(freshTarget()); setInput([]); setChecked(false); }

  return (
    <div className="bg-brand-100 rounded-3xl p-[clamp(24px,4vw,40px)]">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-700">Dictado rítmico · 4 pulsos</div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={play}>Escuchar</Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>Borrar</Button>
          {checked && <Button variant="dark" size="sm" onClick={next}>Nuevo →</Button>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => {
          const chosen = input[i];
          const t = target[i];
          const match = checked && chosen === t;
          const bg = checked ? (match ? 'bg-ok-fillDark text-white' : 'bg-bad-dark text-ink-900') : chosen ? 'bg-white border-brand-500 border-2' : (i === input.length ? 'border-brand-500 border-2 border-dashed' : 'border-2 border-dashed border-ink-300');
          const label = checked
            ? match ? BLOCKS.find((b) => b.id === t)!.name : `${BLOCKS.find((b) => b.id === t)!.name}${chosen ? ` · pusiste ${BLOCKS.find((b) => b.id === chosen)!.name}` : ''}`
            : chosen ? BLOCKS.find((b) => b.id === chosen)!.name : '';
          return (
            <div key={i} className={`h-[120px] rounded-2xl flex items-center justify-center text-center p-2 text-[13px] font-medium ${bg}`}>
              {label}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {BLOCKS.map((b) => (
          <button key={b.id} onClick={() => addBlock(b.id)} disabled={checked} className="bg-ink-50 rounded-xl py-4 px-3 text-ink-900 hover:brightness-95 disabled:opacity-40">
            <div className="flex gap-[6px] justify-center h-[30px] items-center">
              {b.subs.length === 0 ? <span className="text-[12px] text-ink-500">∅</span> : b.subs.map((_, i) => <span key={i} className="rounded-full bg-ink-900" style={{ width: b.dotSize, height: b.dotSize }} />)}
            </div>
            <div className="text-[12px] mt-2">{b.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
