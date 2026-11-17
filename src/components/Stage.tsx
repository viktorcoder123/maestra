import clsx from 'clsx';
import { ReactNode } from 'react';

export function Stage({ children, className, noPad }: { children: ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={clsx('bg-stage text-ink-50 rounded-3xl', !noPad && 'p-[clamp(24px,5vw,48px)]', className)}>
      {children}
    </div>
  );
}
