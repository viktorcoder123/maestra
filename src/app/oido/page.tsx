import { OidoClient } from './OidoClient';

export default function Oido() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-2">Educación del oído</h1>
      <p className="text-ink-800/70 mb-6">
        Toca el altavoz para escuchar. Identifica lo que suena.
      </p>
      <OidoClient />
    </div>
  );
}
