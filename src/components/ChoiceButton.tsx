'use client';
import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type State = 'idle' | 'correct' | 'wrong' | 'dim';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  state?: State;
  stage?: boolean;
};

export function ChoiceButton({ state = 'idle', stage = false, className, children, ...rest }: Props) {
  const base = 'w-full text-left px-[18px] py-4 min-h-[56px] rounded-2xl border-[1.5px] font-medium transition-colors';
  const styles = stage
    ? {
        idle:    'bg-ink-50/[0.07] border-ink-50/30 text-ink-50 hover:bg-ink-50/10 hover:border-ink-50/60',
        correct: 'bg-ok-fillDark border-ok-fillDark text-white',
        wrong:   'bg-bad-dark border-bad-dark text-ink-900',
        dim:     'bg-ink-50/[0.04] border-ink-50/15 text-ink-50/50',
      }[state]
    : {
        idle:    'bg-white border-ink-200 text-ink-900 hover:border-ink-900',
        correct: 'bg-sage-600 border-sage-600 text-white',
        wrong:   'bg-bad border-bad text-white',
        dim:     'bg-white border-ink-200 text-ink-900 opacity-45',
      }[state];
  return (
    <button {...rest} className={clsx(base, styles, className)}>
      {children}
    </button>
  );
}
