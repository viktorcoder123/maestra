import type { Metadata } from 'next';
import { Instrument_Serif, DM_Sans } from 'next/font/google';
import { AppHeader } from '@/components/AppHeader';
import './globals.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans  = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Maestra · Oposiciones Música Primaria',
  description: 'Entrenamiento para las oposiciones de Maestro/a de Primaria especialidad Música',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}`}</style>
        <AppHeader />
        <main className="w-full max-w-container mx-auto px-5 pt-7 pb-20">{children}</main>
      </body>
    </html>
  );
}
