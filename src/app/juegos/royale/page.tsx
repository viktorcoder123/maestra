import { RoyaleClient } from './RoyaleClient';

export default function Page() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Oposición Royale 💀</h1>
      <p className="text-ink-800/70 mb-6">
        3 vidas. Preguntas de todos los temas, cada ronda más rápida. ¿Cuánto aguantas?
      </p>
      <RoyaleClient />
    </div>
  );
}
