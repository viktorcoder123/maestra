import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Maestra · Oposiciones Música Primaria',
  description: 'Entrenamiento para las oposiciones de Maestro/a de Primaria — Música',
};

const NAV = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/temas', label: 'Temario', icon: '📚' },
  { href: '/repaso', label: 'Repaso', icon: '🧠' },
  { href: '/simulador', label: 'Simulador', icon: '⏱️' },
  { href: '/juegos', label: 'Juegos', icon: '🎮' },
  { href: '/oido', label: 'Oído', icon: '🎧' },
  { href: '/ensayos', label: 'Ensayos', icon: '✍️' },
  { href: '/debilidades', label: 'Puntos débiles', icon: '🎯' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl px-4 pb-24">
          <header className="flex items-center justify-between py-5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🎼</span>
              <span className="font-serif text-xl tracking-tight group-hover:text-brand-600 transition">Maestra</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-full text-sm text-ink-800 hover:bg-ink-100 transition"
                >
                  <span className="mr-1">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>
          <main>{children}</main>
        </div>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white/90 backdrop-blur">
          <div className="grid grid-cols-8 text-[10px]">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="flex flex-col items-center py-2">
                <span className="text-lg">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
