'use client';
import { useEffect, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

type Item = { k: number; t: string; r?: string };
type P = { id: string; nombre: string; metodo: string; anios: string };

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }
function birthYear(a: string) { const m = a.match(/^(\d{4})/); return m ? parseInt(m[1],10) : 1900; }

function generatePuzzle(pedagogos: P[], temas: any[], topByTema: Record<number, any[]>) {
  const roundType = Math.random() < 0.5 ? 'tema' : 'peds';
  if (roundType === 'tema') {
    const candidates = temas.filter((t) => (topByTema[t.id] ?? []).filter((s) => !['0','99','100'].includes(s.number)).length >= 5);
    const t = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] ?? temas[0];
    const rows = (topByTema[t.id] ?? []).filter((s) => !['0','99','100'].includes(s.number));
    return {
      prompt: `Ordena las secciones del TEMA ${t.number} — ${t.title}`,
      items: shuffle(rows.map((s, i) => ({ k: i + 1, t: s.title } as Item))),
    };
  }
  const pool = shuffle(pedagogos.filter((p) => /^\d{4}/.test(p.anios))).slice(0, 5).sort((a, b) => birthYear(a.anios) - birthYear(b.anios));
  return {
    prompt: 'Ordena los pedagogos del más antiguo al más reciente',
    items: shuffle(pool.map((p, i) => ({ k: i + 1, t: p.nombre, r: p.anios }))),
  };
}

export function OrdenClient({ pedagogos, temas, topByTema }: { pedagogos: P[]; temas: any[]; topByTema: Record<number, any[]> }) {
  const [combo, setCombo] = useState(0);
  const [{ prompt, items }, setPuzzle] = useState(() => generatePuzzle(pedagogos, temas, topByTema));
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const sorted = [...items.map((x) => x.k)].sort((a, b) => a - b);
  const correctCount = items.filter((x, i) => x.k === sorted[i]).length;

  function tap(i: number) {
    if (checked) return;
    if (sel == null) return setSel(i);
    const a = [...items]; [a[i], a[sel]] = [a[sel], a[i]];
    sfx.click();
    setPuzzle((p) => ({ ...p, items: a }));
    setSel(null);
  }
  function action() {
    if (checked) {
      setPuzzle(generatePuzzle(pedagogos, temas, topByTema));
      setChecked(false); setSel(null);
      return;
    }
    setChecked(true);
    const perfect = correctCount === items.length;
    const res = registerAnswer('orden', perfect, correctCount * 4, combo);
    setCombo(res.newCombo);
    perfect ? sfx.correct() : sfx.wrong();
    if (perfect && res.newCombo >= 3) sfx.combo(res.newCombo);
  }

  return (
    <div>
      <div className="font-serif text-[clamp(24px,3.6vw,34px)] leading-[1.15] mb-5 font-serif-balance">{prompt}</div>
      <div className="space-y-2 mb-6">
        {items.map((x, i) => {
          const on = sel === i;
          const ok = checked && x.k === sorted[i];
          const style = checked
            ? ok ? 'bg-sage-600 text-white border-sage-600' : 'bg-bad text-white border-bad'
            : on ? 'bg-brand-50 border-brand-500 translate-x-[10px]' : 'bg-white border-ink-200 hover:border-ink-900';
          return (
            <button key={i} onClick={() => tap(i)} className={`w-full text-left flex items-center gap-5 p-4 rounded-[18px] border-2 min-h-[64px] transition-all ${style}`}>
              <span className={`font-serif text-[40px] leading-none w-[52px] text-right ${checked ? 'text-white' : 'text-brand-600'}`}>{i + 1}</span>
              <span className="flex-1 font-medium">{x.t}</span>
              {checked && x.r && <span className="text-sm opacity-80">{x.r}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        {checked && <div className="text-sm">{correctCount} de {items.length} en su sitio</div>}
        <Button variant={checked ? 'dark' : 'primary'} onClick={action}>{checked ? 'Otra ronda →' : 'Comprobar'}</Button>
      </div>
    </div>
  );
}
