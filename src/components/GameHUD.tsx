'use client';
import { useEffect, useState } from 'react';
import { load, level, type Achievement } from '@/lib/game-state';

/** Floating XP/combo toast + achievement popup. Mount once per game page. */
export function GameHUD({
  combo,
  xpGained,
  achievements,
}: {
  combo: number;
  xpGained?: number;
  achievements?: Achievement[];
}) {
  const [gs, setGs] = useState(load());
  const [toast, setToast] = useState<string | null>(null);
  const [ach, setAch] = useState<Achievement | null>(null);

  useEffect(() => { setGs(load()); }, [xpGained, combo]);

  useEffect(() => {
    if (!xpGained) return;
    setToast(`+${xpGained} XP`);
    const t = setTimeout(() => setToast(null), 900);
    return () => clearTimeout(t);
  }, [xpGained]);

  useEffect(() => {
    if (!achievements?.length) return;
    const a = achievements[0];
    setAch(a);
    const t = setTimeout(() => setAch(null), 3500);
    return () => clearTimeout(t);
  }, [achievements]);

  const lv = level(gs.xp);

  return (
    <div className="flex items-center gap-3 mb-4 relative">
      <div className="flex-1 border rounded-xl bg-white px-4 py-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-800/70">Nivel <strong>{lv.level}</strong></span>
          <span className="text-ink-800/60 tabular-nums">{gs.xp} XP</span>
        </div>
        <div className="mt-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${lv.progress * 100}%` }} />
        </div>
      </div>
      {combo > 1 && (
        <div className="px-3 py-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 pop-in">
          <span className="font-bold tabular-nums">x{combo}</span>
          <span className="ml-1 text-sm">🔥</span>
        </div>
      )}
      {toast && (
        <div className="absolute -top-8 right-0 pop-in font-bold text-brand-600">{toast}</div>
      )}
      {ach && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 pop-in bg-ink-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="text-3xl">{ach.icon}</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-300">¡Logro desbloqueado!</div>
            <div className="font-serif">{ach.name}</div>
            <div className="text-xs text-white/70">{ach.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}
