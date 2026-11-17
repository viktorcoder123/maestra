'use client';
import { useEffect, useState } from 'react';
import { load, level, ACHIEVEMENTS } from '@/lib/game-state';

export function StatsStrip() {
  const [gs, setGs] = useState(load());
  useEffect(() => {
    const h = () => setGs(load());
    window.addEventListener('maestra:gamestate', h);
    return () => window.removeEventListener('maestra:gamestate', h);
  }, []);

  const lv = level(gs.xp);
  const unlocked = gs.achievements.length;
  const total = ACHIEVEMENTS.length;

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100">
        Nivel <strong>{lv.level}</strong> · {gs.xp} XP
      </div>
      <div className="px-3 py-1.5 rounded-full bg-ink-100">
        🔥 Mejor: <strong>{gs.bestCombo}</strong>
      </div>
      <div className="hidden md:inline-block px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100">
        🏅 {unlocked}/{total}
      </div>
    </div>
  );
}
