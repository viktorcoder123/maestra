import fs from 'node:fs';
import path from 'node:path';
import { TimelineClient } from './TimelineClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Línea del tiempo</h1>
      <p className="text-ink-800/70 mb-6">
        Arrastra a cada pedagogo/a a la década de su nacimiento. Pistas: el país y una palabra clave.
      </p>
      <TimelineClient pedagogos={raw.pedagogos} />
    </div>
  );
}
