import { OidoClient } from './OidoClient';

export default function Oido() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none mb-2">Oído</h1>
      <p className="text-ink-500 mb-7">Pulsa el disco para escuchar. Identifica lo que suena.</p>
      <OidoClient />
    </div>
  );
}
