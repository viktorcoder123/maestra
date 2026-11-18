'use client';
import { Pill } from './Pill';

export function TemaPills({ temas, value, onChange }: { temas: Array<{ id: number }>; value: number; onChange: (id: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-[14px]">
      {temas.map((t) => (
        <Pill key={t.id} selected={value === t.id} onClick={() => onChange(t.id)}>
          Tema {t.id}
        </Pill>
      ))}
    </div>
  );
}
