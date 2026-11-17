'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter } from '@/lib/game-state';
import { Button } from '@/components/Button';
import { Monogram } from '@/components/Monogram';

type P = { id: string; nombre: string; pais: string; anios: string; metodo: string; palabras_clave: string[] };
const DECADES = [1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1970];

function birthYear(a: string): number { const m = a.match(/^(\d{4})/); return m ? parseInt(m[1], 10) : 1900; }
function birthDecade(a: string): number { return Math.floor(birthYear(a) / 10) * 10; }

type Placed = { pid: string; decade: number; correct: boolean };

export function TimelineClient({ pedagogos }: { pedagogos: P[] }) {
  const [combo, setCombo] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const unplaced = pedagogos.filter((p) => !placed.find((x) => x.pid === p.id));
  const done = unplaced.length === 0;
  const perfect = done && placed.every((p) => p.correct);

  function dropOn(decade: number, pid: string) {
    if (placed.find((x) => x.pid === pid)) return;
    const p = pedagogos.find((x) => x.id === pid)!;
    const realDecade = birthDecade(p.anios);
    const correct = realDecade === decade;
    const res = registerAnswer('timeline', correct, 15, combo);
    setCombo(res.newCombo);
    correct ? sfx.correct() : sfx.wrong();
    if (correct && res.newCombo >= 3) sfx.combo(res.newCombo);
    // Place chip in its CORRECT decade (so the finished board is always a correct timeline)
    setPlaced((prev) => [...prev, { pid, decade: realDecade, correct }]);
    setSelected(null);

    if (unplaced.length === 1) {
      const allRight = correct && placed.every((x) => x.correct);
      if (allRight) {
        sfx.fanfare();
        bumpCounter('timeline_completed', pedagogos.length);
      }
    }
  }

  function reset() { setPlaced([]); setCombo(0); setSelected(null); }

  if (done) {
    const score = placed.filter((p) => p.correct).length;
    return (
      <div className="bg-ink-900 text-ink-50 rounded-3xl p-10 text-center">
        <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">Resultado</div>
        <div className="font-serif text-[clamp(32px,5vw,56px)] leading-none mt-2 font-serif-balance">
          {perfect ? 'Siglo XX dominado.' : `${score} de ${pedagogos.length} a la primera`}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>Otra vez</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-sage-100 rounded-3xl p-6 overflow-x-auto">
        <div className="min-w-[940px]">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${DECADES.length}, minmax(88px, 1fr))` }}>
            {DECADES.map((d) => {
              const chips = placed.filter((p) => p.decade === d);
              const highlight = !!selected;
              return (
                <div key={d}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const pid = e.dataTransfer.getData('text/plain') || selected; if (pid) dropOn(d, pid); }}
                  onClick={() => { if (selected) dropOn(d, selected); }}
                  className={`min-h-[230px] rounded-xl bg-white/45 p-2 flex flex-col-reverse gap-1 border-2 transition-colors
                    ${highlight ? 'border-dashed border-sage-600' : 'border-transparent'}`}
                >
                  {chips.map((c) => {
                    const p = pedagogos.find((x) => x.id === c.pid)!;
                    const bg = c.correct ? 'bg-sage-600 text-white' : 'bg-bad text-white';
                    return (
                      <div key={c.pid} className={`rounded-lg px-2 py-[6px] text-[12px] font-medium ${bg} anim-pop`}>
                        {p.nombre.split(' ').slice(-1)[0]}
                        {!c.correct && <span className="block opacity-80">{birthYear(p.anios)} · fallo</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="relative h-[2px] bg-sage-600 mt-2">
            {DECADES.map((d, i) => (
              <div key={d} className="absolute font-serif text-[22px] text-sage-600 -translate-x-1/2 top-3" style={{ left: `${(i + 0.5) * (100 / DECADES.length)}%` }}>{d}s</div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-[10px] p-5 border border-ink-200 rounded-2xl bg-ink-100 mt-12">
        {unplaced.map((p) => {
          const active = selected === p.id;
          return (
            <button key={p.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
              onClick={(e) => { e.stopPropagation(); setSelected((s) => s === p.id ? null : p.id); }}
              className={`flex items-center gap-[10px] px-[12px] py-[8px] rounded-xl bg-white border-2 cursor-pointer transition-all
                ${active ? 'border-brand-500 bg-brand-50 -translate-y-[4px] shadow-tile' : 'border-ink-200 hover:border-ink-900'}`}
            >
              <Monogram name={p.nombre} size={32} />
              <span className="text-left">
                <span className="block text-[14px] font-semibold text-ink-900">{p.nombre.split(' ').slice(-2).join(' ')}</span>
                <span className="block text-[12px] text-ink-500">{p.palabras_clave[0]} · {p.pais}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
