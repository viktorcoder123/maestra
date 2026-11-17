import fs from 'node:fs';
import path from 'node:path';
import { EmparejaClient } from './EmparejaClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Empareja método</h1>
      <p className="text-ink-800/70 mb-6">
        Arrastra cada palabra clave al pedagogo correcto.
      </p>
      <EmparejaClient pedagogos={raw.pedagogos} />
    </div>
  );
}
