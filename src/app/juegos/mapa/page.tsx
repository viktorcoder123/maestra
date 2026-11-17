import fs from 'node:fs';
import path from 'node:path';
import { MapaClient } from './MapaClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Atlas pedagógico</h1>
      <p className="text-ink-800/70 mb-6">
        Aparece un pedagogo. Pulsa su país de origen. Dos intentos por ronda.
      </p>
      <MapaClient pedagogos={raw.pedagogos} />
    </div>
  );
}
