'use client';
import { useEffect, useState } from 'react';
import { load, level, ACHIEVEMENTS } from '@/lib/game-state';

export function XPWidget() {
  const [gs, setGs] = useState(load());
  useEffect(() => {
    const h = () => setGs(load());
    window.addEventListener('maestra:gamestate', h);
    return () => window.removeEventListener('maestra:gamestate', h);
  }, []);

  const lv = level(gs.xp);
  return (
    <div className="rounded-2xl p-4 border border-brand-100 bg-gradient-to-br from-brand-50 to-white">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-600">Nivel {lv.level}</div>
          <div className="font-serif text-2xl tabular-nums">{gs.xp} <span className="text-sm text-ink-800/60">XP</span></div>
        </div>
        <div className="text-right text-xs text-ink-800/60">
          🔥 Mejor racha: <strong>{gs.bestCombo}</strong><br/>
          🏅 {gs.achievements.length}/{ACHIEVEMENTS.length} logros
        </div>
      </div>
      <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden border">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${lv.progress * 100}%` }} />
      </div>
      <div className="text-xs text-ink-800/50 mt-1">{lv.next} XP para nivel {lv.level + 1}</div>
    </div>
  );
}
