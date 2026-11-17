'use client';
import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'dark' | 'ghost' | 'ghost-dark';
  size?: 'md' | 'sm';
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: Props) {
  const sizing = size === 'sm' ? 'px-5 py-[10px] text-[14px]' : 'px-6 py-[14px] text-[15px]';
  const styles = {
    primary:    'bg-brand-500 text-white hover:bg-brand-600',
    dark:       'bg-ink-900 text-ink-50 hover:bg-ink-700',
    ghost:      'bg-transparent border border-ink-200 text-ink-900 hover:bg-ink-100 hover:border-ink-900',
    'ghost-dark': 'bg-transparent border border-ink-50/40 text-ink-50 hover:bg-ink-50/10',
  }[variant];
  return (
    <button
      {...rest}
      className={clsx('inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-40', sizing, styles, className)}
    >
      {children}
    </button>
  );
}
