'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type P = { id: string; nombre: string; pais: string; anios: string; metodo: string; palabras_clave: string[] };

const DECADES = [1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1970];
const FLAGS: Record<string, string> = {
  'Suiza': '🇨🇭', 'Hungría': '🇭🇺', 'Alemania': '🇩🇪', 'Bélgica': '🇧🇪',
  'Bélgica/Suiza': '🇧🇪', 'Francia': '🇫🇷', 'Estados Unidos': '🇺🇸', 'Japón': '🇯🇵',
  'España': '🇪🇸', 'Italia': '🇮🇹', 'Canadá': '🇨🇦', 'Argentina': '🇦🇷',
};

function birthDecade(anios: string): number {
  const m = anios.match(/^(\d{4})/);
  if (!m) return 1900;
  const y = parseInt(m[1], 10);
  return Math.floor(y / 10) * 10;
}

export function TimelineClient({ pedagogos }: { pedagogos: P[] }) {
  const [placed, setPlaced] = useState<Record<string, number>>({}); // pid -> decade
  const [checked, setChecked] = useState<Record<string, 'good' | 'bad'>>({});
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [dragging, setDragging] = useState<string | null>(null);

  const unplaced = pedagogos.filter((p) => !placed[p.id]);
  const allDone = unplaced.length === 0;

  function dropOn(decade: number, pid: string) {
    if (checked[pid]) return;
    const p = pedagogos.find((x) => x.id === pid)!;
    const correct = birthDecade(p.anios) === decade;
    const res = registerAnswer('timeline', correct, correct ? 15 : 0, combo);
    setCombo(res.newCombo);
    setXpGained(res.xpGained);
    setNewAch(res.newAchievements);
    correct ? sfx.correct() : sfx.wrong();
    setPlaced((s) => ({ ...s, [pid]: decade }));
    setChecked((c) => ({ ...c, [pid]: correct ? 'good' : 'bad' }));
    if (correct && res.newCombo >= 3) sfx.combo(res.newCombo);

    // Check for completion achievement
    const nextPlaced = { ...placed, [pid]: decade };
    if (Object.keys(nextPlaced).length === pedagogos.length) {
      const allCorrect = pedagogos.every((pp) => birthDecade(pp.anios) === nextPlaced[pp.id]);
      if (allCorrect) {
        sfx.fanfare();
        const a = bumpCounter('timeline_completed', pedagogos.length);
        if (a.length) setNewAch(a);
      }
    }
  }

  function reset() {
    setPlaced({}); setChecked({}); setCombo(0);
  }

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />

      <div className="relative mb-6 overflow-x-auto pb-4">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-10 gap-2">
            {DECADES.map((d) => (
              <DecadeSlot key={d} decade={d}
                placed={pedagogos.filter((p) => placed[p.id] === d)}
                checked={checked}
                onDrop={(pid: string) => dropOn(d, pid)}
                dragging={dragging}
              />
            ))}
          </div>
          <div className="relative h-1 bg-ink-200 mt-2">
            <div className="absolute -top-1 left-0 w-full flex justify-between">
              {DECADES.map((d) => (
                <div key={d} className="text-xs text-ink-800/60 -translate-x-1/2">{d}s</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-4 border rounded-2xl bg-ink-50 min-h-[90px]">
        {unplaced.length === 0 ? (
          <div className="w-full text-center py-4">
            <div className="text-4xl mb-2">{Object.values(checked).every((v) => v === 'good') ? '🏆' : '✅'}</div>
            <div className="font-serif text-lg">
              {Object.values(checked).every((v) => v === 'good')
                ? '¡Perfecto! Siglo XX dominado.'
                : `${Object.values(checked).filter((v) => v === 'good').length} / ${pedagogos.length} aciertos`}
            </div>
            <button onClick={reset} className="mt-3 px-5 py-2 rounded-full bg-ink-900 text-white hover:bg-ink-800">Otra vez</button>
          </div>
        ) : (
          unplaced.map((p) => (
            <div key={p.id}
              draggable
              onDragStart={(e) => { setDragging(p.id); e.dataTransfer.setData('text/plain', p.id); }}
              onDragEnd={() => setDragging(null)}
              className="px-3 py-2 rounded-xl bg-white border cursor-move hover:border-brand-400 text-sm shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span>{FLAGS[p.pais] ?? '🏳️'}</span>
                <span className="font-serif">{p.nombre.split(' ').slice(-2).join(' ')}</span>
              </div>
              <div className="text-xs text-ink-800/50 italic">{p.palabras_clave[0]}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DecadeSlot({ decade, placed, checked, onDrop, dragging }: any) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const pid = e.dataTransfer.getData('text/plain'); onDrop(pid); }}
      className={`min-h-[140px] rounded-xl border-2 ${over ? 'border-brand-500 bg-brand-50' : dragging ? 'border-dashed border-ink-300 bg-white' : 'border-ink-100 bg-white'} p-2 flex flex-col gap-1`}
    >
      {placed.map((p: P) => {
        const state = checked[p.id];
        return (
          <div key={p.id} className={`px-2 py-1 rounded-lg text-xs ${state === 'good' ? 'bg-emerald-500 text-white' : state === 'bad' ? 'bg-red-500 text-white' : 'bg-ink-100'}`}>
            {p.nombre.split(' ').slice(-1)[0]}
            {state === 'bad' && <div className="opacity-80">era {birthDecade(p.anios)}s</div>}
          </div>
        );
      })}
    </div>
  );
}
