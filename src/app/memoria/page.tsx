import Link from 'next/link';

const TILES = [
  {
    href: '/memoria/palacio',
    eyebrow: 'Lugares',
    title: 'Palacio de la memoria',
    desc: 'Deja cada sección en una sala del colegio y recórrelo para recordarlas.',
    bg: '#f3f1ea', fg: '#171717', glyph: 'Aula · Patio', size: '54px',
  },
  {
    href: '/memoria/canta',
    eyebrow: 'Melodía',
    title: 'Canta el esquema',
    desc: 'Ponle una melodía a cada sección y apréndete el orden cantando.',
    bg: '#1d1b18', fg: '#eb7a3a', glyph: 'Do Mi Sol', size: '64px',
  },
  {
    href: '/memoria/mapa',
    eyebrow: 'Recuerdo libre',
    title: 'Mapa mental propio',
    desc: 'Dibuja el tema de memoria y compáralo con el esquema real.',
    bg: '#e8ede6', fg: '#4f6a4a', glyph: '○—○—○', size: '64px',
  },
  {
    href: '/memoria/frases',
    eyebrow: 'Mnemotecnia',
    title: 'Acrónimos y frases',
    desc: 'Inventa tu frase para una lista y entrénate con ella.',
    bg: '#dd5f1b', fg: '#ffffff', glyph: 'D K O W', size: '76px',
  },
];

export default function Memoria() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none">Memoria</h1>
      <p className="text-ink-500 mt-3 mb-7 max-w-[620px] text-[16px]">
        Cuatro formas de fijar un esquema para que salga solo el día del examen. Lo que construyas aquí se guarda.
      </p>
      <section className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="flex flex-col justify-start border border-ink-200 bg-white rounded-[22px] overflow-hidden text-ink-900 transition-transform duration-150 hover:-translate-y-[3px] hover:shadow-tile">
            <div className="h-[clamp(140px,34vw,180px)] relative overflow-hidden flex items-center justify-center" style={{ background: t.bg, color: t.fg }}>
              <div className="absolute inset-x-0 top-[58px] flex flex-col gap-[15px] opacity-20">
                {Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-px bg-current" />)}
              </div>
              <span className="relative font-serif leading-none whitespace-nowrap" style={{ fontSize: t.size }}>{t.glyph}</span>
            </div>
            <div className="p-5 pt-[18px]">
              <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600">{t.eyebrow}</div>
              <div className="font-serif text-[28px] leading-[1.1] mt-1 mb-[6px]">{t.title}</div>
              <div className="text-sm text-ink-500 leading-[1.45]">{t.desc}</div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
