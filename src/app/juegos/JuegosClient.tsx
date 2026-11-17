'use client';
import { useEffect, useState } from 'react';
import { load } from '@/lib/game-state';

export function JuegosClient() {
  const [best, setBest] = useState(0);
  useEffect(() => {
    const h = () => setBest(load().bestCombo);
    h();
    window.addEventListener('maestra:gamestate', h);
    return () => window.removeEventListener('maestra:gamestate', h);
  }, []);
  return (
    <div className="text-sm text-ink-500">
      Mejor racha <strong className="text-ink-900">{best}</strong> aciertos
    </div>
  );
}
