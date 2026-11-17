'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter, type Achievement } from '@/lib/game-state';
import { GameHUD } from '@/components/GameHUD';

type P = { id: string; nombre: string; pais: string; metodo: string; anios: string };

// Rough map positions (percent coordinates on the SVG viewBox)
const COUNTRIES = [
  { id: 'Suiza',           label: 'Suiza',           x: 50, y: 50 },
  { id: 'Hungría',         label: 'Hungría',         x: 55, y: 48 },
  { id: 'Alemania',        label: 'Alemania',        x: 51, y: 42 },
  { id: 'Bélgica',         label: 'Bélgica',         x: 47, y: 40 },
  { id: 'Bélgica/Suiza',   label: 'Bélgica/Suiza',   x: 48, y: 45 },
  { id: 'Francia',         label: 'Francia',         x: 45, y: 46 },
  { id: 'Estados Unidos',  label: 'EE. UU.',         x: 15, y: 46 },
  { id: 'Japón',           label: 'Japón',           x: 86, y: 48 },
  { id: 'España',          label: 'España',          x: 42, y: 52 },
  { id: 'Italia',          label: 'Italia',          x: 52, y: 54 },
  { id: 'Canadá',          label: 'Canadá',          x: 18, y: 32 },
  { id: 'Argentina',       label: 'Argentina',       x: 28, y: 82 },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function MapaClient({ pedagogos }: { pedagogos: P[] }) {
  const [combo, setCombo] = useState(0);
  const [xpGained, setXpGained] = useState<number | undefined>();
  const [newAch, setNewAch] = useState<Achievement[] | undefined>();
  const [score, setScore] = useState({ good: 0, bad: 0 });
  const [attempts, setAttempts] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [current, setCurrent] = useState<P>(() => pick(pedagogos));

  function nextRound() {
    const next = pick(pedagogos.filter((p) => p.id !== current.id));
    setCurrent(next);
    setPicked(null); setAttempts(0);
  }

  function choose(cid: string) {
    if (picked) return;
    const correct = cid === current.pais;
    setPicked(cid);
    if (correct) {
      const res = registerAnswer('mapa', true, attempts === 0 ? 15 : 7, combo);
      setCombo(res.newCombo);
      setXpGained(res.xpGained);
      setNewAch(res.newAchievements);
      setScore((s) => ({ ...s, good: s.good + 1 }));
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      const counterAch = bumpCounter('mapa_hits');
      if (counterAch.length) setNewAch(counterAch);
      setTimeout(nextRound, 1400);
    } else {
      if (attempts >= 1) {
        const res = registerAnswer('mapa', false, 0, combo);
        setCombo(res.newCombo);
        setScore((s) => ({ ...s, bad: s.bad + 1 }));
        sfx.wrong();
        setTimeout(nextRound, 1800);
      } else {
        sfx.wrong();
        setAttempts(1);
        setTimeout(() => setPicked(null), 600);
      }
    }
  }

  return (
    <div>
      <GameHUD combo={combo} xpGained={xpGained} achievements={newAch} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase text-brand-600">Pedagogo/a</div>
          <div className="font-serif text-xl">{current.nombre}</div>
          <div className="text-sm text-ink-800/60">{current.metodo} — {current.anios}</div>
        </div>
        <div className="text-sm text-ink-800/60">
          <span className="text-emerald-600">✓ {score.good}</span> · <span className="text-red-500">✗ {score.bad}</span>
          {attempts > 0 && <div className="text-xs text-amber-600">2º intento</div>}
        </div>
      </div>

      <div className="relative border rounded-2xl bg-sky-50 overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Simple world silhouette */}
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* Oceans */}
          <rect width="100" height="50" fill="#dbeafe" />
          {/* Continents (very rough shapes) */}
          <path d="M8,15 L28,13 L32,22 L28,35 L20,42 L10,38 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
          <path d="M22,42 L34,42 L30,82 L26,86 L22,78 L20,56 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
          <path d="M40,32 L62,30 L64,52 L50,56 L42,52 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
          <path d="M55,40 L78,28 L85,36 L82,50 L62,52 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
          <path d="M80,40 L92,42 L95,52 L84,55 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
          <path d="M55,55 L72,55 L70,70 L58,70 Z" fill="#d1fae5" stroke="#86a380" strokeWidth="0.2" />
        </svg>

        {COUNTRIES.map((c) => {
          const correct = c.id === current.pais;
          const isPicked = picked === c.id;
          const bg = picked
            ? correct ? 'bg-emerald-500 text-white ring-emerald-200 ring-4' : isPicked ? 'bg-red-500 text-white' : 'bg-white/90 text-ink-800'
            : 'bg-white/90 text-ink-800 hover:bg-brand-100 hover:scale-110';
          return (
            <button
              key={c.id}
              onClick={() => choose(c.id)}
              disabled={!!picked}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-[11px] rounded-md border border-ink-200 shadow-sm transition ${bg}`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
