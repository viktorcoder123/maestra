'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Logo } from './Logo';
import { XPPill } from './XPPill';

const NAV = [
  { href: '/',             label: 'Inicio',         match: (p: string) => p === '/' },
  { href: '/temas',        label: 'Temario',        match: (p: string) => p === '/temas' || p.startsWith('/temas/') },
  { href: '/repaso',       label: 'Repaso',         match: (p: string) => p.startsWith('/repaso') },
  { href: '/simulador',    label: 'Simulador',      match: (p: string) => p.startsWith('/simulador') },
  { href: '/juegos',       label: 'Juegos',         match: (p: string) => p.startsWith('/juegos') },
  { href: '/oido',         label: 'Oído',           match: (p: string) => p.startsWith('/oido') },
  { href: '/ensayos',      label: 'Ensayos',        match: (p: string) => p.startsWith('/ensayos') },
  { href: '/debilidades',  label: 'Puntos débiles', match: (p: string) => p.startsWith('/debilidades') },
];

export function AppHeader() {
  const pathname = usePathname() ?? '/';
  return (
    <header className="sticky top-0 z-20 bg-ink-50/90 backdrop-blur border-b border-ink-200">
      <div className="max-w-container mx-auto px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 flex-wrap">
        <Logo />
        <div className="ml-auto">
          <XPPill />
        </div>
        <nav className="flex gap-[2px] basis-full min-w-0 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {NAV.map((n) => {
            const active = n.match(pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'flex-none px-[11px] py-2 rounded-full text-[14px] font-medium transition-colors whitespace-nowrap',
                  active ? 'bg-ink-900 text-ink-50' : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
