'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';
import { Monogram } from '@/components/Monogram';

type P = { id: string; nombre: string; metodo: string; palabras_clave: string[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function EmparejaClient({ pedagogos }: { pedagogos: P[] }) {
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const selection = useMemo(() => shuffle(pedagogos).slice(0, 4), [round, pedagogos]);
  const words = useMemo(() => shuffle(selection.flatMap((p) => p.palabras_clave.slice(0, 2).map((w) => ({ word: w, correct: p.id })))), [selection]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  function placeAt(pid: string, word: string) { setPlaced((p) => ({ ...p, [word]: pid })); setSelectedChip(null); }
  function pickChip(w: string) { if (checked) return; setSelectedChip((s) => s === w ? null : w); }
  function cardTap(pid: string) { if (checked || !selectedChip) return; placeAt(pid, selectedChip); }
  function removePlaced(w: string) { if (checked) return; setPlaced((p) => { const n = { ...p }; delete n[w]; return n; }); }

  function check() {
    setChecked(true);
    const correctCount = words.filter((w) => placed[w.word] === w.correct).length;
    const perfect = correctCount === words.length;
    const res = registerAnswer('empareja', perfect, correctCount * 5, combo);
    setCombo(res.newCombo);
    perfect ? sfx.fanfare() : correctCount > 0 ? sfx.correct() : sfx.wrong();
  }
  function nextRound() { setChecked(false); setPlaced({}); setSelectedChip(null); setRound((r) => r + 1); }
  const trayLeft = words.filter((w) => !placed[w.word]);
  const score = words.filter((w) => placed[w.word] === w.correct).length;

  return (
    <div>
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-3 mb-6">
        {selection.map((p) => (
          <button
            key={p.id}
            onClick={() => cardTap(p.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const w = e.dataTransfer.getData('text/plain'); placeAt(p.id, w); }}
            className={`text-left bg-white rounded-2xl p-4 min-h-[190px] flex flex-col gap-3 border-2 transition-colors
              ${selectedChip ? 'border-dashed border-brand-500' : 'border-ink-200'}`}
          >
            <div className="flex items-center gap-3">
              <Monogram name={p.nombre} size={36} />
              <div>
                <div className="font-serif text-[18px] leading-tight">{p.nombre.split(' ').slice(-2).join(' ')}</div>
                <div className="text-[12px] text-ink-500 uppercase tracking-[.06em]">{p.metodo}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {Object.entries(placed).filter(([, pid]) => pid === p.id).map(([w]) => {
                const correct = words.find((x) => x.word === w)?.correct === p.id;
                const cls = checked
                  ? correct ? 'bg-sage-600 text-white' : 'bg-bad text-white'
                  : 'bg-ink-100 hover:bg-ink-200';
                return (
                  <span key={w} onClick={(e) => { e.stopPropagation(); removePlaced(w); }}
                    className={`px-[10px] py-1 text-[13px] rounded-lg ${cls} ${!checked ? 'cursor-pointer' : ''}`}>
                    {w}
                  </span>
                );
              })}
            </div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 p-4 border border-ink-200 rounded-2xl bg-ink-100 min-h-[70px]">
        {trayLeft.length > 0 ? trayLeft.map((w) => (
          <span key={w.word}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', w.word)}
            onClick={() => pickChip(w.word)}
            className={`px-[12px] py-[8px] rounded-lg bg-white border cursor-pointer text-[14px] font-medium transition-transform
              ${selectedChip === w.word ? 'border-brand-500 -translate-y-[3px] shadow-tile' : 'border-ink-200 hover:border-ink-900'}`}
          >{w.word}</span>
        )) : (
          <div className="flex items-center justify-between w-full gap-3">
            {!checked
              ? <>
                  <span className="text-ink-500 text-sm">Todas colocadas.</span>
                  <Button variant="primary" onClick={check}>Comprobar</Button>
                </>
              : <>
                  <span className="text-sm">Acierto: <strong>{score}/{words.length}</strong></span>
                  <Button variant="dark" onClick={nextRound}>Otra ronda →</Button>
                </>}
          </div>
        )}
      </div>
    </div>
  );
}
