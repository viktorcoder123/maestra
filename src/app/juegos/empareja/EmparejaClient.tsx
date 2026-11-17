'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type P = { id: string; nombre: string; metodo: string; palabras_clave: string[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function EmparejaClient({ pedagogos }: { pedagogos: P[] }) {
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const selection = useMemo(() => shuffle(pedagogos).slice(0, 4), [round, pedagogos]);
  const words = useMemo(() => shuffle(selection.flatMap((p) => p.palabras_clave.slice(0, 2).map((w) => ({ word: w, correct: p.id })))), [selection]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  function onDragStart(e: React.DragEvent, word: string) {
    e.dataTransfer.setData('text/plain', word);
  }
  function onDrop(e: React.DragEvent, pid: string) {
    const word = e.dataTransfer.getData('text/plain');
    setPlaced((p) => ({ ...p, [word]: pid }));
  }

  function check() {
    setChecked(true);
    const correctCount = words.filter((w) => placed[w.word] === w.correct).length;
    const perfect = correctCount === words.length;
    const res = registerAnswer('empareja', perfect, correctCount * 5, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    perfect ? sfx.fanfare() : correctCount > 0 ? sfx.correct() : sfx.wrong();
  }
  function nextRound() { setChecked(false); setPlaced({}); setRound((r) => r + 1); }

  const score = words.filter((w) => placed[w.word] === w.correct).length;

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {selection.map((p) => (
          <div key={p.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, p.id)}
            className="border-2 border-dashed rounded-2xl p-4 min-h-[140px] bg-white"
          >
            <div className="font-serif font-medium">{p.nombre.split(' ').slice(-2).join(' ')}</div>
            <div className="text-xs text-ink-800/60 mb-2">{p.metodo}</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(placed).filter(([, pid]) => pid === p.id).map(([w]) => {
                const correct = words.find((x) => x.word === w)?.correct === p.id;
                return (
                  <span key={w} className={`px-2 py-1 text-xs rounded-lg ${checked ? (correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800') : 'bg-ink-100'}`}>
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-4 border rounded-2xl bg-ink-50">
        {words.filter((w) => !placed[w.word]).map((w) => (
          <span
            key={w.word}
            draggable
            onDragStart={(e) => onDragStart(e, w.word)}
            className="px-3 py-1.5 rounded-lg bg-white border cursor-move hover:border-brand-400 text-sm"
          >{w.word}</span>
        ))}
        {words.filter((w) => !placed[w.word]).length === 0 && (
          <div className="text-ink-800/50 text-sm">Todas colocadas.</div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!checked ? (
          <button onClick={check} className="px-5 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">Comprobar</button>
        ) : (
          <>
            <div className="text-sm">Acierto: <strong>{score}/{words.length}</strong></div>
            <button onClick={nextRound} className="px-5 py-3 rounded-full bg-ink-900 text-white hover:bg-ink-800">Otra ronda →</button>
          </>
        )}
      </div>
    </div>
  );
}
