'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export function FaltaClient({ temas, topByTema }: { temas: any[]; topByTema: Record<number, any[]> }) {
  const [round, setRound] = useState(0);
  const [combo, setCombo] = useState(0);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);

  const puzzle = useMemo(() => {
    const t = shuffle(temas.filter((x) => (topByTema[x.id] ?? []).filter((s) => !['0','99','100'].includes(s.number)).length >= 4))[0] ?? temas[0];
    const rows = (topByTema[t.id] ?? []).filter((s) => !['0','99','100'].includes(s.number)).slice(0, 7);
    const gapIdx = shuffle(rows.map((_, i) => i)).slice(0, 2);
    const gaps = rows.map((s, i) => gapIdx.includes(i) ? { ...s, gap: true } : s);
    const correctTitles = gaps.filter((r) => (r as any).gap).map((r) => r.title);
    // Distractors: other sections from other temas / level-2 siblings
    const others = shuffle(temas.flatMap((tm) => topByTema[tm.id] ?? [])).filter((s) => !rows.find((r) => r.id === s.id)).slice(0, 2).map((s) => s.title);
    const opts = shuffle([...correctTitles, ...others]).map((t) => ({ t, right: correctTitles.includes(t) }));
    return { tema: t, rows: gaps, opts };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const nPicked = Object.values(pick).filter(Boolean).length;
  const correct = puzzle.opts.every((o) => !!pick[o.t] === o.right);

  function toggle(t: string) {
    if (checked) return;
    const on = !!pick[t];
    if (!on && nPicked >= 2) return;
    setPick((p) => ({ ...p, [t]: !on }));
  }
  function act() {
    if (checked) { setRound((r) => r + 1); setChecked(false); setPick({}); return; }
    if (nPicked !== 2) return;
    setChecked(true);
    const res = registerAnswer('falta', correct, 12, combo);
    setCombo(res.newCombo);
    correct ? sfx.correct() : sfx.wrong();
  }

  return (
    <div>
      <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600 mb-2">TEMA {puzzle.tema.number}</div>
      <div className="font-serif text-[clamp(26px,3.8vw,34px)] leading-tight mb-6">{puzzle.tema.title}</div>
      <div className="grid md:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white border border-ink-200 rounded-2xl p-5 space-y-2">
          {puzzle.rows.map((r, i) => {
            const isGap = (r as any).gap;
            if (!isGap) return (
              <div key={r.id} className="flex items-baseline gap-3 py-2">
                <span className="font-serif text-brand-600 w-8 text-right">{r.number}</span>
                <span className="text-[16px] text-ink-900">{r.title}</span>
              </div>
            );
            return checked ? (
              <div key={r.id} className="flex items-baseline gap-3 p-2 rounded-xl bg-sage-600 text-white">
                <span className="font-serif w-8 text-right">{r.number}</span>
                <span className="text-[16px] font-medium">{r.title}</span>
              </div>
            ) : (
              <div key={r.id} className="flex items-baseline gap-3 p-2 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 text-ink-500">
                <span className="font-serif text-ink-500 w-8 text-right">{r.number}</span>
                <span className="text-[16px]">¿?</span>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          {puzzle.opts.map((o) => {
            const on = !!pick[o.t];
            const style = checked
              ? o.right ? 'bg-sage-600 text-white border-sage-600' : on ? 'bg-bad text-white border-bad' : 'bg-white border-ink-200 opacity-60'
              : on ? 'bg-brand-50 border-brand-500' : 'bg-white border-ink-200 hover:border-ink-900';
            return (
              <button key={o.t} onClick={() => toggle(o.t)} className={`w-full text-left p-3 rounded-xl border-2 text-[14px] transition-colors ${style}`}>{o.t}</button>
            );
          })}
          <Button variant={checked ? 'dark' : 'primary'} className="w-full mt-2" disabled={!checked && nPicked !== 2} onClick={act}>
            {checked ? 'Otro esquema →' : 'Comprobar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
