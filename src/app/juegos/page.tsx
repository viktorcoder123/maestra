import Link from 'next/link';
import { Card } from '@/components/Card';
import { StatsStrip } from './StatsStrip';

export default function Juegos() {
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl">Juegos</h1>
        <StatsStrip />
      </div>

      <section>
        <h2 className="font-serif text-lg mb-2 text-brand-600">🆕 Más intensos</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card href="/juegos/royale" accent="brand" icon="💀"
            title="Oposición Royale"
            description="3 vidas, reloj corriendo, cada ronda más rápida. Modo supervivencia."
          />
          <Card href="/juegos/linea-del-tiempo" accent="sage" icon="📜"
            title="Línea del tiempo"
            description="Arrastra los 14 pedagogos a la década de su nacimiento. Visual, rápido, satisfactorio."
          />
          <Card href="/juegos/mapa" accent="brand" icon="🗺️"
            title="Atlas pedagógico"
            description="Un pedagogo, un mapa. Pulsa el país de origen. Memoria espacial."
          />
          <Card href="/juegos/dictado" accent="sage" icon="🎼"
            title="Dicta la melodía"
            description="Escucha una secuencia y tócala en el piano virtual. TEMA 2 puro."
          />
          <Card href="/juegos/ritmo" accent="brand" icon="🥁"
            title="Ritmo-Tap"
            description="Imita el patrón pulsando espacio. Precisión en milisegundos. TEMA 6."
          />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-lg mb-2 text-ink-800/70">Clásicos</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card href="/juegos/quien-lo-dijo" accent="ink" icon="💬"
            title="¿Quién lo dijo?"
            description="Una cita, cuatro candidatos. ¿Qué pedagogo lo dijo?"
          />
          <Card href="/juegos/empareja" accent="ink" icon="🧩"
            title="Empareja método"
            description="Arrastra las palabras clave al pedagogo correcto."
          />
          <Card href="/juegos/cloze" accent="ink" icon="📝"
            title="Rellena el hueco"
            description="Frases del temario con una palabra escondida."
          />
          <Card href="/juegos/metodos" accent="ink" icon="⚡"
            title="Método → autor relámpago"
            description="60 segundos. Cuántos emparejas."
          />
        </div>
      </section>
    </div>
  );
}
