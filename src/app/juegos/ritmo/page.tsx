import { RitmoClient } from './RitmoClient';

export default function Page() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Ritmo-Tap</h1>
      <p className="text-ink-800/70 mb-6">
        Escucha el patrón rítmico y pulsa <kbd className="px-2 py-0.5 border rounded">espacio</kbd> en cada pulso.
        Precisión en milisegundos. TEMA 6.
      </p>
      <RitmoClient />
    </div>
  );
}
