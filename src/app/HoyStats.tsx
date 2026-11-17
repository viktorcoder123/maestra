'use client';
import { useEffect, useState } from 'react';
import { load, level, ACHIEVEMENTS } from '@/lib/game-state';

export function HoyStats({ streak, reviewsByDay, reviewsToday }: { streak: number; reviewsByDay: number[]; reviewsToday: number }) {
  const [gs, setGs] = useState(() => load());
  useEffect(() => {
    const h = () => setGs(load());
    window.addEventListener('maestra:gamestate', h);
    return () => window.removeEventListener('maestra:gamestate', h);
  }, []);

  const lv = level(gs.xp);
  const maxBar = Math.max(1, ...reviewsByDay);
  const todaysDone = reviewsByDay[reviewsByDay.length - 1] > 0 || reviewsToday > 0;

  return (
    <div className="grid grid-cols-2 gap-[14px]">
      <div className="col-span-2 bg-brand-50 border border-brand-100 rounded-[20px] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-serif text-[44px] leading-none">{streak} {streak === 1 ? 'día' : 'días'}</div>
          <div className="text-sm text-brand-700 mt-1">de racha seguida</div>
        </div>
        <div className="flex gap-[6px] items-end">
          {reviewsByDay.map((n, i) => {
            const isToday = i === reviewsByDay.length - 1;
            const h = Math.max(14, Math.round((n / maxBar) * 44));
            if (isToday && !todaysDone) {
              return <span key={i} className="w-[14px] h-[14px] rounded-[7px] border-[1.5px] border-dashed border-brand-500" />;
            }
            return <span key={i} className="w-[14px] rounded-[7px] bg-brand-500" style={{ height: h }} />;
          })}
        </div>
      </div>
      <div className="bg-white border border-ink-200 rounded-[20px] p-5">
        <div className="text-[13px] text-ink-500">Nivel {lv.level}</div>
        <div className="font-serif text-[36px] leading-[1.1] tabular-nums">{gs.xp} XP</div>
        <div className="h-[6px] rounded-full bg-ink-100 overflow-hidden my-[10px]">
          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${lv.progress * 100}%` }} />
        </div>
        <div className="text-[12px] text-ink-500">{lv.next} XP para el siguiente</div>
      </div>
      <div className="bg-white border border-ink-200 rounded-[20px] p-5">
        <div className="text-[13px] text-ink-500">Logros</div>
        <div className="font-serif text-[36px] leading-[1.1]">{gs.achievements.length} de {ACHIEVEMENTS.length}</div>
        <div className="flex gap-[5px] flex-wrap mt-3">
          {ACHIEVEMENTS.map((a) => (
            <span key={a.id} title={a.name} className={`w-[14px] h-[14px] rounded-full ${gs.achievements.includes(a.id) ? 'bg-sage-600' : 'bg-ink-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
