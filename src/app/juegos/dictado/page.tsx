import { DictadoClient } from './DictadoClient';

export default function Page() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Dicta la melodía</h1>
      <p className="text-ink-800/70 mb-6">
        Escucha y reproduce la melodía tocando las teclas en orden. TEMA 2.
      </p>
      <DictadoClient />
    </div>
  );
}
