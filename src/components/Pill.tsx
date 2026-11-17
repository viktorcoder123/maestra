'use client';
import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: 'default' | 'dark';
};

export function Pill({ selected, tone = 'default', className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center gap-2 border rounded-full px-4 py-[9px] text-sm font-medium transition-colors whitespace-nowrap',
        selected
          ? 'bg-ink-900 text-ink-50 border-ink-900'
          : tone === 'dark'
            ? 'border-ink-50/30 text-ink-50 hover:bg-ink-50/10'
            : 'border-ink-200 text-ink-900 hover:border-ink-900',
        className,
      )}
    >
      {children}
    </button>
  );
}
