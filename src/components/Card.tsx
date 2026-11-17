import clsx from 'clsx';
import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
  href?: string;
  title: string;
  description?: string;
  accent?: 'brand' | 'sage' | 'ink';
  icon?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Card({ href, title, description, accent = 'ink', icon, footer, children, className }: Props) {
  const content = (
    <div
      className={clsx(
        'rounded-2xl p-5 border transition hover:-translate-y-0.5 hover:shadow-lg h-full flex flex-col',
        accent === 'brand' && 'border-brand-100 bg-brand-50 hover:border-brand-400',
        accent === 'sage' && 'border-sage-100 bg-white hover:border-sage-400',
        accent === 'ink' && 'border-ink-200 bg-white hover:border-ink-800',
        className
      )}
    >
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className="font-serif text-lg mb-1">{title}</div>
      {description && <div className="text-sm text-ink-800/70">{description}</div>}
      {children}
      {footer && <div className="mt-auto pt-3 text-xs text-ink-800/60">{footer}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
