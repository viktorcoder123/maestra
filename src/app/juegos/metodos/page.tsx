import fs from 'node:fs';
import path from 'node:path';
import { RelampagoClient } from './RelampagoClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Método → autor relámpago</h1>
      <p className="text-ink-800/70 mb-6">60 segundos. ¡A ver cuántos resuelves!</p>
      <RelampagoClient pedagogos={raw.pedagogos} />
    </div>
  );
}
