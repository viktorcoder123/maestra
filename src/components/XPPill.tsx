'use client';
import { useEffect, useState } from 'react';
import { load, level } from '@/lib/game-state';

type ToastState = { xp: number; key: number } | null;

export function XPPill() {
  const [gs, setGs] = useState(() => load());
  const [combo, setCombo] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    const prevXp = { current: gs.xp };
    const onUpdate = (e: Event) => {
      const next = load();
      const detail = (e as CustomEvent<{ xpGained?: number; combo?: number }>).detail;
      if (detail?.xpGained && detail.xpGained > 0) {
        setToast({ xp: detail.xpGained, key: Date.now() });
        setTimeout(() => setToast(null), 900);
      }
      if (typeof detail?.combo === 'number') setCombo(detail.combo);
      prevXp.current = next.xp;
      setGs(next);
    };
    window.addEventListener('maestra:gamestate', onUpdate);
    return () => window.removeEventListener('maestra:gamestate', onUpdate);
  }, []);

  const lv = level(gs.xp);

  return (
    <div className="flex items-center gap-[10px] relative">
      {combo > 1 && (
        <div key={`combo-${combo}`} className="px-[11px] py-[6px] rounded-full bg-ink-900 text-ink-50 text-[13px] font-semibold anim-pop">
          ×{combo} racha
        </div>
      )}
      <div className="flex items-center gap-[10px] pl-[6px] pr-3 py-[6px] rounded-full bg-white border border-ink-200">
        <span className="w-7 h-7 rounded-full bg-brand-500 text-white inline-flex items-center justify-center text-[13px] font-semibold">
          {lv.level}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold leading-none tabular-nums">{gs.xp} XP</span>
          <span className="hidden sm:block w-[84px] h-1 rounded-full bg-ink-100 overflow-hidden">
            <span className="block h-full bg-brand-500 rounded-full transition-[width] duration-500" style={{ width: `${lv.progress * 100}%` }} />
          </span>
        </span>
      </div>
      {toast && (
        <div key={toast.key} className="absolute right-2 top-full font-semibold text-brand-600 text-[15px] anim-rise pointer-events-none">
          +{toast.xp} XP
        </div>
      )}
    </div>
  );
}
