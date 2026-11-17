import clsx from 'clsx';

const COLORS = ['bg-ink-900', 'bg-sage-600', 'bg-brand-600', 'bg-ink-700'];

export function Monogram({ name, size = 46, border }: { name: string; size?: number; border?: string }) {
  const initial = (name ?? '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(-1).toUpperCase() || '?';
  // Deterministic colour from name
  let h = 0;
  for (let i = 0; i < (name ?? '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const color = COLORS[h % COLORS.length];
  return (
    <span
      className={clsx('inline-flex items-center justify-center rounded-full font-serif text-ink-50 flex-none', color)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44), border: border ? `3px solid ${border}` : undefined }}
    >
      {initial}
    </span>
  );
}
