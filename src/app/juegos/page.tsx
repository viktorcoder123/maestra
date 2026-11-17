import Link from 'next/link';
import { JuegosClient } from './JuegosClient';

const CUSTOM_TILES: Array<{
  href: string; tag: string; title: string; desc: string;
  art: 'dictado' | 'ritmo' | 'timeline' | 'citas' | 'royale' | 'atlas' | 'empareja' | 'cloze' | 'relampago';
}> = [
  { href: '/juegos/dictado',            tag: 'Tema 2 · Oído',   title: 'Dicta la melodía',          desc: 'Escucha la secuencia y escríbela en el pentagrama tocando el piano.', art: 'dictado' },
  { href: '/juegos/ritmo',              tag: 'Tema 6 · Ritmo',  title: 'Ritmo-Tap',                  desc: 'Imita el patrón y mira cada pulsación caer sobre el compás, al milisegundo.', art: 'ritmo' },
  { href: '/juegos/linea-del-tiempo',   tag: 'Tema 7 · Pedagogos', title: 'Línea del tiempo',       desc: 'Coloca a los quince pedagogos en la década en que nacieron.', art: 'timeline' },
  { href: '/juegos/quien-lo-dijo',      tag: 'Tema 7 · Citas',  title: '¿Quién lo dijo?',           desc: 'Una cita, cuatro candidatos. Elige al pedagogo.', art: 'citas' },
  { href: '/juegos/royale',             tag: 'Supervivencia',   title: 'Oposición Royale',           desc: 'Tres vidas, reloj corriendo y cada ronda más rápida.', art: 'royale' },
  { href: '/juegos/mapa',               tag: 'Tema 7 · Geografía', title: 'Atlas pedagógico',       desc: 'Un pedagogo, un mapa. Pulsa su país de origen.', art: 'atlas' },
  { href: '/juegos/empareja',           tag: 'Tema 7 · Métodos', title: 'Empareja método',          desc: 'Lleva cada palabra clave a su pedagogo.', art: 'empareja' },
  { href: '/juegos/cloze',              tag: 'Temario',          title: 'Rellena el hueco',         desc: 'Frases del temario con una palabra escondida, letra a letra.', art: 'cloze' },
  { href: '/juegos/metodos',            tag: 'Contrarreloj',     title: 'Método → autor relámpago', desc: 'Sesenta segundos. Cuántos emparejas.', art: 'relampago' },
];

const NEW_TILES = [
  ['/juegos/orden',       'Estructura',     'Ordena el esquema',            'Secciones o pedagogos desordenados: ponlos en su sitio.',  '#171717', '#fafaf7', '1 · 2 · 3', '76px'],
  ['/juegos/falta',       'Estructura',     '¿Qué falta?',                   'Un esquema con dos huecos y cuatro candidatos.',           '#ffffff', '#171717', '2. ___',    '84px'],
  ['/juegos/tema',        'Temas 6 y 7',    '¿En qué tema sale?',            'Un pedagogo: ¿aparece en el Tema 6, en el 7 o en ambos?', '#e8ede6', '#4f6a4a', '6 · 7',     '110px'],
  ['/juegos/intervalo',   'Tema 2 · Oído',  'Intervalo en el pentagrama',    'Escucha y coloca la segunda nota donde suena.',           '#1d1b18', '#fafaf7', '5ª',        '130px'],
  ['/juegos/escala',      'Tema 2 · Escalas','Construye la escala',          'Dórico, lidio, menor armónico: pulsa sus teclas desde Do.',   '#dd5f1b', '#ffffff', 'Do Re Mi',  '64px'],
  ['/juegos/dictritmo',   'Tema 6 · Ritmo', 'Dictado rítmico',               'Reconstruye el compás con bloques de figuras.',            '#fde3d4', '#8c380d', '♩ ♫ ♩',     '64px'],
  ['/juegos/capas',       'Tema 5 · Textura','Capas de textura',             'Enciende voces hasta que suene homofonía o contrapunto.', '#1d1b18', '#eb7a3a', '≡',         '150px'],
  ['/juegos/forma',       'Formas',         'Arma la forma',                 'Bloques A, B y C para construir binaria, ternaria o rondó.', '#fef5f0', '#dd5f1b', 'A B A',   '100px'],
  ['/juegos/memory',      'Tema 7',         'Memory de parejas',             'Voltea cartas y une cada pedagogo con su método.',         '#4f6a4a', '#ffffff', '2 × 6',     '100px'],
  ['/juegos/quien-soy',   'Tema 7',         '¿Quién soy?',                   'Pistas una a una. Cuantas menos uses, más puntos.',        '#171717', '#eb7a3a', '?',         '170px'],
  ['/juegos/mentira',     'Tema 7',         'Dos verdades y una mentira',    'Tres principios; uno pertenece a otro pedagogo.',          '#fde3d4', '#171717', '2 + 1',     '110px'],
  ['/juegos/aula',        'Práctica',       'Aula en práctica',              'Una escena de clase. ¿Qué método se está aplicando?',     '#e8ede6', '#171717', 'Aula',      '110px'],
  ['/juegos/lomloe',      'Normativa',      'LOMLOE exprés',                 'Leyes, decretos y fechas a toda velocidad.',               '#ffffff', '#b84a12', '§',         '160px'],
  ['/juegos/reto',        'Una vez al día', 'Reto diario',                   'Cinco preguntas mezcladas. Solo un intento.',              '#8c380d', '#ffffff', '5',         '170px'],
] as const;

export default function Juegos() {
  return (
    <div className="py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none">Juegos</h1>
          <p className="mt-2 text-ink-500 text-base">Cinco minutos de juego cuentan como repaso.</p>
        </div>
        <JuegosClient />
      </div>
      <section className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
        {CUSTOM_TILES.map((t) => (
          <Tile key={t.href} href={t.href} tag={t.tag} title={t.title} desc={t.desc}>
            <CustomArt kind={t.art} />
          </Tile>
        ))}
        {NEW_TILES.map(([href, tag, title, desc, bg, fg, glyph, size]) => (
          <Tile key={href} href={href} tag={tag} title={title} desc={desc}>
            <GlyphArt bg={bg} fg={fg} glyph={glyph} size={size} />
          </Tile>
        ))}
      </section>
    </div>
  );
}

function Tile({ href, tag, title, desc, children }: { href: string; tag: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col justify-start border border-ink-200 bg-white rounded-[22px] overflow-hidden text-ink-900 transition-transform duration-150 hover:-translate-y-[3px] hover:shadow-tile">
      <div className="h-[180px] relative overflow-hidden">{children}</div>
      <div className="p-5 pt-[18px]">
        <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600">{tag}</div>
        <div className="font-serif text-[28px] leading-[1.1] mt-1 mb-[6px]">{title}</div>
        <div className="text-sm text-ink-500 leading-[1.45]">{desc}</div>
      </div>
    </Link>
  );
}

function GlyphArt({ bg, fg, glyph, size }: { bg: string; fg: string; glyph: string; size: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ background: bg, color: fg }}>
      <div className="absolute inset-x-0 top-[58px] flex flex-col gap-[15px] opacity-20">
        {Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-px bg-current" />)}
      </div>
      <span className="relative font-serif leading-none whitespace-nowrap" style={{ fontSize: size }}>{glyph}</span>
    </div>
  );
}

function CustomArt({ kind }: { kind: 'dictado' | 'ritmo' | 'timeline' | 'citas' | 'royale' | 'atlas' | 'empareja' | 'cloze' | 'relampago' }) {
  if (kind === 'dictado') {
    return (
      <div className="w-full h-full bg-stage relative overflow-hidden">
        <div className="absolute inset-x-0 top-9 flex flex-col gap-[13px]">
          {Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-px bg-ink-50/45" />)}
        </div>
        <span className="absolute left-[14%] top-[71px] w-5 h-[14px] rounded-full bg-ink-50 -rotate-[18deg]" />
        <span className="absolute left-[34%] top-[57px] w-5 h-[14px] rounded-full bg-ink-50 -rotate-[18deg]" />
        <span className="absolute left-[54%] top-[43px] w-5 h-[14px] rounded-full bg-brand-500 -rotate-[18deg]" />
        <span className="absolute left-[74%] top-[64px] w-5 h-[14px] rounded-full border-2 border-dashed border-ink-50/60 -rotate-[18deg]" />
        <div className="absolute inset-x-0 bottom-0 h-[46px] flex gap-[2px] px-[18px]">
          {[0,1,2,3,4,5,6,7].map((i) => (
            <span key={i} className={`flex-1 rounded-b-[4px] ${i === 2 ? 'bg-brand-500' : 'bg-ink-50'}`} />
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'ritmo') {
    return (
      <div className="w-full h-full bg-brand-500 relative overflow-hidden flex items-center justify-center gap-[14px]">
        <span className="absolute w-[300px] h-[300px] rounded-full border border-white/35" />
        <span className="absolute w-[200px] h-[200px] rounded-full border border-white/50" />
        <span className="w-11 h-11 rounded-full bg-white" />
        <span className="w-5 h-5 rounded-full bg-white" />
        <span className="w-5 h-5 rounded-full bg-white" />
        <span className="w-11 h-11 rounded-full bg-ink-900" />
        <span className="w-5 h-5 rounded-full border-2 border-white" />
        <span className="w-5 h-5 rounded-full border-2 border-white" />
      </div>
    );
  }
  if (kind === 'timeline') {
    const yrs = [{ l: '10%', b: 54, h: 26, c: 'bg-sage-600' }, { l: '10%', b: 86, h: 26, c: 'bg-sage-400' }, { l: '32%', b: 54, h: 26, c: 'bg-sage-600' }, { l: '54%', b: 54, h: 26, c: 'bg-sage-400' }, { l: '54%', b: 86, h: 26, c: 'bg-sage-600' }, { l: '54%', b: 118, h: 26, c: 'bg-brand-500' }];
    return (
      <div className="w-full h-full bg-sage-100 relative overflow-hidden">
        <span className="absolute left-0 right-0 bottom-11 h-[2px] bg-sage-600" />
        {yrs.map((y, i) => <span key={i} className={`absolute w-[16%] rounded-lg ${y.c}`} style={{ left: y.l, bottom: y.b, height: y.h }} />)}
        <span className="absolute left-[76%] bottom-[54px] w-[16%] h-[26px] rounded-lg border-2 border-dashed border-sage-600" />
        {['1860','1880','1890','1930'].map((year, i) => (
          <span key={year} className="absolute bottom-4 text-[12px] font-semibold text-sage-600" style={{ left: ['10%', '32%', '54%', '76%'][i] }}>{year}</span>
        ))}
      </div>
    );
  }
  if (kind === 'citas') {
    return (
      <div className="w-full h-full bg-brand-100 relative overflow-hidden">
        <span className="absolute left-[18px] top-[6px] font-serif text-[240px] leading-none text-brand-500">“</span>
        <div className="absolute right-[18px] bottom-[18px] flex">
          {[{ bg: 'bg-ink-900', text: 'K' }, { bg: 'bg-sage-600', text: 'O' }, { bg: 'bg-brand-600', text: 'S' }, { bg: 'bg-ink-50 !text-ink-900', text: '?' }].map((m, i) => (
            <span key={i} className={`w-[46px] h-[46px] rounded-full ${m.bg} text-ink-50 inline-flex items-center justify-center font-serif text-[20px] border-[3px] border-brand-100 ${i > 0 ? '-ml-3' : ''}`}>{m.text}</span>
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'royale') {
    return (
      <div className="w-full h-full bg-stage relative overflow-hidden flex items-center justify-center">
        <div className="absolute left-[18px] top-[18px] flex gap-[7px]">
          <span className="w-4 h-4 rounded-full bg-brand-500" />
          <span className="w-4 h-4 rounded-full bg-brand-500" />
          <span className="w-4 h-4 rounded-full border-2 border-brand-500" />
        </div>
        <div className="w-[124px] h-[124px] rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#dd5f1b 28%, rgba(250,250,247,.14) 0)' }}>
          <div className="w-[102px] h-[102px] rounded-full bg-stage text-ink-50 flex items-center justify-center font-serif text-[54px]">8</div>
        </div>
      </div>
    );
  }
  if (kind === 'atlas') {
    return (
      <div className="w-full h-full bg-sage-100 relative overflow-hidden flex items-center justify-center">
        <div className="w-[230px] h-[230px] rounded-full border-[1.5px] border-sage-600 relative flex-none">
          <span className="absolute left-1/4 right-1/4 top-0 bottom-0 rounded-full border-[1.5px] border-sage-600" />
          <span className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-sage-600" />
          <span className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-sage-600" />
          <span className="absolute left-[7%] right-[7%] top-1/4 h-[1.5px] bg-sage-600" />
          <span className="absolute left-[7%] right-[7%] top-3/4 h-[1.5px] bg-sage-600" />
          <span className="absolute left-[56%] top-[31%] w-[18px] h-[18px] rounded-full bg-brand-500 border-[3px] border-sage-100" />
        </div>
      </div>
    );
  }
  if (kind === 'empareja') {
    return (
      <div className="w-full h-full bg-ink-100 flex gap-3 p-5">
        <MiniCard chips={['solid', 'solid']} />
        <MiniCard chips={['solid-brand', 'dashed']} />
        <MiniCard chips={['dashed', 'dashed']} />
      </div>
    );
  }
  if (kind === 'cloze') {
    return (
      <div className="w-full h-full bg-brand-50 p-[26px_22px] font-serif text-[30px] leading-[1.25]">
        La <span className="inline-flex gap-[3px] align-middle mx-1">
          <span className="w-6 h-8 rounded-md bg-ink-900 text-ink-50 flex items-center justify-center text-[22px]">v</span>
          <span className="w-6 h-8 rounded-md bg-ink-900 text-ink-50 flex items-center justify-center text-[22px]">o</span>
          <span className="w-6 h-8 rounded-md border-2 border-brand-500" />
        </span> es el instrumento universal.
      </div>
    );
  }
  // relampago
  return (
    <div className="w-full h-full bg-brand-500 relative overflow-hidden text-white">
      <span className="absolute left-5 -top-[6px] font-serif text-[150px] leading-none">60</span>
      <span className="absolute left-5 right-5 bottom-[22px] h-[10px] rounded-full bg-white/30">
        <span className="block w-[62%] h-full rounded-full bg-white" />
      </span>
    </div>
  );
}

function MiniCard({ chips }: { chips: Array<'solid' | 'solid-brand' | 'dashed'> }) {
  return (
    <div className="flex-1 bg-white rounded-[14px] p-[10px] flex flex-col gap-[6px]">
      <span className="w-[30px] h-[30px] rounded-full bg-ink-900" />
      {chips.map((c, i) => (
        <span key={i} className={
          c === 'solid'        ? 'h-[22px] rounded-lg bg-sage-600' :
          c === 'solid-brand'  ? 'h-[22px] rounded-lg bg-brand-500 w-4/5' :
                                 'h-[22px] rounded-lg border-2 border-dashed border-ink-300'
        } />
      ))}
    </div>
  );
}
